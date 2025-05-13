import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import TestApp from './TestApp'; // Import the test component
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Use TestApp instead of App to test basic React functionality
root.render(
  <React.StrictMode>
    <TestApp />
  </React.StrictMode>
);