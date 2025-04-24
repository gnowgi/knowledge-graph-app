// RelationCreator.jsx: UI for subject–predicate–object relation creation
import React, { useEffect, useState } from 'react';

export default function RelationCreator({ onRelationCreated }) {
  const [allNodes, setAllNodes] = useState([]);
  const [relationTypes, setRelationTypes] = useState([]);
  const [sourceInput, setSourceInput] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [relationTypeId, setRelationTypeId] = useState('');
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={handleCreate} className="knowledge-form">
      <div style={{ position: 'relative', minWidth: 120 }}>
        <input
          type="text"
          placeholder="Choose a subject"
          value={sourceInput}
          onChange={e => setSourceInput(e.target.value)}
          list="source-suggestions"
        />
        <datalist id="source-suggestions">
          {allNodes.map(n => (
            <option key={n.id} value={n.label} />
          ))}
        </datalist>
      </div>
      <select value={relationTypeId} onChange={e => setRelationTypeId(e.target.value)}>
        <option value=''>Choose relation name</option>
        {relationTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
      </select>
      <div style={{ position: 'relative', minWidth: 120 }}>
        <input
          type="text"
          placeholder="Choose an object"
          value={targetInput}
          onChange={e => setTargetInput(e.target.value)}
          list="target-suggestions"
        />
        <datalist id="target-suggestions">
          {allNodes.map(n => (
            <option key={n.id} value={n.label} />
          ))}
        </datalist>
      </div>
      <button type='submit' disabled={loading}>{loading ? 'Creating...' : 'Build Knowledge'}</button>
    </form>
  );
}
