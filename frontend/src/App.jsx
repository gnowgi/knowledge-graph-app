import React, { useState } from 'react';
import GraphView from './GraphView';
import RelationTypeManager from './RelationTypeManager';
import RelationCreator from './RelationCreator';
import AttributeManager from './AttributeManager';
import PropertyCreator from './PropertyCreator';
import NodeManager from './NodeManager'; // 

export default function App() {
  const [tab, setTab] = useState("map");
  const [relationRefreshKey, setRelationRefreshKey] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [selectedNodeId, setSelectedNodeId] = useState(1); // Default nodeId for testing

  return (
    <div style={{ width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      <div className="app-header" style={{ justifyContent: 'flex-start', paddingLeft: 32 }}>
        <img
          src="https://www.gnu.org/software/gnowsys/gnowsys-logo-revised-small.png"
          alt="Knowledge Builder Logo"
          className="app-header-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        />
        <h1
          className="app-header-title"
          style={{ cursor: 'pointer', marginLeft: 8 }}
          onClick={() => window.location.reload()}
        >
          Knowledge Network
        </h1>
      </div>

      <div className="tabs-bar" style={{ justifyContent: 'flex-start', paddingLeft: 32 }}>
        <button onClick={() => setTab("map")} className={tab === "map" ? "active-tab" : ""} style={{ marginRight: '10px' }}>
          Construct and View
        </button>
        <button onClick={() => setTab("node")} className={tab === "node" ? "active-tab" : ""}>
          Node Properties
        </button>
        <button onClick={() => setTab("relations")} className={tab === "relations" ? "active-tab" : ""}>
          Relation Propeties
        </button>
        <button onClick={() => setTab("attributes")} className={tab === "attributes" ? "active-tab" : ""}>
          Attribute Properties
        </button>
      </div>

      {tab === "map" ? (
        <GraphView relationRefreshKey={relationRefreshKey} />
      ) : tab === "relations" ? (
        <RelationTypeManager />
      ) : tab === "attributes" ? (
        <AttributeManager />
      ) : (
        <NodeManager nodeId={selectedNodeId} /> // 🆕 Show NodeManager tab
      )}
    </div>
  );
}
