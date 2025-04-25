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
  const [attrType, setAttrType] = useState('string'); // Track selected attribute type

  useEffect(() => {
    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/attributes').then(res => res.json()).then(setAttributes);
  }, []);

  // Update attrType when attribute changes
  useEffect(() => {
    const attr = attributes.find(a => a.id == selectedAttrId);
    setAttrType(attr ? attr.data_type : 'string');
  }, [selectedAttrId, attributes]);

  // Validation based on data type
  function validateValue(val, type) {
    if (type === 'integer') return /^-?\d+$/.test(val);
    if (type === 'float') return /^-?\d+(\.\d+)?$/.test(val);
    if (type === 'boolean') return /^(true|false)$/i.test(val);
    if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(val); // YYYY-MM-DD
    if (type === 'array') return val.trim().length > 0; // simple check
    return true; // string or unknown
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNodeId || !selectedAttrId) {
      alert('Please select a node and an attribute.');
      return;
    }
    if (!validateValue(value, attrType)) {
      alert(`Invalid value for type "${attrType}".`);
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

  // Helper widget for date
  function renderValueInput() {
    if (attrType === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ minWidth: 120 }}
        />
      );
    }
    if (attrType === 'boolean') {
      return (
        <select value={value} onChange={e => setValue(e.target.value)} style={{ minWidth: 120 }}>
          <option value="">Select</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    if (attrType === 'array') {
      return (
        <input
          type="text"
          placeholder="Comma separated values"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ minWidth: 120 }}
          title="Enter comma separated values"
        />
      );
    }
    return (
      <input
        type={attrType === 'integer' || attrType === 'float' ? 'number' : 'text'}
        placeholder="Value"
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{ minWidth: 120 }}
      />
    );
  }

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
        <select
          value={selectedAttrId}
          onChange={e => setSelectedAttrId(e.target.value)}
          style={{ minWidth: 120 }}
        >
          <option value=''>Select Property</option>
          {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {selectedAttrId && (
          <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Type: {attrType}
          </span>
        )}
      </div>
      {/* Value input */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 180 }}>
        <label style={{ fontWeight: 500, marginBottom: 4 }}>Value</label>
        {renderValueInput()}
        {attrType === 'date' && (
          <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Please select a date.
          </span>
        )}
        {attrType === 'boolean' && (
          <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Choose true or false.
          </span>
        )}
        {attrType === 'array' && (
          <span style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            Enter comma separated values.
          </span>
        )}
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: 16, height: 40 }}>{loading ? 'Adding...' : 'Add Property'}</button>
    </form>
  );
}
