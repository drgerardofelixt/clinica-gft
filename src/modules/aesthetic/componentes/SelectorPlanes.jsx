import { useState } from 'react';
import { supabase } from '../../../supabase';

const SelectorPlanes = ({ pacienteId, analisisIA = null, onPlanSeleccionado = () => {} }) => {
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [creadoPersonalizado, setCreandoPersonalizado] = useState(false);
  const [formPersonalizado, setFormPersonalizado] = useState({
    nombre: '',
    objetivo: '',
    procedimientos: [{ tipo: '', zonas: '', dosis: '', frecuencia: '' }],
    duracion_total: '',
    costo_estimado: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  // Obtener planes del análisis IA o usar defaults
  const planesPorDefecto = [
    {
      id: 'conservador',
      nombre: '🟢 CONSERVADOR',
      objetivo: 'Mantenimiento preventivo',
      procedimientos: [
        { tipo: 'Botox', zonas: 'Entrecejo, Frente', dosis: '40-50U', frecuencia: 'Cada 4 meses' }
      ],
      duracion_total: '3 meses',
      costo_estimado: '$3,500-4,000 MXN'
    },
    {
      id: 'estandar',
      nombre: '🟡 ESTÁNDAR',
      objetivo: 'Resultados balanceados con mejora significativa',
      procedimientos: [
        { tipo: 'Botox', zonas: 'Entrecejo, Frente, Patas de gallo', dosis: '60-80U', frecuencia: 'Cada 3-4 meses' },
        { tipo: 'Juvéderm', zonas: 'Pómulos', dosis: '1-1.5mL', frecuencia: 'Anual' }
      ],
      duracion_total: '4 meses',
      costo_estimado: '$6,500-7,500 MXN'
    },
    {
      id: 'intensivo',
      nombre: '🔴 INTENSIVO',
      objetivo: 'Rejuvenecimiento facial global completo',
      procedimientos: [
        { tipo: 'Botox', zonas: 'Entrecejo, Frente, Patas de gallo, Bunny lines', dosis: '90-120U', frecuencia: 'Cada 3-4 meses' },
        { tipo: 'Juvéderm', zonas: 'Pómulos, Labios', dosis: '2.5-3mL total', frecuencia: 'Anual' },
        { tipo: 'Radiesse', zonas: 'Mandíbula', dosis: '1mL', frecuencia: 'Cada 12-18 meses' }
      ],
      duracion_total: '6 meses',
      costo_estimado: '$12,000-14,000 MXN'
    }
  ];

  const planes = analisisIA?.planes_sugeridos || planesPorDefecto;

  const guardarPlan = async (plan) => {
    try {
      setError(null);
      setGuardando(true);

      const { error: err } = await supabase
        .from('planes_tratamiento_estetico')
        .insert({
          paciente_id: pacienteId,
          nombre_plan: plan.nombre,
          objetivo: plan.objetivo,
          procedimientos: plan.procedimientos,
          duracion_total: plan.duracion_total,
          costo_estimado: plan.costo_estimado,
          estado: 'activo'
        });

      if (err) throw err;

      setExito(true);
      setTimeout(() => setExito(false), 3000);
      setPlanSeleccionado(plan.id);
      onPlanSeleccionado(plan);
    } catch (err) {
      console.error('Error guardando plan:', err);
      setError(err.message || 'Error al guardar plan');
    } finally {
      setGuardando(false);
    }
  };

  const guardarPlanPersonalizado = async () => {
    try {
      setError(null);

      if (!formPersonalizado.nombre.trim()) {
        throw new Error('El nombre del plan es requerido');
      }

      setGuardando(true);

      const { error: err } = await supabase
        .from('planes_tratamiento_estetico')
        .insert({
          paciente_id: pacienteId,
          nombre_plan: formPersonalizado.nombre,
          objetivo: formPersonalizado.objetivo,
          procedimientos: formPersonalizado.procedimientos.filter(p => p.tipo),
          duracion_total: formPersonalizado.duracion_total,
          costo_estimado: formPersonalizado.costo_estimado,
          estado: 'activo'
        });

      if (err) throw err;

      setExito(true);
      setTimeout(() => setExito(false), 3000);
      setCreandoPersonalizado(false);
      setFormPersonalizado({
        nombre: '',
        objetivo: '',
        procedimientos: [{ tipo: '', zonas: '', dosis: '', frecuencia: '' }],
        duracion_total: '',
        costo_estimado: ''
      });
      onPlanSeleccionado(formPersonalizado);
    } catch (err) {
      console.error('Error guardando plan personalizado:', err);
      setError(err.message || 'Error al guardar plan');
    } finally {
      setGuardando(false);
    }
  };

  const agregarProcedimiento = () => {
    setFormPersonalizado(prev => ({
      ...prev,
      procedimientos: [...prev.procedimientos, { tipo: '', zonas: '', dosis: '', frecuencia: '' }]
    }));
  };

  const quitarProcedimiento = (idx) => {
    setFormPersonalizado(prev => ({
      ...prev,
      procedimientos: prev.procedimientos.filter((_, i) => i !== idx)
    }));
  };

  const actualizarProcedimiento = (idx, field, value) => {
    setFormPersonalizado(prev => ({
      ...prev,
      procedimientos: prev.procedimientos.map((proc, i) =>
        i === idx ? { ...proc, [field]: value } : proc
      )
    }));
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a1a'
      }}
    >
      <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>
        📋 Selector de Planes de Tratamiento
      </h2>

      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        Elige uno de los 3 planes sugeridos o crea uno totalmente personalizado. Todos los planes son editables después.
      </p>

      {exito && (
        <div
          style={{
            background: '#c8e6c9',
            border: '1px solid #2e7d32',
            color: '#1b5e20',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}
        >
          ✅ Plan guardado correctamente
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#ffcdd2',
            border: '1px solid #c62828',
            color: '#b71c1c',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16
          }}
        >
          ❌ Error: {error}
        </div>
      )}

      {!creadoPersonalizado ? (
        <>
          {/* GRID DE PLANES SUGERIDOS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            {planes.map((plan) => (
              <div
                key={plan.id}
                style={{
                  border: '3px solid',
                  borderColor:
                    plan.nombre.includes('CONSERVADOR')
                      ? '#4CAF50'
                      : plan.nombre.includes('ESTÁNDAR')
                        ? '#ff9800'
                        : '#c62828',
                  borderRadius: 8,
                  padding: 20,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* ENCABEZADO */}
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {plan.nombre}
                    <span style={{ fontSize: 12, background: '#f0f0f0', padding: '2px 8px', borderRadius: 12, color: '#666' }}>
                      {plan.nombre.includes('CONSERVADOR') ? '🟢' : plan.nombre.includes('ESTÁNDAR') ? '🟡' : '🔴'}
                    </span>
                  </h3>
                  <p style={{ margin: '6px 0 0 0', fontSize: 12, color: '#666' }}>
                    {plan.objetivo}
                  </p>
                </div>

                {/* PROCEDIMIENTOS */}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 8, color: '#333' }}>
                    Procedimientos:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.procedimientos?.map((proc, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: 8,
                          background: '#fafafa',
                          borderRadius: 4,
                          fontSize: 11,
                          borderLeft: '3px solid #0066cc'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                          {proc.tipo}
                        </div>
                        <div style={{ color: '#666' }}>
                          Zonas: {proc.zonas}
                        </div>
                        {proc.dosis && (
                          <div style={{ color: '#666' }}>
                            Dosis: {proc.dosis}
                          </div>
                        )}
                        <div style={{ color: '#999', fontSize: 10 }}>
                          Frecuencia: {proc.frecuencia}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DETALLES */}
                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, marginBottom: 6 }}>
                    <strong>Duración total:</strong> {plan.duracion_total}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <strong>Costo estimado:</strong> {plan.costo_estimado}
                  </div>
                </div>

                {/* BOTONES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  <button
                    onClick={() => guardarPlan(plan)}
                    disabled={guardando}
                    style={{
                      padding: 10,
                      background: '#2e7d32',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: guardando ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: 12,
                      opacity: guardando ? 0.6 : 1
                    }}
                  >
                    {guardando ? '⏳' : '✓'} {planSeleccionado === plan.id ? 'GUARDADO' : 'USAR ESTE PLAN'}
                  </button>

                  <button
                    onClick={() => setPlanSeleccionado(plan.id)}
                    style={{
                      padding: 10,
                      background: '#0066cc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: 12
                    }}
                  >
                    ✏️ VER DETALLES
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* BOTÓN CREAR PLAN PERSONALIZADO */}
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setCreandoPersonalizado(true)}
              style={{
                width: '100%',
                padding: 16,
                background: '#5e35b1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ➕ CREAR PLAN TOTALMENTE PERSONALIZADO
            </button>
          </div>
        </>
      ) : (
        <>
          {/* FORMULARIO PLAN PERSONALIZADO */}
          <div
            style={{
              background: '#f5f5f5',
              padding: 20,
              borderRadius: 8,
              border: '2px dashed #5e35b1'
            }}
          >
            <h3 style={{ marginTop: 0, color: '#1a1a1a' }}>
              ➕ Crear Plan Personalizado
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* NOMBRE */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Nombre del plan:
                </label>
                <input
                  type="text"
                  value={formPersonalizado.nombre}
                  onChange={(e) => setFormPersonalizado(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Plan de verano 2026"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* OBJETIVO */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Objetivo:
                </label>
                <textarea
                  value={formPersonalizado.objetivo}
                  onChange={(e) => setFormPersonalizado(prev => ({ ...prev, objetivo: e.target.value }))}
                  placeholder="¿Cuál es el objetivo principal?"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    minHeight: 60,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* PROCEDIMIENTOS */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Procedimientos:
                </label>

                {formPersonalizado.procedimientos.map((proc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      background: '#fff',
                      borderRadius: 4,
                      marginBottom: 12,
                      border: '1px solid #ddd',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 8
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 2 }}>
                        Tipo:
                      </label>
                      <input
                        type="text"
                        value={proc.tipo}
                        onChange={(e) => actualizarProcedimiento(idx, 'tipo', e.target.value)}
                        placeholder="Botox, Juvéderm, etc"
                        style={{
                          width: '100%',
                          padding: 6,
                          border: '1px solid #ddd',
                          borderRadius: 3,
                          fontSize: 11,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 2 }}>
                        Zonas:
                      </label>
                      <input
                        type="text"
                        value={proc.zonas}
                        onChange={(e) => actualizarProcedimiento(idx, 'zonas', e.target.value)}
                        placeholder="Entrecejo, Frente"
                        style={{
                          width: '100%',
                          padding: 6,
                          border: '1px solid #ddd',
                          borderRadius: 3,
                          fontSize: 11,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 2 }}>
                        Dosis:
                      </label>
                      <input
                        type="text"
                        value={proc.dosis}
                        onChange={(e) => actualizarProcedimiento(idx, 'dosis', e.target.value)}
                        placeholder="50U, 1mL"
                        style={{
                          width: '100%',
                          padding: 6,
                          border: '1px solid #ddd',
                          borderRadius: 3,
                          fontSize: 11,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 2 }}>
                        Frecuencia:
                      </label>
                      <input
                        type="text"
                        value={proc.frecuencia}
                        onChange={(e) => actualizarProcedimiento(idx, 'frecuencia', e.target.value)}
                        placeholder="Cada 3 meses"
                        style={{
                          width: '100%',
                          padding: 6,
                          border: '1px solid #ddd',
                          borderRadius: 3,
                          fontSize: 11,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => quitarProcedimiento(idx)}
                        style={{
                          padding: 6,
                          background: '#c62828',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 3,
                          cursor: 'pointer',
                          fontSize: 11,
                          width: '100%'
                        }}
                      >
                        ❌ Quitar
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={agregarProcedimiento}
                  style={{
                    width: '100%',
                    padding: 8,
                    background: '#0066cc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                    marginBottom: 12
                  }}
                >
                  ➕ Agregar procedimiento
                </button>
              </div>

              {/* DURACIÓN */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Duración total:
                </label>
                <input
                  type="text"
                  value={formPersonalizado.duracion_total}
                  onChange={(e) => setFormPersonalizado(prev => ({ ...prev, duracion_total: e.target.value }))}
                  placeholder="Ej: 6 meses"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* COSTO */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Costo estimado:
                </label>
                <input
                  type="text"
                  value={formPersonalizado.costo_estimado}
                  onChange={(e) => setFormPersonalizado(prev => ({ ...prev, costo_estimado: e.target.value }))}
                  placeholder="Ej: $15,000 MXN"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* BOTONES */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => setCreandoPersonalizado(false)}
                  style={{
                    padding: 12,
                    background: '#999',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✕ Cancelar
                </button>

                <button
                  onClick={guardarPlanPersonalizado}
                  disabled={guardando}
                  style={{
                    padding: 12,
                    background: guardando ? '#ccc' : '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {guardando ? '⏳ Guardando...' : '💾 GUARDAR PLAN'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectorPlanes;
