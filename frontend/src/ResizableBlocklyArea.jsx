import React, { useRef, useState, useEffect } from "react";

export default function ResizableBlocklyArea() {
  const [height, setHeight] = useState(350); // Initial height in px
  const dragging = useRef(false);

  // Mouse event handlers
  const onMouseDown = () => {
    dragging.current = true;
  };
  const onMouseMove = (e) => {
    if (dragging.current) {
      // Adjust for min and max heights as needed
      setHeight(Math.max(100, Math.min(window.innerHeight - 100, e.clientY)));
    }
  };
  const onMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* Blockly area */}
      <div
        id="blocklyDiv"
        style={{
          height: `${height}px`,
          background: "#23272e",
          width: "100%",
          transition: "background 0.2s",
        }}
      >
        {/* Insert Blockly workspace here */}
        Blockly area
      </div>
      {/* Draggable resizer */}
      <div
        onMouseDown={onMouseDown}
        style={{
          height: "8px",
          background: "#888",
          cursor: "row-resize",
          width: "100%",
          position: "absolute",
          top: `${height}px`,
          left: 0,
          zIndex: 10,
        }}
      />
      {/* Lower panel (optional, e.g., output tabs) */}
      <div
        style={{
          position: "absolute",
          top: `${height + 8}px`,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "auto",
        }}
      >
        {/* Place your output, tabs, or other UI below */}
        Output or other content here
      </div>
    </div>
  );
}
