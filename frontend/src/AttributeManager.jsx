import React, { useEffect, useState } from 'react';

const DATA_TYPES = [
  'string', 'integer', 'float', 'boolean', 'date', 'array'
];

// MultiSelect component for selecting multiple nodes
function MultiSelectInput({ value, onChange, options, placeholder }) {
  return (
    <select
      multiple
      value={value}
      onChange={e => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        onChange(selected);
      }}
      style={{ marginRight: 8, minWidth: 180 }}
    >
      <option disabled value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function AttributeManager() {
  const [attributes, setAttributes] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [newAttr, setNewAttr] = useState({
    name: '', description: '', data_type: 'string', allowed_values: '', unit: ''
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '' });
  const [search, setSearch] = useState(""); // 1. Add search state

  useEffect(() => {
    fetchAttributes();
    fetchNodes();
  }, []);

  function fetchAttributes() {
    fetch('/api/attributes')
      .then(res => res.json())
      .then(setAttributes);
  }

  function fetchNodes() {
    fetch('/api/nodes')
      .then(res => res.json())
      .then(data => setNodes(data));
  }

  async function handleAdd() {
    if (!newAttr.name.trim() || !newAttr.data_type) return;
    const payload = {
      ...newAttr
    };
    const res = await fetch('/api/attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setNewAttr({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '' });
      fetchAttributes();
    } else {
      alert('Error adding attribute.');
    }
  }

  async function handleUpdate(id) {
    const payload = {
      ...editData
    };
    const res = await fetch(`/api/attribute/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setEditId(null);
      fetchAttributes();
    } else {
      alert('Error updating attribute.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this attribute?')) return;
    const res = await fetch(`/api/attribute/${id}`, { method: 'DELETE' });
    if (res.ok) fetchAttributes();
    else alert('Error deleting attribute.');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Attributes</h2>
      {/* 1. Search/filter input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search attributes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 260, maxWidth: '100%', padding: 6, borderRadius: 4, border: '1px solid #b5d6f7' }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}
      >
        {/* 2. Add new attribute card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #e3f6fc 60%, #f7fbff 100%)',
            border: '2px dashed #90caf9',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            minWidth: 0,
            wordBreak: 'break-word',
            alignSelf: 'start'
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '1.1em', marginBottom: 8, color: '#1976d2' }}>
            Add New Attribute
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAdd();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <label>
              <span style={{ fontWeight: 500 }}>Name:</span>
              <input
                type="text"
                placeholder="Name"
                value={newAttr.name}
                onChange={e => setNewAttr({ ...newAttr, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <span style={{ fontWeight: 500 }}>Description:</span>
              <input
                type="text"
                placeholder="Description"
                value={newAttr.description}
                onChange={e => setNewAttr({ ...newAttr, description: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <span style={{ fontWeight: 500 }}>Type:</span>
              <select
                value={newAttr.data_type}
                onChange={e => setNewAttr({ ...newAttr, data_type: e.target.value })}
                style={{ width: '100%' }}
              >
                {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
              </select>
            </label>
            <label>
              <span style={{ fontWeight: 500 }}>Allowed Values:</span>
              <input
                type="text"
                placeholder="Allowed Values (semicolon separated)"
                value={newAttr.allowed_values}
                onChange={e => setNewAttr({ ...newAttr, allowed_values: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <span style={{ fontWeight: 500 }}>Unit:</span>
              <input
                type="text"
                placeholder="Unit"
                value={newAttr.unit}
                onChange={e => setNewAttr({ ...newAttr, unit: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <button type="submit" style={{ marginTop: 8, minWidth: 60 }}>Add</button>
          </form>
        </div>
        {/* Attribute cards, filtered by search */}
        {attributes
          .filter(attr =>
            attr.name?.toLowerCase().includes(search.toLowerCase()) ||
            attr.description?.toLowerCase().includes(search.toLowerCase()) ||
            attr.data_type?.toLowerCase().includes(search.toLowerCase()) ||
            attr.allowed_values?.toLowerCase().includes(search.toLowerCase()) ||
            attr.unit?.toLowerCase().includes(search.toLowerCase())
          )
          .map(attr => (
          <div
            key={attr.id}
            style={{
              background: '#f7fbff',
              border: '1px solid #cbe6ff',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              minWidth: 0,
              wordBreak: 'break-word',
              position: 'relative'
            }}
          >
            <div style={{
              fontWeight: 600,
              fontSize: '1.1em',
              marginBottom: 8,
              color: '#1976d2'
            }}>
              {attr.name}
            </div>
            {editId === attr.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleUpdate(attr.id);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <label>
                  <span style={{ fontWeight: 500 }}>Name:</span>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 500 }}>Description:</span>
                  <input
                    type="text"
                    value={editData.description}
                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 500 }}>Type:</span>
                  <select
                    value={editData.data_type}
                    onChange={e => setEditData({ ...editData, data_type: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </label>
                <label>
                  <span style={{ fontWeight: 500 }}>Allowed Values:</span>
                  <input
                    type="text"
                    value={editData.allowed_values}
                    onChange={e => setEditData({ ...editData, allowed_values: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 500 }}>Unit:</span>
                  <input
                    type="text"
                    value={editData.unit}
                    onChange={e => setEditData({ ...editData, unit: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 500 }}>Applicable Nodes:</span>
                  <MultiSelectInput
                    value={editData.applicable_nodes}
                    onChange={val => setEditData({ ...editData, applicable_nodes: val })}
                    options={nodes}
                    placeholder="Choose applicable nodes"
                  />
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {/* Name is now the card label, so omit here */}
                {/* <li><strong>Name:</strong> {attr.name}</li> */}
                <li><strong>Description:</strong> {attr.description}</li>
                <li><strong>Type:</strong> {attr.data_type}</li>
                <li><strong>Allowed Values:</strong> {attr.allowed_values}</li>
                <li><strong>Unit:</strong> {attr.unit}</li>
                <li>
                  <strong>Applicable Nodes:</strong>{" "}
                  {Array.isArray(attr.applicable_nodes)
                    ? attr.applicable_nodes
                        .map(id => {
                          const node = nodes.find(n => String(n.id) === String(id));
                          return node ? node.label : id;
                        })
                        .join('; ')
                    : ''}
                </li>
                <li style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setEditId(attr.id);
                      setEditData({
                        name: attr.name,
                        description: attr.description,
                        data_type: attr.data_type,
                        allowed_values: attr.allowed_values,
                        unit: attr.unit,
                        applicable_nodes: Array.isArray(attr.applicable_nodes)
                          ? attr.applicable_nodes.map(String)
                          : []
                      });
                    }}
                    style={{ marginRight: 8 }}
                  >Edit</button>
                  <button onClick={() => handleDelete(attr.id)}>Delete</button>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
