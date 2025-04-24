// RelationCreator.jsx: UI for subject–predicate–object relation creation
import React, { useEffect, useState } from 'react';

export default function RelationCreator({ onRelationCreated, difficulty }) {
  const MODALITIES = [
    '', 'necessarily', 'possibly', 'allegedly', 'experimentally', 'historically', 'reportedly', 'theoretically', 'empirically'
  ];
  const QUANTIFIERS = ['', 'all', 'some', 'none'];

  const [allNodes, setAllNodes] = useState([]);
  const [relationTypes, setRelationTypes] = useState([]);
  const [sourceInput, setSourceInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [relationTypeId, setRelationTypeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [modality, setModality] = useState('');
  const [subjectQuantifier, setSubjectQuantifier] = useState('');
  const [objectQuantifier, setObjectQuantifier] = useState('');

  useEffect(() => {
    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/relation-types').then(res => res.json()).then(setRelationTypes);
  }, []);

  const findNodeByLabel = (label) => {
    return allNodes.find(n => n.label.toLowerCase() === label.trim().toLowerCase());
  };

  const createNodeIfNotExists = async (label) => {
    let node = findNodeByLabel(label);
    if (node) return node;
    const res = await fetch('/api/node/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: label })
    });
    if (res.ok) {
      node = await res.json();
      setAllNodes(nodes => [...nodes, node]);
      return node;
    } else {
      const msg = await res.json();
      alert(msg.error || 'Node creation failed.');
      throw new Error('Node creation failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!sourceInput.trim() || !relationTypeId || !targetInput.trim()) {
      alert('Please fill all fields.');
      return;
    }
    if (sourceInput.trim().toLowerCase() === targetInput.trim().toLowerCase()) {
      alert('Source and target must be different nodes.');
      return;
    }
    setLoading(true);
    try {
      const sourceNode = await createNodeIfNotExists(sourceInput);
      const targetNode = await createNodeIfNotExists(targetInput);
      const res = await fetch('/api/relation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: sourceNode.id,
          target: targetNode.id,
          relation_id: parseInt(relationTypeId)
        })
      });
      setLoading(false);
      if (res.ok) {
        setSourceInput("");
        setTargetInput("");
        setRelationTypeId("");
        if (onRelationCreated) onRelationCreated();
      } else {
        alert('Failed to create relation.');
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="knowledge-form" style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      gap: 20,
      border: '1px solid #ccc',
      borderRadius: 8,
      padding: 20,
      background: '#f8fafd',
      width: '100%',
      maxWidth: 'none',
      boxSizing: 'border-box',
      marginBottom: 24
    }}>
      {/* Modality selector (only in advanced) */}
      {difficulty === 'advanced' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 120, marginRight: 12 }}>
          <label style={{ fontWeight: 500, marginBottom: 4 }}>Modality</label>
          <select value={modality} onChange={e => setModality(e.target.value)}>
            {MODALITIES.map(m => <option key={m} value={m}>{m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Modality'}</option>)}
          </select>
        </div>
      )}
      {/* Subject sub-container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 240, background: '#eef6fa', borderRadius: 6, padding: 12, border: '1px solid #b5c9d6' }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Subject</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(difficulty === 'medium' || difficulty === 'advanced') && (
            <select value={subjectQuantifier} onChange={e => setSubjectQuantifier(e.target.value)}>
              {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="Choose a subject"
            value={sourceInput}
            onChange={e => setSourceInput(e.target.value)}
            list="source-suggestions"
            style={{ minWidth: 140 }}
          />
          <datalist id="source-suggestions">
            {allNodes.map(n => (
              <option key={n.id} value={n.label} />
            ))}
          </datalist>
        </div>
      </div>
      {/* Relation type */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 200 }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Relation</label>
        <select value={relationTypeId} onChange={e => setRelationTypeId(e.target.value)} style={{ minWidth: 140 }}>
          <option value=''>Choose relation name</option>
          {relationTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
        </select>
      </div>
      {/* Object sub-container */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 240, background: '#eef6fa', borderRadius: 6, padding: 12, border: '1px solid #b5c9d6' }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Object</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(difficulty === 'medium' || difficulty === 'advanced') && (
            <select value={objectQuantifier} onChange={e => setObjectQuantifier(e.target.value)}>
              {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
            </select>
          )}
          <input
            type="text"
            placeholder="Choose an object"
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
            list="target-suggestions"
            style={{ minWidth: 140 }}
          />
          <datalist id="target-suggestions">
            {allNodes.map(n => (
              <option key={n.id} value={n.label} />
            ))}
          </datalist>
        </div>
      </div>
      <button type='submit' disabled={loading} style={{ marginTop: 16, height: 40 }}>{loading ? 'Creating...' : 'Add Relation'}</button>
    </form>
  );
}
