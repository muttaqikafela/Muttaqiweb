import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent opaque zero-origin cross-origin third-party "Script error." noise (e.g. from external ad or Google helper scripts)
// while keeping all real application errors completely visible.
window.addEventListener(
  'error',
  (event) => {
    if (
      event.message === 'Script error.' &&
      !event.filename &&
      event.lineno === 0 &&
      event.colno === 0 &&
      !event.error
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
