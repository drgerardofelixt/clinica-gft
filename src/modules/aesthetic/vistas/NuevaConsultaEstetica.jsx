import { useState } from 'react';
import HistoriaClinicaForm from '../componentes/HistoriaClinicaForm';
import CargadorFotos from '../componentes/CargadorFotos';
import AnalizadorIAVision from '../componentes/AnalizadorIAVision';
import SelectorPlanes from '../componentes/SelectorPlanes';

const NuevaConsultaEstetica = ({ pacienteId, pacienteNombre = 'Paciente' }) => {
  const [etapa, setEtapa] = useState('historia'); // 'historia' | 'fotos' | 'analisis' | 'planes'
  const [historiaGuardada, setHistoriaGuardada] = useState(false);
  const [fotosGuardadas, setFotosGuardadas] = useState({});
  const [analisisGuardado, setAnalisisGuardado] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);

  const etapas = [
    { id: 'historia', label: '📋 Historia Clínica', completada: historiaGuardada },
    { id: 'fotos', label: '📸 Fotos (5 ángulos)', completada: Object.keys(fotosGuardadas).length > 0 },
    { id: 'analisis', label: '🤖 Análisis IA', completada: !!analisisGuardado },
    { id: 'planes', label: '📊 Seleccionar Plan', completada: !!planSeleccionado }
  ];

  const indiceEtacaActual = etapas.findIndex(e => e.id === etapa);

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#fafafa',
        minHeight: '100vh',
        paddingBottom: 40
      }}
    >
      {/* ENCABEZADO */}
      <div
        style={{
          background: '#1a1a1a',
          color: '#fff',
          padding: 20,
          marginBottom: 24
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>
          🎨 Nueva Consulta Estética
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: 14, color: '#aaa' }}>
          Paciente: {pacienteNombre}
        </p>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        {/* BARRA DE PROGRESO */}
        <div
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 8,
            marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {etapas.map((e, idx) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 'max-content' }}>
                {/* CÍRCULO */}
                <button
                  onClick={() => setEtapa(e.id)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor:
                      etapa === e.id
                        ? '#0066cc'
                        : e.completada
                          ? '#2e7d32'
                          : '#ddd',
                    background:
                      etapa === e.id
                        ? '#0066cc'
                        : e.completada
                          ? '#2e7d32'
                          : '#fff',
                    color:
                      etapa === e.id || e.completada ? '#fff' : '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 14
                  }}
                >
                  {e.completada ? '✓' : idx + 1}
                </button>

                {/* LABEL */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: etapa === e.id ? 'bold' : 'normal',
                      color:
                        etapa === e.id
                          ? '#0066cc'
                          : e.completada
                            ? '#2e7d32'
                            : '#666'
                    }}
                  >
                    {e.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: e.completada ? '#2e7d32' : '#999'
                    }}
                  >
                    {e.completada ? '✓ Completada' : 'Pendiente'}
                  </span>
                </div>

                {/* FLECHA */}
                {idx < etapas.length - 1 && (
                  <span style={{ color: '#ddd', marginLeft: 4 }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENIDO */}
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: 24
          }}
        >
          {/* ETAPA 1: HISTORIA CLÍNICA */}
          {etapa === 'historia' && (
            <div>
              <HistoriaClinicaForm
                pacienteId={pacienteId}
                onGuardado={() => {
                  setHistoriaGuardada(true);
                }}
              />
            </div>
          )}

          {/* ETAPA 2: FOTOS */}
          {etapa === 'fotos' && (
            <div>
              {!historiaGuardada && (
                <div
                  style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    color: '#856404',
                    padding: 14,
                    borderRadius: 6,
                    marginBottom: 20
                  }}
                >
                  ⚠️ <strong>Nota:</strong> Es recomendable completar la Historia Clínica primero. Puedes continuar,
                  pero asegúrate de volver.
                </div>
              )}
              <CargadorFotos
                pacienteId={pacienteId}
                onFotosGuardadas={(fotos) => {
                  setFotosGuardadas(fotos);
                }}
              />
            </div>
          )}

          {/* ETAPA 3: ANÁLISIS IA */}
          {etapa === 'analisis' && (
            <div>
              {Object.keys(fotosGuardadas).length === 0 && (
                <div
                  style={{
                    background: '#ffebee',
                    border: '2px solid #c62828',
                    color: '#c62828',
                    padding: 14,
                    borderRadius: 6,
                    marginBottom: 20,
                    fontWeight: 'bold'
                  }}
                >
                  🚫 Necesitas cargar al menos 1 foto antes de analizar. Vuelve a la etapa anterior.
                </div>
              )}
              <AnalizadorIAVision
                pacienteId={pacienteId}
                fotosUrls={fotosGuardadas}
                onAnalisisGuardado={(analisis) => {
                  setAnalisisGuardado(analisis);
                }}
              />
            </div>
          )}

          {/* ETAPA 4: SELECCIONAR PLAN */}
          {etapa === 'planes' && (
            <div>
              {!analisisGuardado && (
                <div
                  style={{
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    color: '#856404',
                    padding: 14,
                    borderRadius: 6,
                    marginBottom: 20
                  }}
                >
                  ⚠️ <strong>Nota:</strong> No hay análisis IA guardado. Se mostrarán planes por defecto. Puedes continuar,
                  pero se recomienda completar el análisis primero.
                </div>
              )}
              <SelectorPlanes
                pacienteId={pacienteId}
                analisisIA={analisisGuardado}
                onPlanSeleccionado={(plan) => {
                  setPlanSeleccionado(plan);
                }}
              />
            </div>
          )}
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'space-between',
            marginBottom: 24
          }}
        >
          <button
            onClick={() => {
              const indiceActual = etapas.findIndex(e => e.id === etapa);
              if (indiceActual > 0) {
                setEtapa(etapas[indiceActual - 1].id);
              }
            }}
            disabled={indiceEtacaActual === 0}
            style={{
              padding: 12,
              background:
                indiceEtacaActual === 0 ? '#ccc' : '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor:
                indiceEtacaActual === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: 14,
              minWidth: 120
            }}
          >
            ← Atrás
          </button>

          {indiceEtacaActual < etapas.length - 1 ? (
            <button
              onClick={() => {
                const indiceActual = etapas.findIndex(e => e.id === etapa);
                if (indiceActual < etapas.length - 1) {
                  setEtapa(etapas[indiceActual + 1].id);
                }
              }}
              style={{
                padding: 12,
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                minWidth: 120
              }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={() => {
                alert('✅ Consulta completada. El paciente está listo para agendar procedimientos.');
              }}
              style={{
                padding: 12,
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
                minWidth: 120
              }}
            >
              ✅ Finalizar
            </button>
          )}
        </div>

        {/* RESUMEN FINAL */}
        {indiceEtacaActual === etapas.length - 1 && (
          <div
            style={{
              background: '#e8f5e9',
              border: '2px solid #2e7d32',
              color: '#1b5e20',
              padding: 20,
              borderRadius: 8,
              marginBottom: 24
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              📋 Resumen de la Consulta
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <strong>Historia Clínica:</strong> {historiaGuardada ? '✓ Completa' : '✗ Incompleta'}
              </div>
              <div>
                <strong>Fotos cargadas:</strong> {Object.keys(fotosGuardadas).length} / 5
              </div>
              <div>
                <strong>Análisis IA:</strong> {analisisGuardado ? '✓ Completado' : '✗ No completado'}
              </div>
              <div>
                <strong>Plan seleccionado:</strong> {planSeleccionado ? '✓ Sí' : '✗ No'}
              </div>
            </div>

            <div style={{ paddingTop: 12, borderTop: '1px solid #81c784' }}>
              <p style={{ margin: 0, fontSize: 13 }}>
                🎯 <strong>Próximo paso:</strong> Agendar citas para procedimientos y generar consentimiento NOM-004.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NuevaConsultaEstetica;
