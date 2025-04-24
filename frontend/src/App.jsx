import React, { useState } from 'react';
import GraphView from './GraphView';
import RelationTypeManager from './RelationTypeManager';
import RelationCreator from './RelationCreator';

export default function App() {
  const [tab, setTab] = useState("map");
  const [relationRefreshKey, setRelationRefreshKey] = useState(0);

  return (
    <div style={{ width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      <div className="app-header">
        <img src="https://www.gnu.org/software/gnowsys/gnowsys-logo-revised-small.png" alt="Knowledge Builder Logo" className="app-header-logo" />
        <h1 className="app-header-title">Knowledge Builder</h1>
      </div>
      <div className="tabs-bar">
        <button onClick={() => setTab("map")} style={{ marginRight: '10px' }}>
          Knowledge Map
        </button>
        <button onClick={() => setTab("relations")}>Relation Types</button>
      </div>
      {tab === "map" && (
        <RelationCreator onRelationCreated={() => setRelationRefreshKey(k => k + 1)} />
      )}
      {tab === "map" ? <GraphView relationRefreshKey={relationRefreshKey} /> : <RelationTypeManager />}
    </div>
  );
}
