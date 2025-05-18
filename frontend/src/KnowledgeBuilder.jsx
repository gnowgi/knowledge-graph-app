import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { definePropositionBlock, installNodeMatchValidator } from './blockly/customBlocks';
import PropositionModal from './PropositionModal';

export default function KnowledgeBuilder() {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [relations, setRelations] = useState([]);
  const [attributeTypes, setAttributes] = useState([]);
  const [relationTypes, setRelationTypes] = useState([]);
  const [bottomTab, setBottomTab] = useState('relations');
  const [difficulty, setDifficulty] = useState('easy'); // or 'moderate', etc.
  const [showPropositionModal, setShowPropositionModal] = useState(false);
  const [nodeAttributes, setNodeAttributes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);


    useEffect(() => {
	if (selectedNodeId) {
	    fetch(`/api/node/${selectedNodeId}/attributes`)
		.then(res => res.json())
		.then(setNodeAttributes);
	}
    }, [selectedNodeId]);




    useEffect(() => {
      async function fetchAllNodeAttributes() {
      const allAttributes = [];
      for (const node of nodes) {
	const res = await fetch(`/api/node/${node.id}/attributes`);
	const attrs = await res.json();
	for (const attr of attrs) {
          allAttributes.push({
            ...attr,
            node_id: node.id,
            node_label: node.label || node.title, // add for display
        });
      }
    }
      setNodeAttributes(allAttributes);
  }

  if (nodes.length > 0) {
    fetchAllNodeAttributes();
  }
  }, [nodes]);


    
  useEffect(() => {
    fetch('/api/attributes')
      .then(res => res.json())
      .then(setAttributes)
      .catch(console.error);
  }, []);
    
  useEffect(() => {
    async function setup() {
      const [nodeData, relationData, attributeData, relationTypeData] = await Promise.all([
        fetch('/api/nodes').then(res => res.json()),
        fetch('/api/relations').then(res => res.json()),
        fetch('/api/attributes').then(res => res.json()),
        fetch('/api/relation-types').then(res => res.json())
      ]);

      setNodes(nodeData);
      setRelations(relationData);
      setAttributes(attributeData);
      setRelationTypes(relationTypeData);

      definePropositionBlock(relationTypeData);
      console.log('Fetched attributes:', attributeData);

      const workspace = Blockly.inject(blocklyDiv.current, {
        toolbox: document.getElementById('blockly-toolbox'),
        trashcan: true,
      });

      installNodeMatchValidator(workspace, nodeData);
      workspaceRef.current = workspace;
    }
    setup();
      return () => workspaceRef.current?.dispose();

  }, []);

function injectComposeNodeFromApi(node, neighbors, attributes, attributeTypes) {
  const workspace = workspaceRef.current;

  // 1. Create compose_node_block
  const composeBlock = workspace.newBlock('compose_node_block');
  composeBlock.initSvg();
  composeBlock.render();

  // 2. Plug node_block in
  const nodeBlock = workspace.newBlock('node_block');
  nodeBlock.setFieldValue(node.qualifier || '', 'QUALIFIER');
  nodeBlock.setFieldValue(node.label || node.title, 'TITLE');
  nodeBlock.initSvg();
  nodeBlock.render();
  const nodeInput = composeBlock.getInput('NODE');
  if (nodeInput && nodeInput.connection && nodeBlock.outputConnection)
    nodeInput.connection.connect(nodeBlock.outputConnection);

  // 3. Stack all outgoing relations
  let previousPredicateBlock = null;
    const groupedRelations = {};
      for (const link of neighbors.links) {
	  const relName = link.label;
	  if (!groupedRelations[relName]) groupedRelations[relName] = [];
	  groupedRelations[relName].push(link.target);
      }

for (const [relName, targetIds] of Object.entries(groupedRelations)) {
  const relBlock = workspace.newBlock('predicate_relation_block');
  relBlock.initSvg();
  relBlock.render();

  const relationField = relBlock.getField('RELATION');
  if (relationField) {
    relationField.menuGenerator_ = relationTypes.map(rt => [rt.name, rt.name]);
    if (!relationTypes.some(rt => rt.name === relName)) {
      relationField.menuGenerator_.push([relName, relName]);
    }
    relationField.setValue(relName);
  }

  // Plug in all target nodes
  targetIds.forEach((targetId, idx) => {
    const targetNode = neighbors.nodes.find(n => n.id === targetId);
    if (!targetNode) return;
    const objBlock = workspace.newBlock('node_block');
    objBlock.setFieldValue(targetNode.qualifier || '', 'QUALIFIER');
    objBlock.setFieldValue(targetNode.label || targetNode.title, 'TITLE');
    objBlock.initSvg();
    objBlock.render();
    // Input names: "TARGET_NODE", "TARGET_NODE2", etc.
    const inputName = idx === 0 ? 'TARGET_NODE' : `TARGET_NODE${idx+1}`;
    // Make sure input exists (if block defines them)
    let targetInput = relBlock.getInput(inputName);
    if (!targetInput && idx > 0) {
      // If your block allows, dynamically add the input (for up to your defined max)
      relBlock.appendValueInput(inputName).setCheck('Node');
      targetInput = relBlock.getInput(inputName);
    }
    if (targetInput && targetInput.connection && objBlock.outputConnection) {
      targetInput.connection.connect(objBlock.outputConnection);
    }
  });

  // Chain into stack (as before)
  if (!previousPredicateBlock) {
    const predInput = composeBlock.getInput('PREDICATES');
    if (predInput && predInput.connection && relBlock.previousConnection)
      predInput.connection.connect(relBlock.previousConnection);
  } else {
    if (previousPredicateBlock.nextConnection && relBlock.previousConnection)
      previousPredicateBlock.nextConnection.connect(relBlock.previousConnection);
  }
  previousPredicateBlock = relBlock;
}

   
  // 4. Stack all attributes
  for (const a of attributes) {
    const attrType = attributeTypes.find(at => at.id === a.attribute_id);
    if (!attrType) continue;
    const attrBlock = workspace.newBlock('predicate_attribute_block');
    attrBlock.setFieldValue(attrType.name, 'ATTRIBUTE');
    attrBlock.initSvg();
    attrBlock.render();

    // Value block
    let valueBlock;
    switch (attrType.data_type) {
      case 'number':
        valueBlock = workspace.newBlock('value_number_block');
        valueBlock.setFieldValue(String(a.value), 'VAL');
        break;
      case 'boolean':
        valueBlock = workspace.newBlock('value_boolean_block');
        valueBlock.setFieldValue(String(a.value) === 'true' ? 'true' : 'false', 'VAL');
        break;
      case 'date':
        valueBlock = workspace.newBlock('value_date_block');
        valueBlock.setFieldValue(a.value, 'VAL');
        break;
      case 'enum':
        valueBlock = workspace.newBlock('value_enum_block');
        if (attrType.allowed_values) {
          const field = valueBlock.getField('VAL');
          const options = attrType.allowed_values.split(',').map(v => [v.trim(), v.trim()]);
          field.menuGenerator_ = options;
          field.setValue(a.value);
        }
        break;
      default:
        valueBlock = workspace.newBlock('value_text_block');
        valueBlock.setFieldValue(a.value, 'VAL');
        break;
    }
    valueBlock.initSvg();
    valueBlock.render();
    const valInput = attrBlock.getInput('VALUE');
    if (valInput && valInput.connection && valueBlock.outputConnection)
      valInput.connection.connect(valueBlock.outputConnection);

    // Chain attribute block
    if (!previousPredicateBlock) {
      const predInput = composeBlock.getInput('PREDICATES');
      if (predInput && predInput.connection && attrBlock.previousConnection)
        predInput.connection.connect(attrBlock.previousConnection);
    } else {
      if (previousPredicateBlock.nextConnection && attrBlock.previousConnection)
        previousPredicateBlock.nextConnection.connect(attrBlock.previousConnection);
    }
    previousPredicateBlock = attrBlock;
  }

  // 5. Place compose block at x = sidebar width + 10, y = workspace stack
  const SIDEBAR_WIDTH = 300;
  const baseX = SIDEBAR_WIDTH + 10;
  const offsetY = workspace.getTopBlocks(false).length * 60 + 40;
  composeBlock.moveBy(baseX, offsetY);
}

    




    
function injectAttributeTemplate({
  subjectNode = {},         // Node object {id, title, qualifier, ...}
  attribute = '',           // Attribute name
  attributeTypes = [],      // Array of attribute type objects
  value = '',               // The value for the attribute
}) {
  const workspace = workspaceRef.current;

  // 1. Create subject node block
  const subjectBlock = workspace.newBlock('node_block');
  subjectBlock.setFieldValue(subjectNode.qualifier || '', 'QUALIFIER');
  subjectBlock.setFieldValue(subjectNode.label || subjectNode.title || '', 'TITLE');
  subjectBlock.initSvg();
  subjectBlock.render();

    // 2. Lookup data type for the attribute
  const attrType = attributeTypes.find(a => a.name === attribute);
  const dataType = attrType ? attrType.data_type : 'text';
  const allowedValues = attrType && attrType.allowed_values ? attrType.allowed_values : null;

  // 3. Create predicate_attribute_block, set attribute label
  const attributeBlock = workspace.newBlock('predicate_attribute_block');
  attributeBlock.setFieldValue(attribute, 'ATTRIBUTE');
  attributeBlock.initSvg();
  attributeBlock.render();

  // 4. Create the correct value block and plug in
  let valueBlock;
  switch (dataType) {
    case 'number':
      valueBlock = workspace.newBlock('value_number_block');
      valueBlock.setFieldValue(String(value), 'VAL');
      break;
    case 'boolean':
      valueBlock = workspace.newBlock('value_boolean_block');
      valueBlock.setFieldValue(value === true || value === 'true' ? 'true' : 'false', 'VAL');
      break;
    case 'enum':
      valueBlock = workspace.newBlock('value_enum_block');
      // Set dropdown options dynamically if needed
      if (allowedValues) {
        const field = valueBlock.getField('VAL');
        const options = allowedValues.split(',').map(v => [v.trim(), v.trim()]);
        field.menuGenerator_ = options;
        if (options.some(([opt]) => opt === value)) {
          field.setValue(value);
        }
      }
      break;
    case 'date':
      valueBlock = workspace.newBlock('value_date_block');
      valueBlock.setFieldValue(value, 'VAL');
      break;
    default:
      valueBlock = workspace.newBlock('value_text_block');
      valueBlock.setFieldValue(value, 'VAL');
      break;
  }
  valueBlock.initSvg();
  valueBlock.render();

  // Plug value block into predicate_attribute_block's VALUE input
  const valueInput = attributeBlock.getInput('VALUE');
  if (valueInput && valueInput.connection && valueBlock.outputConnection) {
    valueInput.connection.connect(valueBlock.outputConnection);
  }

  // Stack predicate_attribute_block under subject node block
  if (attributeBlock.previousConnection && subjectBlock.nextConnection) {
    attributeBlock.previousConnection.connect(subjectBlock.nextConnection);
  }

  // Move subject block to a new row for clarity (optional)
    const SIDEBAR_WIDTH = 300;  // Or whatever your sidebar's width is
    const baseX = SIDEBAR_WIDTH;
    const offsetY = workspace.getTopBlocks(false).length * 60 + 40;
    subjectBlock.moveBy(baseX, offsetY);


  // (Optional: do not move valueBlock, Blockly will handle it visually)
}
    

function injectPropositionTemplate({
  subjectNode = {},
  quantifier = '',
  relation = '',
  relationTypes = [],
  objectNode = {}
}) {
  const workspace = workspaceRef.current;

  const subjectBlock = workspace.newBlock('node_block');
  subjectBlock.setFieldValue(subjectNode.qualifier || '', 'QUALIFIER');
  subjectBlock.setFieldValue(subjectNode.label || subjectNode.title || '', 'TITLE');
  if (typeof subjectBlock.showQuantifier === 'function') {
    subjectBlock.showQuantifier(!!quantifier);
    if (quantifier) subjectBlock.setFieldValue(quantifier, 'QUANTIFIER');
  }
  subjectBlock.initSvg();
  subjectBlock.render();

  const predBlock = workspace.newBlock('predicate_relation_block');
  const relationField = predBlock.getField('RELATION');
  if (relationField && relationTypes.length) {
    relationField.menuGenerator_ = relationTypes.map(rt => [rt.name, rt.name]);
    if (relation) relationField.setValue(relation);
  }
  predBlock.initSvg();
  predBlock.render();

  if (predBlock.previousConnection && subjectBlock.nextConnection) {
    predBlock.previousConnection.connect(subjectBlock.nextConnection);
  }

  const objectBlock = workspace.newBlock('node_block');
  objectBlock.setFieldValue(objectNode.qualifier || '', 'QUALIFIER');
  objectBlock.setFieldValue(objectNode.label || objectNode.title || '', 'TITLE');
  objectBlock.initSvg();
  objectBlock.render();

  const targetInput = predBlock.getInput('TARGET_NODE');
  if (targetInput && targetInput.connection && objectBlock.outputConnection) {
    targetInput.connection.connect(objectBlock.outputConnection);
  }

  // Move only the subject (root) block to a new row:
  const offset = workspace.getTopBlocks(false).length * 60 + 40;
  subjectBlock.moveBy(40, offset);

  // Do NOT move objectBlock after it is connected!
}

// Pseudo-code for handler when user clicks a proposition:
function handlePropositionClick(proposition) {
  // proposition: { subject_id, relation_type, object_id }
  const subjectNode = nodes.find(n => n.id === proposition.subject_id);
  const objectNode = nodes.find(n => n.id === proposition.object_id);
  const relationType = relationTypes.find(rt => rt.name === proposition.relation_type);
  injectPropositionTemplate({
    subjectNode,
    quantifier: proposition.quantifier || '',
    relation: relationType.name,
    relationTypes,
    objectNode
  });
}
    
    
  function injectAttribute(attribute) {
    const workspace = workspaceRef.current;
    const block = workspace.newBlock('attribute_block');
    block.setFieldValue(attribute.name, 'NAME');
    block.setFieldValue(attribute.description || '', 'DESCRIPTION');
    block.setFieldValue(attribute.data_type, 'DATA_TYPE');
    block.setFieldValue(attribute.allowed_values || '', 'ALLOWED_VALUES');
    block.setFieldValue(attribute.unit || '', 'UNIT');
    block.setFieldValue((attribute.applicable_nodes || []).join(", "), 'APPLICABLE_NODES');
    block.initSvg();
    block.render();
    const offset = workspace.getTopBlocks(false).length * 40;
    block.moveBy(20, offset);
  }

  function injectNodeBlock(node) {
  const workspace = workspaceRef.current;
  if (!workspace) return;
  const block = workspace.newBlock('node_block');
  block.setFieldValue(node.qualifier || '', 'QUALIFIER');
  block.setFieldValue(node.label || node.title || '', 'TITLE');
  block.initSvg();
  block.render();
  // Vertical offset for stacking
  const offset = workspace.getTopBlocks(false).length * 40;
  block.moveBy(20, offset);
}
  

  async function handleSubmit() {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const topBlocks = workspace.getTopBlocks(true);
    const proposition = topBlocks.find(b => b.type === 'proposition_block');
    if (!proposition) {
      alert("❗ No proposition block found.");
      return;
    }

    const subject = proposition.getFieldValue('SUBJECT');
    const relation = proposition.getFieldValue('RELATION');
    const object = proposition.getFieldValue('OBJECT');

    if (!subject || !relation || !object) {
      alert("❗ Please fill in all fields.");
      return;
    }

    try {
      const subjectRes = await fetch('/api/node/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: subject })
      });
      const subject_id = (await subjectRes.json()).id;

      const objectRes = await fetch('/api/node/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: object })
      });
      const object_id = (await objectRes.json()).id;

      const rel = relationTypes.find(r => r.name.toLowerCase() === relation.toLowerCase());
      if (!rel) {
        alert(`⚠️ Relation type "${relation}" not found.`);
        return;
      }

      const relationRes = await fetch('/api/relation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: subject_id,
          target: object_id,
          relation_id: rel.id,
          quantifier: null,
          modality: null
        })
      });

      if (!relationRes.ok) {
        const errText = await relationRes.text();
        throw new Error("Relation failed: " + errText);
      }

      const result = await relationRes.json();
      console.log("✅ Saved:", result);
      alert("✅ Proposition submitted.");
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("❌ Failed to save proposition:\n" + err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
	{/* Submit button bar */}
	<div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
<button
  onClick={() => {
    if (workspaceRef.current) {
      workspaceRef.current.clear();
    }
  }}
  style={{ margin: "0.5em" }}
>
  Clear Workspace
</button>


	    <button onClick={() => setShowPropositionModal(true)}>
  Add Proposition
</button>

	    {showPropositionModal && attributes.length > 0 && (
  <PropositionModal
    nodes={nodes}
      relationTypes={relationTypes}
      attributeTypes={attributes}     // pass as attributeTypes!
   setNodes={setNodes}
   injectPropositionTemplate={injectPropositionTemplate}
   injectAttributeTemplate={injectAttributeTemplate}
    onClose={() => setShowPropositionModal(false)}
  />
  )}



	</div>	    
 
      {/* Blockly area */}
      <div style={{ height: '25vh' }}>
        <xml id="blockly-toolbox" style={{ display: 'none' }}>

	    <category name="Build" colour="230">

		<block type="node_block" />
		<block type="predicate_relation_block" />
		<block type="predicate_attribute_block" />
		<block type="compose_node_block" />
	    </category>

        </xml>
        <div ref={blocklyDiv} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #ccc', background: '#eee' }}>
        <button onClick={() => setBottomTab('relations')}>🧾 Propositions</button>
        <button onClick={() => setBottomTab('attributes')}>🧬 Attributes</button>
        <button onClick={() => setBottomTab('nodes')}>🧠 Nodes</button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#fafafa' }}>
        {bottomTab === 'relations' && (

<ul>
  {relations.map((r, i) => (
    <li
      key={i}
      style={{ cursor: 'pointer' }}
      onClick={() => {
        // 1. Find the full node objects
        const subjectNode = nodes.find(n =>
          (n.label || n.title) === r.source_label
        );
        const objectNode = nodes.find(n =>
          (n.label || n.title) === r.target_label
        );
        // 2. Find the relation type object
        const relationType = relationTypes.find(rt =>
          rt.name === r.label
        );
        if (subjectNode && objectNode && relationType) {
          injectPropositionTemplate({
            subjectNode,
            quantifier: r.quantifier || '',
            relation: relationType.name,
            relationTypes,
            objectNode
          });
        } else {
          alert('Could not find subject, object, or relation type!');
        }
      }}
    >
      {r.source_label} {r.label} {r.target_label}
    </li>
  ))}
</ul>
        )}

          {bottomTab === 'attributes' && (

	      <ul>
  {nodeAttributes.map((a, i) => {
    const subjectNode = nodes.find(n => n.id === a.node_id);
    const attrType = attributeTypes.find(at => at.id === a.attribute_id);
    const value = a.value;
    return (
      <li
        key={i}
        style={{ cursor: 'pointer' }}
        onClick={() => {
          if (subjectNode && attrType) {
            injectAttributeTemplate({
              subjectNode,
              attribute: attrType.name,
              attributeTypes,
              value
            });
          } else {
            alert('Missing node or attribute type');
          }
        }}
      >
        {a.node_label} — {attrType?.name} = {a.value}
      </li>
    );
  })}
</ul>

        )}

	{bottomTab === 'nodes' && (
  <ul>
    {nodes.map((node, i) => (
	<li key={i} style={{ cursor: 'pointer' }}
	    onClick={async () => {
		const neighbors = await fetch(`/api/node/${node.id}/neighbors`).then(res => res.json());
		const attributes = await fetch(`/api/node/${node.id}/attributes`).then(res => res.json());
		injectComposeNodeFromApi(node, neighbors, attributes, attributeTypes);
	    }}

	>
        {/* Show qualifier in gray if present, then title */}
        {node.qualifier && (
          <span style={{ color: '#888', fontStyle: 'italic', marginRight: 4 }}>{node.qualifier} </span>
        )}
          <span>{node.label || node.title}</span>
      </li>
    ))}
  </ul>
	)}
      </div>
    </div>
  );
}
