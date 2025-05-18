import React from 'react';
import { PencilIcon, TrashIcon, PlusCircleIcon, EyeIcon } from 'lucide-react';

const NodeCard = ({ node, onEdit, onDelete, onAddRelation, onView }) => {
  const isOrphan = node?.isOrphan;
  const attributes = node?.attributes || [];
  const possibleAttributes = node?.possibleAttributes || [];
  const neighbors = node?.neighbors || [];

  const declaredAttrNames = new Set(attributes.map(attr => attr.attributeName));

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {node.label || node.name}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {node.className || 'Unclassified'}
        </span>
      </div>

      {/* Declared Attributes */}
      <div className="grid grid-cols-1 gap-1 mb-4">
        <div className="text-sm text-gray-500">Declared Attributes:</div>
        {attributes.length === 0 && (
          <div className="text-sm text-gray-400 italic">None declared</div>
        )}
        {attributes.map(attr => (
          <div
            key={attr.attributeName}
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="font-medium">{attr.attributeName}:</span> {attr.value || '–'}
          </div>
        ))}
      </div>

      {/* Possible but Undeclared Attributes */}
      {possibleAttributes.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-500">Possible (undeclared) Attributes:</div>
          <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
            {possibleAttributes
              .filter(attr => !declaredAttrNames.has(attr.attributeName))
              .map(attr => (
                <li key={attr.attributeName}>
                  {attr.attributeName} ({attr.dataType}){attr.unit ? ` [${attr.unit}]` : ''}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Neighbors */}
      {neighbors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-500">Neighbors:</div>
          <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
            {neighbors.map((n) => (
              <li key={n.id}>
                {n.direction === 'outgoing'
                  ? `${node.name} —[${n.relation}]→ ${n.name}`
                  : `${n.name} ←[${n.relation}]— ${node.name}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onView}
          className="hover:text-blue-600 text-gray-500 dark:text-gray-300"
          title="View Node"
        >
          <EyeIcon size={18} />
        </button>
        <button
          onClick={onEdit}
          className="hover:text-green-600 text-gray-500 dark:text-gray-300"
          title="Edit Node"
        >
          <PencilIcon size={18} />
        </button>
        <button
          onClick={onAddRelation}
          className="hover:text-purple-600 text-gray-500 dark:text-gray-300"
          title="Add Relation"
        >
          <PlusCircleIcon size={18} />
        </button>
        <button
          onClick={onDelete}
          disabled={!isOrphan}
          className={`${
            isOrphan
              ? 'hover:text-red-600 text-gray-500 dark:text-gray-300'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={isOrphan ? 'Delete Node' : 'Cannot delete linked node'}
        >
          <TrashIcon size={18} />
        </button>
      </div>
    </div>
  );


import React from 'react';
import { PencilIcon, TrashIcon, PlusCircleIcon, EyeIcon } from 'lucide-react';

const NodeCard = ({ node, onEdit, onDelete, onAddRelation, onView }) => {
  const isOrphan = node?.isOrphan;
  const attributes = node?.attributes || [];
  const possibleAttributes = node?.possibleAttributes || [];
  const neighbors = node?.neighbors || [];

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-2xl p-4 w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {node.label || node.name}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {node.className || 'Unclassified'}
        </span>
      </div>

      {/* Declared Attributes */}
      <div className="grid grid-cols-1 gap-1 mb-4">
        {attributes.length === 0 && (
          <div className="text-sm text-gray-400 italic">No attributes</div>
        )}
        {attributes.map(attr => (
          <div
            key={attr.attributeName}
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            <span className="font-medium">{attr.attributeName}:</span> {attr.value || '–'}
          </div>
        ))}
      </div>

      {/* Possible Attributes */}
      {possibleAttributes.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-500">Possible Attributes:</div>
          <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
            {possibleAttributes.map((attr) => (
              <li key={attr.attributeName}>
                {attr.attributeName} ({attr.dataType}){attr.unit ? ` [${attr.unit}]` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Neighbors */}
      {neighbors.length > 0 && (
        <div className="mb-4">
          <div className="text-sm text-gray-500">Neighbors:</div>
          <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
            {neighbors.map((n) => (
              <li key={n.id}>
                {n.direction === 'outgoing'
                  ? `${node.name} —[${n.relation}]→ ${n.name}`
                  : `${n.name} ←[${n.relation}]— ${node.name}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onView}
          className="hover:text-blue-600 text-gray-500 dark:text-gray-300"
          title="View Node"
        >
          <EyeIcon size={18} />
        </button>
        <button
          onClick={onEdit}
          className="hover:text-green-600 text-gray-500 dark:text-gray-300"
          title="Edit Node"
        >
          <PencilIcon size={18} />
        </button>
        <button
          onClick={onAddRelation}
          className="hover:text-purple-600 text-gray-500 dark:text-gray-300"
          title="Add Relation"
        >
          <PlusCircleIcon size={18} />
        </button>
        <button
          onClick={onDelete}
          disabled={!isOrphan}
          className={`${
            isOrphan
              ? 'hover:text-red-600 text-gray-500 dark:text-gray-300'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          title={isOrphan ? 'Delete Node' : 'Cannot delete linked node'}
        >
          <TrashIcon size={18} />
        </button>
      </div>
    </div>
  );
};

export default NodeCard;

};

export default NodeCard;
