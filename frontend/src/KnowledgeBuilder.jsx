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
  const [showPropositionModal, setShowPropositionModal] = useState(false);
  const [nodeAttributes, setNodeAttributes] = useState([]);
  const [blocklyHeight, setBlocklyHeight] = useState(350);
  const draggingRef = useRef(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    if (selectedNodeId) {
      fetch(`/api/node/${selectedNodeId}/attributes`)
        .then(res => res.json())
        .then(setNodeAttributes);
    }
  }, [selectedNodeId]);

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
            node_label: node.label || node.title,
          });
        }
      }
      setNodeAttributes(allAttributes);
    }
    if (nodes.length > 0) {
      fetchAllNodeAttributes();
    }
  }, [nodes]);

  const onMouseDown = () => { draggingRef.current = true; };
  const onMouseMove = (e) => {
    if (draggingRef.current) {
      setBlocklyHeight(Math.max(120, Math.min(window.innerHeight - 200, e.clientY)));
    }
  };
  const onMouseUp = () => { draggingRef.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);


  async function handleSubmit() {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const allBlocks = workspace.getAllBlocks(false);
    const predicateBlock = allBlocks.find(b => b.type === 'predicate_relation_block');
    if (!predicateBlock) {
      alert("ℹ️ No relation block was found — injecting one now.");
      injectPropositionTemplate({
        subjectNode: { title: subject },
        relation,
        relationTypes,
        objectNode: { title: object }
      });
      return;
    }

    const subjectBlock = predicateBlock.getPreviousBlock();
    const objectInput = predicateBlock.getInput('TARGET_NODE');
    const objectBlock = objectInput?.connection?.targetBlock();

    if (!subjectBlock || !objectBlock || subjectBlock.type !== 'node_block' || objectBlock.type !== 'node_block') {
      alert("❗ Relation block must be connected to a subject and an object node block.");
      return;
    }

    const subject = subjectBlock.getFieldValue('TITLE');
    const relation = predicateBlock.getFieldValue('RELATION');
    const object = objectBlock.getFieldValue('TITLE');

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
      const subjectText = await subjectRes.text();
      let subject_id;
      try {
        subject_id = JSON.parse(subjectText).id;
      } catch (err) {
        console.error("❌ Failed to parse subject response:", subjectText);
        throw new Error("Subject creation failed.");
      }

      const objectRes = await fetch('/api/node/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: object })
      });
      const objectText = await objectRes.text();
      let object_id;
      try {
        object_id = JSON.parse(objectText).id;
      } catch (err) {
        console.error("❌ Failed to parse object response:", objectText);
        throw new Error("Object creation failed.");
      }

      const rel = relationTypes.find(r => r.name.toLowerCase() === relation.toLowerCase());
      if (!rel) {
        alert(`⚠️ Relation type "${relation}" not found.`);
        return;
      }

      const payload = {
        source: subject_id,
        target: object_id,
        relation_id: rel.id
      };
      console.log("Submitting relation to backend:", payload);

      const relationRes = await fetch('/api/relation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      alert("❌ Failed to save proposition:" + err.message);
    }
  }

  // other functions remain unchanged

  
    
  async function injectComposeNodeFromApi(node, neighbors, attributes, attributeTypes) {
    const workspace = workspaceRef.current;
    const composeBlock = workspace.newBlock('compose_node_block');
    composeBlock.initSvg();
    composeBlock.render();

    const nodeBlock = workspace.newBlock('node_block');
    nodeBlock.setFieldValue(node.qualifier || '', 'QUALIFIER');
    nodeBlock.setFieldValue(node.label || node.title, 'TITLE');
    nodeBlock.initSvg();
    nodeBlock.render();
    const nodeInput = composeBlock.getInput('NODE');
    if (nodeInput && nodeInput.connection && nodeBlock.outputConnection) {
      nodeInput.connection.connect(nodeBlock.outputConnection);
    }

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

      targetIds.forEach((targetId, idx) => {
        const targetNode = neighbors.nodes.find(n => n.id === targetId);
        if (!targetNode) return;
        const objBlock = workspace.newBlock('node_block');
        objBlock.setFieldValue(targetNode.qualifier || '', 'QUALIFIER');
        objBlock.setFieldValue(targetNode.label || targetNode.title, 'TITLE');
        objBlock.initSvg();
        objBlock.render();
        const inputName = idx === 0 ? 'TARGET_NODE' : `TARGET_NODE${idx+1}`;
        let targetInput = relBlock.getInput(inputName);
        if (!targetInput && idx > 0) {
          relBlock.appendValueInput(inputName).setCheck('Node');
          targetInput = relBlock.getInput(inputName);
        }
        if (targetInput && targetInput.connection && objBlock.outputConnection) {
          targetInput.connection.connect(objBlock.outputConnection);
        }
      });

      if (!previousPredicateBlock) {
        const predInput = composeBlock.getInput('PREDICATES');
        if (predInput && predInput.connection && relBlock.previousConnection) {
          predInput.connection.connect(relBlock.previousConnection);
        }
      } else {
        if (previousPredicateBlock.nextConnection && relBlock.previousConnection) {
          previousPredicateBlock.nextConnection.connect(relBlock.previousConnection);
        }
      }
      previousPredicateBlock = relBlock;
    }

    for (const a of attributes) {
      const attrType = attributeTypes.find(at => at.id === a.attribute_id);
      if (!attrType) continue;
      const attrBlock = workspace.newBlock('predicate_attribute_block');
      attrBlock.setFieldValue(attrType.name, 'ATTRIBUTE');
      attrBlock.initSvg();
      attrBlock.render();

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
      if (valInput && valInput.connection && valueBlock.outputConnection) {
        valInput.connection.connect(valueBlock.outputConnection);
      }

      if (!previousPredicateBlock) {
        const predInput = composeBlock.getInput('PREDICATES');
        if (predInput && predInput.connection && attrBlock.previousConnection) {
          predInput.connection.connect(attrBlock.previousConnection);
        }
      } else {
        if (previousPredicateBlock.nextConnection && attrBlock.previousConnection) {
          previousPredicateBlock.nextConnection.connect(attrBlock.previousConnection);
        }
      }
      previousPredicateBlock = attrBlock;
    }

    const SIDEBAR_WIDTH = 300;
    const baseX = SIDEBAR_WIDTH + 10;
    const offsetY = workspace.getTopBlocks(false).length * 60 + 40;
    composeBlock.moveBy(baseX, offsetY);
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
    
  
    
  function injectAttributeTemplate({ subjectNode, attribute, attributeTypes, value }) {
    const workspace = workspaceRef.current;
    const subjectBlock = workspace.newBlock('node_block');
    subjectBlock.setFieldValue(subjectNode.qualifier || '', 'QUALIFIER');
    subjectBlock.setFieldValue(subjectNode.label || subjectNode.title, 'TITLE');
    subjectBlock.initSvg();
    subjectBlock.render();

    const attrType = attributeTypes.find(a => a.name === attribute);
    if (!attrType) return;

    const attrBlock = workspace.newBlock('predicate_attribute_block');
    attrBlock.setFieldValue(attribute, 'ATTRIBUTE');
    attrBlock.initSvg();
    attrBlock.render();

    let valueBlock;
    switch (attrType.data_type) {
      case 'number':
        valueBlock = workspace.newBlock('value_number_block');
        valueBlock.setFieldValue(String(value), 'VAL');
        break;
      case 'boolean':
        valueBlock = workspace.newBlock('value_boolean_block');
        valueBlock.setFieldValue(value === 'true' ? 'true' : 'false', 'VAL');
        break;
      case 'date':
        valueBlock = workspace.newBlock('value_date_block');
        valueBlock.setFieldValue(value, 'VAL');
        break;
      case 'enum':
        valueBlock = workspace.newBlock('value_enum_block');
        if (attrType.allowed_values) {
          const options = attrType.allowed_values.split(',').map(v => [v.trim(), v.trim()]);
          const dropdown = valueBlock.getField('VAL');
          dropdown.menuGenerator_ = options;
          dropdown.setValue(value);
        }
        break;
      default:
        valueBlock = workspace.newBlock('value_text_block');
        valueBlock.setFieldValue(value, 'VAL');
    }
    valueBlock.initSvg();
    valueBlock.render();

    const valueInput = attrBlock.getInput('VALUE');
    if (valueInput && valueInput.connection && valueBlock.outputConnection) {
      valueInput.connection.connect(valueBlock.outputConnection);
    }

    if (attrBlock.previousConnection && subjectBlock.nextConnection) {
      attrBlock.previousConnection.connect(subjectBlock.nextConnection);
    }

    const offset = workspace.getTopBlocks(false).length * 60 + 40;
    subjectBlock.moveBy(40, offset);
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => workspaceRef.current?.clear()} style={{ margin: "0.5em" }}>
          Clear Workspace
        </button>
        <button onClick={() => setShowPropositionModal(true)}>Add Proposition</button>
        {showPropositionModal && attributeTypes.length > 0 && (
          <PropositionModal
              nodes={nodes}
              relationTypes={relationTypes}
              attributeTypes={attributeTypes}
              setNodes={setNodes}
              injectPropositionTemplate={injectPropositionTemplate}
              injectAttributeTemplate={injectAttributeTemplate}
              onClose={() => setShowPropositionModal(false)}
	      handleSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Blockly area with resizer */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ height: `${blocklyHeight}px`, background: '#23272e', width: '100%' }}>
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
        <div
          onMouseDown={onMouseDown}
          style={{ height: '8px', background: '#888', cursor: 'row-resize', width: '100%', position: 'absolute', top: `${blocklyHeight}px`, left: 0, zIndex: 10 }}
        />
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
            {relations.map((r, i) => {
              const subjectNode = nodes.find(n => (n.label || n.title) === r.source_label);
              const objectNode = nodes.find(n => (n.label || n.title) === r.target_label);
              const relationType = relationTypes.find(rt => rt.name === r.label);
              return (
                <li
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (subjectNode && objectNode && relationType) {
                      injectPropositionTemplate({
                        subjectNode,
                        quantifier: r.quantifier || '',
                        relation: relationType.name,
                        relationTypes,
                        objectNode,
                      });
                    } else {
                      alert('Could not find subject, object, or relation type!');
                    }
                  }}
                >
                  {r.source_label} {r.label} {r.target_label}
                </li>
              );
            })}
          </ul>
        )}



      {/* Tab content update to re-enable injecting attribute blocks */}
      {bottomTab === 'attributes' && (
        <ul>
          {nodeAttributes.map((a, i) => {
            const subjectNode = nodes.find(n => n.id === a.node_id);
            const attrType = attributeTypes.find(at => at.id === a.attribute_id);
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
                      value: a.value,
                    });
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
              <li
                key={i}
                style={{ cursor: 'pointer' }}
                onClick={async () => {
                  const neighbors = await fetch(`/api/node/${node.id}/neighbors`).then(res => res.json());
                  const attributes = await fetch(`/api/node/${node.id}/attributes`).then(res => res.json());
                  injectComposeNodeFromApi(node, neighbors, attributes, attributeTypes);
                }}
              >
                {node.qualifier && <span style={{ color: '#888', fontStyle: 'italic', marginRight: 4 }}>{node.qualifier} </span>}
                <span>{node.label || node.title}</span>
              </li>
            ))}
          </ul>
        )}

	  
      </div>
    </div>
  );
}



