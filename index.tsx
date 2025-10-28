import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupGlobalErrorTracking } from './utils/errorTracking';

// Setup global error tracking
if (import.meta.env.PROD) {
  setupGlobalErrorTracking();
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      // Ignore security errors in development
      if (err.name !== 'SecurityError') {
        console.error('ServiceWorker registration failed: ', err);
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);