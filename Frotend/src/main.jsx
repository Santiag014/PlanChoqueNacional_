// main.jsx o index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initGA } from './utils/analytics/analytics.js';

// Inicializar Google Analytics
initGA();

// Validar sistema de analytics en desarrollo
if (import.meta.env.DEV) {
  import('./utils/analytics/validator.js').then(({ runAnalyticsValidation }) => {
    setTimeout(runAnalyticsValidation, 2000);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
