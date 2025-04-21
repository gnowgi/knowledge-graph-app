
import React, { useEffect, useState } from 'react';

export default function RelationTypeManager() {
  const [relationTypes, setRelationTypes] = useState([]);
  const [newType, setNewType] = useState({ name: '', inverse_name: '', symmetric: false, transitive: false });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({ name: '', inverse_name: '', symmetric: false, transitive: false });

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
    const res = await fetch(`/api/relation/${id}`, {
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

      <h4>Add New</h4>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Name"
          value={newType.name}
          onChange={(e) => setNewType({ ...newType, name: e.target.value })}
          style={{ marginRight: '8px' }}
        />
        <input
          type="text"
          placeholder="Inverse Name"
          value={newType.inverse_name}
          onChange={(e) => setNewType({ ...newType, inverse_name: e.target.value })}
          style={{ marginRight: '8px' }}
        />
        <label style={{ marginRight: '8px' }}>
          <input
            type="checkbox"
            checked={newType.symmetric}
            onChange={(e) => setNewType({ ...newType, symmetric: e.target.checked })}
          /> Symmetric
        </label>
        <label>
          <input
            type="checkbox"
            checked={newType.transitive}
            onChange={(e) => setNewType({ ...newType, transitive: e.target.checked })}
          /> Transitive
        </label>
        <button onClick={handleAdd} style={{ marginLeft: '10px' }}>Add</button>
      </div>

      <hr />

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Inverse Name</th>
            <th>Symmetric</th>
            <th>Transitive</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relationTypes.map(rt => (
            <tr key={rt.id}>
              <td>
                {editId === rt.id ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                ) : rt.name}
              </td>
              <td>
                {editId === rt.id ? (
                  <input
                    type="text"
                    value={editData.inverse_name || ''}
                    onChange={(e) => setEditData({ ...editData, inverse_name: e.target.value })}
                  />
                ) : rt.inverse_name || "-"}
              </td>
              <td>
                {editId === rt.id ? (
                  <input
                    type="checkbox"
                    checked={editData.symmetric}
                    onChange={(e) => setEditData({ ...editData, symmetric: e.target.checked })}
                  />
                ) : rt.symmetric ? "Yes" : "No"}
              </td>
              <td>
                {editId === rt.id ? (
                  <input
                    type="checkbox"
                    checked={editData.transitive}
                    onChange={(e) => setEditData({ ...editData, transitive: e.target.checked })}
                  />
                ) : rt.transitive ? "Yes" : "No"}
              </td>
              <td>
                {editId === rt.id ? (
                  <>
                    <button onClick={() => handleUpdate(rt.id)}>Save</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => {
                      setEditId(rt.id);
                      setEditData({
                        name: rt.name,
                        inverse_name: rt.inverse_name || '',
                        symmetric: rt.symmetric,
                        transitive: rt.transitive
                      });
                    }}>Edit</button>
                    <button onClick={() => handleDelete(rt.id)}>Delete</button>
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
