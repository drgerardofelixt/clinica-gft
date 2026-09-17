import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import HistorialProcedimientos from './HistorialProcedimientos';
import FormularioProcedimiento from './componentes/FormularioProcedimiento';
import PlanesTratamiento from './PlanesTratamiento';

const C = {
  azul: '#0066cc',
  verde: '#2e7d32',
  rojo: '#cc0000',
  suave: '#666',
  gris: '#f5f5f5',
};

export const VistaPacienteEstetica = ({ paciente, onUpdate }) => {
  const [tab, setTab] = useState('procedimientos');
  const [procedimientos, setProcedimientos] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [paciente?.id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar procedimientos
      const { data: procs, error: err1 } = await supabase
        .from('procedimientos_esteticos')
        .select('*')
        .eq('paciente_id', paciente.id)
        .order('fecha_procedimiento', { ascending: false });

      if (err1) throw err1;
      setProcedimientos(procs || []);

      // Cargar planes
      const { data: pls, error: err2 } = await supabase
        .from('planes_tratamiento_estetico')
        .select('*')
        .eq('paciente_id', paciente.id)
        .order('created_at', { ascending: false });

      if (err2) throw err2;
      setPlanes(pls || []);
    } catch (e) {
      setError(String(e));
      console.error('Error cargando estética:', e);
    } finally {
      setCargando(false);
    }
  };

  const onProcedimientoAgregado = () => {
    cargarDatos();
  };

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.azul }}>🎨 Medicina Estética</h2>
        <div style={{ fontSize: 12, color: C.suave, marginTop: 4 }}>
          {paciente.nombre}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `2px solid ${C.gris}` }}>
        <button
          onClick={() => setTab('procedimientos')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: tab === 'procedimientos' ? C.azul : 'transparent',
            color: tab === 'procedimientos' ? 'white' : C.suave,
            borderBottom: tab === 'procedimientos' ? `3px solid ${C.azul}` : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 13,
          }}
        >
          📋 Procedimientos ({procedimientos.length})
        </button>
        <button
          onClick={() => setTab('nuevo-procedimiento')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: tab === 'nuevo-procedimiento' ? C.azul : 'transparent',
            color: tab === 'nuevo-procedimiento' ? 'white' : C.suave,
            borderBottom: tab === 'nuevo-procedimiento' ? `3px solid ${C.azul}` : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 13,
          }}
        >
          ➕ Nuevo Procedimiento
        </button>
        <button
          onClick={() => setTab('planes')}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: tab === 'planes' ? C.azul : 'transparent',
            color: tab === 'planes' ? 'white' : C.suave,
            borderBottom: tab === 'planes' ? `3px solid ${C.azul}` : 'none',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 13,
          }}
        >
          🎯 Planes ({planes.length})
        </button>
      </div>

      {/* CONTENIDO */}
      {cargando ? (
        <div style={{ textAlign: 'center', color: C.suave }}>Cargando...</div>
      ) : error ? (
        <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8 }}>
          ❌ {error}
        </div>
      ) : (
        <>
          {tab === 'procedimientos' && (
            <HistorialProcedimientos
              procedimientos={procedimientos}
              onActualizar={cargarDatos}
            />
          )}
          {tab === 'nuevo-procedimiento' && (
            <FormularioProcedimiento
              pacienteId={paciente.id}
              onGuardado={onProcedimientoAgregado}
            />
          )}
          {tab === 'planes' && (
            <PlanesTratamiento
              paciente={paciente}
              planes={planes}
              onActualizar={cargarDatos}
            />
          )}
        </>
      )}
    </div>
  );
};

export default VistaPacienteEstetica;
