import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Capturar errores globales y mostrarlos en pantalla
window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `
    <div style="padding:20px;font-family:monospace;background:#fff;min-height:100vh">
      <h2 style="color:red">❌ Error en la app</h2>
      <p style="background:#fee;padding:12px;border-radius:8px;font-size:13px">
        <b>${msg}</b><br/>
        Línea: ${line} · Columna: ${col}<br/>
        Archivo: ${src}
      </p>
      ${err ? `<pre style="font-size:11px;background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto">${err.stack||''}</pre>` : ''}
    </div>`;
};

window.onunhandledrejection = (e) => {
  document.body.innerHTML = `
    <div style="padding:20px;font-family:monospace;background:#fff;min-height:100vh">
      <h2 style="color:red">❌ Error async</h2>
      <p style="background:#fee;padding:12px;border-radius:8px;font-size:13px">
        ${e.reason}
      </p>
      <pre style="font-size:11px;background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto">${e.reason?.stack||''}</pre>
    </div>`;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
