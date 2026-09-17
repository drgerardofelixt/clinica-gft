import { useState } from 'react';
import { supabase } from '../../../supabase';

const AnalizadorIAVision = ({ pacienteId, fotosUrls = {}, onAnalisisGuardado = () => {} }) => {
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [expandido, setExpandido] = useState(null);

  const descargaryConvertirABase64 = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Error descargando foto:', err);
      return null;
    }
  };

  const analizarConIA = async () => {
    try {
      setError(null);
      setAnalizando(true);
      setResultado(null);

      // Validar que haya al menos 1 foto
      const fotosParaAnalizar = Object.entries(fotosUrls)
        .filter(([_, url]) => url)
        .map(([tipo, url]) => ({ tipo, url }));

      if (fotosParaAnalizar.length === 0) {
        throw new Error('Necesitas cargar al menos 1 foto para analizar');
      }

      // Convertir fotos a base64
      console.log('Descargando fotos para análisis...');
      const fotosBase64 = await Promise.all(
        fotosParaAnalizar.map(async (foto) => ({
          tipo: foto.tipo,
          base64: await descargaryConvertirABase64(foto.url)
        }))
      );

      // Construir mensaje para Claude
      const prompt = `Eres un dermatólogo especialista en medicina estética con experiencia en análisis facial para procedimientos cosméticos.

Analiza estas ${fotosParaAnalizar.length} foto(s) del rostro del paciente y proporciona un análisis detallado en JSON estructurado.

INSTRUCCIONES CRÍTICAS:
- Responde SOLO con JSON válido, sin preámbulos ni explicaciones
- No incluyas markdown, comillas triples, ni texto fuera del JSON
- El JSON debe ser parseable directamente con JSON.parse()

Estructura esperada del análisis JSON:
{
  "biometria": {
    "fitzpatrick": "III",
    "fitzpatrick_descripcion": "Morena clara",
    "glogau": 2,
    "glogau_descripcion": "Cambios leves de fotoenvejecimiento",
    "edad_aparente": 32
  },
  "zonas_faciales": [
    {
      "zona": "Entrecejo",
      "estado": "🔴",
      "descripcion": "Arrugas glabelares profundas",
      "profundidad": "moderada"
    },
    {
      "zona": "Frente",
      "estado": "🟡",
      "descripcion": "Líneas dinámicas leves",
      "profundidad": "leve"
    },
    {
      "zona": "Patas de gallo derecha",
      "estado": "🟡",
      "descripcion": "Líneas moderadas",
      "profundidad": "leve-moderada"
    }
  ],
  "asimetrias": [
    {
      "zona": "Cejas",
      "lado": "izquierdo",
      "descripcion": "Más elevada 2-3mm",
      "severidad": "leve"
    }
  ],
  "hallazgos_clinicos": {
    "pigmentacion": "Uniforme, sin discromías evidentes",
    "textura": "Piel con textura normal, poros finos",
    "elasticidad": "Buena elasticidad en 70% de la cara",
    "volumen": "Volumen óseo conservado, leve pérdida malar",
    "mandibula": "Ángulo mandibular bien definido"
  },
  "planes_sugeridos": [
    {
      "nombre": "CONSERVADOR 🟢",
      "objetivo": "Mantenimiento preventivo",
      "procedimientos": [
        {
          "tipo": "Botox",
          "zonas": ["Entrecejo", "Frente"],
          "dosis_total": "40-50U",
          "frecuencia": "Cada 4 meses"
        }
      ],
      "duracion_total": "3 meses",
      "costo_estimado": "$3500-4000 MXN"
    },
    {
      "nombre": "ESTÁNDAR 🟡",
      "objetivo": "Resultados balanceados con mejora significativa",
      "procedimientos": [
        {
          "tipo": "Botox",
          "zonas": ["Entrecejo", "Frente", "Patas de gallo"],
          "dosis_total": "60-80U",
          "frecuencia": "Cada 3-4 meses"
        },
        {
          "tipo": "Juvéderm",
          "zonas": ["Pómulos"],
          "volumen": "1-1.5mL",
          "frecuencia": "Anual"
        }
      ],
      "duracion_total": "4 meses",
      "costo_estimado": "$6500-7500 MXN"
    },
    {
      "nombre": "INTENSIVO 🔴",
      "objetivo": "Rejuvenecimiento facial global completo",
      "procedimientos": [
        {
          "tipo": "Botox",
          "zonas": ["Entrecejo", "Frente", "Patas de gallo", "Bunny lines"],
          "dosis_total": "90-120U",
          "frecuencia": "Cada 3-4 meses"
        },
        {
          "tipo": "Juvéderm",
          "zonas": ["Pómulos", "Labios"],
          "volumen": "2.5-3mL total",
          "frecuencia": "Anual"
        },
        {
          "tipo": "Radiesse",
          "zonas": ["Mandíbula"],
          "volumen": "1mL",
          "frecuencia": "Cada 12-18 meses"
        }
      ],
      "duracion_total": "6 meses",
      "costo_estimado": "$12000-14000 MXN"
    }
  ],
  "recomendaciones_clinicas": [
    "Protección solar diaria (SPF 50+) es crítica",
    "Considerar retinoides nocturnos para mantener elasticidad",
    "Seguimiento cada 3 meses para ajustar protocolo"
  ],
  "contraindicaciones_detectadas": [],
  "confiabilidad_analisis": "Alto — Múltiples ángulos analizados, buena iluminación"
}

Analiza TODAS las fotos proporcionadas y devuelve SOLO el JSON completo, válido, sin comentarios adicionales.`;

      // Construir bloques de contenido para Claude API
      const imageBlocks = fotosBase64.map((foto) => ({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: foto.base64
        }
      }));

      const messageBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: [
              ...imageBlocks,
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      };

      // Llamar Claude vía endpoint serverless (api/claude.js) — la API key
      // se agrega del lado del servidor, nunca se expone en el navegador.
      console.log('Enviando fotos a Claude API para análisis...');
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${errorData.error?.message || 'Error desconocido'}`);
      }

      const data = await response.json();
      const textContent = data.content.find((c) => c.type === 'text');

      if (!textContent) {
        throw new Error('No hay respuesta de texto de Claude');
      }

      // Parsear JSON de respuesta
      let analisisJSON;
      try {
        // Limpiar respuesta si tiene markdown
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        analisisJSON = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error('Respuesta de Claude:', textContent.text);
        throw new Error(`Error parseando JSON de Claude: ${parseErr.message}`);
      }

      setResultado(analisisJSON);
      console.log('Análisis completado:', analisisJSON);
    } catch (err) {
      console.error('Error analizando fotos:', err);
      setError(err.message || 'Error al analizar fotos');
    } finally {
      setAnalizando(false);
    }
  };

  const guardarAnalisis = async () => {
    try {
      setError(null);

      if (!resultado) {
        throw new Error('No hay análisis para guardar');
      }

      // Actualizar o crear en consultas_iniciales_estetica
      const { data: consultaExistente } = await supabase
        .from('consultas_iniciales_estetica')
        .select('id')
        .eq('paciente_id', pacienteId)
        .single();

      if (consultaExistente?.id) {
        // ACTUALIZAR
        const { error: err } = await supabase
          .from('consultas_iniciales_estetica')
          .update({
            fitzpatrick: resultado.biometria.fitzpatrick,
            glogau: resultado.biometria.glogau,
            analisis_ia: resultado,
            updated_at: new Date()
          })
          .eq('paciente_id', pacienteId);

        if (err) throw err;
      } else {
        // CREAR
        const { error: err } = await supabase
          .from('consultas_iniciales_estetica')
          .insert({
            paciente_id: pacienteId,
            fitzpatrick: resultado.biometria.fitzpatrick,
            glogau: resultado.biometria.glogau,
            analisis_ia: resultado
          });

        if (err) throw err;
      }

      setExito(true);
      setTimeout(() => setExito(false), 3000);
      onAnalisisGuardado(resultado);
    } catch (err) {
      console.error('Error guardando análisis:', err);
      setError(err.message || 'Error al guardar análisis');
    }
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 16,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>
        🤖 Analizador IA Vision (Claude API)
      </h2>

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
          ✅ Análisis guardado correctamente en BD
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

      {/* BOTÓN ANALIZAR */}
      {!resultado && (
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={analizarConIA}
            disabled={analizando}
            style={{
              width: '100%',
              padding: 16,
              background: analizando ? '#ccc' : '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 'bold',
              cursor: analizando ? 'not-allowed' : 'pointer'
            }}
          >
            {analizando ? '⏳ Analizando fotos con IA (esto puede tardar 30-60s)...' : '🚀 ANALIZAR CON IA VISION'}
          </button>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#e3f2fd',
              borderRadius: 6,
              fontSize: 12,
              color: '#1565c0'
            }}
          >
            <strong>ℹ️ Qué hace:</strong> Envía las fotos cargadas a Claude Sonnet (multimodal) para análisis dermatológico completo:
            Fitzpatrick, Glogau, 30 zonas faciales, asimetrías, hallazgos clínicos y 3 planes sugeridos (Conservador, Estándar, Intensivo).
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      {resultado && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* BIOMETRÍA */}
          <div
            style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}
          >
            <button
              onClick={() => setExpandido(expandido === 'biometria' ? null : 'biometria')}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}
            >
              <span>📊 Biometría</span>
              <span>{expandido === 'biometria' ? '▼' : '▶'}</span>
            </button>

            {expandido === 'biometria' && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                  <div>
                    <strong>Fitzpatrick:</strong> {resultado.biometria.fitzpatrick} ({resultado.biometria.fitzpatrick_descripcion})
                  </div>
                  <div>
                    <strong>Glogau:</strong> {resultado.biometria.glogau} ({resultado.biometria.glogau_descripcion})
                  </div>
                  <div>
                    <strong>Edad aparente:</strong> {resultado.biometria.edad_aparente} años
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ZONAS FACIALES */}
          <div
            style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}
          >
            <button
              onClick={() => setExpandido(expandido === 'zonas' ? null : 'zonas')}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}
            >
              <span>🗺️ Zonas Faciales ({resultado.zonas_faciales?.length || 0})</span>
              <span>{expandido === 'zonas' ? '▼' : '▶'}</span>
            </button>

            {expandido === 'zonas' && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resultado.zonas_faciales?.map((zona, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      background: '#fff',
                      borderLeft: '4px solid',
                      borderColor:
                        zona.estado === '🔴'
                          ? '#c62828'
                          : zona.estado === '🟡'
                            ? '#f57f17'
                            : '#2e7d32',
                      borderRadius: 4
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>
                        {zona.estado} {zona.zona}
                      </strong>
                      <span style={{ fontSize: 11, color: '#666' }}>Profundidad: {zona.profundidad}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#333' }}>{zona.descripcion}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ASIMETRÍAS */}
          {resultado.asimetrias && resultado.asimetrias.length > 0 && (
            <div
              style={{
                background: '#fff3e0',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #ff9800'
              }}
            >
              <button
                onClick={() => setExpandido(expandido === 'asimetrias' ? null : 'asimetrias')}
                style={{
                  width: '100%',
                  padding: 12,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#1a1a1a'
                }}
              >
                <span>⚖️ Asimetrías ({resultado.asimetrias.length})</span>
                <span>{expandido === 'asimetrias' ? '▼' : '▶'}</span>
              </button>

              {expandido === 'asimetrias' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resultado.asimetrias.map((asimetria, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        background: '#fff',
                        borderRadius: 4,
                        borderLeft: '4px solid #ff9800'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                        {asimetria.zona} ({asimetria.lado})
                      </div>
                      <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>
                        {asimetria.descripcion}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>Severidad: {asimetria.severidad}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HALLAZGOS CLÍNICOS */}
          <div
            style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}
          >
            <button
              onClick={() => setExpandido(expandido === 'hallazgos' ? null : 'hallazgos')}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}
            >
              <span>🔬 Hallazgos Clínicos</span>
              <span>{expandido === 'hallazgos' ? '▼' : '▶'}</span>
            </button>

            {expandido === 'hallazgos' && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(resultado.hallazgos_clinicos || {}).map(([key, value]) => (
                  <div key={key} style={{ fontSize: 13 }}>
                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong> {value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PLANES SUGERIDOS */}
          <div
            style={{
              background: '#f5f5f5',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e0e0e0'
            }}
          >
            <button
              onClick={() => setExpandido(expandido === 'planes' ? null : 'planes')}
              style={{
                width: '100%',
                padding: 12,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 14,
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}
            >
              <span>📋 3 Planes Sugeridos</span>
              <span>{expandido === 'planes' ? '▼' : '▶'}</span>
            </button>

            {expandido === 'planes' && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                {resultado.planes_sugeridos?.map((plan, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      background: '#fff',
                      border: '2px solid',
                      borderColor:
                        plan.nombre.includes('CONSERVADOR')
                          ? '#4CAF50'
                          : plan.nombre.includes('ESTÁNDAR')
                            ? '#ff9800'
                            : '#c62828',
                      borderRadius: 6
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 'bold' }}>
                      {plan.nombre}
                    </h4>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      <strong>Objetivo:</strong> {plan.objetivo}
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 8 }}>
                      <strong>Procedimientos:</strong>
                      <ul style={{ margin: '4px 0 0 0', paddingLeft: 16 }}>
                        {plan.procedimientos?.map((proc, pidx) => (
                          <li key={pidx} style={{ fontSize: 11, marginBottom: 2 }}>
                            {proc.tipo}: {proc.zonas.join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ fontSize: 12, paddingTop: 8, borderTop: '1px solid #eee' }}>
                      <div><strong>Duración:</strong> {plan.duracion_total}</div>
                      <div><strong>Costo:</strong> {plan.costo_estimado}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RECOMENDACIONES */}
          {resultado.recomendaciones_clinicas && resultado.recomendaciones_clinicas.length > 0 && (
            <div
              style={{
                background: '#e8f5e9',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #2e7d32'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1b5e20' }}>
                ✅ Recomendaciones Clínicas
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                {resultado.recomendaciones_clinicas.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BOTÓN GUARDAR */}
          <button
            onClick={guardarAnalisis}
            style={{
              width: '100%',
              padding: 14,
              background: '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            💾 GUARDAR ANÁLISIS A BD
          </button>

          {/* BOTÓN NUEVO ANÁLISIS */}
          <button
            onClick={() => setResultado(null)}
            style={{
              width: '100%',
              padding: 14,
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 NUEVO ANÁLISIS
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalizadorIAVision;
