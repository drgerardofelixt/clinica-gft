import { useState } from 'react';
import { supabase } from '../../supabase';

const C = {
  azul: '#0066cc',
  verde: '#2e7d32',
  rojo: '#cc0000',
  suave: '#666',
};

const FormularioProcedimiento = ({ paciente, onGuardado }) => {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fecha_procedimiento: new Date().toISOString().split('T')[0],
    procedimiento_tipo: '',
    zonas_tratadas: [],
    productos_usados: JSON.stringify([]),
    costo_total_mxn: 0,
    precio_cobrado_mxn: 0,
    gais_score_antes: 2,
    gais_score_despues: 2,
    notas_clinicas: '',
    proxima_cita: '',
  });

  const guardarProcedimiento = async () => {
    try {
      setGuardando(true);
      setError(null);

      const { error: err } = await supabase
        .from('procedimientos_esteticos')
        .insert([
          {
            paciente_id: paciente.id,
            ...form,
          },
        ]);

      if (err) throw err;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({
          fecha_procedimiento: new Date().toISOString().split('T')[0],
          procedimiento_tipo: '',
          zonas_tratadas: [],
          productos_usados: JSON.stringify([]),
          costo_total_mxn: 0,
          precio_cobrado_mxn: 0,
          gais_score_antes: 2,
          gais_score_despues: 2,
          notas_clinicas: '',
          proxima_cita: '',
        });
        onGuardado();
      }, 1500);
    } catch (e) {
      setError(String(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {error && (
        <div style={{ padding: 12, background: '#fee', color: '#c00', borderRadius: 8, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ padding: 12, background: '#efe', color: '#060', borderRadius: 8, marginBottom: 16 }}>
          ✅ Procedimiento guardado
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
          Fecha del procedimiento *
        </label>
        <input
          type="date"
          value={form.fecha_procedimiento}
          onChange={(e) => setForm({ ...form, fecha_procedimiento: e.target.value })}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
          Tipo de procedimiento *
        </label>
        <input
          type="text"
          placeholder="Ej: Botox + Juvéderm"
          value={form.procedimiento_tipo}
          onChange={(e) => setForm({ ...form, procedimiento_tipo: e.target.value })}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
          Zonas tratadas
        </label>
        <input
          type="text"
          placeholder="Ej: Entrecejo, frente, patas de gallo"
          value={form.zonas_tratadas.join(', ')}
          onChange={(e) => setForm({ ...form, zonas_tratadas: e.target.value.split(',').map(z => z.trim()) })}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
            Costo MXN
          </label>
          <input
            type="number"
            value={form.costo_total_mxn}
            onChange={(e) => setForm({ ...form, costo_total_mxn: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
            Cobrado MXN
          </label>
          <input
            type="number"
            value={form.precio_cobrado_mxn}
            onChange={(e) => setForm({ ...form, precio_cobrado_mxn: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
            GAIS Antes (0-4)
          </label>
          <input
            type="number"
            min="0"
            max="4"
            value={form.gais_score_antes}
            onChange={(e) => setForm({ ...form, gais_score_antes: parseInt(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
            GAIS Después (0-4)
          </label>
          <input
            type="number"
            min="0"
            max="4"
            value={form.gais_score_despues}
            onChange={(e) => setForm({ ...form, gais_score_despues: parseInt(e.target.value) || 0 })}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
          Notas clínicas
        </label>
        <textarea
          value={form.notas_clinicas}
          onChange={(e) => setForm({ ...form, notas_clinicas: e.target.value })}
          placeholder="Ej: Excelente respuesta. Paciente muy satisfecho."
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            boxSizing: 'border-box',
            minHeight: 80,
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontWeight: 'bold', fontSize: 12, marginBottom: 4, color: '#000' }}>
          Próxima cita
        </label>
        <input
          type="date"
          value={form.proxima_cita}
          onChange={(e) => setForm({ ...form, proxima_cita: e.target.value })}
          style={{
            width: '100%',
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        onClick={guardarProcedimiento}
        disabled={guardando || !form.procedimiento_tipo}
        style={{
          width: '100%',
          padding: 12,
          background: guardando ? '#ccc' : C.verde,
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: guardando ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: 13,
        }}
      >
        {guardando ? '⏳ Guardando...' : '💾 Guardar Procedimiento'}
      </button>
    </div>
  );
};

export default FormularioProcedimiento;
