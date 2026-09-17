import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

const HistoriaClinicaForm = ({ pacienteId, paciente = null, historiaExistente = null, onGuardado = () => {} }) => {
  const [seccionEditando, setSeccionEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const [formData, setFormData] = useState(historiaExistente || {
    // SECCIÓN 1: Datos personales
    nombre: '',
    edad: '',
    telefono: '',
    email: '',
    ocupacion: '',

    // SECCIÓN 2: Antecedentes médicos
    alergias: '',
    medicamentos_actuales: '',
    cirugias_previas_cara_cuello: '',
    procedimientos_esteticos_previos: '',
    enfermedades_autoinmunes: false,
    trastornos_hemorralgicos: false,
    anticoagulantes_aine: false,
    isotretinoin_ultimos_6_meses: false,

    // SECCIÓN 3: Historial estético
    reacciones_adversas_previas: false,
    reacciones_adversas_descripcion: '',
    satisfaccion_procedimientos_previos: '',
    expectativas_actuales: '',

    // SECCIÓN 4: Exploración física
    fitzpatrick: '',
    glogau: '',
    medidas_faciales: '',
    hallazgos_clinicos: '',

    // SECCIÓN 6: Consentimiento
    paciente_entiende_procedimiento: false,
    paciente_entiende_riesgos: false,
    fecha_firma: new Date().toISOString().split('T')[0],

    // Banderas rojas
    banderas_rojas: []
  });

  // Pre-llenar desde el expediente del paciente — SOLO campos que existen en
  // la tabla historias_clinicas_estetica y que estén vacíos (no pisa lo escrito
  // ni una historia ya cargada).
  useEffect(() => {
    if (!paciente || historiaExistente) return;
    const overlay = {};
    for (const campo of ['nombre', 'edad', 'telefono', 'email', 'ocupacion', 'alergias', 'medicamentos_actuales']) {
      if (paciente[campo] != null && paciente[campo] !== '') overlay[campo] = paciente[campo];
    }
    if (Object.keys(overlay).length) {
      setFormData(prev => {
        const merged = { ...prev };
        for (const [k, v] of Object.entries(overlay)) {
          if (prev[k] === '' || prev[k] == null) merged[k] = v;
        }
        return merged;
      });
    }
  }, [paciente, historiaExistente]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const guardarHistoria = async () => {
    try {
      setGuardando(true);
      setError(null);
      setExito(false);

      if (historiaExistente?.id) {
        // ACTUALIZAR
        const { error: err } = await supabase
          .from('historias_clinicas_estetica')
          .update(formData)
          .eq('id', historiaExistente.id);

        if (err) throw err;
      } else {
        // CREAR
        const { error: err } = await supabase
          .from('historias_clinicas_estetica')
          .insert({
            paciente_id: pacienteId,
            ...formData
          });

        if (err) throw err;
      }

      setExito(true);
      setSeccionEditando(null);
      setTimeout(() => setExito(false), 3000);
      onGuardado();
    } catch (err) {
      console.error('Error guardando historia:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const BanderaRoja = ({ paciente, condicion, descripcion }) => {
    if (condicion) {
      return (
        <div style={{
          background: '#ffebee',
          border: '2px solid #c62828',
          color: '#c62828',
          padding: 10,
          borderRadius: 6,
          marginTop: 8,
          fontSize: 12,
          fontWeight: 'bold'
        }}>
          🚩 {descripcion}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1a1a1a'
    }}>
      <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>
        📋 Historia Clínica Estética (NOM-004)
      </h2>

      {exito && (
        <div style={{
          background: '#c8e6c9',
          border: '1px solid #2e7d32',
          color: '#1b5e20',
          padding: 12,
          borderRadius: 6,
          marginBottom: 16
        }}>
          ✅ Historia clínica guardada correctamente
        </div>
      )}

      {error && (
        <div style={{
          background: '#ffcdd2',
          border: '1px solid #c62828',
          color: '#b71c1c',
          padding: 12,
          borderRadius: 6,
          marginBottom: 16
        }}>
          ❌ Error: {error}
        </div>
      )}

      {/* SECCIÓN 1: DATOS PERSONALES */}
      <div style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 16 }}>
            👤 SECCIÓN 1: Datos Personales
          </h3>
          <button
            onClick={() => setSeccionEditando(seccionEditando === 1 ? null : 1)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✏️ {seccionEditando === 1 ? 'CERRAR' : 'EDITAR'}
          </button>
        </div>

        {seccionEditando === 1 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Nombre:
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Edad:
              </label>
              <input
                type="number"
                value={formData.edad}
                onChange={(e) => handleInputChange('edad', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Teléfono:
              </label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Email:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Ocupación:
              </label>
              <input
                type="text"
                value={formData.ocupacion}
                onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#333' }}>
            <div><strong>Nombre:</strong> {formData.nombre || '—'}</div>
            <div><strong>Edad:</strong> {formData.edad || '—'}</div>
            <div><strong>Teléfono:</strong> {formData.telefono || '—'}</div>
            <div><strong>Email:</strong> {formData.email || '—'}</div>
            <div><strong>Ocupación:</strong> {formData.ocupacion || '—'}</div>
          </div>
        )}
      </div>

      {/* SECCIÓN 2: ANTECEDENTES MÉDICOS */}
      <div style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 16 }}>
            🏥 SECCIÓN 2: Antecedentes Médicos
          </h3>
          <button
            onClick={() => setSeccionEditando(seccionEditando === 2 ? null : 2)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✏️ {seccionEditando === 2 ? 'CERRAR' : 'EDITAR'}
          </button>
        </div>

        {seccionEditando === 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Alergias:
              </label>
              <textarea
                value={formData.alergias}
                onChange={(e) => handleInputChange('alergias', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Medicamentos actuales:
              </label>
              <textarea
                value={formData.medicamentos_actuales}
                onChange={(e) => handleInputChange('medicamentos_actuales', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Cirugías previas (cara/cuello):
              </label>
              <textarea
                value={formData.cirugias_previas_cara_cuello}
                onChange={(e) => handleInputChange('cirugias_previas_cara_cuello', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Procedimientos estéticos previos:
              </label>
              <textarea
                value={formData.procedimientos_esteticos_previos}
                onChange={(e) => handleInputChange('procedimientos_esteticos_previos', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.enfermedades_autoinmunes}
                  onChange={() => handleCheckboxChange('enfermedades_autoinmunes')}
                />
                <span style={{ fontSize: 12 }}>¿Enfermedades autoinmunes?</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.trastornos_hemorralgicos}
                  onChange={() => handleCheckboxChange('trastornos_hemorralgicos')}
                />
                <span style={{ fontSize: 12 }}>¿Trastornos hemorrágicos?</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.anticoagulantes_aine}
                  onChange={() => handleCheckboxChange('anticoagulantes_aine')}
                />
                <span style={{ fontSize: 12 }}>¿Anticoagulantes/AINE?</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isotretinoin_ultimos_6_meses}
                  onChange={() => handleCheckboxChange('isotretinoin_ultimos_6_meses')}
                />
                <span style={{ fontSize: 12 }}>¿Isotretinoína (últimos 6 meses)?</span>
              </label>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#333' }}>
            <div><strong>Alergias:</strong> {formData.alergias || '—'}</div>
            <div><strong>Medicamentos:</strong> {formData.medicamentos_actuales || '—'}</div>
            <div><strong>Cirugías previas:</strong> {formData.cirugias_previas_cara_cuello || '—'}</div>
            <div><strong>Procedimientos previos:</strong> {formData.procedimientos_esteticos_previos || '—'}</div>
            <div style={{ marginTop: 8 }}>
              {formData.enfermedades_autoinmunes && <div>✓ Enfermedades autoinmunes</div>}
              {formData.trastornos_hemorralgicos && <div>✓ Trastornos hemorrágicos</div>}
              {formData.anticoagulantes_aine && <div>✓ Anticoagulantes/AINE</div>}
              {formData.isotretinoin_ultimos_6_meses && <div>✓ Isotretinoína últimos 6 meses</div>}
            </div>
          </div>
        )}

        {/* BANDERAS ROJAS SECCIÓN 2 */}
        <BanderaRoja
          paciente={formData}
          condicion={formData.trastornos_hemorralgicos}
          descripcion="Trastorno hemorrágico detectado — Evaluar riesgo de hematomas"
        />
        <BanderaRoja
          paciente={formData}
          condicion={formData.anticoagulantes_aine}
          descripcion="Paciente en anticoagulantes/AINE — Suspender 3-5 días pre"
        />
        <BanderaRoja
          paciente={formData}
          condicion={formData.enfermedades_autoinmunes}
          descripcion="Enfermedad autoinmune — Evaluar compatibilidad"
        />
      </div>

      {/* SECCIÓN 3: HISTORIAL ESTÉTICO */}
      <div style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 16 }}>
            💄 SECCIÓN 3: Historial Estético
          </h3>
          <button
            onClick={() => setSeccionEditando(seccionEditando === 3 ? null : 3)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✏️ {seccionEditando === 3 ? 'CERRAR' : 'EDITAR'}
          </button>
        </div>

        {seccionEditando === 3 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Satisfacción con procedimientos previos:
              </label>
              <textarea
                value={formData.satisfaccion_procedimientos_previos}
                onChange={(e) => handleInputChange('satisfaccion_procedimientos_previos', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Expectativas actuales:
              </label>
              <textarea
                value={formData.expectativas_actuales}
                onChange={(e) => handleInputChange('expectativas_actuales', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.reacciones_adversas_previas}
                onChange={() => handleCheckboxChange('reacciones_adversas_previas')}
              />
              <span style={{ fontSize: 12 }}>¿Reacciones adversas previas?</span>
            </label>

            {formData.reacciones_adversas_previas && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                  Describir reacciones adversas:
                </label>
                <textarea
                  value={formData.reacciones_adversas_descripcion}
                  onChange={(e) => handleInputChange('reacciones_adversas_descripcion', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    minHeight: 80,
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#333' }}>
            <div><strong>Satisfacción procedimientos previos:</strong> {formData.satisfaccion_procedimientos_previos || '—'}</div>
            <div><strong>Expectativas actuales:</strong> {formData.expectativas_actuales || '—'}</div>
            <div><strong>Reacciones adversas previas:</strong> {formData.reacciones_adversas_previas ? 'SÍ' : 'NO'}</div>
            {formData.reacciones_adversas_previas && (
              <div><strong>Descripción:</strong> {formData.reacciones_adversas_descripcion || '—'}</div>
            )}
          </div>
        )}

        <BanderaRoja
          paciente={formData}
          condicion={formData.reacciones_adversas_previas}
          descripcion="Historial de reacciones adversas — Aumentar vigilancia post-procedimiento"
        />
      </div>

      {/* SECCIÓN 4: EXPLORACIÓN FÍSICA */}
      <div style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 16 }}>
            🔍 SECCIÓN 4: Exploración Física
          </h3>
          <button
            onClick={() => setSeccionEditando(seccionEditando === 4 ? null : 4)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✏️ {seccionEditando === 4 ? 'CERRAR' : 'EDITAR'}
          </button>
        </div>

        {seccionEditando === 4 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Fitzpatrick (I-VI):
              </label>
              <select
                value={formData.fitzpatrick}
                onChange={(e) => handleInputChange('fitzpatrick', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecciona...</option>
                <option value="I">I - Blanca (sin pigmento)</option>
                <option value="II">II - Blanca (poco pigmento)</option>
                <option value="III">III - Morena clara</option>
                <option value="IV">IV - Morena oscura</option>
                <option value="V">V - Muy oscura</option>
                <option value="VI">VI - Negra</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Glogau (0-4):
              </label>
              <select
                value={formData.glogau}
                onChange={(e) => handleInputChange('glogau', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecciona...</option>
                <option value="0">0 - Sin fotoenvejecimiento</option>
                <option value="1">1 - Sin cambios clínicos</option>
                <option value="2">2 - Cambios leves</option>
                <option value="3">3 - Cambios moderados</option>
                <option value="4">4 - Cambios severos</option>
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Medidas faciales (si aplica):
              </label>
              <textarea
                value={formData.medidas_faciales}
                onChange={(e) => handleInputChange('medidas_faciales', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
                placeholder="Ej: Distancia intercantal, proporción facial, etc."
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Hallazgos clínicos:
              </label>
              <textarea
                value={formData.hallazgos_clinicos}
                onChange={(e) => handleInputChange('hallazgos_clinicos', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit'
                }}
                placeholder="Ej: Arrugas glabelares profundas, asimetría facial, etc."
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#333' }}>
            <div><strong>Fitzpatrick:</strong> {formData.fitzpatrick || '—'}</div>
            <div><strong>Glogau:</strong> {formData.glogau || '—'}</div>
            <div><strong>Medidas faciales:</strong> {formData.medidas_faciales || '—'}</div>
            <div><strong>Hallazgos clínicos:</strong> {formData.hallazgos_clinicos || '—'}</div>
          </div>
        )}
      </div>

      {/* SECCIÓN 6: CONSENTIMIENTO */}
      <div style={{
        background: '#f5f5f5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: 16 }}>
            ✍️ SECCIÓN 6: Consentimiento & Firma
          </h3>
          <button
            onClick={() => setSeccionEditando(seccionEditando === 6 ? null : 6)}
            style={{
              padding: '6px 12px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✏️ {seccionEditando === 6 ? 'CERRAR' : 'EDITAR'}
          </button>
        </div>

        {seccionEditando === 6 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.paciente_entiende_procedimiento}
                onChange={() => handleCheckboxChange('paciente_entiende_procedimiento')}
              />
              <span style={{ fontSize: 12 }}>¿Paciente entiende el procedimiento?</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.paciente_entiende_riesgos}
                onChange={() => handleCheckboxChange('paciente_entiende_riesgos')}
              />
              <span style={{ fontSize: 12 }}>¿Paciente entiende los riesgos?</span>
            </label>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                Fecha firma:
              </label>
              <input
                type="date"
                value={formData.fecha_firma}
                onChange={(e) => handleInputChange('fecha_firma', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: '#333' }}>
            <div>¿Entiende procedimiento?: {formData.paciente_entiende_procedimiento ? '✓ SÍ' : '✗ NO'}</div>
            <div>¿Entiende riesgos?: {formData.paciente_entiende_riesgos ? '✓ SÍ' : '✗ NO'}</div>
            <div><strong>Fecha firma:</strong> {formData.fecha_firma || '—'}</div>
          </div>
        )}

        <BanderaRoja
          paciente={formData}
          condicion={!formData.paciente_entiende_procedimiento || !formData.paciente_entiende_riesgos}
          descripcion="Consentimiento incompleto — Paciente no entiende procedimiento o riesgos"
        />
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        onClick={guardarHistoria}
        disabled={guardando}
        style={{
          width: '100%',
          padding: 12,
          background: guardando ? '#ccc' : '#2e7d32',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'bold',
          cursor: guardando ? 'not-allowed' : 'pointer'
        }}
      >
        {guardando ? '⏳ Guardando...' : '💾 GUARDAR HISTORIA CLÍNICA'}
      </button>
    </div>
  );
};

export default HistoriaClinicaForm;
