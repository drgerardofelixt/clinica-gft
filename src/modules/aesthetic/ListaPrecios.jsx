import { useState, useMemo } from 'react';
import { PRECIOS_ESTETICA, PRECIOS_ACTUALIZADO } from './preciosBeaunit';

const money = (n) => '$' + (Number(n) || 0).toLocaleString('es-MX');

// Normaliza para búsqueda: minúsculas y sin acentos.
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Lista de precios de REFERENCIA (solo lectura) para cotizar procedimientos al momento.
export default function ListaPrecios() {
  const [q, setQ] = useState('');

  const grupos = useMemo(() => {
    const t = norm(q.trim());
    const filtrados = !t
      ? PRECIOS_ESTETICA
      : PRECIOS_ESTETICA.filter((p) => norm(p.nombre).includes(t) || norm(p.categoria).includes(t));
    const map = new Map();
    for (const p of filtrados) {
      if (!map.has(p.categoria)) map.set(p.categoria, []);
      map.get(p.categoria).push(p);
    }
    return [...map.entries()];
  }, [q]);

  const totalFiltrado = grupos.reduce((a, [, arr]) => a + arr.length, 0);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 20, color: '#1a1a1a' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h1 style={{ margin: 0, color: '#000', fontSize: 22 }}>💲 Lista de precios</h1>
        <div style={{ fontSize: 12, color: '#777' }}>Beaunit · lista {PRECIOS_ACTUALIZADO} · {PRECIOS_ESTETICA.length} procedimientos</div>
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        Precios de referencia para cotizar. Escribe para buscar por procedimiento o categoría.
      </div>

      {/* BUSCADOR — cotización rápida */}
      <div style={{ position: 'sticky', top: 0, background: '#fff', paddingBottom: 12, zIndex: 1 }}>
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar… ej. Botox, Clarity, labios, ácido hialurónico"
          style={{
            width: '100%', padding: '13px 16px', fontSize: 16, boxSizing: 'border-box',
            border: '2px solid #C77DAE', borderRadius: 12, outline: 'none',
          }}
        />
        {q.trim() && (
          <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
            {totalFiltrado} resultado{totalFiltrado !== 1 ? 's' : ''}
            <button onClick={() => setQ('')} style={{ marginLeft: 10, background: 'none', border: 'none', color: '#C77DAE', cursor: 'pointer', fontWeight: 600 }}>limpiar</button>
          </div>
        )}
      </div>

      {totalFiltrado === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          Sin resultados para “{q}”.
        </div>
      ) : (
        grupos.map(([cat, arr]) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              color: '#0F2C57', padding: '8px 2px', borderBottom: '2px solid #eef0f4', marginBottom: 2,
            }}>
              {cat} <span style={{ color: '#aaa', fontWeight: 600 }}>· {arr.length}</span>
            </div>
            {arr.map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                padding: '9px 2px', borderBottom: '1px solid #f3f4f6',
              }}>
                <div style={{ fontSize: 14 }}>{p.nombre}</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0F2C57', whiteSpace: 'nowrap' }}>
                  {money(p.precio)}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
