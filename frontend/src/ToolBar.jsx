import React from 'react';
import NodeInfo from './NodeInfo';
import RelationCreator from './RelationCreator';
import PropertyCreator from './PropertyCreator';

export default function ToolBar({
  creatorTab,
  setCreatorTab,
  selectedNode,
  handleRelationCreated,
  handlePropertyAdded,
  difficulty,
  allNodes,
  relationList,
  searchQuery,
  setSearchQuery,
  showNodeAndNeighbors,
  showRelation,
  editNodeId,
  setEditNodeId,
  editNodeData,
  setEditNodeData,
  handleDeleteNode,
  handleDeleteRelation,
  nodes,
  setNodes,
  setAllNodes
}) {
  return (
    <>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '16px 0 0 24px',
      }}>
        <div style={{
          display: 'flex',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          border: '1px solid #e3f6fc'
        }}>
          <button
            onClick={() => setCreatorTab('view')}
            style={{
              padding: '10px 24px',
              background: creatorTab === 'view' ? '#e3f6fc' : '#fff',
              border: 'none',
              borderBottom: creatorTab === 'view' ? '2px solid #1976d2' : 'none',
              fontWeight: 600,
              color: creatorTab === 'view' ? '#1976d2' : '#333',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            View
          </button>
          <button
            onClick={() => setCreatorTab('relation')}
            style={{
              padding: '10px 24px',
              background: creatorTab === 'relation' ? '#e3f6fc' : '#fff',
              border: 'none',
              borderBottom: creatorTab === 'relation' ? '2px solid #1976d2' : 'none',
              fontWeight: 600,
              color: creatorTab === 'relation' ? '#1976d2' : '#333',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Create Relation
          </button>
          <button
            onClick={() => setCreatorTab('property')}
            style={{
              padding: '10px 24px',
              background: creatorTab === 'property' ? '#e3f6fc' : '#fff',
              border: 'none',
              borderBottom: creatorTab === 'property' ? '2px solid #1976d2' : 'none',
              fontWeight: 600,
              color: creatorTab === 'property' ? '#1976d2' : '#333',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Create Property
          </button>
          <button
            onClick={() => setCreatorTab('nodes')}
            style={{
              padding: '10px 24px',
              background: creatorTab === 'nodes' ? '#e3f6fc' : '#fff',
              border: 'none',
              borderBottom: creatorTab === 'nodes' ? '2px solid #1976d2' : 'none',
              fontWeight: 600,
              color: creatorTab === 'nodes' ? '#1976d2' : '#333',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            All Nodes
          </button>
          <button
            onClick={() => setCreatorTab('props')}
            style={{
              padding: '10px 24px',
              background: creatorTab === 'props' ? '#e3f6fc' : '#fff',
              border: 'none',
              borderBottom: creatorTab === 'props' ? '2px solid #1976d2' : 'none',
              fontWeight: 600,
              color: creatorTab === 'props' ? '#1976d2' : '#333',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            All Propositions
          </button>
        </div>
      </div>
      {/* Tab Content */}
      {creatorTab === 'view' && selectedNode && (
        <NodeInfo node={selectedNode} />
      )}
      {creatorTab === 'relation' && (
        <div style={{
          background: '#f7fbff',
          border: '1px solid #cbe6ff',
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 300,
          maxWidth: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          margin: '16px 0 8px 24px',
          minHeight: 0
        }}>
          <RelationCreator
            onRelationCreated={handleRelationCreated}
            difficulty={difficulty}
          />
        </div>
      )}
      {creatorTab === 'property' && (
        <div style={{
          background: '#f7fbff',
          border: '1px solid #cbe6ff',
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 300,
          maxWidth: 600,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          margin: '16px 0 8px 24px',
          minHeight: 0
        }}>
          <PropertyCreator
            onPropertyAdded={handlePropertyAdded}
            difficulty={difficulty}
          />
        </div>
      )}
      {creatorTab === 'nodes' && (
        // ...existing All Nodes card code...
        // You can move the ListCards logic here or import a ListCards component
        null
      )}
      {creatorTab === 'props' && (
        // ...existing All Propositions card code...
        // You can move the ListCards logic here or import a ListCards component
        null
      )}
    </>
  );
}
