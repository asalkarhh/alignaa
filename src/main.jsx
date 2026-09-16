import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import './index.css';

function AppReady() {
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('alignaa:ready')));
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <AppReady />
    <Analytics />
  </React.StrictMode>
);

