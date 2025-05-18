import React from 'react';
import NodeProperties from './NodeProperties';

export default function NodeInfo({ node }) {
  if (!node) return null;
  return (
    <div
      style={{
        marginLeft: 24,
        marginRight: 24,
        marginTop: 0,
        marginBottom: 12,
        minWidth: 260,
        maxWidth: 600,
        background: '#fff',
        border: '1px solid #e3f6fc',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <h3 style={{ margin: 0 }}>{node.label}</h3>
      <NodeProperties nodeId={node.id} />
      {node.summary && (
        <>
          <strong>Summary:</strong>
          <p>{node.summary}</p>
        </>
      )}
    </div>
  );
}
