import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

// Las 5 fotos iniciales viven en columnas separadas (no un JSON array)
const FOTOS_INICIALES = [
  { col: 'foto_frontal_url', label: 'Frontal' },
  { col: 'foto_perfil_d_url', label: 'Perfil Der.' },
  { col: 'foto_perfil_i_url', label: 'Perfil Izq.' },
  { col: 'foto_3cuartos_d_url', label: '3/4 Der.' },
  { col: 'foto_3cuartos_i_url', label: '3/4 Izq.' },
];

const GaleriaAntesDesp = ({ pacienteId }) => {
  const [consultas, setConsultas] = useState([]);
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pacienteId) cargar();
  }, [pacienteId]);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);

      // Consultas (fotos iniciales) — sin join, por paciente_id
      const { data: cons, error: e1 } = await supabase
        .from('consultas_iniciales_estetica')
        .select('id, created_at, foto_frontal_url, foto_perfil_d_url, foto_perfil_i_url, foto_3cuartos_d_url, foto_3cuartos_i_url')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });
      if (e1) throw e1;

      // Procedimientos (antes/después) — query separado, no hay FK a consultas
      const { data: procs, error: e2 } = await supabase
        .from('procedimientos_esteticos')
        .select('id, tipo_procedimiento, fecha_procedimiento, created_at, foto_pre_url, foto_post_url')
        .eq('paciente_id', pacienteId)
        .order('fecha_procedimiento', { ascending: false });
      if (e2) throw e2;

      setConsultas(cons || []);
      setProcedimientos(procs || []);
    } catch (err) {
      console.error('Error cargando galería:', err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const fmtFecha = (f) => {
    if (!f) return '';
    try { return new Date(f).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return f; }
  };

  const Foto = ({ url, alt }) => (
    <img
      src={url}
      alt={alt}
      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer' }}
      onClick={() => window.open(url, '_blank')}
    />
  );

  const consultasConFotos = consultas.filter(c => FOTOS_INICIALES.some(f => c[f.col]));
  const procsConFotos = procedimientos.filter(p => p.foto_pre_url || p.foto_post_url);

  if (loading) return <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Cargando galería...</div>;
  if (error) return <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>❌ {error}</div>;

  return (
    <div style={{ padding: 20, color: '#1a1a1a' }}>
      <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>📸 Evolución Fotográfica</h2>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
        Comparación visual de consultas y procedimientos realizados
      </p>

      {consultasConFotos.length === 0 && procsConFotos.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', background: '#f9f9f9', borderRadius: 6, color: '#999' }}>
          Sin fotos registradas aún
        </div>
      ) : (
        <>
          {/* FOTOS INICIALES POR CONSULTA */}
          {consultasConFotos.map((c) => (
            <div key={c.id} style={{ marginBottom: 28, borderBottom: '1px solid #eee', paddingBottom: 20 }}>
              <h4 style={{ marginTop: 0, marginBottom: 12, color: '#1a1a1a' }}>
                📅 {fmtFecha(c.created_at)} — Fotos Iniciales
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {FOTOS_INICIALES.filter(f => c[f.col]).map(f => (
                  <div key={f.col}>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{f.label}</div>
                    <Foto url={c[f.col]} alt={f.label} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ANTES / DESPUÉS POR PROCEDIMIENTO */}
          {procsConFotos.length > 0 && (
            <div>
              <h3 style={{ marginBottom: 12, color: '#1a1a1a' }}>✅ Antes / Después por Procedimiento</h3>
              {procsConFotos.map((proc) => (
                <div key={proc.id} style={{ marginBottom: 16, padding: 12, background: '#f9f9f9', borderRadius: 6 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 13, color: '#1a1a1a' }}>
                    {proc.tipo_procedimiento || 'Procedimiento'} — {fmtFecha(proc.fecha_procedimiento || proc.created_at)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                    {proc.foto_pre_url && (
                      <div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Antes</div>
                        <Foto url={proc.foto_pre_url} alt="Antes" />
                      </div>
                    )}
                    {proc.foto_post_url && (
                      <div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Después</div>
                        <Foto url={proc.foto_post_url} alt="Después" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GaleriaAntesDesp;
