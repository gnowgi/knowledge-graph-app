import React, { useState } from 'react';

export default function PropositionModal({
    nodes,
    relationTypes,
    attributeTypes,
    injectPropositionTemplate,
    injectAttributeTemplate,
    setNodes,
    onClose,
    handleSubmit
}) {
  attributeTypes = attributeTypes || [];

  const [activeTab, setActiveTab] = useState('relation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Relation tab states
  const [subject, setSubject] = useState('');
  const [quantifier, setQuantifier] = useState('');
  const [relation, setRelation] = useState('');
  const [objectNodeId, setObjectNodeId] = useState('');

  // Attribute tab states
  const [attributeSubject, setAttributeSubject] = useState('');
  const [attribute, setAttribute] = useState('');
  const [attributeValue, setAttributeValue] = useState('');

  // Helper to get or create a node
  async function getOrCreateNode(title, nodes, setNodes) {
    let nodeObj = nodes.find(n => (n.label || n.title).toLowerCase() === title.trim().toLowerCase());
    if (!nodeObj && title.trim()) {
      const res = await fetch('/api/node/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      nodeObj = await res.json();
      if (setNodes) setNodes(prev => [...prev, nodeObj]);
    }
    return nodeObj;
  }

  return (
    <div style={{
      position: 'fixed', top: '30%', left: '35%', width: '30%', padding: 20,
      background: '#fff', border: '1px solid #ccc', borderRadius: 8, zIndex: 1000
    }}>
      <div style={{ display: 'flex', marginBottom: 16 }}>
        <button
          style={{
            flex: 1,
            fontWeight: activeTab === 'relation' ? 'bold' : 'normal',
            background: activeTab === 'relation' ? '#e0e0ff' : '#f9f9f9'
          }}
          onClick={() => setActiveTab('relation')}
        >Relate Nodes</button>
        <button
          style={{
            flex: 1,
            fontWeight: activeTab === 'attribute' ? 'bold' : 'normal',
            background: activeTab === 'attribute' ? '#e0ffe0' : '#f9f9f9'
          }}
          onClick={() => setActiveTab('attribute')}
        >Set Attribute</button>
      </div>

      {activeTab === 'relation' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label>Quantifier: </label>
            <select value={quantifier} onChange={e => setQuantifier(e.target.value)}>
              <option value="">(none)</option>
              <option value="all">all</option>
              <option value="some">some</option>
              <option value="no">no</option>
              <option value="most">most</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Subject Node: </label>
            <input
              type="text"
              list="subjectNodeList"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Type or select node"
            />
            <datalist id="subjectNodeList">
              {nodes.map(n => (
                <option value={n.label || n.title} key={n.id}>
                  {n.qualifier ? n.qualifier + ' ' : ''}{n.label || n.title}
                </option>
              ))}
            </datalist>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Relation: </label>
            <select value={relation} onChange={e => setRelation(e.target.value)}>
              <option value="">(choose relation)</option>
              {relationTypes.map(rt => (
                <option value={rt.name} key={rt.name}>{rt.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Object Node: </label>
            <input
              type="text"
              list="objectNodeList"
              value={objectNodeId}
              onChange={e => setObjectNodeId(e.target.value)}
              placeholder="Type or select node"
            />
            <datalist id="objectNodeList">
              {nodes.map(n => (
                <option value={n.label || n.title} key={n.id}>
                  {n.qualifier ? n.qualifier + ' ' : ''}{n.label || n.title}
                </option>
              ))}
            </datalist>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              disabled={isSubmitting || !subject.trim() || !relation || !objectNodeId.trim()}
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  const subjectNodeObj = await getOrCreateNode(subject, nodes, setNodes);
                  const objectNodeObj = await getOrCreateNode(objectNodeId, nodes, setNodes);

                  injectPropositionTemplate({
                    mode: 'relation',
                    subjectNode: subjectNodeObj,
                    quantifier,
                    relation,
                    relationTypes,
                    objectNode: objectNodeObj
                  });
                  onClose();
                } catch (err) {
                  alert('Error creating proposition: ' + err.message);
                  console.error(err);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >Insert Relation Proposition</button>
	      <button
		  style={{ marginLeft: '1em' }}
		  onClick={handleSubmit}
	      >
		  Submit Proposition to Backend
	      </button>

          </div>
        </>
      )}

      {activeTab === 'attribute' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label>Subject Node: </label>
            <input
              type="text"
              list="attributeSubjectNodeList"
              value={attributeSubject}
              onChange={e => setAttributeSubject(e.target.value)}
              placeholder="Type or select node"
            />
            <datalist id="attributeSubjectNodeList">
              {nodes.map(n => (
                <option value={n.label || n.title} key={n.id}>
                  {n.qualifier ? n.qualifier + ' ' : ''}{n.label || n.title}
                </option>
              ))}
            </datalist>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Attribute: </label>
            <select value={attribute} onChange={e => setAttribute(e.target.value)}>
              <option value="" >(choose attribute)</option>
		
		{attributeTypes.map(a => (
                <option value={a.name} key={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
              <label>Value: </label>
	      {(() => {
  const selectedAttr = attributeTypes.find(a => a.name === attribute);
  if (!selectedAttr) {
    return (
      <input
        type="text"
        value={attributeValue}
        onChange={e => setAttributeValue(e.target.value)}
        placeholder="Enter value"
      />
    );
  }

  switch (selectedAttr.data_type) {
    case 'number':
      return (
        <input
          type="number"
          value={attributeValue}
          onChange={e => setAttributeValue(e.target.value)}
          placeholder={`Enter a number${selectedAttr.unit ? ' (' + selectedAttr.unit + ')' : ''}`}
        />
      );
    case 'boolean':
      return (
        <select value={attributeValue} onChange={e => setAttributeValue(e.target.value)}>
          <option value="">(choose)</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    case 'enum':
      // Assumes allowed_values is a comma-separated string
      return (
        <select value={attributeValue} onChange={e => setAttributeValue(e.target.value)}>
          <option value="">(choose)</option>
          {selectedAttr.allowed_values &&
            selectedAttr.allowed_values.split(',').map(val => (
              <option value={val.trim()} key={val.trim()}>{val.trim()}</option>
            ))}
        </select>
      );
    case 'date':
      return (
        <input
          type="date"
          value={attributeValue}
          onChange={e => setAttributeValue(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          value={attributeValue}
          onChange={e => setAttributeValue(e.target.value)}
          placeholder="Enter value"
        />
      );
  }
})()}

         
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
<button
  disabled={isSubmitting || !attributeSubject.trim() || !attribute || !attributeValue.trim()}
  onClick={async () => {
    setIsSubmitting(true);
    try {
      // 1. Find or create the subject node
      const subjectNodeObj = await getOrCreateNode(attributeSubject, nodes, setNodes);

      // 2. Find the attribute type object by name
      const attributeTypeObj = attributeTypes.find(a => a.name === attribute);

      if (!attributeTypeObj) {
        alert('Selected attribute not found.');
        return;
      }

      // 3. POST to the backend to set the attribute value
      const res = await fetch(`/api/node/${subjectNodeObj.id}/attribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attribute_id: attributeTypeObj.id,
          value: attributeValue,
          quantifier: '' // Add if you use quantifiers for attributes
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Optionally, show success or update UI
        injectAttributeTemplate({
          subjectNode: subjectNodeObj,
          attribute,
          attributeTypes,
          value: attributeValue
        });
        onClose();
      } else {
        alert(data.error || 'Failed to set attribute');
      }
    } catch (err) {
      alert('Error creating attribute proposition: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }}
>
  Insert Attribute Proposition
</button>


          </div>
        </>
      )}

      <div style={{ textAlign: 'right', marginTop: 12 }}>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
