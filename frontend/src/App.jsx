import React, { useState } from 'react';
import GraphView from './GraphView';
import RelationTypeManager from './RelationTypeManager';
import RelationCreator from './RelationCreator';
import AttributeManager from './AttributeManager';
import PropertyCreator from './PropertyCreator';

export default function App() {
  const [tab, setTab] = useState("map");
  const [relationRefreshKey, setRelationRefreshKey] = useState(0);

  return (
    <div style={{ width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      <div className="app-header" style={{ justifyContent: 'flex-start', paddingLeft: 32 }}>
        <img src="https://www.gnu.org/software/gnowsys/gnowsys-logo-revised-small.png" alt="Knowledge Builder Logo" className="app-header-logo" />
        <h1 className="app-header-title">Knowledge Builder</h1>
      </div>
      <div className="tabs-bar" style={{ justifyContent: 'flex-start', paddingLeft: 32 }}>
        <button onClick={() => setTab("map")} style={{ marginRight: '10px' }}>
          Knowledge Map
        </button>
        <button onClick={() => setTab("relations")}>Relation Types</button>
        <button onClick={() => setTab("attributes")}>Attributes</button>
      </div>
      {tab === "map" && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: 32 }}>
          <RelationCreator onRelationCreated={() => setRelationRefreshKey(k => k + 1)} />
          <PropertyCreator />
        </div>
      )}
      {tab === "map" ? <GraphView relationRefreshKey={relationRefreshKey} /> :
        tab === "relations" ? <RelationTypeManager /> :
        <AttributeManager />}
    </div>
  );
}
