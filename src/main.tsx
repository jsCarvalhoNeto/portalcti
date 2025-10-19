import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Atualização do frontend - sincronização com repositório
createRoot(document.getElementById("root")!).render(
  <App />
);
