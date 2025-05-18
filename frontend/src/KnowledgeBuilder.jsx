import React, { useState, useRef, useEffect } from 'react';
import Blockly from 'blockly';

const KnowledgeBuilder = () => {
  const [splitPosition, setSplitPosition] = useState(50); // Percentage for workspace height
  const workspaceRef = useRef(null);
  const dragRef = useRef(null);

  // Initialize Blockly workspace

useEffect(() => {
  const workspace = Blockly.inject(workspaceRef.current, {
    toolbox: document.getElementById('blockly-toolbox'),
    trashcan: true,
  });
  workspaceRef.current.blocklyWorkspace = workspace; // Store workspace
  return () => workspace.dispose();
}, []);


  // Handle drag events
    const startDrag = (e) => {
	console.log('startDrag triggered'); // Debug log
	e.preventDefault();
	const moveHandler = (moveEvent) => {
	    const container = workspaceRef.current.parentElement;
	    if (!container) {
		console.error('Container not found');
		return;
	    }
	    const containerHeight = container.clientHeight;
	    const newY = moveEvent.clientY - container.getBoundingClientRect().top;
	    const newPosition = (newY / containerHeight) * 100;
	    setSplitPosition(Math.max(20, Math.min(80, newPosition)));
	};
	const stopDrag = () => {
	    window.removeEventListener('mousemove', moveHandler);
	    window.removeEventListener('mouseup', stopDrag);
	    if (workspaceRef.current?.blocklyWorkspace) {
		Blockly.svgResize(workspaceRef.current.blocklyWorkspace);
	    }
	};
	window.addEventListener('mousemove', moveHandler);
	window.addEventListener('mouseup', stopDrag);
    };
    

  return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
	  <h4>before blockly workspace</h4>
      {/* Blockly Workspace */}
      <div
        ref={workspaceRef}
        style={{ flex: `0 0 ${splitPosition}%`, background: '#f0f0f0' }}
      />


{/* Draggable Handle */}
	  <div
	      ref={dragRef}
	      onMouseDown={startDrag}
	      style={{
		  height: '6px',
		  background: 'black', // Bright, distinct color
		  cursor: 'ns-resize',
		  width: '100%',
		  zIndex: 1000, // Very high to avoid overlap
		  pointerEvents: 'auto',
		  border: '1px solid black', // Thick border
		  display: 'flex',
	      }}
	  >
	  </div>


	  
      {/* Canvas */}
      <div
        style={{
          flex: `0 0 ${100 - splitPosition}%`,
          background: '#fff',
              borderTop: '1px solid #888',
	      overflow: 'auto',
        }}
      >
        {/* Canvas content, e.g., graph visualization */}
        <div>Graph Canvas</div>
      </div>
    </div>
  );
};

export default KnowledgeBuilder;
