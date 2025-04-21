
// Full working code restored from previous versions (see assistant history)
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function GraphView() {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [relationTargetId, setRelationTargetId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [relationTypes, setRelationTypes] = useState([]);
  const expandedNodes = useRef(new Set());

  useEffect(() => {
    fetch('/api/page/1/neighbors')
      .then(res => res.json())
      .then(({ nodes, links }) => {
        setNodes(nodes);
        setLinks(links);
        drawGraph(nodes, links);
      });

    fetch('/api/relation-types')
      .then(res => res.json())
      .then(setRelationTypes);
  }, []);

  useEffect(() => {
    drawGraph(nodes, links);
  }, [nodes, links]);

  const drawGraph = (nodes, links) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 18)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#aaa");

    const root = d3.hierarchy({ name: "root", children: nodes.map(n => ({ ...n })) });
    const cluster = d3.cluster().size([2 * Math.PI, 200]);
    cluster(root);

    const radialNodes = root.descendants().slice(1).map((d) => {
      const angle = d.x;
      const radius = d.y;
      return {
        ...d.data,
        x: centerX + radius * Math.cos(angle - Math.PI / 2),
        y: centerY + radius * Math.sin(angle - Math.PI / 2)
      };
    });

    const nodeById = Object.fromEntries(radialNodes.map(n => [n.id, n]));
    const radialLinks = links.map(l => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return {
        ...l,
        source: nodeById[sourceId],
        target: nodeById[targetId]
      };
    });

    svg.selectAll("line")
      .data(radialLinks)
      .enter()
      .append("line")
      .attr("stroke", "#aaa")
      .attr("marker-end", "url(#arrow)")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    svg.selectAll("circle")
      .data(radialNodes)
      .enter()
      .append("circle")
      .attr("r", 6)
      .attr("fill", "#69b3a2")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .on("click", (event, d) => {
        setSelectedNode(d);
        expandNode(d.id);
      });

    svg.selectAll("text.label")
      .data(radialNodes)
      .enter()
      .append("text")
      .attr("x", d => d.x + 10)
      .attr("y", d => d.y)
      .attr("font-size", 12)
      .text(d => d.label);

    svg.selectAll("text.relation")
      .data(radialLinks)
      .enter()
      .append("text")
      .attr("font-size", 10)
      .attr("fill", "#333")
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2)
      .text(d => d.label);
  };

  const expandNode = (id) => {
    if (expandedNodes.current.has(id)) return;
    expandedNodes.current.add(id);

    fetch(`/api/page/${id}/neighbors`)
      .then(res => res.json())
      .then(({ nodes: newNodes, links: newLinks }) => {
        const allNodeIds = new Set(nodes.map(n => n.id));
        const updatedNodes = [...nodes];
        newNodes.forEach(n => { if (!allNodeIds.has(n.id)) updatedNodes.push(n); });

        const existingLinks = new Set(links.map(l => `${l.source}->${l.target}`));
        const newFilteredLinks = newLinks.filter(l => !existingLinks.has(`${l.source}->${l.target}`));

        setNodes(updatedNodes);
        setLinks([...links, ...newFilteredLinks]);
      });
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/node/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    });
    if (res.ok) {
      const node = await res.json();
      setNodes([...nodes, { id: node.id, label: node.label }]);
      setSelectedNode(node);
      setNewTitle("");
    } else {
      const msg = await res.json();
      alert(msg.error || "Node creation failed.");
    }
  };

  const handleCreateRelation = async () => {
    if (!selectedNode || !relationTargetId || !relationTypeId) {
      alert("Please select source, target and relation type.");
      return;
    }

    const res = await fetch('/api/relation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: selectedNode.id,
        target: parseInt(relationTargetId),
        relation_id: parseInt(relationTypeId)
      })
    });

    if (res.ok) {
      setRelationTargetId("");
      setRelationTypeId("");
      expandNode(selectedNode.id);
    } else {
      alert("Failed to create relation.");
    }
  };

  return (
    <div style={{ width: '100%', height: 'calc(100% - 50px)', display: 'flex' }}>
      <div style={{ width: '300px', padding: '10px', fontFamily: 'sans-serif', background: '#f9f9f9', borderRight: '1px solid #ddd' }}>
        <h3>Details</h3>
        {selectedNode ? (
          <div>
            <strong>ID:</strong> {selectedNode.id}<br />
            <strong>Title:</strong> {selectedNode.label}<br />
            {selectedNode.summary && <><strong>Summary:</strong> <p>{selectedNode.summary}</p></>}
          </div>
        ) : (
          <div>Select a node</div>
        )}

        <hr />
        <form onSubmit={handleCreateNode}>
          <h4>Create New Node</h4>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '6px', marginBottom: '8px' }}
          />
          <button type="submit" style={{ width: '100%' }}>Add Node with AI Summary</button>
        </form>

        <hr />
        <h4>Create Relation</h4>
        <div>
          <label>Target Node:</label>
          <select
            value={relationTargetId}
            onChange={(e) => setRelationTargetId(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            <option value="">Select...</option>
            {nodes
              .filter(n => selectedNode && n.id !== selectedNode.id)
              .map(n => (
                <option key={n.id} value={n.id}>{n.label}</option>
            ))}
          </select>

          <label>Relation Type:</label>
          <select
            value={relationTypeId}
            onChange={(e) => setRelationTypeId(e.target.value)}
            style={{ width: '100%', marginBottom: '8px' }}
          >
            <option value="">Select...</option>
            {relationTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>

          <button type="button" onClick={handleCreateRelation} style={{ width: '100%' }}>
            Create Relation
          </button>
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="100%" style={{ flex: 1 }} />
    </div>
  );
}
