import { useState } from 'react';

// Zonas de aplicación de toxina botulínica.
// rango_min/max: unidades de referencia (consenso clínico) — editable por el médico.
// puntos: patrón de inyección aproximado sobre el diagrama frontal (viewBox 300x470).
//   Convención: la DERECHA del paciente se dibuja a la IZQUIERDA (vista frontal).
const ZONAS_TOXINA = {
  frente: {
    nombre: 'Frente', musculo: 'Frontalis', profundidad: '3-4 mm',
    rango_min: 10, rango_max: 20, region: 'Tercio superior',
    puntos: [[112, 96], [138, 90], [162, 90], [188, 96], [124, 76], [150, 72], [176, 76]],
    historial_ejemplo: [{ fecha: '2026-09-16', dosis: 16, marca: 'Botox', lote: 'BOT-089456' }],
  },
  entrecejo: {
    nombre: 'Entrecejo (glabela)', musculo: 'Procerus + corrugadores', profundidad: '4-5 mm',
    rango_min: 20, rango_max: 30, region: 'Tercio superior',
    puntos: [[150, 132], [136, 124], [164, 124], [124, 120], [176, 120]],
    historial_ejemplo: [
      { fecha: '2026-09-16', dosis: 24, marca: 'Botox', lote: 'BOT-089456' },
      { fecha: '2026-06-15', dosis: 22, marca: 'Dysport', lote: 'DYS-065123' },
    ],
  },
  elevacion_cejas: {
    nombre: 'Elevación de cejas (brow lift)', musculo: 'Orbicularis (cola de ceja)', profundidad: '2-3 mm',
    rango_min: 4, rango_max: 8, region: 'Tercio superior',
    puntos: [[116, 138], [184, 138]],
    historial_ejemplo: [],
  },
  pata_gallo_d: {
    nombre: 'Patas de gallo — derecha', musculo: 'Orbicularis oculi', profundidad: '2-3 mm',
    rango_min: 8, rango_max: 15, region: 'Tercio superior',
    puntos: [[76, 150], [70, 163], [80, 176]],
    historial_ejemplo: [],
  },
  pata_gallo_i: {
    nombre: 'Patas de gallo — izquierda', musculo: 'Orbicularis oculi', profundidad: '2-3 mm',
    rango_min: 8, rango_max: 15, region: 'Tercio superior',
    puntos: [[224, 150], [230, 163], [220, 176]],
    historial_ejemplo: [],
  },
  bunny: {
    nombre: 'Bunny lines (nasales)', musculo: 'Nasalis', profundidad: '2-3 mm',
    rango_min: 4, rango_max: 8, region: 'Tercio medio',
    puntos: [[138, 188], [162, 188]],
    historial_ejemplo: [],
  },
  sonrisa_gingival: {
    nombre: 'Sonrisa gingival', musculo: 'Elevador del labio (LLSAN)', profundidad: '3-4 mm',
    rango_min: 2, rango_max: 6, region: 'Tercio medio',
    puntos: [[142, 236], [158, 236]],
    historial_ejemplo: [],
  },
  comisura_labial: {
    nombre: 'Comisura labial (DAO)', musculo: 'Depressor anguli oris', profundidad: '4-5 mm',
    rango_min: 4, rango_max: 10, region: 'Tercio inferior',
    puntos: [[122, 268], [178, 268]],
    historial_ejemplo: [],
  },
  menton: {
    nombre: 'Mentón (dimpling)', musculo: 'Mentalis', profundidad: '4-5 mm',
    rango_min: 4, rango_max: 10, region: 'Tercio inferior',
    puntos: [[144, 302], [156, 302]],
    historial_ejemplo: [],
  },
  masetero: {
    nombre: 'Masetero (bruxismo)', musculo: 'Masseter', profundidad: '5-6 mm',
    rango_min: 20, rango_max: 40, region: 'Tercio inferior',
    puntos: [[92, 268], [208, 268]],
    historial_ejemplo: [],
  },
  bandas_platismales: {
    nombre: 'Bandas platismales', musculo: 'Platysma', profundidad: '2-3 mm',
    rango_min: 20, rango_max: 60, region: 'Cuello',
    puntos: [[130, 356], [130, 384], [170, 356], [170, 384]],
    historial_ejemplo: [],
  },
  lineas_transversales_cuello: {
    nombre: 'Líneas transversales del cuello', musculo: 'Surcos horizontales', profundidad: '2-3 mm',
    rango_min: 10, rango_max: 20, region: 'Cuello',
    puntos: [[134, 406], [150, 409], [166, 406]],
    historial_ejemplo: [],
  },
  escote: {
    nombre: 'Escote (décolletage)', musculo: 'Líneas del escote', profundidad: '2-3 mm',
    rango_min: 15, rango_max: 30, region: 'Cuello',
    puntos: [[122, 446], [150, 451], [178, 446]],
    historial_ejemplo: [],
  },
  axilas: {
    nombre: 'Axilas (hiperhidrosis)', musculo: 'Glándulas ecrinas', profundidad: '2-3 mm',
    rango_min: 50, rango_max: 100, region: 'Hiperhidrosis',
    puntos: [], historial_ejemplo: [],
  },
  manos: {
    nombre: 'Manos (hiperhidrosis)', musculo: 'Glándulas palmares', profundidad: '2-3 mm',
    rango_min: 25, rango_max: 50, region: 'Hiperhidrosis',
    puntos: [], historial_ejemplo: [],
  },
};

const COL = {
  vacio: '#cbd5e1', vacioBorde: '#94a3b8',
  sel: '#0066cc', inyectado: '#16a34a',
  piel: '#f4ddd0', pielBorde: '#c9a08c', rasgo: '#b07d68',
};

const MapaFacialAnatomicoToxina = ({ onDosisChange, dosisActual = {} }) => {
  const [zonaSeleccionada, setZonaSeleccionada] = useState('entrecejo');
  const [dosis, setDosis] = useState(dosisActual);
  const [alerta, setAlerta] = useState(null);

  const zona = ZONAS_TOXINA[zonaSeleccionada];

  const handleDosisChange = (e) => {
    const valor = parseInt(e.target.value) || 0;
    const next = { ...dosis, [zonaSeleccionada]: valor };
    setDosis(next);
    onDosisChange?.(next);
    if (valor > 0 && (valor < zona.rango_min || valor > zona.rango_max)) {
      setAlerta(`⚠️ Rango sugerido: ${zona.rango_min}-${zona.rango_max} U. Ingresaste: ${valor} U`);
    } else {
      setAlerta(null);
    }
  };

  const colorPunto = (zid) =>
    zid === zonaSeleccionada ? COL.sel : dosis[zid] ? COL.inyectado : COL.vacio;

  const totalUnidades = Object.values(dosis).reduce((a, b) => a + (Number(b) || 0), 0);
  const zonasInyectadas = Object.keys(dosis).filter((k) => dosis[k]);

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: '#1a1a1a' }}>
      {/* IZQUIERDA: DIAGRAMA */}
      <div style={{ flex: '1 1 320px', minWidth: 300 }}>
        <svg viewBox="0 0 300 470" style={{ width: '100%', height: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10 }}>
          <title>Mapa facial de aplicación de toxina botulínica</title>

          {/* CUELLO / ESCOTE */}
          <path d="M112,300 C108,342 106,364 116,384 C104,392 92,398 84,410 L84,470 L216,470 L216,410 C208,398 196,392 184,384 C194,364 192,342 188,300 Z"
            fill={COL.piel} stroke={COL.pielBorde} strokeWidth="1.5" />

          {/* CABEZA / CARA */}
          <path d="M150,44 C108,44 80,70 74,120 C70,150 72,186 86,226 C98,264 120,302 150,316 C180,302 202,264 214,226 C228,186 230,150 226,120 C220,70 192,44 150,44 Z"
            fill={COL.piel} stroke={COL.pielBorde} strokeWidth="1.8" />

          {/* OREJAS */}
          <path d="M74,150 C64,148 60,160 64,172 C67,182 74,184 78,180" fill={COL.piel} stroke={COL.pielBorde} strokeWidth="1.5" />
          <path d="M226,150 C236,148 240,160 236,172 C233,182 226,184 222,180" fill={COL.piel} stroke={COL.pielBorde} strokeWidth="1.5" />

          {/* GUÍAS DE TERCIOS (sutiles) */}
          <line x1="70" y1="132" x2="230" y2="132" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="72" y1="218" x2="228" y2="218" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 4" />

          {/* CEJAS */}
          <path d="M94,132 Q112,124 132,128" fill="none" stroke={COL.rasgo} strokeWidth="3" strokeLinecap="round" />
          <path d="M168,128 Q188,124 206,132" fill="none" stroke={COL.rasgo} strokeWidth="3" strokeLinecap="round" />

          {/* OJOS */}
          <path d="M92,150 Q108,140 124,150 Q108,160 92,150 Z" fill="#fff" stroke={COL.rasgo} strokeWidth="1.4" />
          <path d="M176,150 Q192,140 208,150 Q192,160 176,150 Z" fill="#fff" stroke={COL.rasgo} strokeWidth="1.4" />
          <circle cx="108" cy="150" r="4" fill="#6b4a3a" />
          <circle cx="192" cy="150" r="4" fill="#6b4a3a" />

          {/* NARIZ */}
          <path d="M150,150 L150,198 M150,198 C140,206 134,210 136,214 C140,218 148,216 150,212 C152,216 160,218 164,214 C166,210 160,206 150,198"
            fill="none" stroke={COL.rasgo} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* LABIOS */}
          <path d="M126,250 Q138,244 150,248 Q162,244 174,250 Q162,258 150,258 Q138,258 126,250 Z"
            fill="#d9927e" stroke={COL.rasgo} strokeWidth="1.2" />
          <line x1="126" y1="250" x2="174" y2="250" stroke={COL.rasgo} strokeWidth="1" />

          {/* PUNTOS DE INYECCIÓN */}
          {Object.entries(ZONAS_TOXINA).map(([zid, z]) =>
            (z.puntos || []).map(([x, y], i) => (
              <circle
                key={`${zid}-${i}`}
                cx={x} cy={y}
                r={zid === zonaSeleccionada ? 6 : 5}
                fill={colorPunto(zid)}
                stroke="#fff" strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => setZonaSeleccionada(zid)}
              >
                <title>{z.nombre}</title>
              </circle>
            ))
          )}
        </svg>

        {/* LEYENDA */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#475569', marginTop: 8 }}>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COL.vacio, marginRight: 5, verticalAlign: 'middle' }} />Sin aplicar</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COL.sel, marginRight: 5, verticalAlign: 'middle' }} />Seleccionada</span>
          <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: COL.inyectado, marginRight: 5, verticalAlign: 'middle' }} />Con dosis</span>
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          Vista frontal — la derecha del paciente está a tu izquierda.
        </div>

        {/* CHIPS DE TODAS LAS ZONAS (incluye no faciales) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {Object.entries(ZONAS_TOXINA).map(([zid, z]) => {
            const activa = zid === zonaSeleccionada;
            const inyect = !!dosis[zid];
            return (
              <button
                key={zid}
                onClick={() => setZonaSeleccionada(zid)}
                style={{
                  padding: '5px 10px', borderRadius: 14, fontSize: 11, cursor: 'pointer',
                  border: `1px solid ${activa ? COL.sel : inyect ? COL.inyectado : '#cbd5e1'}`,
                  background: activa ? COL.sel : inyect ? '#e8f7ee' : '#f8fafc',
                  color: activa ? '#fff' : inyect ? '#166534' : '#475569',
                  fontWeight: activa ? 'bold' : 'normal',
                }}
              >
                {inyect && !activa ? '✓ ' : ''}{z.nombre}{inyect ? ` · ${dosis[zid]}U` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* DERECHA: DETALLE */}
      <div style={{ flex: '1 1 280px', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: 17 }}>{zona.nombre}</h3>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{zona.musculo} · {zona.region}</div>
        </div>

        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: 12, borderRadius: 8, fontSize: 12, color: '#1e40af' }}>
          <div><strong>Profundidad:</strong> {zona.profundidad}</div>
          <div><strong>Rango sugerido:</strong> {zona.rango_min}-{zona.rango_max} U</div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6, color: '#0f172a' }}>
            Unidades a inyectar:
          </label>
          <input
            type="number" min="0"
            value={dosis[zonaSeleccionada] || ''}
            onChange={handleDosisChange}
            placeholder={`${zona.rango_min}-${zona.rango_max} U`}
            style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {alerta && (
          <div style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#9a3412', padding: 8, borderRadius: 6, fontSize: 12 }}>
            {alerta}
          </div>
        )}

        {/* RESUMEN */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 }}>
            Resumen: {zonasInyectadas.length} zona(s) · {totalUnidades} U totales
          </div>
          {zonasInyectadas.length === 0 ? (
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Aún no registras unidades.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {zonasInyectadas.map((zid) => (
                <div key={zid} style={{ fontSize: 11, color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{ZONAS_TOXINA[zid].nombre}</span>
                  <strong>{dosis[zid]} U</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HISTORIAL ZONA */}
        {zona.historial_ejemplo && zona.historial_ejemplo.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 12, color: '#0f172a', marginBottom: 6 }}>Historial de la zona:</div>
            {zona.historial_ejemplo.map((item, idx) => (
              <div key={idx} style={{ fontSize: 11, color: '#475569', padding: 6, background: '#f8fafc', borderRadius: 4, marginBottom: 4 }}>
                <strong>{item.fecha}:</strong> {item.dosis} U · {item.marca} · LOT {item.lote}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaFacialAnatomicoToxina;
