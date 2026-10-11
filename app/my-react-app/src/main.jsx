import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

/**
 * Application Entry Point
 * Renders the root React application inside Vite's mount target (#root)
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Fatal: Failed to locate #root DOM container element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
