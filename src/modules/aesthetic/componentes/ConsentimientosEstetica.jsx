import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import SignaturePad from './SignaturePad';
import { MEDICO, PLANTILLAS, aplicarNombre } from './consentTemplates';

const ConsentimientosEstetica = ({ paciente }) => {
  const [tipo, setTipo] = useState(null); // 'procedimiento' | 'fotografia'
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [nombre, setNombre] = useState(paciente?.nombre || '');
  const [firma, setFirma] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => { if (paciente?.id) cargar(); }, [paciente?.id]);

  const cargar = async () => {
    try {
      setCargando(true);
      const { data, error: err } = await supabase
        .from('consentimientos_estetica')
        .select('*')
        .eq('paciente_id', paciente.id)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setLista(data || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setCargando(false);
    }
  };

  const elegir = (t) => {
    setTipo(t);
    setTitulo(PLANTILLAS[t].titulo);
    setTexto(aplicarNombre(PLANTILLAS[t].texto, paciente?.nombre));
    setNombre(paciente?.nombre || '');
    setFirma('');
    setError(null);
  };

  const guardar = async () => {
    try {
      setError(null);
      if (!nombre.trim()) throw new Error('Escribe el nombre de quien firma');
      if (!firma) throw new Error('Falta la firma del paciente');
      setGuardando(true);
      const { error: err } = await supabase.from('consentimientos_estetica').insert({
        paciente_id: paciente.id,
        tipo, titulo, texto,
        nombre_firmante: nombre,
        firma_paciente_b64: firma,
        fecha: new Date().toISOString().split('T')[0],
      });
      if (err) throw err;
      setExito(true);
      setTimeout(() => setExito(false), 3000);
      setTipo(null);
      cargar();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setGuardando(false);
    }
  };

  const imprimir = (c) => {
    const fecha = new Date(c.fecha || c.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const w = window.open('', '_blank');
    if (!w) { setError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${c.titulo || 'Consentimiento'}</title>
      <style>body{font-family:-apple-system,system-ui,Arial,sans-serif;color:#0f172a;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.6}
      h1{font-size:18px;text-align:center;margin-bottom:24px}p{white-space:pre-wrap;font-size:13px}
      .firma{margin-top:40px;display:flex;justify-content:space-between;gap:40px}
      .box{flex:1;text-align:center}.box img{max-height:90px;display:block;margin:0 auto 6px}
      .line{border-top:1px solid #0f172a;padding-top:6px;font-size:12px}</style></head>
      <body><h1>${c.titulo || ''}</h1><p>${(c.texto || '').replace(/</g, '&lt;')}</p>
      <div class="firma">
        <div class="box">${c.firma_paciente_b64 ? `<img src="${c.firma_paciente_b64}"/>` : '<div style="height:90px"></div>'}<div class="line">${c.nombre_firmante || ''}<br/>Paciente</div></div>
        <div class="box"><div style="height:90px"></div><div class="line">${MEDICO}<br/>Médico tratante</div></div>
      </div>
      <p style="text-align:right;font-size:12px;margin-top:24px">Fecha: ${fecha}</p>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  const btnCard = (t, icono, label, desc) => (
    <button onClick={() => elegir(t)} style={{ flex: '1 1 240px', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, cursor: 'pointer' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icono}</div>
      <div style={{ fontWeight: 'bold', fontSize: 14, color: '#0f172a' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{desc}</div>
    </button>
  );

  return (
    <div style={{ color: '#1a1a1a' }}>
      <h2 style={{ marginTop: 0, color: '#0f172a' }}>📄 Consentimientos informados</h2>

      {exito && <div style={{ background: '#dcfce7', border: '1px solid #16a34a', color: '#166534', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>✅ Consentimiento firmado y guardado</div>}
      {error && <div style={{ background: '#fee2e2', border: '1px solid #dc2626', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>❌ {error}</div>}

      {!tipo ? (
        <>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 0 }}>Elige el documento a firmar con el paciente:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            {btnCard('procedimiento', '💉', 'Consentimiento de procedimiento', 'Riesgos, alcances y aceptación del tratamiento estético.')}
            {btnCard('fotografia', '📸', 'Consentimiento de fotografías', 'Autorización para toma y uso clínico de fotografías.')}
          </div>

          <h3 style={{ fontSize: 15, color: '#0f172a' }}>Firmados ({lista.length})</h3>
          {cargando ? (
            <div style={{ color: '#64748b', fontSize: 13 }}>Cargando...</div>
          ) : lista.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px dashed #e2e8f0' }}>Sin consentimientos firmados aún.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lista.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>
                      {c.tipo === 'fotografia' ? '📸' : '💉'} {c.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {c.nombre_firmante} · {new Date(c.fecha || c.created_at).toLocaleDateString('es-MX')}
                    </div>
                  </div>
                  <button onClick={() => imprimir(c)} style={{ fontSize: 12, padding: '6px 12px', border: 'none', background: '#0066cc', color: '#fff', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    🖨️ Imprimir / PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, color: '#0f172a' }}>{titulo}</h3>
            <button onClick={() => setTipo(null)} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #cbd5e1', background: '#f8fafc', borderRadius: 6, cursor: 'pointer', color: '#334155' }}>← Volver</button>
          </div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Texto del documento (editable):</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
            style={{ width: '100%', minHeight: 260, padding: 12, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5, fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1a1a' }} />

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Nombre de quien firma:</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              style={{ width: '100%', padding: 9, border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', color: '#1a1a1a' }} />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Firma del paciente:</label>
            <SignaturePad onChange={setFirma} />
          </div>

          <button onClick={guardar} disabled={guardando}
            style={{ width: '100%', marginTop: 16, padding: 13, background: guardando ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}>
            {guardando ? '⏳ Guardando...' : '💾 Guardar y firmar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConsentimientosEstetica;
