// src/blockly/customBlocks.js
 

import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as BlocklyJavaScript from 'blockly/javascript';


// --- Block Definitions ---

Blockly.defineBlocksWithJsonArray([
  // Proposition block
  {
    "type": "proposition_block",
    "message0": "Subject %1 Relation %2 Object %3",
    "args0": [
      { "type": "field_input", "name": "SUBJECT", "text": "" },
      { "type": "field_input", "name": "RELATION", "text": "" },
      { "type": "field_input", "name": "OBJECT", "text": "" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": 20,
    "tooltip": "Proposition block (subject-relation-object).",
    "helpUrl": ""
  },

  // Attribute block


  {
    "type": "attribute_block",
    "message0": "Attribute:",
    "args0": [],
    "message1": "Name: %1", "args1": [{ "type": "field_input", "name": "NAME", "text": "" }],
    "message2": "Description: %1", "args2": [{ "type": "field_input", "name": "DESCRIPTION", "text": "" }],
    "message3": "Data Type: %1", "args3": [{ "type": "field_input", "name": "DATA_TYPE", "text": "" }],
    "message4": "Allowed Values: %1", "args4": [{ "type": "field_input", "name": "ALLOWED_VALUES", "text": "" }],
    "message5": "Unit: %1", "args5": [{ "type": "field_input", "name": "UNIT", "text": "" }],
    "message6": "Applicable Nodes: %1", "args6": [{ "type": "field_input", "name": "APPLICABLE_NODES", "text": "" }],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120,
    "tooltip": "Attribute block.",
    "helpUrl": ""
  },

// {
//   "type": "predicate_relation_block",
//   "message0": "%1 %2",
//   "args0": [
//     { "type": "field_input", "name": "RELATION", "text": "relation" },
//     { "type": "field_input", "name": "TARGET_NODE", "text": "target node" }
//   ],
//   "previousStatement": null,
//   "nextStatement": null,
//   "colour": 65,
//   "tooltip": "Binary relation (relates to another node)",
//   "helpUrl": ""
// },
{
  "type": "predicate_attribute_block",
  "message0": "%1 %2",
  "args0": [
    { "type": "field_input", "name": "ATTRIBUTE", "text": "attribute" },
    { "type": "field_input", "name": "VALUE", "text": "value" }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 120,
  "tooltip": "Attribute assignment (relates to a value)",
  "helpUrl": ""
},


  // Node block
  {
    "type": "node_block",
    "message0": "Node: %1 %2",
    "args0": [
      { "type": "field_input", "name": "QUALIFIER", "text": "" },
      { "type": "field_input", "name": "TITLE", "text": "node title" }
    ],
    "previousStatement": null,  // allows node to be the start of a stack
    "nextStatement": null,      // allows node to have something stacked below (like predicate block)  
    "output": "Node",  // Or "Node" if you want to type-chain
    "colour": 210,
    "tooltip": "Node (entity) with optional qualifier.",
    "helpUrl": ""
  }
]);

// --- Predicate Relation Block (value input for node) ---
Blockly.Blocks['predicate_relation_block'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldTextInput("relation"), "RELATION");
    this.appendValueInput("TARGET_NODE")
      .setCheck("Node")  // Only allow node_block!
      .appendField("→");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Binary relation (relates to another node)");
    this.setHelpUrl("");
  }
};

// --- Code Generators ---

BlocklyJavaScript['node_block'] = function(block) {
  const qualifier = block.getFieldValue('QUALIFIER');
  const title = block.getFieldValue('TITLE');
  return JSON.stringify({ qualifier, title });
};

BlocklyJavaScript['predicate_relation_block'] = function(block) {
  const relation = block.getFieldValue('RELATION');
  // Get code from the attached node_block
  const target = BlocklyJavaScript.valueToCode(block, 'TARGET_NODE', BlocklyJavaScript.ORDER_NONE) || 'null';
  return JSON.stringify({ relation, target }) + ';\n';
};

BlocklyJavaScript['predicate_attribute_block'] = function(block) {
  const attribute = block.getFieldValue('ATTRIBUTE');
  const value = block.getFieldValue('VALUE');
  return JSON.stringify({ attribute, value }) + ';\n';
};




BlocklyJavaScript['proposition_block'] = function(block) {
  const subject = block.getFieldValue('SUBJECT');
  const relation = block.getFieldValue('RELATION');
  const object = block.getFieldValue('OBJECT');
  const code = JSON.stringify({ subject, relation, object });
  return code + ';\n';
};

BlocklyJavaScript['attribute_block'] = function(block) {
  const name = block.getFieldValue('NAME');
  const description = block.getFieldValue('DESCRIPTION');
  const data_type = block.getFieldValue('DATA_TYPE');
  const allowed_values = block.getFieldValue('ALLOWED_VALUES');
  const unit = block.getFieldValue('UNIT');
  const applicable_nodes = block.getFieldValue('APPLICABLE_NODES');
  const code = JSON.stringify({
    name, description, data_type, allowed_values, unit, applicable_nodes
  });
  return code + ';\n';
};


// --- Exported helpers (implement as needed) ---

export function definePropositionBlock(relationTypeData) {
  // Your dynamic proposition block logic here, if any
  // (For example: dynamically create blocks for each relation type)
}

export function installNodeMatchValidator(workspace, nodeData) {
  // Your custom validation logic here, if any
  // (For example: validate node existence or match constraints)
}
