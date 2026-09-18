import { useEffect, useRef } from 'react';

// Pad de firma en canvas — Pointer Events: Apple Pencil / dedo / mouse.
export default function SignaturePad({ onChange, altura = 180 }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dibujando = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctxRef.current = ctx;
  }, []);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e) => {
    e.preventDefault();
    dibujando.current = true;
    const { x, y } = pos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
  };
  const move = (e) => {
    if (!dibujando.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };
  const end = () => {
    if (!dibujando.current) return;
    dibujando.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };
  const limpiar = () => {
    const c = canvasRef.current;
    ctxRef.current.clearRect(0, 0, c.width, c.height);
    onChange('');
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{ width: '100%', height: altura, border: '2px dashed #94a3b8', borderRadius: 8, background: '#fff', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Firme aquí con el Apple Pencil o el dedo</span>
        <button type="button" onClick={limpiar} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', color: '#334155' }}>
          Borrar firma
        </button>
      </div>
    </div>
  );
}
