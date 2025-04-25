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
    name: '', description: '', data_type: 'string', allowed_values: '', unit: '', applicable_nodes: []
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '', applicable_nodes: [] });

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
      ...newAttr,
      applicable_nodes: Array.isArray(newAttr.applicable_nodes)
        ? newAttr.applicable_nodes.map(id => Number(id))
        : []
    };
    const res = await fetch('/api/attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      setNewAttr({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '', applicable_nodes: [] });
      fetchAttributes();
    } else {
      alert('Error adding attribute.');
    }
  }

  async function handleUpdate(id) {
    const payload = {
      ...editData,
      applicable_nodes: Array.isArray(editData.applicable_nodes)
        ? editData.applicable_nodes.map(id => Number(id))
        : []
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
      <h4>Add New</h4>
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Name"
          value={newAttr.name}
          onChange={e => setNewAttr({ ...newAttr, name: e.target.value })}
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Description"
          value={newAttr.description}
          onChange={e => setNewAttr({ ...newAttr, description: e.target.value })}
          style={{ marginRight: 8 }}
        />
        <select
          value={newAttr.data_type}
          onChange={e => setNewAttr({ ...newAttr, data_type: e.target.value })}
          style={{ marginRight: 8 }}
        >
          {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
        </select>
        <input
          type="text"
          placeholder="Allowed Values (semicolon separated)"
          value={newAttr.allowed_values}
          onChange={e => setNewAttr({ ...newAttr, allowed_values: e.target.value })}
          style={{ marginRight: 8 }}
        />
        <input
          type="text"
          placeholder="Unit"
          value={newAttr.unit}
          onChange={e => setNewAttr({ ...newAttr, unit: e.target.value })}
          style={{ marginRight: 8 }}
        />
        <MultiSelectInput
          value={newAttr.applicable_nodes}
          onChange={val => setNewAttr({ ...newAttr, applicable_nodes: val })}
          options={nodes}
          placeholder="Choose applicable nodes"
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <hr />
      <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Name</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Description</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Type</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Allowed Values</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Unit</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Applicable Nodes</th>
            <th style={{ paddingRight: 24, textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attributes.map((attr, idx) => (
            <tr
              key={attr.id}
              style={idx % 2 === 1 ? { background: '#eaf6ff' } : {}}
            >
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : attr.name}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <input
                    type="text"
                    value={editData.description}
                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                  />
                ) : attr.description}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <select
                    value={editData.data_type}
                    onChange={e => setEditData({ ...editData, data_type: e.target.value })}
                  >
                    {DATA_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                ) : attr.data_type}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <input
                    type="text"
                    value={editData.allowed_values}
                    onChange={e => setEditData({ ...editData, allowed_values: e.target.value })}
                  />
                ) : attr.allowed_values}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <input
                    type="text"
                    value={editData.unit}
                    onChange={e => setEditData({ ...editData, unit: e.target.value })}
                  />
                ) : attr.unit}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <MultiSelectInput
                    value={editData.applicable_nodes}
                    onChange={val => setEditData({ ...editData, applicable_nodes: val })}
                    options={nodes}
                    placeholder="Choose applicable nodes"
                  />
                ) : Array.isArray(attr.applicable_nodes)
                  ? attr.applicable_nodes
                      .map(id => {
                        const node = nodes.find(n => String(n.id) === String(id));
                        return node ? node.label : id;
                      })
                      .join('; ')
                  : ''}
              </td>
              <td style={{ paddingRight: 24 }}>
                {editId === attr.id ? (
                  <>
                    <button onClick={() => handleUpdate(attr.id)}>Save</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
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
                    }}>Edit</button>
                    <button onClick={() => handleDelete(attr.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
