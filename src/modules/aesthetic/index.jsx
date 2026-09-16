// MÓDULO DE MEDICINA ESTÉTICA — clinica-gft
// Componentes principales e integración

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

// ════════════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Admin Panel de Productos
// ════════════════════════════════════════════════════════════════════════════════════

export const AdminProductos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    tipo_procedimiento: '',
    presentacion: '',
    cantidad_base: 0,
    unidad_base: 'U',
    laboratorio: '',
    numero_registro_cofepris: '',
    registro_valido: true,
    costo_compra_mxn: 0,
    precio_venta_mxn: 0,
    stock_actual: 0,
    categoria_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: cats } = await supabase
        .from('categorias_producto')
        .select('*');
      setCategorias(cats || []);

      const { data: prods } = await supabase
        .from('productos_esteticos')
        .select('*')
        .order('marca, nombre');
      setProductos(prods || []);
    } catch (e) {
      setError('Error cargando datos: ' + String(e));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const guardarProducto = async () => {
    try {
      setError(null);

      if (!formData.nombre || !formData.marca || formData.costo_compra_mxn <= 0) {
        throw new Error('Completa los campos requeridos');
      }

      if (formData.precio_venta_mxn < formData.costo_compra_mxn) {
        throw new Error('Precio venta debe ser ≥ costo compra');
      }

      if (editingId) {
        const { error: err } = await supabase
          .from('productos_esteticos')
          .update(formData)
          .eq('id', editingId);
        if (err) throw err;
        setSuccess('Producto actualizado ✅');
      } else {
        const { error: err } = await supabase
          .from('productos_esteticos')
          .insert([formData]);
        if (err) throw err;
        setSuccess('Producto agregado ✅');
      }

      setFormData({
        nombre: '', marca: '', tipo_procedimiento: '', presentacion: '',
        cantidad_base: 0, unidad_base: 'U', laboratorio: '',
        numero_registro_cofepris: '', registro_valido: true,
        costo_compra_mxn: 0, precio_venta_mxn: 0, stock_actual: 0,
        categoria_id: '',
      });
      setEditingId(null);
      setShowModal(false);
      await loadData();
    } catch (e) {
      setError(String(e));
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const { error: err } = await supabase
        .from('productos_esteticos')
        .delete()
        .eq('id', id);
      if (err) throw err;
      setSuccess('Producto eliminado');
      await loadData();
    } catch (e) {
      setError(String(e));
    }
  };

  const abrirFormulario = (producto) => {
    if (producto) {
      setFormData(producto);
      setEditingId(producto.id);
    } else {
      setFormData({
        nombre: '', marca: '', tipo_procedimiento: '', presentacion: '',
        cantidad_base: 0, unidad_base: 'U', laboratorio: '',
        numero_registro_cofepris: '', registro_valido: true,
        costo_compra_mxn: 0, precio_venta_mxn: 0, stock_actual: 0,
        categoria_id: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>💊 Catálogo de Productos</h1>
        <button
          onClick={() => abrirFormulario(null)}
          style={{
            padding: '10px 20px',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ➕ Agregar Producto
        </button>
      </div>

      {error && (
        <div style={{
          padding: 12,
          background: '#fee',
          color: '#c00',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: 12,
          background: '#efe',
          color: '#060',
          borderRadius: 8,
          marginBottom: 16,
        }}>
          ✅ {success}
        </div>
      )}

      {/* TABLA DE PRODUCTOS */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #ddd' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Marca / Producto</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Presentación</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Costo</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Precio</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Utilidad</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Stock</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>
                  <div style={{ fontWeight: 'bold' }}>{p.marca}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>{p.nombre}</div>
                </td>
                <td style={{ padding: 12 }}>{p.presentacion}</td>
                <td style={{ padding: 12, textAlign: 'right', fontFamily: 'monospace' }}>
                  ${p.costo_compra_mxn.toLocaleString('es-MX')}
                </td>
                <td style={{ padding: 12, textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  ${p.precio_venta_mxn.toLocaleString('es-MX')}
                </td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#060' }}>
                    ${(p.precio_venta_mxn - p.costo_compra_mxn).toLocaleString('es-MX')}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {p.costo_compra_mxn > 0 
                      ? (((p.precio_venta_mxn - p.costo_compra_mxn) / p.costo_compra_mxn) * 100).toFixed(1) 
                      : 0}%
                  </div>
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: p.stock_actual > 0 ? '#e8f5e9' : '#ffebee',
                    color: p.stock_actual > 0 ? '#2e7d32' : '#c62828',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    {p.stock_actual}
                  </span>
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button
                    onClick={() => abrirFormulario(p)}
                    style={{
                      padding: '4px 8px',
                      background: '#0066cc',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      marginRight: 4,
                      fontSize: 11,
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => eliminarProducto(p.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#cc0000',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Agregar/Editar Producto */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ marginTop: 0 }}>
              {editingId ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto'}
            </h2>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Botox 100 Unidades"
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Marca *
              </label>
              <input
                type="text"
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                placeholder="Ej: Allergan"
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Tipo Procedimiento *
              </label>
              <select
                value={formData.tipo_procedimiento}
                onChange={(e) => setFormData({ ...formData, tipo_procedimiento: e.target.value })}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">-- Selecciona --</option>
                <option value="toxina">💉 Toxina Botulínica</option>
                <option value="relleno_ah">💧 Relleno ácido Hialurónico</option>
                <option value="bioestimulador">⚡ Bioestimulador</option>
                <option value="peeling">🧪 Peeling Químico</option>
                <option value="dermapen">🔹 Dermapen/Microneedling</option>
                <option value="enzimas">💛 Enzimas Lipiolíticas</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Presentación *
              </label>
              <input
                type="text"
                value={formData.presentacion}
                onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                placeholder="Ej: Vial 100U"
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

            {/* PRECIOS - SECCIÓN DESTACADA */}
            <div style={{
              background: '#e3f2fd',
              border: '2px solid #2196f3',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#1565c0' }}>💰 PRECIOS</h3>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                  Costo Compra (MXN) *
                </label>
                <input
                  type="number"
                  value={formData.costo_compra_mxn}
                  onChange={(e) => setFormData({ ...formData, costo_compra_mxn: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 3600"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #90caf9',
                    borderRadius: 4,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#1565c0', marginTop: 4 }}>Qué te cuesta comprarlo</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                  Precio Venta (MXN) *
                </label>
                <input
                  type="number"
                  value={formData.precio_venta_mxn}
                  onChange={(e) => setFormData({ ...formData, precio_venta_mxn: parseFloat(e.target.value) || 0 })}
                  placeholder="Ej: 4500"
                  style={{
                    width: '100%',
                    padding: 8,
                    border: '1px solid #90caf9',
                    borderRadius: 4,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#1565c0', marginTop: 4 }}>A qué precio lo vendes</div>
              </div>

              {/* AUTO-CÁLCULO */}
              {formData.costo_compra_mxn > 0 && formData.precio_venta_mxn > 0 && (
                <div style={{ background: 'white', padding: 8, borderRadius: 4, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Utilidad Bruta:</span>
                    <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      ${(formData.precio_venta_mxn - formData.costo_compra_mxn).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>% Ganancia:</span>
                    <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                      {(((formData.precio_venta_mxn - formData.costo_compra_mxn) / formData.costo_compra_mxn) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Laboratorio
              </label>
              <input
                type="text"
                value={formData.laboratorio}
                onChange={(e) => setFormData({ ...formData, laboratorio: e.target.value })}
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

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', fontSize: 12 }}>
                Stock Actual
              </label>
              <input
                type="number"
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: parseInt(e.target.value) || 0 })}
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

            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="registro_valido"
                checked={formData.registro_valido}
                onChange={(e) => setFormData({ ...formData, registro_valido: e.target.checked })}
              />
              <label htmlFor="registro_valido" style={{ fontSize: 12, margin: 0 }}>
                ✅ Registro válido en México (COFEPRIS)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 16px',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarProducto}
                style={{
                  padding: '10px 16px',
                  background: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════════════
// EXPORT PARA USO EN APP.JSX
// ════════════════════════════════════════════════════════════════════════════════════

export default AdminProductos;
