import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { definePropositionBlock, installNodeMatchValidator } from './blockly/customBlocks';
import PropositionModal from './PropositionModal';

export default function KnowledgeBuilder() {
  const blocklyDiv = useRef(null);
  const workspaceRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [relations, setRelations] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [relationTypes, setRelationTypes] = useState([]);
  const [bottomTab, setBottomTab] = useState('relations');
  const [difficulty, setDifficulty] = useState('easy'); // or 'moderate', etc.
  const [showPropositionModal, setShowPropositionModal] = useState(false);


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

  function injectProposition({ subject, relation, object }) {
    const workspace = workspaceRef.current;
    const block = workspace.newBlock('proposition_block');
    block.setFieldValue(subject, 'SUBJECT');
    block.setFieldValue(relation, 'RELATION');
    block.setFieldValue(object, 'OBJECT');
    block.initSvg();
    block.render();
    const offset = workspace.getTopBlocks(false).length * 40;
    block.moveBy(20, offset);
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
  const offset = workspace.getTopBlocks(false).length * 60 + 40;
  subjectBlock.moveBy(40, offset);

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
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <button onClick={handleSubmit}>Submit Proposition</button>
      </div>
 
      {/* Blockly area */}
      <div style={{ height: '25vh' }}>
        <xml id="blockly-toolbox" style={{ display: 'none' }}>

	    <category name="Build" colour="230">
		<block type="attribute_block" />
		<block type="node_block" />
		<block type="predicate_relation_block" />
		<block type="predicate_attribute_block" />
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
              <li key={i} style={{ cursor: 'pointer' }}
                  onClick={() => injectProposition({ subject: r.source_label, relation: r.label, object: r.target_label })}>
                {r.source_label} {r.label} {r.target_label}
              </li>
            ))}
          </ul>
        )}
        {bottomTab === 'attributes' && (
          <ul>
            {attributes.map((a, i) => (
              <li key={i} style={{ cursor: 'pointer' }}
                  onClick={() => injectAttribute(a)}>
                {a.name} = {a.allowed_values} ({a.data_type})
              </li>
            ))}
          </ul>
        )}

	{bottomTab === 'nodes' && (
  <ul>
    {nodes.map((n, i) => (
      <li key={i} style={{ cursor: 'pointer' }} onClick={() => injectNodeBlock(n)}>
        {/* Show qualifier in gray if present, then title */}
        {n.qualifier && (
          <span style={{ color: '#888', fontStyle: 'italic', marginRight: 4 }}>{n.qualifier} </span>
        )}
          <span>{n.label || n.title}</span>
      </li>
    ))}
  </ul>
	)}
      </div>
    </div>
  );
}
