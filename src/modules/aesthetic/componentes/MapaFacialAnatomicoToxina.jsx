import { useState, useEffect } from 'react';

const ZONAS_TOXINA = {
  entrecejo: {
    nombre: 'Entrecejo',
    musculo: 'Procerus + Corrugador',
    profundidad: '4mm',
    rango_min: 15,
    rango_max: 30,
    historial_ejemplo: [
      { fecha: '2026-09-16', dosis: 30, marca: 'Botox', lote: 'BOT-089456' },
      { fecha: '2026-06-15', dosis: 25, marca: 'Dysport', lote: 'DYS-065123' }
    ]
  },
  frente: {
    nombre: 'Frente',
    musculo: 'Frontalis',
    profundidad: '3-4mm',
    rango_min: 20,
    rango_max: 60,
    historial_ejemplo: [
      { fecha: '2026-09-16', dosis: 50, marca: 'Botox', lote: 'BOT-089456' }
    ]
  },
  pata_gallo_d: {
    nombre: 'Patas de Gallo Derecha',
    musculo: 'Orbicularis oculi',
    profundidad: '2-3mm',
    rango_min: 8,
    rango_max: 15,
    historial_ejemplo: []
  },
  pata_gallo_i: {
    nombre: 'Patas de Gallo Izquierda',
    musculo: 'Orbicularis oculi',
    profundidad: '2-3mm',
    rango_min: 8,
    rango_max: 15,
    historial_ejemplo: []
  },
  bunny: {
    nombre: 'Bunny Lines (Nasales)',
    musculo: 'Nasalis',
    profundidad: '3mm',
    rango_min: 4,
    rango_max: 8,
    historial_ejemplo: []
  },
  elevacion_cejas: {
    nombre: 'Elevación Cejas (Tail Lift)',
    musculo: 'Orbicularis oculi (lateral superior)',
    profundidad: '2-3mm',
    rango_min: 5,
    rango_max: 10,
    historial_ejemplo: []
  },
  sonrisa_gingival: {
    nombre: 'Sonrisa Gingival',
    musculo: 'Levator labii superioris',
    profundidad: '3-4mm',
    rango_min: 2,
    rango_max: 6,
    historial_ejemplo: []
  },
  comisura_labial: {
    nombre: 'Comisura Labial (Marionette)',
    musculo: 'Depressor anguli oris',
    profundidad: '4mm',
    rango_min: 5,
    rango_max: 10,
    historial_ejemplo: []
  },
  menton: {
    nombre: 'Mentón (Dimpling)',
    musculo: 'Mentalis',
    profundidad: '3-4mm',
    rango_min: 4,
    rango_max: 8,
    historial_ejemplo: []
  },
  masetero: {
    nombre: 'Masetero (Bruxismo)',
    musculo: 'Masseter',
    profundidad: '5-6mm',
    rango_min: 15,
    rango_max: 30,
    historial_ejemplo: []
  },
  bandas_platismales: {
    nombre: 'Bandas Platismales',
    musculo: 'Platysma',
    profundidad: '4-5mm',
    rango_min: 20,
    rango_max: 40,
    historial_ejemplo: []
  },
  lineas_transversales_cuello: {
    nombre: 'Líneas Transversales Cuello',
    musculo: 'Surcos transversos',
    profundidad: '3-4mm',
    rango_min: 10,
    rango_max: 20,
    historial_ejemplo: []
  },
  escote: {
    nombre: 'Escote (Décolletage)',
    musculo: 'Sternocleidomastoideo',
    profundidad: '2-3mm',
    rango_min: 15,
    rango_max: 30,
    historial_ejemplo: []
  },
  axilas: {
    nombre: 'Axilas (Hiperhidrosis)',
    musculo: 'Glándulas sudoríparas ecrinas',
    profundidad: '2-3mm',
    rango_min: 50,
    rango_max: 100,
    historial_ejemplo: []
  },
  manos: {
    nombre: 'Manos (Hiperhidrosis)',
    musculo: 'Glándulas sudoríparas palmas',
    profundidad: '2-3mm',
    rango_min: 25,
    rango_max: 50,
    historial_ejemplo: []
  }
};

const MapaFacialAnatomicoToxina = ({ onDosisChange, dosisActual = {} }) => {
  const [zonaSeleccionada, setZonaSeleccionada] = useState('entrecejo');
  const [dosis, setDosis] = useState(dosisActual);
  const [alerta, setAlerta] = useState(null);

  const zona = ZONAS_TOXINA[zonaSeleccionada];

  const handleDosisChange = (e) => {
    const valor = parseInt(e.target.value) || 0;

    setDosis({ ...dosis, [zonaSeleccionada]: valor });
    onDosisChange({ ...dosis, [zonaSeleccionada]: valor });

    // Validación informativa (no bloquea)
    if (valor < zona.rango_min || valor > zona.rango_max) {
      setAlerta(`⚠️ Rango sugerido: ${zona.rango_min}-${zona.rango_max}U. Ingresaste: ${valor}U`);
    } else {
      setAlerta(null);
    }
  };

  const zonaIds = Object.keys(ZONAS_TOXINA);

  return (
    <div style={{
      display: 'flex',
      gap: 20,
      padding: 16,
      background: '#fafafa',
      borderRadius: 8
    }}>
      {/* LADO IZQUIERDO: MAPA SVG */}
      <div style={{
        flex: 1,
        minWidth: 300
      }}>
        <svg
          viewBox="0 0 200 400"
          style={{
            width: '100%',
            height: 'auto',
            border: '1px solid #ddd',
            borderRadius: 8,
            background: '#fff'
          }}
        >
          {/* ROSTRO ESQUEMÁTICO */}
          {/* Cara */}
          <ellipse cx="100" cy="100" rx="60" ry="80" fill="none" stroke="#ccc" strokeWidth="1" />

          {/* Frente */}
          <line x1="50" y1="30" x2="150" y2="30" stroke="#ccc" strokeWidth="1" />

          {/* Ojos */}
          <circle cx="75" cy="80" r="8" fill="none" stroke="#ccc" strokeWidth="1" />
          <circle cx="125" cy="80" r="8" fill="none" stroke="#ccc" strokeWidth="1" />

          {/* Nariz */}
          <line x1="100" y1="90" x2="100" y2="130" stroke="#ccc" strokeWidth="1" />

          {/* Boca */}
          <path d="M 80 160 Q 100 170 120 160" fill="none" stroke="#ccc" strokeWidth="1" />

          {/* PUNTOS INTERACTIVOS (15 zonas) */}

          {/* 1. Entrecejo */}
          <circle
            cx="100"
            cy="65"
            r="8"
            fill={zonaSeleccionada === 'entrecejo' ? '#0066cc' : dosis['entrecejo'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('entrecejo')}
            style={{ cursor: 'pointer' }}
          />

          {/* 2. Frente (3 puntos) */}
          <circle
            cx="70"
            cy="40"
            r="8"
            fill={zonaSeleccionada === 'frente' ? '#0066cc' : dosis['frente'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('frente')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="100"
            cy="35"
            r="8"
            fill={zonaSeleccionada === 'frente' ? '#0066cc' : dosis['frente'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('frente')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="130"
            cy="40"
            r="8"
            fill={zonaSeleccionada === 'frente' ? '#0066cc' : dosis['frente'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('frente')}
            style={{ cursor: 'pointer' }}
          />

          {/* 3. Patas de gallo derecha */}
          <circle
            cx="135"
            cy="85"
            r="8"
            fill={zonaSeleccionada === 'pata_gallo_d' ? '#0066cc' : dosis['pata_gallo_d'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('pata_gallo_d')}
            style={{ cursor: 'pointer' }}
          />

          {/* 4. Patas de gallo izquierda */}
          <circle
            cx="65"
            cy="85"
            r="8"
            fill={zonaSeleccionada === 'pata_gallo_i' ? '#0066cc' : dosis['pata_gallo_i'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('pata_gallo_i')}
            style={{ cursor: 'pointer' }}
          />

          {/* 5. Bunny lines */}
          <circle
            cx="90"
            cy="100"
            r="6"
            fill={zonaSeleccionada === 'bunny' ? '#0066cc' : dosis['bunny'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('bunny')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="110"
            cy="100"
            r="6"
            fill={zonaSeleccionada === 'bunny' ? '#0066cc' : dosis['bunny'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('bunny')}
            style={{ cursor: 'pointer' }}
          />

          {/* 6. Elevación cejas */}
          <circle
            cx="50"
            cy="75"
            r="6"
            fill={zonaSeleccionada === 'elevacion_cejas' ? '#0066cc' : dosis['elevacion_cejas'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('elevacion_cejas')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="150"
            cy="75"
            r="6"
            fill={zonaSeleccionada === 'elevacion_cejas' ? '#0066cc' : dosis['elevacion_cejas'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('elevacion_cejas')}
            style={{ cursor: 'pointer' }}
          />

          {/* 7. Sonrisa gingival */}
          <circle
            cx="100"
            cy="145"
            r="6"
            fill={zonaSeleccionada === 'sonrisa_gingival' ? '#0066cc' : dosis['sonrisa_gingival'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('sonrisa_gingival')}
            style={{ cursor: 'pointer' }}
          />

          {/* 8. Comisura labial */}
          <circle
            cx="80"
            cy="165"
            r="6"
            fill={zonaSeleccionada === 'comisura_labial' ? '#0066cc' : dosis['comisura_labial'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('comisura_labial')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="120"
            cy="165"
            r="6"
            fill={zonaSeleccionada === 'comisura_labial' ? '#0066cc' : dosis['comisura_labial'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('comisura_labial')}
            style={{ cursor: 'pointer' }}
          />

          {/* 9. Mentón */}
          <circle
            cx="100"
            cy="185"
            r="7"
            fill={zonaSeleccionada === 'menton' ? '#0066cc' : dosis['menton'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('menton')}
            style={{ cursor: 'pointer' }}
          />

          {/* 10. Masetero */}
          <circle
            cx="65"
            cy="130"
            r="8"
            fill={zonaSeleccionada === 'masetero' ? '#0066cc' : dosis['masetero'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('masetero')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="135"
            cy="130"
            r="8"
            fill={zonaSeleccionada === 'masetero' ? '#0066cc' : dosis['masetero'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('masetero')}
            style={{ cursor: 'pointer' }}
          />

          {/* 11. Bandas platismales (cuello) */}
          <circle
            cx="80"
            cy="220"
            r="7"
            fill={zonaSeleccionada === 'bandas_platismales' ? '#0066cc' : dosis['bandas_platismales'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('bandas_platismales')}
            style={{ cursor: 'pointer' }}
          />
          <circle
            cx="120"
            cy="220"
            r="7"
            fill={zonaSeleccionada === 'bandas_platismales' ? '#0066cc' : dosis['bandas_platismales'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('bandas_platismales')}
            style={{ cursor: 'pointer' }}
          />

          {/* 12. Líneas transversales cuello */}
          <circle
            cx="100"
            cy="250"
            r="7"
            fill={zonaSeleccionada === 'lineas_transversales_cuello' ? '#0066cc' : dosis['lineas_transversales_cuello'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('lineas_transversales_cuello')}
            style={{ cursor: 'pointer' }}
          />

          {/* 13. Escote */}
          <circle
            cx="100"
            cy="310"
            r="7"
            fill={zonaSeleccionada === 'escote' ? '#0066cc' : dosis['escote'] ? '#4CAF50' : '#ddd'}
            onClick={() => setZonaSeleccionada('escote')}
            style={{ cursor: 'pointer' }}
          />

          {/* Leyenda colores */}
          <text x="10" y="380" fontSize="10" fill="#666">
            ● Gris: sin inyectar | ● Azul: seleccionado | ● Verde: inyectado
          </text>
        </svg>
      </div>

      {/* LADO DERECHO: DETALLES ZONA */}
      <div style={{
        flex: 1,
        minWidth: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#000', fontSize: 16 }}>
            {zona.nombre}
          </h3>
          <p style={{ margin: 4, fontSize: 12, color: '#666' }}>
            {zona.musculo}
          </p>
        </div>

        <div style={{
          background: '#e3f2fd',
          padding: 12,
          borderRadius: 6,
          fontSize: 12,
          color: '#1565c0'
        }}>
          <div><strong>Profundidad:</strong> {zona.profundidad}</div>
          <div><strong>Rango sugerido:</strong> {zona.rango_min}-{zona.rango_max}U</div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontWeight: 'bold',
            fontSize: 12,
            marginBottom: 6,
            color: '#000'
          }}>
            Unidades a inyectar:
          </label>
          <input
            type="number"
            value={dosis[zonaSeleccionada] || ''}
            onChange={handleDosisChange}
            style={{
              width: '100%',
              padding: 8,
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 14,
              boxSizing: 'border-box'
            }}
            placeholder="Ingresa dosis"
          />
        </div>

        {alerta && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            padding: 8,
            borderRadius: 4,
            fontSize: 12
          }}>
            {alerta}
          </div>
        )}

        {/* HISTORIAL ZONA */}
        {zona.historial_ejemplo && zona.historial_ejemplo.length > 0 && (
          <div>
            <div style={{
              fontWeight: 'bold',
              fontSize: 12,
              color: '#000',
              marginBottom: 8
            }}>
              Historial zona:
            </div>
            {zona.historial_ejemplo.map((item, idx) => (
              <div key={idx} style={{
                fontSize: 11,
                color: '#666',
                padding: 6,
                background: '#fafafa',
                borderRadius: 4,
                marginBottom: 4
              }}>
                <div><strong>{item.fecha}:</strong> {item.dosis}U {item.marca} LOT-{item.lote}</div>
              </div>
            ))}
          </div>
        )}

        {(!zona.historial_ejemplo || zona.historial_ejemplo.length === 0) && (
          <div style={{
            fontSize: 12,
            color: '#999',
            fontStyle: 'italic'
          }}>
            Sin historial previo en esta zona
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaFacialAnatomicoToxina;
