import React, { useEffect, useState } from 'react';

const DATA_TYPES = [
  'string', 'integer', 'float', 'boolean', 'date', 'array'
];

export default function AttributeManager() {
  const [attributes, setAttributes] = useState([]);
  const [newAttr, setNewAttr] = useState({
    name: '', description: '', data_type: 'string', allowed_values: '', unit: ''
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '' });

  useEffect(() => {
    fetchAttributes();
  }, []);

  function fetchAttributes() {
    fetch('/api/attributes')
      .then(res => res.json())
      .then(setAttributes);
  }

  async function handleAdd() {
    if (!newAttr.name.trim() || !newAttr.data_type) return;
    const res = await fetch('/api/attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAttr)
    });
    if (res.ok) {
      setNewAttr({ name: '', description: '', data_type: 'string', allowed_values: '', unit: '' });
      fetchAttributes();
    } else {
      alert('Error adding attribute.');
    }
  }

  async function handleUpdate(id) {
    const res = await fetch(`/api/attribute/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
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
                        unit: attr.unit
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
