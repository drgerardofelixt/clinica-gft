import { useState } from 'react';
import { supabase } from '../../../supabase';

const CargadorFotos = ({ pacienteId, fotosExistentes = {}, onFotosGuardadas = () => {} }) => {
  const [fotos, setFotos] = useState(fotosExistentes);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  const TIPOS_FOTOS = {
    frontal: {
      nombre: 'Frontal (De frente)',
      descripcion: 'Rostro de frente, ojos abiertos, expresión neutral, sin maquillaje',
      icono: '📸'
    },
    perfil_d: {
      nombre: 'Perfil Derecho',
      descripcion: 'Lado derecho del rostro, orejas visibles, postura recta',
      icono: '👤'
    },
    perfil_i: {
      nombre: 'Perfil Izquierdo',
      descripcion: 'Lado izquierdo del rostro, orejas visibles, postura recta',
      icono: '👤'
    },
    tres_cuartos_d: {
      nombre: '3/4 Derecho',
      descripcion: 'Vista oblicua lado derecho, captar ángulo y volumen facial',
      icono: '📷'
    },
    tres_cuartos_i: {
      nombre: '3/4 Izquierdo',
      descripcion: 'Vista oblicua lado izquierdo, captar ángulo y volumen facial',
      icono: '📷'
    }
  };

  const subirFoto = async (tipoFoto, archivo) => {
    try {
      setError(null);

      if (!archivo) return;

      setCargando(true);

      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const nombreArchivo = `${pacienteId}_${tipoFoto}_${timestamp}.jpg`;
      const ruta = `fotos-estetica/${pacienteId}/${nombreArchivo}`;

      // Subir a Supabase Storage
      const { data, error: errorSubida } = await supabase.storage
        .from('clinica-gft-storage') // Bucket debe existir
        .upload(ruta, archivo, {
          cacheControl: '3600',
          upsert: true
        });

      if (errorSubida) throw errorSubida;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('clinica-gft-storage')
        .getPublicUrl(ruta);

      const urlPublica = urlData.publicUrl;

      // Actualizar estado
      setFotos(prev => ({
        ...prev,
        [tipoFoto]: urlPublica
      }));

      setExito(true);
      setTimeout(() => setExito(false), 2000);
    } catch (err) {
      console.error('Error subiendo foto:', err);
      setError(err.message || 'Error al subir foto');
    } finally {
      setCargando(false);
    }
  };

  const guardarTodasLasFotos = async () => {
    try {
      setError(null);
      setCargando(true);

      // Actualizar o crear registro en consultas_iniciales_estetica
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
            foto_frontal_url: fotos.frontal || null,
            foto_perfil_d_url: fotos.perfil_d || null,
            foto_perfil_i_url: fotos.perfil_i || null,
            foto_3cuartos_d_url: fotos.tres_cuartos_d || null,
            foto_3cuartos_i_url: fotos.tres_cuartos_i || null,
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
            foto_frontal_url: fotos.frontal || null,
            foto_perfil_d_url: fotos.perfil_d || null,
            foto_perfil_i_url: fotos.perfil_i || null,
            foto_3cuartos_d_url: fotos.tres_cuartos_d || null,
            foto_3cuartos_i_url: fotos.tres_cuartos_i || null
          });

        if (err) throw err;
      }

      setExito(true);
      setTimeout(() => setExito(false), 3000);
      onFotosGuardadas(fotos);
    } catch (err) {
      console.error('Error guardando fotos:', err);
      setError(err.message || 'Error al guardar fotos');
    } finally {
      setCargando(false);
    }
  };

  // Refetch de la consulta del paciente (útil para flujo multiplataforma:
  // subes fotos desde el celular y las traes aquí sin recargar la página).
  const recargarFotos = async () => {
    try {
      setError(null);
      setCargando(true);
      const { data, error: err } = await supabase
        .from('consultas_iniciales_estetica')
        .select('foto_frontal_url, foto_perfil_d_url, foto_perfil_i_url, foto_3cuartos_d_url, foto_3cuartos_i_url')
        .eq('paciente_id', pacienteId)
        .maybeSingle();
      if (err) throw err;
      if (data) {
        setFotos({
          frontal: data.foto_frontal_url || '',
          perfil_d: data.foto_perfil_d_url || '',
          perfil_i: data.foto_perfil_i_url || '',
          tres_cuartos_d: data.foto_3cuartos_d_url || '',
          tres_cuartos_i: data.foto_3cuartos_i_url || '',
        });
      }
    } catch (err) {
      console.error('Error recargando fotos:', err);
      setError(err.message || 'Error al recargar fotos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      maxWidth: 1000,
      margin: '0 auto',
      padding: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ marginBottom: 16, color: '#1a1a1a' }}>
        📸 Cargador de Fotos (5 ángulos)
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
          ✅ Fotos guardadas correctamente
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

      {/* RECARGAR (flujo multiplataforma: subir en celular, ver en compu) */}
      <button
        onClick={recargarFotos}
        disabled={cargando}
        style={{
          padding: '8px 16px',
          background: cargando ? '#ccc' : '#0066cc',
          color: '#fff',
          borderRadius: 6,
          border: 'none',
          cursor: cargando ? 'not-allowed' : 'pointer',
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 'bold'
        }}
      >
        {cargando ? '⏳ Cargando...' : '🔄 Recargar fotos'}
      </button>

      {/* GRID DE FOTOS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {Object.entries(TIPOS_FOTOS).map(([tipoKey, tipoData]) => (
          <div
            key={tipoKey}
            style={{
              background: '#f5f5f5',
              border: '2px solid #e0e0e0',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {/* ENCABEZADO */}
            <div>
              <div style={{
                fontSize: 24,
                marginBottom: 6
              }}>
                {tipoData.icono}
              </div>
              <h3 style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'bold',
                color: '#1a1a1a'
              }}>
                {tipoData.nombre}
              </h3>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: 12,
                color: '#666'
              }}>
                {tipoData.descripcion}
              </p>
            </div>

            {/* PREVIEW DE FOTO CARGADA */}
            {fotos[tipoKey] ? (
              <div style={{
                width: '100%',
                height: 160,
                background: '#fff',
                border: '1px solid #ddd',
                borderRadius: 6,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src={fotos[tipoKey]}
                  alt={tipoData.nombre}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: 160,
                background: '#e3f2fd',
                border: '2px dashed #0066cc',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0066cc',
                fontSize: 12
              }}>
                Sin foto
              </div>
            )}

            {/* INPUT ARCHIVO */}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  subirFoto(tipoKey, e.target.files[0]);
                }
              }}
              disabled={cargando}
              style={{
                display: 'block',
                width: '100%',
                padding: 8,
                fontSize: 12,
                cursor: cargando ? 'not-allowed' : 'pointer',
                opacity: cargando ? 0.5 : 1
              }}
            />

            {/* ESTADO */}
            {fotos[tipoKey] && (
              <div style={{
                fontSize: 11,
                color: '#2e7d32',
                fontWeight: 'bold'
              }}>
                ✓ Foto cargada
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RESUMEN */}
      <div style={{
        background: '#fafafa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: 14,
          color: '#1a1a1a'
        }}>
          📊 Resumen de carga
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 12
        }}>
          {Object.entries(TIPOS_FOTOS).map(([tipoKey, tipoData]) => (
            <div
              key={tipoKey}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 8,
                background: fotos[tipoKey] ? '#e8f5e9' : '#fff3e0',
                borderRadius: 4
              }}
            >
              <span style={{
                fontSize: 16
              }}>
                {fotos[tipoKey] ? '✓' : '○'}
              </span>
              <span style={{
                color: fotos[tipoKey] ? '#2e7d32' : '#e65100'
              }}>
                {tipoData.nombre}
              </span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #e0e0e0',
          fontSize: 12,
          color: '#666'
        }}>
          Cargadas: {Object.values(fotos).filter(f => f).length} / 5
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        onClick={guardarTodasLasFotos}
        disabled={cargando || Object.values(fotos).filter(f => f).length === 0}
        style={{
          width: '100%',
          padding: 14,
          background: cargando || Object.values(fotos).filter(f => f).length === 0 ? '#ccc' : '#2e7d32',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'bold',
          cursor: cargando || Object.values(fotos).filter(f => f).length === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {cargando ? '⏳ Guardando...' : '💾 GUARDAR TODAS LAS FOTOS'}
      </button>

      <div style={{
        marginTop: 12,
        padding: 12,
        background: '#e3f2fd',
        borderRadius: 6,
        fontSize: 12,
        color: '#1565c0',
        lineHeight: 1.6
      }}>
        <strong>📝 Instrucciones para mejores resultados:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
          <li>Luz natural o bien iluminado</li>
          <li>Sin maquillaje (o maquillaje ligero)</li>
          <li>Expresión facial neutra/relajada</li>
          <li>Fondo liso (blanco o neutro)</li>
          <li>Formato JPG o PNG</li>
        </ul>
      </div>
    </div>
  );
};

export default CargadorFotos;
