import React, { useEffect, useState } from 'react';

export default function RelationTypeManager() {
  const [relationTypes, setRelationTypes] = useState([]);
  const [newType, setNewType] = useState({ name: '', inverse_name: '', symmetric: false, transitive: false });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', inverse_name: '', symmetric: false, transitive: false });
  const [search, setSearch] = useState(""); // Add search state

  useEffect(() => {
    fetchRelationTypes();
  }, []);

  const fetchRelationTypes = () => {
    fetch('/api/relation-types')
      .then(res => res.json())
      .then(setRelationTypes);
  };

  const handleAdd = async () => {
    if (!newType.name.trim()) return;
    const res = await fetch('/api/relation-type', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newType)
    });
    if (res.ok) {
      setNewType({ name: '', inverse_name: '', symmetric: false, transitive: false });
      fetchRelationTypes();
    } else {
      alert("Error adding relation type.");
    }
  };

  const handleUpdate = async (id) => {
    const res = await fetch(`/api/relation-type/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    if (res.ok) {
      setEditId(null);
      fetchRelationTypes();
    } else {
      alert("Error updating relation type.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this relation type?")) return;
    const res = await fetch(`/api/relation-type/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      fetchRelationTypes();
    } else {
      alert("Error deleting relation.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Relation Types</h2>
      {/* Search/filter input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search relation types..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, maxWidth: '100%', padding: 6, borderRadius: 4, border: '1px solid #b5d6f7' }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Add new relation type card */}
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
            Add New Relation Type
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
                value={newType.name}
                onChange={e => setNewType({ ...newType, name: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <span style={{ fontWeight: 500 }}>Inverse Name:</span>
              <input
                type="text"
                placeholder="Inverse Name"
                value={newType.inverse_name}
                onChange={e => setNewType({ ...newType, inverse_name: e.target.value })}
                style={{ width: '100%' }}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={newType.symmetric}
                onChange={e => setNewType({ ...newType, symmetric: e.target.checked })}
              /> Symmetric
            </label>
            <label>
              <input
                type="checkbox"
                checked={newType.transitive}
                onChange={e => setNewType({ ...newType, transitive: e.target.checked })}
              /> Transitive
            </label>
            <button type="submit" style={{ marginTop: 8, minWidth: 60 }}>Add</button>
          </form>
        </div>
        {/* Relation type cards, filtered by search */}
        {relationTypes
          .filter(rt =>
            rt.name?.toLowerCase().includes(search.toLowerCase()) ||
            rt.inverse_name?.toLowerCase().includes(search.toLowerCase())
          )
          .map((rt) => (
          <div
            key={rt.id}
            style={{
              background: '#f7fbff',
              border: '1px solid #cbe6ff',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              minWidth: 0,
              wordBreak: 'break-word'
            }}
          >
            {/* Card label using Name */}
            <div style={{
              fontWeight: 600,
              fontSize: '1.1em',
              marginBottom: 8,
              color: '#1976d2'
            }}>
              {rt.name}
            </div>
            {editId === rt.id ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleUpdate(rt.id);
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
                  <span style={{ fontWeight: 500 }}>Inverse Name:</span>
                  <input
                    type="text"
                    value={editData.inverse_name || ''}
                    onChange={e => setEditData({ ...editData, inverse_name: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editData.symmetric}
                    onChange={e => setEditData({ ...editData, symmetric: e.target.checked })}
                  /> Symmetric
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editData.transitive}
                    onChange={e => setEditData({ ...editData, transitive: e.target.checked })}
                  /> Transitive
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {/* Name is now the card label, so omit here */}
                {/* <li><strong>Name:</strong> {rt.name}</li> */}
                <li><strong>Inverse Name:</strong> {rt.inverse_name || <span style={{ color: '#888' }}>-</span>}</li>
                <li><strong>Symmetric:</strong> {rt.symmetric ? "Yes" : "No"}</li>
                <li><strong>Transitive:</strong> {rt.transitive ? "Yes" : "No"}</li>
                <li style={{ marginTop: 8 }}>
                  <button
                    onClick={() => {
                      setEditId(rt.id);
                      setEditData({
                        name: rt.name,
                        inverse_name: rt.inverse_name || '',
                        symmetric: rt.symmetric,
                        transitive: rt.transitive
                      });
                    }}
                    style={{ marginRight: 8 }}
                  >Edit</button>
                  <button onClick={() => handleDelete(rt.id)}>Delete</button>
                </li>
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
