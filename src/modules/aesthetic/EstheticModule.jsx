import { useState } from 'react';
import NuevaConsultaEstetica from './vistas/NuevaConsultaEstetica';
import VistaPacienteEstetica from './VistaPacienteEstetica';
import GaleriaAntesDesp from './vistas/GaleriaAntesDesp';

const EstheticModule = ({ paciente }) => {
  const [subpestana, setSubpestana] = useState('expediente');

  if (!paciente || !paciente.id) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: '#666',
        fontSize: 14
      }}>
        ⚠️ No hay paciente seleccionado
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1a1a1a',
      background: '#fff',
      borderRadius: 12,
      padding: 20
    }}>
      {/* SUB-PESTAÑAS */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: 12
      }}>
        <button
          onClick={() => setSubpestana('expediente')}
          style={{
            padding: '8px 16px',
            background: subpestana === 'expediente' ? '#0066cc' : 'transparent',
            color: subpestana === 'expediente' ? '#fff' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: subpestana === 'expediente' ? 'bold' : 'normal',
            fontSize: 13
          }}
        >
          📋 Expediente Estético
        </button>

        <button
          onClick={() => setSubpestana('nueva-consulta')}
          style={{
            padding: '8px 16px',
            background: subpestana === 'nueva-consulta' ? '#0066cc' : 'transparent',
            color: subpestana === 'nueva-consulta' ? '#fff' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: subpestana === 'nueva-consulta' ? 'bold' : 'normal',
            fontSize: 13
          }}
        >
          ➕ Nueva Consulta
        </button>

        <button
          onClick={() => setSubpestana('galeria')}
          style={{
            padding: '8px 16px',
            background: subpestana === 'galeria' ? '#0066cc' : 'transparent',
            color: subpestana === 'galeria' ? '#fff' : '#666',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: subpestana === 'galeria' ? 'bold' : 'normal',
            fontSize: 13
          }}
        >
          📸 Evolución Fotográfica
        </button>
      </div>

      {/* CONTENIDO */}
      {subpestana === 'expediente' && (
        <VistaPacienteEstetica paciente={paciente} />
      )}

      {subpestana === 'nueva-consulta' && (
        <NuevaConsultaEstetica
          pacienteId={paciente.id}
          pacienteNombre={paciente.nombre || 'Paciente'}
          paciente={paciente}
        />
      )}

      {subpestana === 'galeria' && (
        <GaleriaAntesDesp pacienteId={paciente.id} />
      )}
    </div>
  );
};

export default EstheticModule;
