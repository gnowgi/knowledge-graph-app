// RelationCreator.jsx: UI for subject–predicate–object relation creation
import React, { useEffect, useState } from 'react';

// TEMPORARY helper for parsing
async function parseNodeLabel(text) {
  const res = await fetch('/api/nlp/parse-node-label', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  return await res.json();
}

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

  const [confirmingNode, setConfirmingNode] = useState(null); // { role, original, parsed }
  const [parsedSource, setParsedSource] = useState(null);
  const [parsedTarget, setParsedTarget] = useState(null);

  // Dropdown visibility states
  const [sourceDropdown, setSourceDropdown] = useState(false);
  const [targetDropdown, setTargetDropdown] = useState(false);

  // Filtered node lists for autocomplete
  const filteredSourceNodes = allNodes.filter(n =>
    sourceInput.trim() &&
    n.label.toLowerCase().includes(sourceInput.trim().toLowerCase())
  );
  const filteredTargetNodes = allNodes.filter(n =>
    targetInput.trim() &&
    n.label.toLowerCase().includes(targetInput.trim().toLowerCase())
  );

  // Track selected node IDs if chosen from dropdown
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [selectedTargetNode, setSelectedTargetNode] = useState(null);

  // Reset selected node if input changes
  useEffect(() => { setSelectedSourceNode(null); }, [sourceInput]);
  useEffect(() => { setSelectedTargetNode(null); }, [targetInput]);

  useEffect(() => {
    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/relation-types').then(res => res.json()).then(setRelationTypes);
  }, []);

  const findNodeByLabel = (label) => {
    return allNodes.find(n => n.label.toLowerCase() === label.trim().toLowerCase());
  };

  const createNodeIfNotExists = async (label, qualifier) => {
    const node = allNodes.find(n => n.label.toLowerCase() === label.trim().toLowerCase() && (n.qualifier || '') === (qualifier || ''));
    if (node) return node;
    const res = await fetch('/api/node/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: label, qualifier })
    });
    if (res.ok) {
      const newNode = await res.json();
      setAllNodes(nodes => [...nodes, newNode]);
      return newNode;
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

    // If user selected from dropdown, use that node directly
    if (selectedSourceNode && selectedTargetNode) {
      await finalizeCreate(
        { title: selectedSourceNode.label, qualifier: selectedSourceNode.qualifier, id: selectedSourceNode.id },
        { title: selectedTargetNode.label, qualifier: selectedTargetNode.qualifier, id: selectedTargetNode.id }
      );
      return;
    }

    if (parsedSource && parsedTarget) {
      await finalizeCreate(parsedSource, parsedTarget);
      return;
    }

    const src = parsedSource || await parseNodeLabel(sourceInput);
    const tgt = parsedTarget || await parseNodeLabel(targetInput);

    if (!parsedSource && src.parsed) {
      setConfirmingNode({ role: 'subject', original: sourceInput, parsed: src });
      return;
    }
    if (!parsedTarget && tgt.parsed) {
      setConfirmingNode({ role: 'object', original: targetInput, parsed: tgt });
      return;
    }

    await finalizeCreate(src, tgt);
  };

  const finalizeCreate = async (src, tgt) => {
    setLoading(true);
    try {
      // If node was selected from dropdown, use its id directly
      const sourceNode = src.id
        ? src
        : await createNodeIfNotExists(src.title, src.qualifier);
      const targetNode = tgt.id
        ? tgt
        : await createNodeIfNotExists(tgt.title, tgt.qualifier);
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
        setParsedSource(null);
        setParsedTarget(null);
        if (onRelationCreated) onRelationCreated();
      } else {
        alert('Failed to create relation.');
      }
    } catch {
      setLoading(false);
    }
  };

  const handleConfirmParsed = () => {
    if (confirmingNode.role === 'subject') {
      setParsedSource(confirmingNode.parsed);
    } else {
      setParsedTarget(confirmingNode.parsed);
    }
    setConfirmingNode(null);
  };

  const handleRejectParsed = () => {
    const fallback = { title: confirmingNode.original, qualifier: null, parsed: false };
    if (confirmingNode.role === 'subject') {
      setParsedSource(fallback);
    } else {
      setParsedTarget(fallback);
    }
    setConfirmingNode(null);
  };

  useEffect(() => {
    if (parsedSource && parsedTarget) {
      finalizeCreate(parsedSource, parsedTarget);
    }
  }, [parsedSource, parsedTarget]);

  return (
    <>
      {confirmingNode && (
        <div style={{ padding: 12, border: '1px solid #cbe6ff', borderRadius: 6, background: '#f0f8ff', marginBottom: 12 }}>
          <strong>Confirm interpretation for {confirmingNode.role}:</strong>
          <div style={{ marginTop: 4 }}>
            <span>“<em>{confirmingNode.original}</em>” → <strong>{confirmingNode.parsed.qualifier}</strong> {confirmingNode.parsed.title}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={handleConfirmParsed} style={{ marginRight: 8 }}>✔ Confirm</button>
            <button onClick={handleRejectParsed}>✖ Use original</button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ width: '100%' }}>
        <div className="relation-card-grid" style={{
          display: 'grid',
          gap: 16,
          width: '100%',
          marginBottom: 12,
          gridTemplateColumns: '1fr',
        }}>
          <div style={{ background: '#f8fafd', border: '1px solid #cbe6ff', borderRadius: 8, padding: 18, position: 'relative' }}>
            <label>Subject</label>
            {(difficulty === 'medium' || difficulty === 'advanced') && (
              <select value={subjectQuantifier} onChange={e => setSubjectQuantifier(e.target.value)} style={{ width: '100%' }}>
                {QUANTIFIERS.map(q => <option key={q} value={q}>{q || 'Quantifier'}</option>)}
              </select>
            )}
            <input
              value={sourceInput}
              onChange={e => {
                setSourceInput(e.target.value);
                setSourceDropdown(true);
              }}
              placeholder="Enter subject"
              style={{ width: '100%' }}
              onFocus={() => setSourceDropdown(true)}
              autoComplete="off"
            />
            {sourceDropdown && filteredSourceNodes.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 60,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #cbe6ff',
                  borderRadius: 6,
                  zIndex: 10,
                  maxHeight: 120,
                  overflowY: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                {filteredSourceNodes.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f8ff'
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                      setSourceInput(n.label);
                      setSelectedSourceNode(n);
                      setSourceDropdown(false);
                    }}
                  >
                    {n.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: '#f8fafd', border: '1px solid #cbe6ff', borderRadius: 8, padding: 18 }}>
            <label>Relation</label>
            <select value={relationTypeId} onChange={e => setRelationTypeId(e.target.value)} style={{ width: '100%' }}>
              <option value=''>Choose relation name</option>
              {relationTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>

          <div style={{ background: '#f8fafd', border: '1px solid #cbe6ff', borderRadius: 8, padding: 18, position: 'relative' }}>
            <label>Object</label>
            {(difficulty === 'medium' || difficulty === 'advanced') && (
              <select value={objectQuantifier} onChange={e => setObjectQuantifier(e.target.value)} style={{ width: '100%' }}>
                {QUANTIFIERS.map(q => <option key={q} value={q}>{q || 'Quantifier'}</option>)}
              </select>
            )}
            <input
              value={targetInput}
              onChange={e => {
                setTargetInput(e.target.value);
                setTargetDropdown(true);
              }}
              placeholder="Enter object"
              style={{ width: '100%' }}
              onFocus={() => setTargetDropdown(true)}
              autoComplete="off"
            />
            {targetDropdown && filteredTargetNodes.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 60,
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #cbe6ff',
                  borderRadius: 6,
                  zIndex: 10,
                  maxHeight: 120,
                  overflowY: 'auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                {filteredTargetNodes.map(n => (
                  <div
                    key={n.id}
                    style={{
                      padding: '6px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f8ff'
                    }}
                    onMouseDown={e => {
                      e.preventDefault();
                      setTargetInput(n.label);
                      setSelectedTargetNode(n);
                      setTargetDropdown(false);
                    }}
                  >
                    {n.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ float: 'right', minWidth: 140 }}>
          {loading ? 'Creating...' : 'Add Relation'}
        </button>
      </form>
    </>
  );
}
