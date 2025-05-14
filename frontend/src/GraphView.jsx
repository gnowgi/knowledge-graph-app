import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import NodeProperties from './NodeProperties';
import RelationCreator from './RelationCreator';
import PropertyCreator from './PropertyCreator';

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
  const [creatorTab, setCreatorTab] = useState('view'); // default to 'view'
  const [difficulty, setDifficulty] = useState('easy'); // 'easy', 'medium', 'advanced'

  // Add state for SVG viewBox configuration tool
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    // Removed initial fetch for /api/node/1/neighbors
    // Only fetch allNodes, relationTypes, and relationList
    fetch('/api/nodes').then(res => res.json()).then(data => {
      // Normalize IDs to numbers
      setAllNodes(data.map(n => ({ ...n, id: Number(n.id) })));
    });
    fetch('/api/relation-types').then(res => res.json()).then(setRelationTypes);
    fetch('/api/relations').then(res => res.json()).then(data => {
      // Debug: log relationList
      console.log("Fetched relationList:", data);
      // Normalize IDs to numbers
      setRelationList(data.map(r => ({
        ...r,
        source: Number(r.source),
        target: Number(r.target)
      })));
    });
  }, [relationRefreshKey]);

  useEffect(() => {
    drawGraph(nodes, links);
  }, [nodes, links]);

  // Handler to update viewBox values
  const handleViewBoxChange = (field, value) => {
    setViewBox(prev => ({
      ...prev,
      [field]: Number(value)
    }));
  };

  const drawGraph = (nodes, links) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    // Define sidebar, header, and form dimensions
    const sidebarWidth = 300;
    const headerHeight = 50;
    const formHeight = 100; // Height of the Build Knowledge form (adjust as needed)
    const width = window.innerWidth - sidebarWidth;
    const height = window.innerHeight - headerHeight - formHeight;
    svg.attr(
      'viewBox',
      `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    ).attr('preserveAspectRatio', 'xMinYMin meet');

    // Arrow marker for links (adjusted for rectangles, larger and more visible)
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -7 20 14')
      .attr('refX', 38) // further out for rectangle nodes
      .attr('refY', 0)
      .attr('markerWidth', 18)
      .attr('markerHeight', 18)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-7L20,0L0,7')
      .attr('fill', '#aaa');

    // --- Label nodes for repulsion ---
    // For each link, create a virtual label node
    const labelNodes = links.map((l, i) => ({ id: `label-${i}`, link: l, x: 0, y: 0 }));
    // Link each label node to both source and target of its link
    const labelLinks = links.flatMap((l, i) => [
      { source: l.source, target: `label-${i}` },
      { source: l.target, target: `label-${i}` }
    ]);

    // Add label nodes to simulation for repulsion and keep them near the link midpoint
    const simulation = d3.forceSimulation(nodes.concat(labelNodes))
      .force('link', d3.forceLink(links).id(d => d.id).distance(220)) // Increased from 120 to 220
      .force('labelLink', d3.forceLink(labelLinks).id(d => typeof d === 'object' ? d.id : d).distance(0).strength(1))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('labelRepel', d3.forceManyBody().strength(d => (typeof d.id === 'string' && d.id.startsWith('label-')) ? -200 : 0))
      .force('center', d3.forceCenter(sidebarWidth, headerHeight + formHeight));

    // Draw links: lines for direct, arcs for inferred
    const linkGroup = svg.append('g').attr('stroke', '#aaa');
    const directLinks = links.filter(l => !l._inferred);
    const inferredLinks = links.filter(l => l._inferred);

    // Draw tapered edges for direct links
    const link = linkGroup.selectAll('path.tapered-link')
      .data(directLinks)
      .enter().append('path')
      .attr('class', 'tapered-link')
      .attr('fill', '#aaa');

    // Inferred links as tapered arcs (SVG paths)
    const arc = linkGroup.selectAll('path.tapered-arc')
      .data(inferredLinks)
      .enter().append('path')
      .attr('class', 'tapered-arc')
      .attr('fill', '#7ecbff'); // Light blue for inverse links

    // Draw link labels using label nodes
    const linkLabel = svg.append('g')
      .selectAll('text')
      .data(labelNodes)
      .enter().append('text')
      .attr('font-size', 14)
      .attr('fill', d => d.link._inferred ? '#3399cc' : '#333') // Light blue for inverse link labels
      .text(d => d.link.label);

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
      .attr('fill', '#f5f5f5') // Light grey for better contrast on green
      .attr('y', 0)
      .attr('x', 0)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(d => d.label)
      .each(function(d) {
        d.textWidth = this.getBBox().width;
      });

    // Draw rectangles sized to text
    nodeGroup.insert('rect', 'text')
      .attr('rx', d => d.is_instance ? 0 : 12)
      .attr('ry', d => d.is_instance ? 0 : 12)
      .attr('x', d => -((d.textWidth || 60) / 2 + 10))
      .attr('y', -18)
      .attr('width', d => (d.textWidth || 60) + 20)
      .attr('height', 36)
      .attr('fill', '#f5f5f5') // Light grey background for node box
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5);

    // Center text in the rect
    nodeGroup.select('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#222'); // Black text for node label

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
      // Recalculate label node positions to follow the edge
      labelNodes.forEach(labelNode => {
        const l = labelNode.link;
        if (l._inferred) {
          // For arcs: use arc midpoint (with offset)
          const sx = l.source.x, sy = l.source.y;
          const tx = l.target.x, ty = l.target.y;
          const mx = (sx + tx) / 2;
          const my = (sy + ty) / 2;
          const dx = tx - sx, dy = ty - sy;
          const len = Math.sqrt(dx * dx + dy * dy);
          const px = -dy / len, py = dx / len;
          const arcHeight = 0.4 * len;
          labelNode.x = mx + px * arcHeight;
          labelNode.y = my + py * arcHeight;
        } else {
          // For direct: use straight midpoint
          labelNode.x = (l.source.x + l.target.x) / 2;
          labelNode.y = (l.source.y + l.target.y) / 2;
        }
      });
      // Tapered direct links
      link.attr('d', d => {
        // Source and target coordinates
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        // Direction vector
        const dx = tx - sx, dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return '';
        // Perpendicular vector (normalized)
        const px = -dy / len, py = dx / len;
        // Thickness at source and target
        const thick = 12, thin = 2;
        // Points for the polygon
        const s1x = sx + px * thick / 2, s1y = sy + py * thick / 2;
        const s2x = sx - px * thick / 2, s2y = sy - py * thick / 2;
        const t1x = tx + px * thin / 2, t1y = ty + py * thin / 2;
        const t2x = tx - px * thin / 2, t2y = ty - py * thin / 2;
        return `M${s1x},${s1y} L${t1x},${t1y} L${t2x},${t2y} L${s2x},${s2y} Z`;
      });
      // Tapered arcs for inferred links
      arc.attr('d', d => {
        // Source and target coordinates
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        // Midpoint for arc
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        // Perpendicular for arc control point
        const dx = tx - sx, dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return '';
        const px = -dy / len, py = dx / len;
        const arcHeight = 0.4 * len; // arc height factor
        // Arc control point
        const cx = mx + px * arcHeight;
        const cy = my + py * arcHeight;
        // Tapered width
        const thick = 12, thin = 2;
        // Offset at source and target (perpendicular to tangent)
        // Tangent at source: direction to control point
        const t1x = cx - sx, t1y = cy - sy;
        const t1len = Math.sqrt(t1x * t1x + t1y * t1y);
        const t1px = -t1y / t1len, t1py = t1x / t1len;
        // Tangent at target: direction from control point
        const t2x = tx - cx, t2y = ty - cy;
        const t2len = Math.sqrt(t2x * t2x + t2y * t2y);
        const t2px = -t2y / t2len, t2py = t2x / t2len;
        // Four points: source left/right, target left/right
        const s1x = sx + t1px * thick / 2, s1y = sy + t1py * thick / 2;
        const s2x = sx - t1px * thick / 2, s2y = sy - t1py * thick / 2;
        const t1x2 = tx + t2px * thin / 2, t1y2 = ty + t2py * thin / 2;
        const t2x2 = tx - t2px * thin / 2, t2y2 = ty - t2py * thin / 2;
        // Path: move to s1, quadratic to t1, line to t2, quadratic back to s2, close
        return `M${s1x},${s1y} Q${cx},${cy} ${t1x2},${t1y2} L${t2x2},${t2y2} Q${cx},${cy} ${s2x},${s2y} Z`;
      });
      // Link labels: use label node positions
      linkLabel
        .attr('x', d => d.x)
        .attr('y', d => d.y);
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

    fetch(`/api/node/${id}/neighbors`)
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
    fetch(`/api/node/${nodeId}/neighbors`)
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

  // Draw default network: all nodes, show relations as tapering arcs, no labels.
  const drawDefaultNetwork = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const sidebarWidth = 300;
    const headerHeight = 50;
    const width = window.innerWidth - sidebarWidth;
    const height = window.innerHeight - headerHeight;

    if (!allNodes.length) {
      console.log("No nodes to draw.");
      return;
    }

    // Build a map from label to node object
    const nodeLabelMap = {};
    allNodes.forEach(n => { nodeLabelMap[n.label] = n; });

    // Use node IDs for degree calculation
    const degreeMap = {};
    relationList.forEach(r => {
      const sourceNode = nodeLabelMap[r.source_label];
      const targetNode = nodeLabelMap[r.target_label];
      if (sourceNode) degreeMap[sourceNode.id] = (degreeMap[sourceNode.id] || 0) + 1;
      if (targetNode) degreeMap[targetNode.id] = (degreeMap[targetNode.id] || 0) + 1;
    });

    const nodes = allNodes.map(n => {
      const deg = degreeMap[n.id] || 1;
      // Restore original node size calculation
      return { ...n, _radius: Math.max(10, Math.min(32, 10 + Math.sqrt(deg) * 5)) };
    });

    // Build links using node objects
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    const links = relationList
      .map(r => {
        const sourceNode = nodeLabelMap[r.source_label];
        const targetNode = nodeLabelMap[r.target_label];
        if (sourceNode && targetNode) {
          return {
            source: nodeMap[sourceNode.id],
            target: nodeMap[targetNode.id]
          };
        }
        return null;
      })
      .filter(Boolean);

    // Debug: log links after label mapping
    console.log("Links after label mapping:", links);

    if (!links.length) {
      console.log("No links to draw.");
    }

    svg.attr('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(120).strength(1))
      .force('charge', d3.forceManyBody().strength(d => -40 - (degreeMap[d.id] || 0) * 10))
      .force('center', d3.forceCenter(sidebarWidth + 120, headerHeight + 80))
      .force('collision', d3.forceCollide().radius(d => d._radius + 2));

    // Draw links as tapering arcs (no labels)
    const arc = svg.append('g')
      .attr('stroke', '#aaa')
      .attr('stroke-width', 2)
      .attr('fill', 'rgba(3, 10, 24, 0.25)')
      .attr('pointer-events', 'visiblePainted')
      .selectAll('path')
      .data(links)
      .enter().append('path');

    // Debug: log arc selection
    console.log("arc selection count:", arc.size());

    // Draw nodes (no labels), radius based on degree
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d._radius)
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      .on('click', (event, d) => {
        setSelectedNode(d);
        showNodeAndNeighbors(d.id);
      });

    simulation.on('tick', () => {
      arc.attr('d', d => {
        // Tapered arc path between d.source and d.target
        if (!d.source || !d.target) {
          // Debug: log missing source/target
          console.log("Arc missing source/target:", d);
          return '';
        }
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        if (typeof sx !== 'number' || typeof sy !== 'number' || typeof tx !== 'number' || typeof ty !== 'number') {
          // Debug: log missing coordinates
          console.log("Arc missing coordinates:", d);
          return '';
        }
        const mx = (sx + tx) / 2, my = (sy + ty) / 2;
        const dx = tx - sx, dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return '';
        const px = -dy / len, py = dx / len;
        const arcHeight = 0.4 * len;
        const cx = mx + px * arcHeight, cy = my + py * arcHeight;
        const thick = 12, thin = 2;
        // Tangent at source
        const t1x = cx - sx, t1y = cy - sy;
        const t1len = Math.sqrt(t1x * t1x + t1y * t1y);
        const t1px = -t1y / t1len, t1py = t1x / t1len;
        // Tangent at target
        const t2x = tx - cx, t2y = ty - cy;
        const t2len = Math.sqrt(t2x * t2x + t2y * t2y);
        const t2px = -t2y / t2len, t2py = t2x / t2len;
        // Four points: source left/right, target left/right
        const s1x = sx + t1px * thick / 2, s1y = sy + t1py * thick / 2;
        const s2x = sx - t1px * thick / 2, s2y = sy - t1py * thick / 2;
        const t1x2 = tx + t2px * thin / 2, t1y2 = ty + t2py * thin / 2;
        const t2x2 = tx - t2px * thin / 2, t2y2 = ty - t2py * thin / 2;
        // Path: move to s1, quadratic to t1, line to t2, quadratic back to s2, close
        return `M${s1x},${s1y} Q${cx},${cy} ${t1x2},${t1y2} L${t2x2},${t2y2} Q${cx},${cy} ${s2x},${s2y} Z`;
      });
      node
        .attr('cx', d => {
          const r = d._radius || 10;
          // Clamp horizontally within canvas
          return Math.max(sidebarWidth + r, Math.min(width + sidebarWidth - r, d.x));
        })
        .attr('cy', d => {
          const r = d._radius || 10;
          // Clamp vertically within canvas (avoid top and bottom overflow)
          return Math.max(headerHeight + r, Math.min(height + headerHeight - r, d.y));
        });
    });
  };

  // Only call drawDefaultNetwork when nothing is selected
  useEffect(() => {
    // Only draw default network if allNodes and relationList are loaded and non-empty
    if (
      !selectedNode &&
      nodes.length === 0 &&
      links.length === 0 &&
      allNodes.length > 0 &&
      relationList.length > 0
    ) {
      drawDefaultNetwork();
    } else {
      drawGraph(nodes, links);
    }
    // eslint-disable-next-line
  }, [selectedNode, relationList, allNodes, nodes, links]);

  // Add a function to reset to default view
  const resetDefaultView = () => {
    setSelectedNode(null);
    setNodes([]);
    setLinks([]);
    expandedNodes.current = new Set();
  };

  // Optionally, add handlers to refresh graph after creation
  const handleRelationCreated = () => {
    fetch('/api/relations').then(res => res.json()).then(setRelationList);
  };
  const handlePropertyAdded = () => {
    // Optionally refresh node properties or graph
  };

  // Add a small tool UI for adjusting SVG viewBox (now placed just above SVG)
  const renderViewBoxTool = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '0 0 12px 24px',
      fontSize: 13,
      background: '#f7fbff',
      border: '1px solid #cbe6ff',
      borderRadius: 6,
      padding: '6px 12px',
      width: 'fit-content'
    }}>
      <span style={{ fontWeight: 500, marginRight: 4 }}>SVG ViewBox:</span>
      <label>
        x:
        <input
          type="number"
          value={viewBox.x}
          onChange={e => handleViewBoxChange('x', e.target.value)}
          style={{ width: 60, margin: '0 4px' }}
        />
      </label>
      <label>
        y:
        <input
          type="number"
          value={viewBox.y}
          onChange={e => handleViewBoxChange('y', e.target.value)}
          style={{ width: 60, margin: '0 4px' }}
        />
      </label>
      <label>
        width:
        <input
          type="number"
          value={viewBox.width}
          onChange={e => handleViewBoxChange('width', e.target.value)}
          style={{ width: 80, margin: '0 4px' }}
        />
      </label>
      <label>
        height:
        <input
          type="number"
          value={viewBox.height}
          onChange={e => handleViewBoxChange('height', e.target.value)}
          style={{ width: 80, margin: '0 4px' }}
        />
      </label>
      <button
        onClick={() => setViewBox({
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight
        })}
        style={{
          marginLeft: 8,
          padding: '2px 10px',
          borderRadius: 4,
          border: '1px solid #b5d6f7',
          background: '#e3f6fc',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
    </div>
  );

  // Dynamically update SVG viewBox when viewBox state changes
  useEffect(() => {
    const svg = svgRef.current;
    if (svg) {
      svg.setAttribute(
        'viewBox',
        `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
      );
    }
  }, [viewBox]);

  return (
    <div style={{ width: '100%', height: 'calc(100% - 45px)', display: 'flex', flexDirection: 'column' }}>
      {/* Difficulty selector */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, marginLeft: 24 }}>
        <span style={{ marginRight: 8, fontWeight: 500 }}>Mode:</span>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid #b5d6f7' }}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium (Quantifiers)</option>
          <option value="advanced">Advanced (Quantifiers + Modality)</option>
        </select>
      </div>
      {/* Unified Tabs Row (View + Creator + All Nodes/Props) */}
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
      {/* Creator Card Content or Listing Card */}
      {(creatorTab === 'relation' || creatorTab === 'property') && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          margin: '0 0 8px 24px', // <-- left offset is 24px
          minHeight: 0,
          paddingTop: 2,
          paddingBottom: 2
        }}>
          {creatorTab === 'relation' && (
            <div style={{
              background: '#f7fbff',
              border: '1px solid #cbe6ff',
              borderRadius: 8,
              padding: '8px 12px', // reduce vertical padding
              minWidth: 300, // restore previous width
              maxWidth: 600, // restore previous width
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              marginRight: 8,
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
              padding: '8px 12px', // reduce vertical padding
              minWidth: 300, // restore previous width
              maxWidth: 600, // restore previous width
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              marginLeft: 8,
              minHeight: 0
            }}>
              <PropertyCreator
                onPropertyAdded={handlePropertyAdded}
                difficulty={difficulty}
              />
            </div>
          )}
        </div>
      )}
      {(creatorTab === 'nodes' || creatorTab === 'props') && (
        <div style={{
          background: '#f7fbff',
          border: '1px solid #cbe6ff',
          borderRadius: 8,
          padding: 10,
          margin: '0 0 12px 24px', // <-- left offset is 24px
          minWidth: 160,
          maxWidth: 900,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          minHeight: 0,
          maxHeight: 220,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {creatorTab === 'nodes' && (
            <>
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', marginBottom: '8px' }}
              />
              {/* Only show cards for matched nodes */}
              {searchQuery.trim() && (
                <div className="node-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                  maxHeight: 150 // fits within parent card, adjust as needed
                }}>
                  {[...allNodes].sort((a, b) => b.id - a.id)
                    .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(n => (
                      <div
                        key={n.id}
                        className={`node-list-item${selectedNode?.id === n.id ? ' selected' : ''}`}
                        style={{
                          background: '#fff',
                          border: '1px solid #e3f6fc',
                          borderRadius: 6,
                          padding: 8,
                          marginBottom: 2,
                          cursor: 'pointer',
                          fontSize: 14,
                          minHeight: 36,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center'
                        }}
                        onClick={() => showNodeAndNeighbors(n.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span style={n.is_instance ? { textDecoration: 'underline', textDecorationThickness: '2px' } : {}}>{n.label}</span>
                          <div className="actions">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setEditNodeId(n.id);
                                setEditNodeData({ label: n.label, summary: n.summary || '' });
                              }}
                              style={{ fontSize: 13, padding: '0 4px' }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteNode(n.id);
                              }}
                              style={{ fontSize: 13, padding: '0 4px' }}
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
                              style={{ fontSize: 13, marginBottom: 2 }}
                            />
                            <textarea
                              value={editNodeData.summary}
                              onChange={e => setEditNodeData({ ...editNodeData, summary: e.target.value })}
                              rows={2}
                              placeholder="Summary (optional)"
                              style={{ fontSize: 13, marginBottom: 2 }}
                            />
                            <div className="form-actions">
                              <button type="submit" style={{ fontSize: 13, marginRight: 4 }}>Save</button>
                              <button type="button" onClick={() => setEditNodeId(null)} style={{ fontSize: 13 }}>Cancel</button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  {/* If no matches, show a message */}
                  {
                    [...allNodes].filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 &&
                    <div style={{ color: '#888', padding: 8 }}>No nodes found.</div>
                  }
                </div>
              )}
            </>
          )}
          {creatorTab === 'props' && (
            <>
              <input
                type="text"
                placeholder="Search propositions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', marginBottom: '8px' }}
              />
              {/* Only show cards for matched propositions */}
              {searchQuery.trim() && (
                <div className="prop-list" style={{
                  fontSize: '0.95em',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                  maxHeight: 150 // fits within parent card, adjust as needed
                }}>
                  {relationList
                    .filter(r =>
                      r.source_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.target_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.label?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((r, idx) => (
                      <div key={r.id || `${r.source_label}->${r.label}->${r.target_label}->${idx}`}
                        style={{
                          background: '#fff',
                          border: '1px solid #e3f6fc',
                          borderRadius: 6,
                          padding: 8,
                          marginBottom: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          minHeight: 36
                        }}
                        onClick={() => showRelation(r)}
                      >
                        <span>{r.source_label} {r.label} {r.target_label}</span>
                        {r.id && (
                          <button onClick={e => { e.stopPropagation(); handleDeleteRelation(r.id); }} style={{ marginLeft: '10px', fontSize: 13, padding: '0 4px' }}>🗑</button>
                        )}
                      </div>
                    ))}
                  {/* If no matches, show a message */}
                  {
                    relationList.filter(r =>
                      r.source_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.target_label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      r.label?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 &&
                    <div style={{ color: '#888', padding: 8 }}>No propositions found.</div>
                  }
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Main GraphView layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          flexDirection: 'column', // stack vertically always
        }}
      >
        {/* Info card only in "view" tab */}
        {creatorTab === 'view' && selectedNode && (
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
            <h3 style={{ margin: 0 }}>{selectedNode.label}</h3>
            <NodeProperties nodeId={selectedNode.id} />
            {selectedNode.summary && (
              <>
                <strong>Summary:</strong>
                <p>{selectedNode.summary}</p>
              </>
            )}
          </div>
        )}
        {/* SVG ViewBox Tool just above SVG */}
        {renderViewBoxTool()}
        {/* SVG graph card always below info card and viewbox tool */}
        <div
          style={{
            flex: 1,
            marginTop: 1,
            marginRight: 24,
            marginLeft: 24,
            background: '#f7fbff',
            border: '1px solid #cbe6ff',
            borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <svg ref={svgRef} width="100%" height="100%" style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
}
