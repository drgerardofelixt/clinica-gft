import { useState } from 'react';

const PlanesTratamiento = ({ planes = [] }) => {
  const [expandido, setExpandido] = useState(null);

  if (!planes || planes.length === 0) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
        background: '#f9f9f9',
        borderRadius: 6,
        border: '1px dashed #ddd'
      }}>
        📋 Sin planes registrados aún
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      color: '#1a1a1a'
    }}>
      {planes.map((plan, idx) => {
        // Fallback: preferir campos nuevos (Fase 2), caer a viejos si no existen
        const nombre = plan.nombre_plan || 'Plan sin nombre';
        const nivel = plan.nivel_plan; // Viejo — mostrar solo si existe
        const objetivo = plan.objetivo; // Nuevo
        const duracion = plan.duracion_total ||
                        (plan.duracion_total_meses ? `${plan.duracion_total_meses} meses` : 'No especificada');
        const costo = plan.costo_estimado ||
                     (plan.costo_total_mxn ? `$${plan.costo_total_mxn?.toLocaleString('es-MX')} MXN` : '$0 MXN');
        const procedimientos = plan.procedimientos || []; // Nuevo — array
        const estado = plan.estado || 'activo'; // Nuevo

        return (
          <div
            key={idx}
            style={{
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              padding: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: expandido === idx ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
            }}
            onClick={() => setExpandido(expandido === idx ? null : idx)}
          >
            {/* ENCABEZADO */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: expandido === idx ? 12 : 0
            }}>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: 13,
                  color: '#1a1a1a',
                  marginBottom: 4
                }}>
                  {nombre}
                  {nivel && (
                    <span style={{
                      fontSize: 11,
                      color: '#666',
                      marginLeft: 8,
                      fontWeight: 'normal'
                    }}>
                      ({nivel})
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#999'
                }}>
                  {duracion} • {costo}
                </div>
              </div>

              {/* BADGE ESTADO */}
              <div style={{
                padding: '4px 10px',
                background: estado === 'activo' ? '#e8f5e9' : '#fff3e0',
                color: estado === 'activo' ? '#2e7d32' : '#e65100',
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 'bold',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}>
                {estado}
              </div>
            </div>

            {/* EXPANDIBLE */}
            {expandido === idx && (
              <div style={{
                paddingTop: 12,
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {objetivo && (
                  <div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: '#666',
                      marginBottom: 4
                    }}>
                      📌 Objetivo
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: '#333'
                    }}>
                      {objetivo}
                    </div>
                  </div>
                )}

                {procedimientos && procedimientos.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 'bold',
                      color: '#666',
                      marginBottom: 6
                    }}>
                      💉 Procedimientos ({procedimientos.length})
                    </div>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      {procedimientos.map((proc, pidx) => (
                        <div
                          key={pidx}
                          style={{
                            padding: 8,
                            background: '#f9f9f9',
                            borderLeft: '3px solid #0066cc',
                            borderRadius: 3,
                            fontSize: 11
                          }}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            color: '#1a1a1a',
                            marginBottom: 2
                          }}>
                            {proc.tipo}
                          </div>
                          {proc.zonas && (
                            <div style={{ color: '#666' }}>
                              Zonas: {proc.zonas}
                            </div>
                          )}
                          {proc.dosis && (
                            <div style={{ color: '#666' }}>
                              Dosis: {proc.dosis}
                            </div>
                          )}
                          {proc.frecuencia && (
                            <div style={{ color: '#999', fontSize: 10 }}>
                              {proc.frecuencia}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DETALLES ADICIONALES */}
                <div style={{
                  paddingTop: 8,
                  borderTop: '1px solid #f0f0f0',
                  fontSize: 10,
                  color: '#999'
                }}>
                  <div>✓ Duración: {duracion}</div>
                  <div>✓ Costo: {costo}</div>
                  {plan.procedimientos && plan.procedimientos.length === 0 && (
                    <div style={{ color: '#c62828' }}>
                      ⚠️ Sin procedimientos asignados
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PlanesTratamiento;
