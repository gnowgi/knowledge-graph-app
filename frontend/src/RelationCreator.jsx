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
          relation_id: parseInt(relationTypeId),
          modality: difficulty === 'advanced' ? modality : undefined,
          subject_quantifier: (difficulty === 'medium' || difficulty === 'advanced') ? subjectQuantifier : undefined,
          object_quantifier: (difficulty === 'medium' || difficulty === 'advanced') ? objectQuantifier : undefined
        })
      });
      setLoading(false);
      if (res.ok) {
        setSourceInput("");
        setTargetInput("");
        setRelationTypeId("");
        setModality('');
        setSubjectQuantifier('');
        setObjectQuantifier('');
        if (onRelationCreated) onRelationCreated();
      } else {
        alert('Failed to create relation.');
      }
    } catch {
      setLoading(false);
    }
  };

  // Responsive grid style (always row on desktop, column on mobile)
  const gridStyle = {
    display: 'grid',
    gap: 16,
    width: '100%',
    marginBottom: 12,
    gridTemplateColumns: '1fr', // default: column
  };

  // Add a media query for desktop
  const gridMediaStyle = `
    @media (min-width: 600px) {
      .relation-card-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }
  `;

  const cardStyle = {
    background: '#f8fafd',
    border: '1px solid #cbe6ff',
    borderRadius: 8,
    padding: 18,
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  };

  return (
    <>
      <style>{gridMediaStyle}</style>
      <form onSubmit={handleCreate} style={{ width: '100%' }}>
        <div className="relation-card-grid" style={gridStyle}>
          {/* Subject Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Subject</label>
            {difficulty === 'advanced' && (
              <div style={{ marginBottom: 8, width: '100%' }}>
                <label style={{ fontWeight: 500, fontSize: 13 }}>Modality</label>
                <select value={modality} onChange={e => setModality(e.target.value)} style={{ width: '100%' }}>
                  {MODALITIES.map(m => <option key={m} value={m}>{m ? m.charAt(0).toUpperCase() + m.slice(1) : 'Modality'}</option>)}
                </select>
              </div>
            )}
            {(difficulty === 'medium' || difficulty === 'advanced') && (
              <select value={subjectQuantifier} onChange={e => setSubjectQuantifier(e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
                {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
              </select>
            )}
            <input
              type="text"
              placeholder="Choose a subject"
              value={sourceInput}
              onChange={e => setSourceInput(e.target.value)}
              list="source-suggestions"
              style={{ minWidth: 140, width: '100%' }}
            />
            <datalist id="source-suggestions">
              {allNodes.map(n => (
                <option key={n.id} value={n.label} />
              ))}
            </datalist>
          </div>
          {/* Relation Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Relation</label>
            <select value={relationTypeId} onChange={e => setRelationTypeId(e.target.value)} style={{ minWidth: 140, width: '100%' }}>
              <option value=''>Choose relation name</option>
              {relationTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
          {/* Object Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Object</label>
            {(difficulty === 'medium' || difficulty === 'advanced') && (
              <select value={objectQuantifier} onChange={e => setObjectQuantifier(e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
                {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
              </select>
            )}
            <input
              type="text"
              placeholder="Choose an object"
              value={targetInput}
              onChange={e => setTargetInput(e.target.value)}
              list="target-suggestions"
              style={{ minWidth: 140, width: '100%' }}
            />
            <datalist id="target-suggestions">
              {allNodes.map(n => (
                <option key={n.id} value={n.label} />
              ))}
            </datalist>
            <button
              type='submit'
              disabled={loading}
              style={{ marginTop: 16, height: 40, alignSelf: 'flex-end', minWidth: 120 }}
            >
              {loading ? 'Creating...' : 'Add Relation'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
