import React, { useEffect, useState } from 'react';

const NodeManager = () => {
  const [allNodes, setAllNodes] = useState([]);
  const [attributesByNode, setAttributesByNode] = useState({});
  const [possibleAttrsByNode, setPossibleAttrsByNode] = useState({});
  const [allAttributes, setAllAttributes] = useState([]);
  const [editNodeId, setEditNodeId] = useState(null);
  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [addAttrSelected, setAddAttrSelected] = useState({}); // { [nodeId]: attrId }
  const [search, setSearch] = useState('');

  // Fetch all nodes and all attributes
  useEffect(() => {
    fetch('/api/nodes')
      .then(res => res.json())
      .then(setAllNodes);

    fetch('/api/attributes')
      .then(res => res.json())
      .then(setAllAttributes);
  }, []);

  // Fetch attributes and possible attributes for all nodes
  useEffect(() => {
    allNodes.forEach(node => {
      fetch(`/api/node/${node.id}/attributes`)
        .then(res => res.json())
        .then(data => setAttributesByNode(prev => ({ ...prev, [node.id]: data })));

      fetch(`/api/nodes/${node.id}/possible-attributes`)
        .then(res => res.json())
        .then(data =>
          setPossibleAttrsByNode(prev => ({
            ...prev,
            [node.id]: [...data.direct, ...data.inherited]
          }))
        );
    });
  }, [allNodes]);

  // In-line edit handlers
  const handleEditLabel = (node) => {
    setEditNodeId(node.id);
    setEditNodeLabel(node.label);
  };
  const handleSaveLabel = async (node) => {
    await fetch(`/api/node/${node.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editNodeLabel })
    });
    setEditNodeId(null);
    // Refresh nodes
    fetch('/api/nodes')
      .then(res => res.json())
      .then(setAllNodes);
  };

  // Add possible attribute
  const handleAddPossibleAttribute = async (nodeId) => {
    const attrId = addAttrSelected[nodeId];
    if (!attrId) return;
    await fetch(`/api/nodes/${nodeId}/possible-attributes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribute_ids: [parseInt(attrId)] })
    });
    // Refresh possible attributes
    fetch(`/api/nodes/${nodeId}/possible-attributes`)
      .then(res => res.json())
      .then(data =>
        setPossibleAttrsByNode(prev => ({
          ...prev,
          [nodeId]: [...data.direct, ...data.inherited]
        }))
      );
    setAddAttrSelected(prev => ({ ...prev, [nodeId]: "" }));
  };

  // Remove possible attribute
  const handleRemovePossibleAttribute = async (nodeId, attrId) => {
    await fetch(`/api/nodes/${nodeId}/possible-attributes/${attrId}`, { method: 'DELETE' });
    fetch(`/api/nodes/${nodeId}/possible-attributes`)
      .then(res => res.json())
      .then(data =>
        setPossibleAttrsByNode(prev => ({
          ...prev,
          [nodeId]: [...data.direct, ...data.inherited]
        }))
      );
  };

  // Filtered nodes by search
  const filteredNodes = allNodes.filter(node =>
    node.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      <h2>Nodes</h2>
      {/* Search/filter input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search nodes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 240, maxWidth: '100%', padding: 6, borderRadius: 4, border: '1px solid #b5d6f7' }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}
      >
        {filteredNodes.map(node => (
          <div
            key={node.id}
            style={{
              background: '#f7fbff',
              border: '1px solid #cbe6ff',
              borderRadius: 8,
              padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              minWidth: 0,
              wordBreak: 'break-word',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch'
            }}
          >
            {/* Node label with in-line edit */}
            <div style={{ marginBottom: 8 }}>
              {editNodeId === node.id ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveLabel(node);
                  }}
                  style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                >
                  <input
                    type="text"
                    value={editNodeLabel}
                    onChange={e => setEditNodeLabel(e.target.value)}
                    style={{ fontWeight: 600, fontSize: '1.1em', flex: 1 }}
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditNodeId(null)}>Cancel</button>
                </form>
              ) : (
                <span style={{ fontWeight: 600, fontSize: '1.1em', color: '#1976d2' }}>
                  {node.label}
                  <button
                    style={{ marginLeft: 8, fontSize: '0.9em' }}
                    onClick={() => handleEditLabel(node)}
                  >Edit</button>
                </span>
              )}
            </div>
            {/* Node metadata */}
            <div style={{ color: '#444', marginBottom: 8 }}>
              <div><strong>ID:</strong> {node.id}</div>
              {node.summary && <div><strong>Summary:</strong> {node.summary}</div>}
              {/* Add more metadata fields here if present */}
            </div>
            {/* Declared attributes */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 500 }}>Declared Attributes:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(attributesByNode[node.id] || []).length === 0 && (
                  <li style={{ color: '#888' }}>None</li>
                )}
                {(attributesByNode[node.id] || []).map(attr => (
                  <li key={attr.attribute_id}>
                    <strong>{attr.name}:</strong> {attr.value}
                  </li>
                ))}
              </ul>
            </div>
            {/* Possible attributes */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 500 }}>Possible Attributes:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(possibleAttrsByNode[node.id] || []).length === 0 && (
                  <li style={{ color: '#888' }}>None</li>
                )}
                {(possibleAttrsByNode[node.id] || []).map(attr => (
                  <li key={attr.id}>
                    <strong>{attr.name}</strong>
                    <button
                      style={{ marginLeft: 8 }}
                      onClick={() => handleRemovePossibleAttribute(node.id, attr.id)}
                    >Remove</button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Add possible attribute form */}
            <div style={{ marginTop: 'auto' }}>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAddPossibleAttribute(node.id);
                }}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <select
                  value={addAttrSelected[node.id] || ""}
                  onChange={e =>
                    setAddAttrSelected(prev => ({ ...prev, [node.id]: e.target.value }))
                  }
                  style={{ flex: 1 }}
                >
                  <option value="">Select attribute to add...</option>
                  {allAttributes
                    .filter(attr =>
                      !(possibleAttrsByNode[node.id] || []).some(pa => pa.id === attr.id)
                    )
                    .map(attr => (
                      <option key={attr.id} value={attr.id}>
                        {attr.name}
                      </option>
                    ))}
                </select>
                <button type="submit" disabled={!addAttrSelected[node.id]}>
                  Add
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeManager;
