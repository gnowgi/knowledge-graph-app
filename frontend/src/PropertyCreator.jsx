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
  const [attrType, setAttrType] = useState('string');

  useEffect(() => {
    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/attributes').then(res => res.json()).then(setAttributes);
  }, []);

  useEffect(() => {
    const attr = attributes.find(a => a.id == selectedAttrId);
    setAttrType(attr ? attr.data_type : 'string');
  }, [selectedAttrId, attributes]);

  function validateValue(val, type) {
    if (type === 'integer') return /^-?\d+$/.test(val);
    if (type === 'float') return /^-?\d+(\.\d+)?$/.test(val);
    if (type === 'boolean') return /^(true|false)$/i.test(val);
    if (type === 'date') return /^\d{4}-\d{2}-\d{2}$/.test(val);
    if (type === 'array') return val.trim().length > 0;
    return true;
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
      setSubjectQuantifier('');
      if (onPropertyAdded) onPropertyAdded();
    } else {
      alert('Failed to add property.');
    }
  };

  function renderValueInput() {
    if (attrType === 'date') {
      return (
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          style={{ minWidth: 120, width: '100%' }}
        />
      );
    }
    if (attrType === 'boolean') {
      return (
        <select value={value} onChange={e => setValue(e.target.value)} style={{ minWidth: 120, width: '100%' }}>
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
          style={{ minWidth: 120, width: '100%' }}
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
        style={{ minWidth: 120, width: '100%' }}
      />
    );
  }

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
      .property-card-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }
  `;

  // Card style
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
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div className="property-card-grid" style={gridStyle}>
          {/* Subject Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Subject</label>
            {(!difficulty || difficulty === 'easy') ? null : (
              <select value={subjectQuantifier} onChange={e => setSubjectQuantifier(e.target.value)} style={{ marginBottom: 8, width: '100%' }}>
                {QUANTIFIERS.map(q => <option key={q} value={q}>{q ? q.charAt(0).toUpperCase() + q.slice(1) : 'Quantifier'}</option>)}
              </select>
            )}
            <select value={selectedNodeId} onChange={e => setSelectedNodeId(e.target.value)} style={{ minWidth: 120, width: '100%' }}>
              <option value=''>Choose Subject</option>
              {allNodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
          </div>
          {/* Property Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Property</label>
            <select
              value={selectedAttrId}
              onChange={e => setSelectedAttrId(e.target.value)}
              style={{ minWidth: 120, width: '100%' }}
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
          {/* Value Card */}
          <div style={cardStyle}>
            <label style={{ fontWeight: 500, marginBottom: 6 }}>Value</label>
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
            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: 16, height: 40, alignSelf: 'flex-end', minWidth: 120 }}
            >
              {loading ? 'Adding...' : 'Add Property'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
