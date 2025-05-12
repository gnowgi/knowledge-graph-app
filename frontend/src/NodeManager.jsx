import React, { useEffect, useState } from 'react';

const NodeManager = () => {
  const [allNodes, setAllNodes] = useState([]);
  const [search, setSearch] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [node, setNode] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [possibleAttributes, setPossibleAttributes] = useState([]);
  const [selectedAttrId, setSelectedAttrId] = useState("");

  // Load all nodes for selection
  useEffect(() => {
    fetch('/api/nodes')
      .then(res => res.json())
      .then(setAllNodes);
  }, []);

  // Load node info, current attribute values, all attributes, and possible attributes
  useEffect(() => {
    if (!nodeId) return;

    fetch(`/api/node/${nodeId}`)
      .then(res => res.json())
      .then(data => setNode(data));

    fetch(`/api/node/${nodeId}/attributes`)
      .then(res => res.json())
      .then(data => setAttributes(data));

    fetch('/api/attributes')
      .then(res => res.json())
      .then(data => setAllAttributes(data));

    // FIX: Use /api/nodes/... for possible attributes
    fetch(`/api/nodes/${nodeId}/possible-attributes`)
      .then(res => res.json())
      .then(data => setPossibleAttributes([...data.direct, ...data.inherited]));
  }, [nodeId]);

  const handleAddPossibleAttribute = async () => {
    if (!selectedAttrId) return;
    await fetch(`/api/nodes/${nodeId}/possible-attributes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attribute_ids: [parseInt(selectedAttrId)] })
    });
    fetch(`/api/nodes/${nodeId}/possible-attributes`)
      .then(res => res.json())
      .then(data => setPossibleAttributes([...data.direct, ...data.inherited]));
    setSelectedAttrId("");
  };

  const handleRemovePossibleAttribute = async (attrId) => {
    await fetch(`/api/nodes/${nodeId}/possible-attributes/${attrId}`, { method: 'DELETE' });
    fetch(`/api/nodes/${nodeId}/possible-attributes`)
      .then(res => res.json())
      .then(data => setPossibleAttributes([...data.direct, ...data.inherited]));
  };

  // Filter nodes by search query
  const filteredNodes = allNodes.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ paddingLeft: 24 }}>
      <h2>Select Node</h2>
      <input
        type="text"
        placeholder="Search node..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setNodeId(""); // Reset selection when typing
        }}
        style={{ marginBottom: 8, width: '80%' }}
        list="node-search-list"
        onBlur={e => {
          // Auto-select node if input matches a label exactly (case-insensitive, trimmed)
          const match = filteredNodes.find(
            n => n.label.trim().toLowerCase() === e.target.value.trim().toLowerCase()
          );
          if (match) setNodeId(match.id);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const match = filteredNodes.find(
              n => n.label.trim().toLowerCase() === search.trim().toLowerCase()
            );
            if (match) setNodeId(match.id);
          }
        }}
      />
      <datalist id="node-search-list">
        {filteredNodes.map(n => (
          <option key={n.id} value={n.label} />
        ))}
      </datalist>

      {/* Show a button to select if user picks from datalist or types and wants to confirm */}
      <button
        style={{ marginBottom: 16, marginLeft: 8 }}
        disabled={
          !filteredNodes.some(
            n => n.label.trim().toLowerCase() === search.trim().toLowerCase()
          )
        }
        onClick={() => {
          const match = filteredNodes.find(
            n => n.label.trim().toLowerCase() === search.trim().toLowerCase()
          );
          if (match) setNodeId(match.id);
        }}
      >
        Select
      </button>

      {node && (
        <>
          <h2>Node: {node.label}</h2>
          <p>{node.summary}</p>

          <h3>Existing Attributes</h3>
          <ul>
            {attributes.map(attr => (
              <li key={attr.attribute_id}>
                <strong>{attr.name}:</strong> {attr.value}
              </li>
            ))}
          </ul>

          <h3>Possible Attributes</h3>
          <ul>
            {possibleAttributes.map(attr => (
              <li key={attr.id}>
                <strong>{attr.name}</strong>
                <button style={{ marginLeft: 8 }} onClick={() => handleRemovePossibleAttribute(attr.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div>
            <select
              value={selectedAttrId}
              onChange={e => setSelectedAttrId(e.target.value)}
            >
              <option value="">Select attribute to add...</option>
              {allAttributes
                .filter(attr => !possibleAttributes.some(pa => pa.id === attr.id))
                .map(attr => (
                  <option key={attr.id} value={attr.id}>
                    {attr.name}
                  </option>
                ))}
            </select>
            <button onClick={handleAddPossibleAttribute} disabled={!selectedAttrId}>
              Add Possible Attribute
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NodeManager;
