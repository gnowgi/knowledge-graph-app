
import React, { useState } from 'react';
import GraphView from './GraphView';
import RelationTypeManager from './RelationTypeManager';

export default function App() {
  const [tab, setTab] = useState("map");

  return (
    <div style={{ width: '100vw', height: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', background: '#f0f0f0' }}>
        <button onClick={() => setTab("map")} style={{ marginRight: '10px' }}>
          Knowledge Map
        </button>
        <button onClick={() => setTab("relations")}>
          Relation Types
        </button>
      </div>
      {tab === "map" ? <GraphView /> : <RelationTypeManager />}
    </div>
  );
}
