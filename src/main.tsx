import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { seedDemoData } from './lib/demoData';
import './index.css';

// Install the demo workspace before React mounts so every provider's lazy
// state initialiser reads populated localStorage on the very first render.
seedDemoData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

