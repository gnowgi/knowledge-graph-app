import React from 'react';

export default function GraphArea({ renderViewBoxTool, svgRef }) {
  return (
    <>
      {renderViewBoxTool()}
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
    </>
  );
}
