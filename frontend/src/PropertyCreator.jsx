import React, { useEffect, useState } from 'react';

const QUANTIFIERS = ['', 'all', 'some', 'none'];

export default function PropertyCreator({ onPropertyAdded, difficulty }) {
  const [allNodes, setAllNodes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedAttrId, setSelectedAttrId] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [subjectQuantifier, setSubjectQuantifier] = useState('');

  useEffect(() => {
    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/attributes').then(res => res.json()).then(setAttributes);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNodeId || !selectedAttrId) {
      alert('Please select a node and an attribute.');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/node/${selectedNodeId}/attribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribute_id: selectedAttrId, value, quantifier: subjectQuantifier })
    });
    setLoading(false);
    if (res.ok) {
      setSelectedNodeId('');
      setSelectedAttrId('');
      setValue('');
      if (onPropertyAdded) onPropertyAdded();
    } else {
      alert('Failed to add property.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
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
      {/* Subject with quantifier */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 240, background: '#eef6fa', borderRadius: 6, padding: 12, border: '1px solid #b5c9d6' }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Choose Subject</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(!difficulty || difficulty === 'easy') ? null : (
            <select value={subjectQuantifier} onChange={e => setSubjectQuantifier(e.target.value)}>
              {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
            </select>
          )}
          <select value={selectedNodeId} onChange={e => setSelectedNodeId(e.target.value)} style={{ minWidth: 120 }}>
            <option value=''>Choose Subject</option>
            {allNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>
      </div>
      {/* Property selector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 220 }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Select Property</label>
        <select value={selectedAttrId} onChange={e => setSelectedAttrId(e.target.value)} style={{ minWidth: 120 }}>
          <option value=''>Select Property</option>
          {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      {/* Value input */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 180 }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Value</label>
        <input
          type="text"
          placeholder="Value"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ minWidth: 120 }}
        />
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 16, height: 40 }}>{loading ? 'Adding...' : 'Add Property'}</button>
    </form>
  );
}
