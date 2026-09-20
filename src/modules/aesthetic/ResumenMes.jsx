import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const money = (n) => '$' + (Number(n) || 0).toLocaleString('es-MX');
const PRECIO_CONSULTA_OBESIDAD = 1000; // MXN por consulta de obesidad

// Resumen del mes para la vista de Reportes: actividad de citas + ingresos
// (obesidad = consultas atendidas × $1,000; estética = procedimientos cobrados).
export default function ResumenMes({ atendidasMes = 0, canceladasMes = 0, nuevasMes = 0 }) {
  const [ingEstetica, setIngEstetica] = useState(null); // null = cargando
  const [procMes, setProcMes] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const ahora = new Date();
        const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString().split('T')[0];
        const { data } = await supabase
          .from('procedimientos_esteticos')
          .select('fecha_procedimiento, precio_cobrado_mxn, costo_total_mxn')
          .gte('fecha_procedimiento', inicioMes);
        const list = data || [];
        setProcMes(list.length);
        setIngEstetica(list.reduce((a, p) => a + (Number(p.precio_cobrado_mxn) || Number(p.costo_total_mxn) || 0), 0));
      } catch {
        setIngEstetica(0);
      }
    })();
  }, []);

  const ingObesidad = atendidasMes * PRECIO_CONSULTA_OBESIDAD;
  const total = ingObesidad + (ingEstetica || 0);

  const cardCita = (label, valor, color) => (
    <div className="gft-card" style={{ textAlign: 'center', padding: '14px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gft-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, fontFamily: 'var(--gft-font-data)', lineHeight: 1.1, marginTop: 4 }}>{valor}</div>
    </div>
  );
  const cardIng = (label, valor, sub, color) => (
    <div className="gft-card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gft-text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--gft-font-data)', marginTop: 4 }}>{valor}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--gft-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--gft-text)', marginBottom: 10 }}>📅 Citas del mes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
        {cardCita('Nuevas agendadas', nuevasMes, 'var(--gft-accent)')}
        {cardCita('Atendidas', atendidasMes, 'var(--gft-success)')}
        {cardCita('Canceladas', canceladasMes, 'var(--gft-danger)')}
      </div>

      <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--gft-text)', marginBottom: 10 }}>💰 Ingresos del mes</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12 }}>
        {cardIng('Obesidad', money(ingObesidad), `${atendidasMes} consultas × $1,000`, 'var(--gft-accent)')}
        {cardIng('Medicina estética', ingEstetica == null ? '…' : money(ingEstetica), `${procMes} procedimiento(s) cobrados`, 'var(--gft-purple)')}
        {cardIng('Total del mes', ingEstetica == null ? '…' : money(total), 'obesidad + estética', 'var(--gft-success)')}
      </div>
    </div>
  );
}
