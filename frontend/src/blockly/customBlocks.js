// src/blockly/customBlocks.js
 

import * as Blockly from 'blockly';
import 'blockly/blocks';
import * as BlocklyJavaScript from 'blockly/javascript';


// --- Block Definitions ---

Blockly.defineBlocksWithJsonArray([
  {
    "type": "compose_node_block",
    "message0": "Node: %1",
    "args0": [
      { "type": "input_value", "name": "NODE", "check": "Node" }
    ],
    "message1": "Predicates %1",
    "args1": [
      { "type": "input_statement", "name": "PREDICATES" } // stack of relation/attribute blocks
    ],
    "colour": 270,
    "tooltip": "Compose all knowledge about a node",
    "helpUrl": ""
  }
]);


Blockly.defineBlocksWithJsonArray([

  // --- Value Text Block ---
  {
    "type": "value_text_block",
    "message0": "%1",
    "args0": [
      { "type": "field_input", "name": "VAL", "text": "value" }
    ],
    "output": "Value",
    "colour": 160,
    "tooltip": "Text value",
    "helpUrl": ""
  },

  // --- Value Number Block ---
  {
    "type": "value_number_block",
    "message0": "%1",
    "args0": [
      { "type": "field_number", "name": "VAL", "value": 0 }
    ],
    "output": "Value",
    "colour": 180,
    "tooltip": "Number value",
    "helpUrl": ""
  },

  // --- Value Boolean Block ---
  {
    "type": "value_boolean_block",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "VAL",
        "options": [
          ["true", "true"],
          ["false", "false"]
        ]
      }
    ],
    "output": "Value",
    "colour": 200,
    "tooltip": "Boolean value",
    "helpUrl": ""
  },

  // --- Value Enum Block (takes comma-separated options via mutation/extension) ---
  {
    "type": "value_enum_block",
    "message0": "%1",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "VAL",
        "options": [["(choose)", ""]]
      }
    ],
    "output": "Value",
    "colour": 220,
    "tooltip": "Enum value",
    "helpUrl": ""
  },

  // --- Value Date Block ---
  {
    "type": "value_date_block",
    "message0": "%1",
    "args0": [
      { "type": "field_input", "name": "VAL", "text": "YYYY-MM-DD" }
    ],
    "output": "Value",
    "colour": 240,
    "tooltip": "Date value (ISO format: YYYY-MM-DD)",
    "helpUrl": ""
  }

]);


Blockly.defineBlocksWithJsonArray([
  {
    "type": "predicate_attribute_block",
    "message0": "%1 : %2",
    "args0": [
      {
        "type": "field_label_serializable",
        "name": "ATTRIBUTE",
        "text": "attribute"
      },
      {
        "type": "input_value",
        "name": "VALUE",
        "check": "Value"
      }
    ],
    "previousStatement": "Predicate",
    "nextStatement": "Predicate",
    "colour": 120,
    "tooltip": "Attribute assignment (relates node to value)",
    "helpUrl": ""
  }
]);


Blockly.defineBlocksWithJsonArray([
  // Proposition block

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


  {
    "type": "node_block",
      "message0": "Node: %1 %2 %3",

    
    "args0": [
      {
        "type": "field_dropdown",
        "name": "QUANTIFIER",
        "options": [
          ["", ""],
          ["all", "all"],
          ["some", "some"],
          ["no", "no"],
          ["most", "most"]
        ]
      },
      { "type": "field_input", "name": "QUALIFIER", "text": "" },
      { "type": "field_input", "name": "TITLE", "text": "node title" }
    ],
      "args1": [
	  { "type": "input_statement", "name": "PREDICATES", "check": "Predicate" }
      ],
    "output": "Node",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Node (with optional quantifier for moderate+ difficulty)",
    "helpUrl": "",
    "extensions": ["hide_quantifier_field"]
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

Blockly.defineBlocksWithJsonArray([
  {
    "type": "predicate_relation_block",
    "message0": "%1 → %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "RELATION",
        "options": [
          ["", ""]
          // Placeholder; fill dynamically or keep a few defaults
        ]
      },
      {
        "type": "input_value",
        "name": "TARGET_NODE",
        "check": "Node"
      }
    ],
    "previousStatement": "Predicate",
    "nextStatement": "Predicate",
    "colour": 65,
    "tooltip": "Binary relation (relates to another node)",
    "helpUrl": ""
  }
]);


Blockly.Extensions.register('hide_quantifier_field', function() {
  const quantifierField = this.getField('QUANTIFIER');
  if (quantifierField) {
    quantifierField.setVisible(false);
  }
  this.showQuantifier = function(show = false) {
    if (quantifierField) {
      quantifierField.setVisible(show);
      this.render(); // update block display
    }
  };
});



// --- Code Generators ---

// Make sure you import Blockly.JavaScript (or BlocklyJS) as in your project

BlocklyJavaScript['value_text_block'] = function(block) {
  const value = block.getFieldValue('VAL');
  return [JSON.stringify(value), 0];
};

BlocklyJavaScript['value_number_block'] = function(block) {
  const value = Number(block.getFieldValue('VAL'));
  return [value, 0];
};

BlocklyJavaScript['value_boolean_block'] = function(block) {
  const value = block.getFieldValue('VAL') === 'true';
  return [value, 0];
};

BlocklyJavaScript['value_enum_block'] = function(block) {
  const value = block.getFieldValue('VAL');
  return [JSON.stringify(value), 0];
};

BlocklyJavaScript['value_date_block'] = function(block) {
  const value = block.getFieldValue('VAL');
  return [JSON.stringify(value), 0];
};


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
  const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
  // For a pure semantic triple, return as a JS object:
  const prop = `{ attribute: ${JSON.stringify(attribute)}, value: ${value} }`;
  return prop + ';\n';
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


BlocklyJavaScript['compose_node_block'] = function(block) {
  // 1. Generate code for the NODE input (should return node label/title)
  const node = BlocklyJS.valueToCode(block, 'NODE', BlocklyJS.ORDER_ATOMIC);

  // 2. Generate code for the stacked predicates
  const predicates = BlocklyJS.statementToCode(block, 'PREDICATES');

  // 3. Output as a single JS object (or adapt to your backend/export needs)
  // You might want an object like:
  // { node: ..., predicates: [ ... ] }
  // But because predicate blocks may each generate a semicolon-ended string, we'll collect as an array

  // Remove trailing semicolons and split into an array
  const predicateArray = predicates
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line !== ';' && line !== 'undefined;')
    .map(line => line.endsWith(';') ? line.slice(0, -1) : line);

  // Compose the JS/JSON object
  const code = `
{
  node: ${node},
  predicates: [
    ${predicateArray.join(',\n    ')}
  ]
}
  `;

  // If this is meant to be a statement block, return code + newline;
  // if output, use: return [code, BlocklyJS.ORDER_ATOMIC];
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
