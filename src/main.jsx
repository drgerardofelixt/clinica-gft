import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const formatError = (err) => {
  if (!err) return "Sin información";
  if (typeof err === "string") return err;
  if (err.message) return err.message + (err.code?" (code: "+err.code+")":"") + (err.details?"\nDetalles: "+err.details:"") + (err.hint?"\nHint: "+err.hint:"");
  try { return JSON.stringify(err, null, 2); } catch(_) { return String(err); }
};

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
      <button onclick="location.reload()" style="padding:10px 20px;background:#1B3F8B;color:white;border:none;border-radius:8px;font-size:14px;margin-top:12px">Recargar</button>
    </div>`;
};

window.onunhandledrejection = (e) => {
  const err = e.reason;
  document.body.innerHTML = `
    <div style="padding:20px;font-family:monospace;background:#fff;min-height:100vh">
      <h2 style="color:red">❌ Error async</h2>
      <pre style="background:#fee;padding:12px;border-radius:8px;font-size:13px;white-space:pre-wrap;word-break:break-word">${formatError(err)}</pre>
      ${err?.stack ? `<pre style="font-size:11px;background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto;margin-top:12px">${err.stack}</pre>` : ''}
      <button onclick="location.reload()" style="padding:10px 20px;background:#1B3F8B;color:white;border:none;border-radius:8px;font-size:14px;margin-top:12px">Recargar</button>
    </div>`;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
