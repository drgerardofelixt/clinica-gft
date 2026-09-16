const PlanesTratamiento = ({ paciente, planes }) => {
  if (planes.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
        <div style={{ fontSize: 14 }}>📭 Sin planes generados aún</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          Los planes se generan automáticamente después de la consulta inicial con IA Vision (Fase 2)
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {planes.map((plan) => (
        <div
          key={plan.id}
          style={{
            border: `1px solid #ddd`,
            borderRadius: 8,
            padding: 16,
            background: '#fafafa',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 8, color: '#000' }}>
            {plan.nombre_plan || 'Plan'} ({plan.nivel_plan})
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {plan.numero_sesiones} sesión(es) | {plan.duracion_total_meses} meses
          </div>
          <div style={{ fontSize: 12, color: '#2e7d32', fontWeight: 'bold', marginTop: 8 }}>
            ${plan.costo_total_mxn?.toLocaleString('es-MX') || '0'} MXN
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlanesTratamiento;
