import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function GraphView({ relationRefreshKey }) {
  const svgRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [relationTargetId, setRelationTargetId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [relationTypes, setRelationTypes] = useState([]);
  const [allNodes, setAllNodes] = useState([]);
  const [relationList, setRelationList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const expandedNodes = useRef(new Set());
  const [sidebarTab, setSidebarTab] = useState('nodes'); // 'nodes' or 'props'
  const [editNodeId, setEditNodeId] = useState(null);
  const [editNodeData, setEditNodeData] = useState({ label: '', summary: '' });

  useEffect(() => {
    fetch('/api/page/1/neighbors')
      .then(res => res.json())
      .then(({ nodes, links }) => {
        setNodes(nodes);
        setLinks(links);
        drawGraph(nodes, links);
      });

    fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
    fetch('/api/relation-types').then(res => res.json()).then(setRelationTypes);
    fetch('/api/relations').then(res => res.json()).then(setRelationList);
  }, [relationRefreshKey]);

  useEffect(() => {
    drawGraph(nodes, links);
  }, [nodes, links]);

  const drawGraph = (nodes, links) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    // Define sidebar, header, and form dimensions
    const sidebarWidth = 300;
    const headerHeight = 50;
    const formHeight = 100; // Height of the Build Knowledge form (adjust as needed)
    const width = window.innerWidth - sidebarWidth;
    const height = window.innerHeight - headerHeight - formHeight;
    svg.attr('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#aaa');

    // Place the force center at the top-left of the visible area, below the form
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(sidebarWidth, headerHeight + formHeight)); // below form

    // Draw links: lines for direct, arcs for inferred
    const linkGroup = svg.append('g').attr('stroke', '#aaa');
    const directLinks = links.filter(l => !l._inferred);
    const inferredLinks = links.filter(l => l._inferred);

    // Direct links as lines
    const link = linkGroup.selectAll('line')
      .data(directLinks)
      .enter().append('line')
      .attr('marker-end', 'url(#arrow)');

    // Inferred links as arcs (SVG paths)
    const arc = linkGroup.selectAll('path')
      .data(inferredLinks)
      .enter().append('path')
      .attr('stroke', '#d17')
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrow)');

    // Draw link labels
    const linkLabel = svg.append('g')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('font-size', 14) // Match sidebar font size
      .attr('fill', d => d._inferred ? '#d17' : '#333')
      .text(d => d.label);

    // Draw nodes as groups (rect + text + pin icon if pinned)
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        setSelectedNode(d);
        expandNode(d.id);
      })
      .on('dblclick', (event, d) => {
        // Unpin node on double-click
        d.fx = null;
        d.fy = null;
        d3.select(event.currentTarget).select('.pin-icon').remove();
      });

    // For each node, append a text element to measure its width
    nodeGroup.append('text')
      .attr('font-size', 14)
      .attr('fill', '#222')
      .attr('y', 0)
      .attr('x', 0)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(d => d.label)
      .each(function(d) {
        // Store text width for each node
        d.textWidth = this.getBBox().width;
      });

    // Draw rectangles sized to text
    nodeGroup.insert('rect', 'text')
      .attr('rx', 12)
      .attr('ry', 12)
      .attr('x', d => -((d.textWidth || 60) / 2 + 10))
      .attr('y', -18)
      .attr('width', d => (d.textWidth || 60) + 20)
      .attr('height', 36)
      .attr('fill', '#69b3a2')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5);

    // Center text in the rect
    nodeGroup.select('text')
      .attr('x', 0)
      .attr('y', 0);

    // Add pin icon for pinned nodes
    nodeGroup.each(function(d) {
      if (d.fx !== undefined && d.fx !== null && d.fy !== undefined && d.fy !== null) {
        d3.select(this).append('text')
          .attr('class', 'pin-icon')
          .attr('x', (d.textWidth || 60) / 2 + 6)
          .attr('y', -14)
          .attr('font-size', 16)
          .attr('text-anchor', 'start')
          .attr('dominant-baseline', 'middle')
          .text('📌');
      }
    });

    // When drawing, offset all elements by sidebarWidth and headerHeight
    simulation.on('tick', () => {
      // Direct links as lines
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      // Inferred links as arcs
      arc.attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.2; // arc radius
        // Sweep flag 0 for one direction, 1 for the other (to avoid overlap if both directions exist)
        const sweep = 1;
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
      });
      // Link labels
      linkLabel
        .attr('x', d => {
          if (d._inferred) {
            // Place label at arc midpoint
            const mx = (d.source.x + d.target.x) / 2;
            const my = (d.source.y + d.target.y) / 2;
            // Offset label perpendicular to the link
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const norm = Math.sqrt(dx * dx + dy * dy);
            const offset = 18;
            return mx + offset * (-dy / norm);
          } else {
            return (d.source.x + d.target.x) / 2;
          }
        })
        .attr('y', d => {
          if (d._inferred) {
            const mx = (d.source.y + d.target.y) / 2;
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const norm = Math.sqrt(dx * dx + dy * dy);
            const offset = 18;
            return mx + offset * (dx / norm);
          } else {
            return (d.source.y + d.target.y) / 2;
          }
        });
      // Node positions
      nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
      // Update pin icon position if pinned
      nodeGroup.select('.pin-icon')
        .attr('x', d => (d.textWidth || 60) / 2 + 6)
        .attr('y', -14);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      // Node remains pinned after drag
    }
  };

  // Helper to get relation type by name
  const getRelationTypeByName = (name) => relationTypes.find(rt => rt.name === name);

  // Helper to get relation type by id
  const getRelationTypeById = (id) => relationTypes.find(rt => rt.id === id);

  // Helper: expand node with both direct and inferred (inverse) relations, merging into the current graph
  const expandNode = (id) => {
    if (expandedNodes.current.has(id)) return;
    expandedNodes.current.add(id);

    fetch(`/api/page/${id}/neighbors`)
      .then(res => res.json())
      .then(async ({ nodes: newNodes, links: newLinks }) => {
        let allRels = relationList;
        if (!relationList.length) {
          allRels = await fetch('/api/relations').then(r => r.json());
        }
        // For incoming relations (where target is id)
        const incoming = allRels.filter(r => {
          const targetNode = allNodes.find(n => n.label === r.target_label);
          return targetNode && targetNode.id === id;
        });
        // For each incoming, if inverse_name exists, create a virtual link
        const inferredLinks = incoming.map(rel => {
          const sourceNode = allNodes.find(n => n.label === rel.source_label);
          const targetNode = allNodes.find(n => n.label === rel.target_label);
          const relType = getRelationTypeByName(rel.label);
          if (relType && relType.inverse_name) {
            return {
              source: targetNode.id,
              target: sourceNode.id,
              label: relType.inverse_name,
              _inferred: true
            };
          }
          return null;
        }).filter(Boolean);
        // Merge nodes (avoid duplicates by id)
        const mergedNodes = [...nodes];
        const existingNodeIds = new Set(nodes.map(n => n.id));
        newNodes.forEach(n => {
          if (!existingNodeIds.has(n.id)) {
            mergedNodes.push(n);
            existingNodeIds.add(n.id);
          }
        });
        // Add any missing nodes from inferred links
        incoming.forEach(rel => {
          const sourceNode = allNodes.find(n => n.label === rel.source_label);
          if (sourceNode && !existingNodeIds.has(sourceNode.id)) {
            mergedNodes.push(sourceNode);
            existingNodeIds.add(sourceNode.id);
          }
        });
        // Merge links (avoid duplicates by source-target-label)
        const mergedLinks = [...links];
        const linkKey = l => `${l.source}->${l.target}->${l.label}`;
        const existingLinkKeys = new Set(links.map(linkKey));
        [...newLinks, ...inferredLinks].forEach(l => {
          if (!existingLinkKeys.has(linkKey(l))) {
            mergedLinks.push(l);
            existingLinkKeys.add(linkKey(l));
          }
        });
        setNodes(mergedNodes);
        setLinks(mergedLinks);
      });
  };

  // Helper: redraw graph for a single node and its neighbors (with inferred)
  const showNodeAndNeighbors = (nodeId) => {
    fetch(`/api/page/${nodeId}/neighbors`)
      .then(res => res.json())
      .then(async ({ nodes, links }) => {
        let allRels = relationList;
        if (!relationList.length) {
          allRels = await fetch('/api/relations').then(r => r.json());
        }
        const incoming = allRels.filter(r => {
          const targetNode = allNodes.find(n => n.label === r.target_label);
          return targetNode && targetNode.id === nodeId;
        });
        const inferredLinks = incoming.map(rel => {
          const sourceNode = allNodes.find(n => n.label === rel.source_label);
          const targetNode = allNodes.find(n => n.label === rel.target_label);
          const relType = getRelationTypeByName(rel.label);
          if (relType && relType.inverse_name) {
            return {
              source: targetNode.id,
              target: sourceNode.id,
              label: relType.inverse_name,
              _inferred: true
            };
          }
          return null;
        }).filter(Boolean);
        // Add any missing nodes
        const allNodeIds = new Set([...nodes.map(n => n.id), nodeId]);
        incoming.forEach(rel => {
          const sourceNode = allNodes.find(n => n.label === rel.source_label);
          if (sourceNode && !allNodeIds.has(sourceNode.id)) {
            nodes.push(sourceNode);
            allNodeIds.add(sourceNode.id);
          }
        });
        setNodes([...nodes]);
        setLinks([...links, ...inferredLinks]);
        setSelectedNode(nodes.find(n => n.id === nodeId));
        expandedNodes.current = new Set([nodeId]);
      });
  };

  // Helper: redraw graph for a single relation (show only source and target)
  const showRelation = (relation) => {
    const sourceNode = allNodes.find(n => n.label === relation.source_label);
    const targetNode = allNodes.find(n => n.label === relation.target_label);
    if (sourceNode && targetNode) {
      setNodes([sourceNode, targetNode]);
      setLinks([{ source: sourceNode.id, target: targetNode.id, label: relation.label }]);
      setSelectedNode(null);
      expandedNodes.current = new Set();
    }
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
      alert(`Node added: ${node.label}`);
      fetch('/api/nodes').then(res => res.json()).then(setAllNodes);
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
      fetch('/api/relations').then(res => res.json()).then(setRelationList);
    } else {
      alert("Failed to create relation.");
    }
  };

  const handleDeleteRelation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this relation?")) return;
    const res = await fetch(`/api/relation/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRelationList(relationList.filter(r => r.id !== id));
      setLinks(links.filter(l => l.id !== id));
    } else {
      alert("Failed to delete relation.");
    }
  };

  const handleDeleteNode = async (id) => {
    if (!window.confirm("Are you sure you want to delete this node?")) return;
    const res = await fetch(`/api/node/${id}`, { method: "DELETE" });
    if (res.status === 409) {
      alert("Cannot delete: node is linked to other nodes.");
    } else if (res.ok) {
      setAllNodes(allNodes.filter(n => n.id !== id));
      setNodes(nodes.filter(n => n.id !== id));
      setLinks(links.filter(l => l.source.id !== id && l.target.id !== id));
      if (selectedNode?.id === id) setSelectedNode(null);
    } else {
      alert("Failed to delete node.");
    }
  };

  return (
    <div style={{ width: '100%', height: 'calc(100% - 50px)', display: 'flex' }}>
      <div className="sidebar">
        {selectedNode ? (
          <div>
            <h3 className="node-details-title">{selectedNode.label}</h3>
            {selectedNode.summary && <><strong>Summary:</strong> <p>{selectedNode.summary}</p></>}
          </div>
        ) : (
          <div>Select a Node or Proposition</div>
        )}

        <hr />
        {/* Removed Create New Node form as node creation is now handled in the relation builder */}
        <hr />
        {/* Removed logo and title from sidebar */}
        <div className="sidebar-tabs">
          <button
            onClick={() => setSidebarTab('nodes')}
            className={sidebarTab === 'nodes' ? 'active' : ''}
          >
            All Nodes
          </button>
          <button
            onClick={() => setSidebarTab('props')}
            className={sidebarTab === 'props' ? 'active' : ''}
          >
            All Propositions
          </button>
        </div>
        {sidebarTab === 'nodes' && (
          <>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', marginBottom: '8px' }}
            />
            <div className="node-list">
              {[...allNodes].sort((a, b) => b.id - a.id)
                .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(n => (
                  <div
                    key={n.id}
                    className={`node-list-item${selectedNode?.id === n.id ? ' selected' : ''}`}
                    onClick={() => showNodeAndNeighbors(n.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{n.label}</span>
                      <div className="actions">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setEditNodeId(n.id);
                            setEditNodeData({ label: n.label, summary: n.summary || '' });
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteNode(n.id);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    {editNodeId === n.id && (
                      <form
                        className="edit-node-form"
                        onSubmit={async e => {
                          e.preventDefault();
                          const res = await fetch('/api/node/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: n.id, title: editNodeData.label, summary: editNodeData.summary })
                          });
                          if (res.ok) {
                            setAllNodes(allNodes.map(node => node.id === n.id ? { ...node, label: editNodeData.label, summary: editNodeData.summary } : node));
                            setNodes(nodes.map(node => node.id === n.id ? { ...node, label: editNodeData.label, summary: editNodeData.summary } : node));
                            setEditNodeId(null);
                          } else {
                            alert('Failed to update node.');
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editNodeData.label}
                          onChange={e => setEditNodeData({ ...editNodeData, label: e.target.value })}
                          required
                        />
                        <textarea
                          value={editNodeData.summary}
                          onChange={e => setEditNodeData({ ...editNodeData, summary: e.target.value })}
                          rows={2}
                          placeholder="Summary (optional)"
                        />
                        <div className="form-actions">
                          <button type="submit">Save</button>
                          <button type="button" onClick={() => setEditNodeId(null)}>Cancel</button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
            </div>
          </>
        )}
        {sidebarTab === 'props' && (
          <div className="prop-list" style={{ fontSize: '0.9em' }}>
            {[...relationList].sort((a, b) => b.id - a.id).map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }}
                onClick={() => showRelation(r)}
              >
                <span>{r.source_label} {r.label} {r.target_label}</span>
                <button onClick={e => { e.stopPropagation(); handleDeleteRelation(r.id); }} style={{ marginLeft: '10px' }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <svg ref={svgRef} width="100%" height="100%" style={{ flex: 1 }} />
    </div>
  );
}
