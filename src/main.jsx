import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Seus estilos globais

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);