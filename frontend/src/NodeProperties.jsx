import React, { useEffect, useState } from 'react';

export default function NodeProperties({ nodeId }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editQuantifier, setEditQuantifier] = useState('');
  const QUANTIFIERS = ['', 'all', 'some', 'none'];
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!nodeId) return;
    setLoading(true);
    fetch(`/api/node/${nodeId}/attributes`)
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      });
  }, [nodeId]);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/node/${nodeId}/attributes`)
      .then(res => res.json())
      .then(data => {
        setProperties(data);
        setLoading(false);
      });
  };

  const handleEdit = (prop) => {
    setEditId(prop.id);
    setEditValue(prop.value);
    setEditQuantifier(prop.quantifier || '');
    setExpandedId(prop.id);
  };

  const handleSave = async (prop) => {
    const res = await fetch(`/api/node_attribute/${prop.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: editValue, quantifier: editQuantifier })
    });
    if (res.ok) {
      setEditId(null);
      setEditValue('');
      setEditQuantifier('');
      setExpandedId(null);
      refresh();
    } else {
      alert('Failed to update property.');
    }
  };

  const handleDelete = async (prop) => {
    if (!window.confirm('Delete this property?')) return;
    const res = await fetch(`/api/node_attribute/${prop.id}`, { method: 'DELETE' });
    if (res.ok) {
      setExpandedId(null);
      refresh();
    } else {
      alert('Failed to delete property.');
    }
  };

  if (loading) return <div>Loading properties...</div>;
  if (!properties.length) return <div style={{ color: '#888', fontSize: '0.95em' }}>No properties</div>;

  return (
    <div style={{ margin: '8px 0' }}>
      <strong>Properties:</strong>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {properties.map(p => (
          <li key={p.id} style={{ fontSize: '0.97em', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <span style={{ fontWeight: 500 }}>{p.name}</span>
            {': '}
            <span>{p.value}</span>
            {p.quantifier ? <span style={{ color: '#2a6', marginLeft: 4, fontStyle: 'italic' }}>[{p.quantifier}]</span> : null}
            {p.unit ? <span style={{ color: '#666', marginLeft: 2 }}>({p.unit})</span> : null}
            <span
              style={{ cursor: 'pointer', marginLeft: 6, fontSize: 18, userSelect: 'none' }}
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              title="More actions"
            >
              &#8942;
            </span>
            {expandedId === p.id && (
              <span style={{ position: 'absolute', left: 80, top: 22, background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 10, boxShadow: '0 2px 8px #0001', padding: 6 }}>
                {editId === p.id ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      style={{ fontSize: '0.97em', minWidth: 60 }}
                    />
                    <select value={editQuantifier} onChange={e => setEditQuantifier(e.target.value)} style={{ marginLeft: 4 }}>
                      {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
                    </select>
                    <button onClick={() => handleSave(p)} style={{ marginLeft: 2 }}>💾</button>
                    <button onClick={() => { setEditId(null); setExpandedId(null); }} style={{ marginLeft: 2 }}>✖️</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(p)} style={{ marginRight: 6 }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(p)} style={{ color: 'red' }}>🗑️ Delete</button>
                  </>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
