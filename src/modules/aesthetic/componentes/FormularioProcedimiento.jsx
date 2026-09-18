import { useState } from 'react';
import { supabase } from '../../../supabase';
import MapaFacialAnatomicoToxina from './MapaFacialAnatomicoToxina';
import SignaturePad from './SignaturePad';
import { construirConsentimiento, plantillaPorTipo, aplicarNombre } from './consentTemplates';

// Gestos principales para valoración de arrugas dinámicas (toxina botulínica).
// Todas las fotos son OPCIONALES: se suben solo las que se necesiten según la
// zona a valorar. Agrupadas por tercio facial.
const GESTOS_TOXINA = [
  { id: 'reposo', nombre: 'Reposo (relajado)', desc: 'Rostro relajado, sin gesticular — línea base', tercio: 'General' },
  { id: 'cejas', nombre: 'Elevar cejas', desc: 'Levantar cejas — líneas frontales (frontalis)', tercio: 'Tercio superior' },
  { id: 'ceno', nombre: 'Fruncir el ceño', desc: 'Gesto de enojo — entrecejo (glabela / corrugador)', tercio: 'Tercio superior' },
  { id: 'ojos', nombre: 'Apretar ojos / sonreír', desc: 'Sonrisa amplia o apretar ojos — patas de gallo', tercio: 'Tercio superior' },
  { id: 'nariz', nombre: 'Arrugar la nariz', desc: 'Bunny lines (nasalis)', tercio: 'Tercio medio' },
  { id: 'menton', nombre: 'Apretar labios / mentón', desc: 'Hoyuelos del mentón (mentalis)', tercio: 'Tercio inferior' },
  { id: 'gingival', nombre: 'Sonrisa gingival', desc: 'Sonreír mostrando encías — elevador del labio', tercio: 'Tercio inferior' },
];

const TERCIOS_ORDEN = ['General', 'Tercio superior', 'Tercio medio', 'Tercio inferior'];

const FormularioProcedimiento = ({ pacienteId, pacienteNombre = '', procedimientoId = null, onGuardado = () => {} }) => {
  const [seccion, setSeccion] = useState('basicos'); // 'basicos' | 'mapa' | 'evaluacion' | 'complicaciones' | 'consentimiento'
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [gestoSubiendo, setGestoSubiendo] = useState(null);

  // Consentimiento informado (se firma con el procedimiento, ligado 1:1)
  const consentInicial = construirConsentimiento('general');
  const [consentTitulo, setConsentTitulo] = useState(consentInicial.titulo);
  const [consentTexto, setConsentTexto] = useState(aplicarNombre(consentInicial.texto, pacienteNombre));
  const [consentNombre, setConsentNombre] = useState(pacienteNombre || '');
  const [consentFirma, setConsentFirma] = useState('');

  const cargarPlantilla = (key) => {
    const p = construirConsentimiento(key);
    setConsentTitulo(p.titulo);
    setConsentTexto(aplicarNombre(p.texto, consentNombre || pacienteNombre));
  };

  const [formData, setFormData] = useState({
    // SECCIÓN 1: Datos básicos
    fecha: new Date().toISOString().split('T')[0],
    tipo_procedimiento: '',
    paciente_id: pacienteId,

    // SECCIÓN 2: Mapa + Dosis
    dosis_por_zona: {},
    productos_utilizados: [{ tipo: '', marca: '', lote: '', cantidad: '' }],

    // SECCIÓN 3: Evaluación antes
    gais_antes: 3,
    foto_pre_url: '',
    notas_pre: '',

    // SECCIÓN 4: Durante procedimiento
    duracion_minutos: 15,
    anestesia: 'Crema tópica',
    tiempo_anestesia: 10,
    tecnicas: [],
    incidencias_durante: '',

    // SECCIÓN 5: Evaluación después
    gais_despues: 4,
    foto_post_url: '',
    eritema: 'ninguno',
    edema: 'ninguno',
    equimosis: 'ninguno',
    dolor: 'ninguno',
    satisfaccion_paciente: 8,
    notas_post: '',

    // SECCIÓN 6: Complicaciones
    tiene_complicaciones: false,
    complicaciones_descripcion: '',

    // PRÓXIMAS CITAS (sugerencias)
    proxima_cita_seguimiento_24h: '',
    proxima_cita_seguimiento_48h: '',
    proxima_cita_siguiente_procedimiento: '',

    // Fotos de gestos (toxina botulínica): { gestoId: url }
    fotos_gestos: {}
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDosisChange = (dosisMap) => {
    setFormData(prev => ({ ...prev, dosis_por_zona: dosisMap }));
  };

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ¿El procedimiento es toxina botulínica? (dispara la sección de gestos)
  const esToxina = /botox|toxina/i.test(formData.tipo_procedimiento || '');

  const subirFotoGesto = async (gestoId, archivo) => {
    if (!archivo) return;
    try {
      setGestoSubiendo(gestoId);
      setError(null);
      const ruta = `gestos-toxina/${pacienteId}/${pacienteId}_${gestoId}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('clinica-gft-storage')
        .upload(ruta, archivo, { cacheControl: '3600', upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('clinica-gft-storage').getPublicUrl(ruta);
      setFormData(prev => ({
        ...prev,
        fotos_gestos: { ...prev.fotos_gestos, [gestoId]: data.publicUrl }
      }));
    } catch (e) {
      console.error('Error subiendo foto de gesto:', e);
      setError(e.message || 'Error al subir foto de gesto');
    } finally {
      setGestoSubiendo(null);
    }
  };

  const guardarProcedimiento = async () => {
    try {
      setError(null);
      setGuardando(true);

      // Validaciones básicas
      if (!formData.tipo_procedimiento.trim()) {
        throw new Error('Tipo de procedimiento es requerido');
      }

      if (Object.keys(formData.dosis_por_zona).length === 0) {
        throw new Error('Debes inyectar al menos una zona');
      }

      const datosGuardar = {
        paciente_id: pacienteId,
        fecha_procedimiento: formData.fecha,
        tipo_procedimiento: formData.tipo_procedimiento,
        dosis_por_zona: formData.dosis_por_zona,
        productos_utilizados: formData.productos_utilizados.filter(p => p.tipo),

        gais_antes: formData.gais_antes,
        gais_despues: formData.gais_despues,
        foto_pre_url: formData.foto_pre_url || null,
        foto_post_url: formData.foto_post_url || null,

        duracion_minutos: formData.duracion_minutos,
        anestesia: formData.anestesia,
        tiempo_anestesia: formData.tiempo_anestesia,
        tecnicas: formData.tecnicas,

        eritema: formData.eritema,
        edema: formData.edema,
        equimosis: formData.equimosis,
        dolor: formData.dolor,
        satisfaccion_paciente: formData.satisfaccion_paciente,

        tiene_complicaciones: formData.tiene_complicaciones,
        complicaciones_descripcion: formData.complicaciones_descripcion || null,

        notas_pre: formData.notas_pre,
        notas_post: formData.notas_post,
        incidencias_durante: formData.incidencias_durante,

        estado: 'completado',
        // Solo se envía si hay fotos de gestos (así no se rompe el guardado
        // si la columna fotos_gestos aún no existe en la BD).
        ...(Object.keys(formData.fotos_gestos || {}).length
          ? { fotos_gestos: formData.fotos_gestos }
          : {})
      };

      // Aviso si el procedimiento no lleva consentimiento firmado
      if (!consentFirma) {
        const cont = window.confirm('Este procedimiento no tiene consentimiento informado firmado. ¿Guardar de todos modos?');
        if (!cont) { setGuardando(false); return; }
      }

      let procId = procedimientoId;
      if (procedimientoId) {
        // ACTUALIZAR
        const { error: err } = await supabase
          .from('procedimientos_esteticos')
          .update(datosGuardar)
          .eq('id', procedimientoId);

        if (err) throw err;
      } else {
        // CREAR (devuelve el id para ligar el consentimiento)
        const { data: ins, error: err } = await supabase
          .from('procedimientos_esteticos')
          .insert(datosGuardar)
          .select('id')
          .single();

        if (err) throw err;
        procId = ins.id;
      }

      // Consentimiento informado ligado al procedimiento (si se firmó)
      if (consentFirma) {
        const { error: cErr } = await supabase
          .from('consentimientos_estetica')
          .insert({
            paciente_id: pacienteId,
            procedimiento_id: procId,
            tipo: 'procedimiento',
            titulo: consentTitulo,
            texto: consentTexto,
            nombre_firmante: consentNombre,
            firma_paciente_b64: consentFirma,
            fecha: formData.fecha,
          });
        if (cErr) throw new Error('Procedimiento guardado, pero el consentimiento falló: ' + cErr.message);
      }

      setExito(true);
      setTimeout(() => setExito(false), 3000);
      onGuardado(formData);
    } catch (err) {
      console.error('Error guardando procedimiento:', err);
      setError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1a1a1a'
    }}>
      <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>
        💉 Formulario de Procedimiento Estético
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
          ✅ Procedimiento guardado correctamente
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

      {/* TABS */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        borderBottom: '2px solid #e0e0e0',
        overflowX: 'auto',
        paddingBottom: 8
      }}>
        {[
          { id: 'basicos', label: '📋 Básicos' },
          { id: 'mapa', label: '🗺️ Mapa Facial' },
          { id: 'evaluacion', label: '🔍 Evaluación' },
          { id: 'complicaciones', label: '⚠️ Complicaciones' },
          { id: 'consentimiento', label: '📄 Consentimiento' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSeccion(tab.id)}
            style={{
              padding: '8px 16px',
              background: seccion === tab.id ? '#0066cc' : 'transparent',
              color: seccion === tab.id ? '#fff' : '#666',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontWeight: seccion === tab.id ? 'bold' : 'normal',
              fontSize: 12,
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECCIÓN 1: BÁSICOS */}
      {seccion === 'basicos' && (
        <div style={{
          background: '#f5f5f5',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Fecha:
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
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
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Tipo de procedimiento:
              </label>
              <input
                type="text"
                value={formData.tipo_procedimiento}
                onChange={(e) => handleInputChange('tipo_procedimiento', e.target.value)}
                placeholder="Ej: Botox, Juvéderm, Radiesse"
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

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
              Productos utilizados:
            </label>
            {formData.productos_utilizados.map((prod, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: 8,
                  marginBottom: 8
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: '#999', marginBottom: 2 }}>
                    Tipo:
                    {prod.tipo && (
                      <span style={{
                        marginLeft: 6,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background:
                          prod.tipo.toLowerCase().includes('botox') ? '#e3f2fd' :
                          prod.tipo.toLowerCase().includes('juvéderm') ? '#fce4ec' :
                          prod.tipo.toLowerCase().includes('radiesse') ? '#fff3e0' :
                          prod.tipo.toLowerCase().includes('profhilo') ? '#f3e5f5' :
                          prod.tipo.toLowerCase().includes('sculptra') ? '#e8f5e9' :
                          '#f5f5f5',
                        color:
                          prod.tipo.toLowerCase().includes('botox') ? '#0066cc' :
                          prod.tipo.toLowerCase().includes('juvéderm') ? '#c2185b' :
                          prod.tipo.toLowerCase().includes('radiesse') ? '#e65100' :
                          prod.tipo.toLowerCase().includes('profhilo') ? '#7b1fa2' :
                          prod.tipo.toLowerCase().includes('sculptra') ? '#2e7d32' :
                          '#666',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}>
                        {prod.tipo}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Tipo (Botox, Juvéderm)"
                    value={prod.tipo}
                    onChange={(e) => {
                      const nuevosProd = [...formData.productos_utilizados];
                      nuevosProd[idx].tipo = e.target.value;
                      setFormData(prev => ({ ...prev, productos_utilizados: nuevosProd }));
                    }}
                    style={{
                      width: '100%',
                      padding: 6,
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 11,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Marca (Allergan, Galderma)"
                  value={prod.marca}
                  onChange={(e) => {
                    const nuevosProd = [...formData.productos_utilizados];
                    nuevosProd[idx].marca = e.target.value;
                    setFormData(prev => ({ ...prev, productos_utilizados: nuevosProd }));
                  }}
                  style={{
                    padding: 6,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 11,
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  placeholder="Lote"
                  value={prod.lote}
                  onChange={(e) => {
                    const nuevosProd = [...formData.productos_utilizados];
                    nuevosProd[idx].lote = e.target.value;
                    setFormData(prev => ({ ...prev, productos_utilizados: nuevosProd }));
                  }}
                  style={{
                    padding: 6,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 11,
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="text"
                  placeholder="Cantidad (100U, 1mL)"
                  value={prod.cantidad}
                  onChange={(e) => {
                    const nuevosProd = [...formData.productos_utilizados];
                    nuevosProd[idx].cantidad = e.target.value;
                    setFormData(prev => ({ ...prev, productos_utilizados: nuevosProd }));
                  }}
                  style={{
                    padding: 6,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    fontSize: 11,
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => {
                    const nuevosProd = formData.productos_utilizados.filter((_, i) => i !== idx);
                    setFormData(prev => ({ ...prev, productos_utilizados: nuevosProd }));
                  }}
                  style={{
                    padding: 6,
                    background: '#c62828',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 3,
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  productos_utilizados: [...prev.productos_utilizados, { tipo: '', marca: '', lote: '', cantidad: '' }]
                }));
              }}
              style={{
                width: '100%',
                padding: 8,
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            >
              ➕ Agregar producto
            </button>
          </div>

          {/* FOTOS DE GESTOS — solo si el tipo es toxina botulínica */}
          {esToxina && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px dashed #0066cc' }}>
              <h3 style={{ margin: '0 0 4px 0', color: '#1a1a1a', fontSize: 15 }}>
                📸 Fotos de gestos para valoración de arrugas
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#666' }}>
                Sube <strong>solo las que necesites</strong> — todas son opcionales. Ej.: si solo valoras el
                tercio superior, toma únicamente esas.
              </p>
              {TERCIOS_ORDEN.filter(t => GESTOS_TOXINA.some(g => g.tercio === t)).map(tercio => (
                <div key={tercio} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0066cc', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {tercio}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {GESTOS_TOXINA.filter(g => g.tercio === tercio).map((g) => (
                      <div key={g.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 12, color: '#1a1a1a' }}>{g.nombre}</div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{g.desc}</div>
                        {formData.fotos_gestos?.[g.id] ? (
                          <img
                            src={formData.fotos_gestos[g.id]}
                            alt={g.nombre}
                            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => window.open(formData.fotos_gestos[g.id], '_blank')}
                          />
                        ) : (
                          <div style={{ width: '100%', height: 120, background: '#e3f2fd', border: '2px dashed #0066cc', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0066cc', fontSize: 11 }}>
                            Sin foto (opcional)
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={gestoSubiendo === g.id}
                          onChange={(e) => { if (e.target.files?.[0]) subirFotoGesto(g.id, e.target.files[0]); }}
                          style={{ width: '100%', marginTop: 8, fontSize: 11 }}
                        />
                        {gestoSubiendo === g.id && (
                          <div style={{ fontSize: 11, color: '#0066cc', marginTop: 4 }}>⏳ Subiendo...</div>
                        )}
                        {formData.fotos_gestos?.[g.id] && gestoSubiendo !== g.id && (
                          <div style={{ fontSize: 11, color: '#2e7d32', marginTop: 4, fontWeight: 'bold' }}>✓ Cargada</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 2: MAPA FACIAL */}
      {seccion === 'mapa' && (
        <div style={{
          background: '#f5f5f5',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <MapaFacialAnatomicoToxina
            onDosisChange={handleDosisChange}
            dosisActual={formData.dosis_por_zona}
          />
        </div>
      )}

      {/* SECCIÓN 3: EVALUACIÓN */}
      {seccion === 'evaluacion' && (
        <div style={{
          background: '#f5f5f5',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* ANTES */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#1a1a1a' }}>
              Antes del procedimiento
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  GAIS (antes):
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={formData.gais_antes}
                  onChange={(e) => handleInputChange('gais_antes', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {formData.gais_antes} / 7
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Foto pre (URL):
                </label>
                <input
                  type="text"
                  value={formData.foto_pre_url}
                  onChange={(e) => handleInputChange('foto_pre_url', e.target.value)}
                  placeholder="URL de foto"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    fontSize: 11
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Notas pre:
              </label>
              <textarea
                value={formData.notas_pre}
                onChange={(e) => handleInputChange('notas_pre', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit',
                  fontSize: 12
                }}
              />
            </div>
          </div>

          {/* DURANTE */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1a1a1a' }}>
              Durante el procedimiento
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Duración (minutos):
                </label>
                <input
                  type="number"
                  value={formData.duracion_minutos}
                  onChange={(e) => handleInputChange('duracion_minutos', parseInt(e.target.value))}
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
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Anestesia:
                </label>
                <input
                  type="text"
                  value={formData.anestesia}
                  onChange={(e) => handleInputChange('anestesia', e.target.value)}
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
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Tiempo anestesia (min):
                </label>
                <input
                  type="number"
                  value={formData.tiempo_anestesia}
                  onChange={(e) => handleInputChange('tiempo_anestesia', parseInt(e.target.value))}
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

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Incidencias durante:
              </label>
              <textarea
                value={formData.incidencias_durante}
                onChange={(e) => handleInputChange('incidencias_durante', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 60,
                  fontFamily: 'inherit',
                  fontSize: 12
                }}
              />
            </div>
          </div>

          {/* DESPUÉS */}
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 16 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#1a1a1a' }}>
              Después del procedimiento
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  GAIS (después):
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={formData.gais_despues}
                  onChange={(e) => handleInputChange('gais_despues', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {formData.gais_despues} / 7
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                  Foto post (URL):
                </label>
                <input
                  type="text"
                  value={formData.foto_post_url}
                  onChange={(e) => handleInputChange('foto_post_url', e.target.value)}
                  placeholder="URL de foto"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #ddd',
                    borderRadius: 4,
                    boxSizing: 'border-box',
                    fontSize: 11
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 12 }}>
              {[
                { field: 'eritema', label: 'Eritema' },
                { field: 'edema', label: 'Edema' },
                { field: 'equimosis', label: 'Equimosis' },
                { field: 'dolor', label: 'Dolor' }
              ].map(item => (
                <div key={item.field}>
                  <label style={{ display: 'block', fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>
                    {item.label}:
                  </label>
                  <select
                    value={formData[item.field]}
                    onChange={(e) => handleInputChange(item.field, e.target.value)}
                    style={{
                      width: '100%',
                      padding: 6,
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      fontSize: 11,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="ninguno">Ninguno</option>
                    <option value="leve">Leve</option>
                    <option value="moderado">Moderado</option>
                    <option value="severo">Severo</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Satisfacción paciente (1-10):
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.satisfaccion_paciente}
                onChange={(e) => handleInputChange('satisfaccion_paciente', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {formData.satisfaccion_paciente} / 10
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Notas post:
              </label>
              <textarea
                value={formData.notas_post}
                onChange={(e) => handleInputChange('notas_post', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 80,
                  fontFamily: 'inherit',
                  fontSize: 12
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: COMPLICACIONES */}
      {seccion === 'complicaciones' && (
        <div style={{
          background: '#f5f5f5',
          padding: 20,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input
              type="checkbox"
              checked={formData.tiene_complicaciones}
              onChange={() => handleCheckboxChange('tiene_complicaciones')}
            />
            <span style={{ fontWeight: 'bold', fontSize: 13 }}>
              ¿Hubo complicaciones?
            </span>
          </label>

          {formData.tiene_complicaciones && (
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 6 }}>
                Descripción de complicaciones:
              </label>
              <textarea
                value={formData.complicaciones_descripcion}
                onChange={(e) => handleInputChange('complicaciones_descripcion', e.target.value)}
                placeholder="Describe qué complicación ocurrió, cómo fue tratada y su resolución"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '2px solid #c62828',
                  borderRadius: 4,
                  boxSizing: 'border-box',
                  minHeight: 120,
                  fontFamily: 'inherit',
                  fontSize: 12
                }}
              />
            </div>
          )}

          {!formData.tiene_complicaciones && (
            <div style={{
              padding: 12,
              background: '#e8f5e9',
              borderRadius: 4,
              border: '1px solid #2e7d32',
              color: '#1b5e20',
              fontSize: 12
            }}>
              ✓ Procedimiento sin complicaciones
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 5: CONSENTIMIENTO INFORMADO */}
      {seccion === 'consentimiento' && (
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ background: consentFirma ? '#dcfce7' : '#fff7ed', border: '1px solid ' + (consentFirma ? '#16a34a' : '#fdba74'), color: consentFirma ? '#166534' : '#9a3412', padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
            {consentFirma
              ? '✅ Consentimiento firmado — se guardará ligado a este procedimiento.'
              : '⚠️ Cada procedimiento debe tener su consentimiento informado firmado por el paciente.'}
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginRight: 8 }}>Plantilla:</span>
            {[{ k: 'toxina', l: 'Toxina' }, { k: 'relleno', l: 'Rellenos' }, { k: 'general', l: 'General' }].map(({ k, l }) => {
              const sugerida = plantillaPorTipo(formData.tipo_procedimiento) === k;
              return (
                <button key={k} type="button" onClick={() => cargarPlantilla(k)}
                  style={{ marginRight: 6, padding: '4px 10px', fontSize: 12, borderRadius: 14, cursor: 'pointer',
                    border: '1px solid ' + (sugerida ? '#0066cc' : '#cbd5e1'),
                    background: sugerida ? '#e6f1fb' : '#fff', color: sugerida ? '#0c447c' : '#334155',
                    fontWeight: sugerida ? 'bold' : 'normal' }}>
                  {l}{sugerida ? ' ·sugerida' : ''}
                </button>
              );
            })}
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
            Texto del consentimiento (editable):
          </label>
          <textarea
            value={consentTexto}
            onChange={(e) => setConsentTexto(e.target.value)}
            style={{ width: '100%', minHeight: 220, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a1a' }}
          />

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
              Nombre de quien firma:
            </label>
            <input
              value={consentNombre}
              onChange={(e) => setConsentNombre(e.target.value)}
              placeholder="Nombre del paciente"
              style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', color: '#1a1a1a' }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>
              Firma del paciente:
            </label>
            <SignaturePad onChange={setConsentFirma} />
          </div>
        </div>
      )}

      {/* BOTÓN GUARDAR */}
      <button
        onClick={guardarProcedimiento}
        disabled={guardando}
        style={{
          width: '100%',
          padding: 14,
          background: guardando ? '#ccc' : '#2e7d32',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'bold',
          cursor: guardando ? 'not-allowed' : 'pointer'
        }}
      >
        {guardando ? '⏳ Guardando...' : '💾 GUARDAR PROCEDIMIENTO'}
      </button>
    </div>
  );
};

export default FormularioProcedimiento;
