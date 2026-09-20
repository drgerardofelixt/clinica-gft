import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const money = (n) => '$' + (Number(n) || 0).toLocaleString('es-MX');
const fmtFecha = (f) => {
  if (!f) return '';
  try { return new Date(f + (f.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }); }
  catch { return f; }
};

// Panel/dashboard de Medicina Estética (usa tokens --gft-* para integrarse al tema oscuro)
export default function PanelEstetica({ onAbrirCatalogo, onVerPacientes, onAgendar }) {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ mes: 0, ingresosMes: 0, total: 0, consent: 0 });
  const [recientes, setRecientes] = useState([]);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
      const { data: procs } = await supabase
        .from('procedimientos_esteticos')
        .select('fecha_procedimiento, tipo_procedimiento, precio_cobrado_mxn, costo_total_mxn, paciente_id, created_at')
        .order('fecha_procedimiento', { ascending: false });
      const list = procs || [];
      const delMes = list.filter((p) => (p.fecha_procedimiento || '') >= inicioMes);
      const ingresosMes = delMes.reduce((a, p) => a + (Number(p.precio_cobrado_mxn) || Number(p.costo_total_mxn) || 0), 0);

      let consent = 0;
      try { const r = await supabase.from('consentimientos_estetica').select('*', { count: 'exact', head: true }); consent = r.count || 0; } catch {}

      const recientes6 = list.slice(0, 6);
      const ids = [...new Set(recientes6.map((p) => p.paciente_id).filter(Boolean))];
      const nombres = {};
      if (ids.length) {
        const { data: pac } = await supabase.from('pacientes').select('id, nombre').in('id', ids);
        (pac || []).forEach((p) => { nombres[p.id] = p.nombre; });
      }
      setRecientes(recientes6.map((p) => ({ ...p, nombre: nombres[p.paciente_id] || 'Paciente' })));
      setKpi({ mes: delMes.length, ingresosMes, total: list.length, consent });
    } catch (e) {
      console.warn('PanelEstetica:', e);
    } finally {
      setLoading(false);
    }
  };

  // Nota: los ingresos NO van aquí (a petición del médico); se ven en Reportes.
  const tarjetas = [
    { l: 'Procedimientos del mes', v: kpi.mes, u: 'este mes', color: 'var(--gft-accent)' },
    { l: 'Procedimientos totales', v: kpi.total, u: 'histórico', color: 'var(--gft-purple)' },
    { l: 'Consentimientos firmados', v: kpi.consent, u: 'en expediente', color: 'var(--gft-warning)' },
  ];

  const accion = (icono, titulo, sub, onClick, color) => (
    <button onClick={onClick} style={{
      flex: '1 1 200px', textAlign: 'left', cursor: 'pointer',
      background: 'var(--gft-surface)', border: '1px solid var(--gft-border)', borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icono}</div>
      <div style={{ fontWeight: 600, color: 'var(--gft-text)', fontSize: 15 }}>{titulo}</div>
      <div style={{ fontSize: 12, color: 'var(--gft-text-muted)', marginTop: 2 }}>{sub}</div>
      <div style={{ marginTop: 8, fontSize: 12, color, fontWeight: 600 }}>Abrir →</div>
    </button>
  );

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {tarjetas.map((t, i) => (
          <div key={i} style={{ background: 'var(--gft-surface)', border: '1px solid var(--gft-border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--gft-text-muted)' }}>{t.l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: t.color, marginTop: 4 }}>{loading ? '…' : t.v}</div>
            <div style={{ fontSize: 11, color: 'var(--gft-text-muted)', marginTop: 2 }}>{t.u}</div>
          </div>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'var(--gft-text-muted)', margin: '4px 0 10px' }}>ACCESOS RÁPIDOS</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        {accion('💊', 'Catálogo de productos', 'Precios, utilidad e inventario', onAbrirCatalogo, 'var(--gft-accent)')}
        {accion('👥', 'Pacientes', 'Abrir expediente → pestaña 💉 Estética', onVerPacientes, 'var(--gft-purple)')}
        {accion('🗓', 'Agendar cita', 'Nueva cita en el calendario', () => onAgendar && onAgendar(), 'var(--gft-success)')}
      </div>

      {/* Procedimientos recientes */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'var(--gft-text-muted)', margin: '4px 0 10px' }}>PROCEDIMIENTOS RECIENTES</div>
      <div style={{ background: 'var(--gft-surface)', border: '1px solid var(--gft-border)', borderRadius: 12, padding: 8 }}>
        {loading ? (
          <div style={{ padding: 16, color: 'var(--gft-text-muted)', fontSize: 13 }}>Cargando…</div>
        ) : recientes.length === 0 ? (
          <div style={{ padding: 16, color: 'var(--gft-text-muted)', fontSize: 13 }}>Aún no hay procedimientos registrados.</div>
        ) : (
          recientes.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: i < recientes.length - 1 ? '1px solid var(--gft-border)' : 'none' }}>
              <div>
                <div style={{ color: 'var(--gft-text)', fontSize: 14 }}>{p.nombre}</div>
                <div style={{ color: 'var(--gft-text-muted)', fontSize: 12 }}>{p.tipo_procedimiento || 'Procedimiento'}</div>
              </div>
              <div style={{ color: 'var(--gft-text-muted)', fontSize: 12 }}>{fmtFecha(p.fecha_procedimiento || p.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
