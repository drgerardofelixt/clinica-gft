import { useState } from 'react';

const C = {
  azul: '#0066cc',
  verde: '#2e7d32',
  suave: '#666',
  gris: '#f5f5f5',
};

const HistorialProcedimientos = ({ procedimientos, onActualizar, onAbrir }) => {
  if (procedimientos.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: C.suave }}>
        <div style={{ fontSize: 14 }}>📭 Sin procedimientos registrados aún</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#1a1a1a' }}>
      {procedimientos.map((proc) => (
        <div
          key={proc.id}
          onClick={() => onAbrir && onAbrir(proc)}
          style={{
            border: `1px solid ${C.gris}`,
            borderRadius: 8,
            padding: 16,
            background: '#fafafa',
            cursor: onAbrir ? 'pointer' : 'default',
          }}
        >
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 14, color: '#000' }}>
                📅 {proc.fecha_procedimiento ? new Date(proc.fecha_procedimiento).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'Sin fecha'}
              </div>
              <div style={{ fontSize: 12, color: C.suave, marginTop: 2 }}>
                {proc.tipo_procedimiento || proc.procedimiento_tipo || 'Procedimiento'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {onAbrir && <div style={{ fontSize: 12, color: C.azul, fontWeight: 'bold', marginBottom: 4 }}>✏️ Abrir →</div>}
              <div style={{ fontSize: 11, color: C.suave }}>GAIS</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: C.verde }}>
                {(proc.gais_antes ?? proc.gais_score_antes ?? '—')} → {(proc.gais_despues ?? proc.gais_score_despues ?? '—')}
              </div>
            </div>
          </div>

          {/* DETALLES */}
          <div style={{ fontSize: 12, color: '#333', lineHeight: '1.6', marginBottom: 12 }}>
            {proc.zonas_tratadas && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Zonas:</span> {proc.zonas_tratadas.join(', ')}
              </div>
            )}
            {proc.costo_total_mxn && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Costo:</span> ${proc.costo_total_mxn.toLocaleString('es-MX')} MXN
              </div>
            )}
            {proc.precio_cobrado_mxn && (
              <div>
                <span style={{ fontWeight: 'bold' }}>Cobrado:</span> ${proc.precio_cobrado_mxn.toLocaleString('es-MX')} MXN
              </div>
            )}
            {proc.notas_clinicas && (
              <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 4, borderLeft: `3px solid ${C.azul}` }}>
                <div style={{ fontWeight: 'bold', fontSize: 11, color: C.azul }}>Notas:</div>
                <div style={{ fontSize: 11, color: '#333', marginTop: 4 }}>{proc.notas_clinicas}</div>
              </div>
            )}
          </div>

          {/* PRÓXIMA CITA */}
          {proc.proxima_cita && (
            <div style={{ padding: 8, background: '#e3f2fd', borderRadius: 4, fontSize: 12, color: '#1565c0' }}>
              📅 Próxima cita: {new Date(proc.proxima_cita).toLocaleDateString('es-MX')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HistorialProcedimientos;
