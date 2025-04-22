import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Add a global style to remove body margin
const style = document.createElement('style');
style.textContent = `body { margin: 0; }`;
document.head.appendChild(style);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
