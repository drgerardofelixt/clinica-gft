# 🎨 MÓDULO DE MEDICINA ESTÉTICA — Guía de Implementación
**Dr. Gerardo Félix Tapia · clinica-gft**  
**Fecha: 2026-09-16**

---

## 📋 Estado Actual

✅ **Completado:**
- Schema SQL completo (tablas, índices, constraints)
- Precarga: 13 toxinas botulínicas, rellenos AH, bioestimuladores
- Admin Panel (CRUD productos con precios manuales)
- Sistema de cálculo automático de utilidad %
- Componente React inicial

🔄 **Pendiente:**
- Integración en App.jsx (agregar navegación/botón)
- Ejecutar SQL en Supabase
- IA Vision (Claude API para análisis fotos)
- Consentimientos dinámicos
- Precarga completa (15+ zonas toxina, 30+ dosis recomendadas)

---

## 🚀 PASOS DE IMPLEMENTACIÓN (INMEDIATOS)

### Paso 1: Ejecutar SQL en Supabase
```sql
-- 1. Abre https://app.supabase.com → proyecto xvbyfzluebbbjnrwvhti
-- 2. Pestaña "SQL Editor" → "New Query"
-- 3. Copia TODO el contenido de sql/aesthetic-schema.sql
-- 4. Ejecuta (Ctrl+Enter)
-- 5. Verifica: debería crear 8 tablas + precarga 13 productos
```

**Esperado:**
- ✅ 8 tablas nuevas en schema público
- ✅ 13 toxinas botulínicas precargadas
- ✅ 5 rellenos AH precargados
- ✅ 1 bioestimulador precargado
- ✅ 5 ejemplos de costo_por_paciente

**Test rápido en Supabase:**
```sql
SELECT COUNT(*) FROM productos_esteticos;  -- Debe devolver 19
SELECT * FROM categorias_producto;         -- Debe devolver 7
```

---

### Paso 2: Integrar en App.jsx

En `src/App.jsx`, busca la sección de **imports** (línea ~12-17):

**Agregar:**
```jsx
import AdminProductos from './modules/aesthetic/index.jsx';
```

Luego, en la **función main App()**, busca donde está:
```jsx
const [showConfig, setShowConfig] = useState(false);
```

**Agregar después:**
```jsx
const [showEstetica, setShowEstetica] = useState(false);
```

Finalmente, en el **return principal** de App(), busca:
```jsx
{showConfig && (
  <ModalConfig ...
)}
```

**Agregar después:**
```jsx
{showEstetica && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'white',
    zIndex: 9998,
    display: 'flex',
    flexDirection: 'column',
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: '#f5f5f5',
      borderBottom: '1px solid #ddd',
    }}>
      <h1 style={{ margin: 0 }}>💊 Medicina Estética</h1>
      <button
        onClick={() => setShowEstetica(false)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 20,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <AdminProductos />
    </div>
  </div>
)}
```

En el **Dashboard**, busca los botones principales (Agenda, Pacientes). Agrega un botón nuevo:

```jsx
<button
  onClick={() => setShowEstetica(true)}
  style={{
    padding: '12px 24px',
    background: '#FF6B9D',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 13,
  }}
>
  💊 Medicina Estética
</button>
```

---

### Paso 3: Deploy en Vercel

```bash
# En tu máquina local (o CI/CD):
cd clinica-gft
git add -A
git commit -m "feat: módulo medicina estética v1.0 - admin panel + precarga 19 productos"
git push origin main
```

**Vercel automáticamente:**
- ✅ Detecta cambios en main
- ✅ Corre build (Vite)
- ✅ Deploy en clinica-gft.vercel.app

---

## 📊 ARQUITECTURA ACTUAL

```
clinica-gft/
├── sql/
│   └── aesthetic-schema.sql        ← TABLAS + PRECARGA
├── src/
│   ├── App.jsx                     ← Integración (pending)
│   └── modules/
│       └── aesthetic/
│           └── index.jsx           ← AdminProductos component
└── AESTHETIC_IMPLEMENTATION.md     ← ESTE ARCHIVO
```

**Tablas en Supabase:**
```
categorias_producto           ← 7 categorías (Toxina, Relleno, Bioestim, etc)
productos_esteticos          ← 19 productos precargados + PRECIOS MANUALES 💰
dosis_recomendadas_por_zona  ← Toxinas: 15 zonas, rellenos: 10 zonas
esquemas_dilucion            ← Instrucciones paso a paso por laboratorio
compatibilidad_productos     ← Productos seguros de combinar
costo_por_paciente           ← Cálculo dinámico (1-5 pacientes/vial)
photo_analysis               ← JSON resultados IA Vision
audit_productos              ← Historial cambios de precio
```

---

## 🎯 NEXT STEPS (PRIORIDAD)

### CORTO PLAZO (1-2 días)
- [ ] Ejecutar SQL en Supabase ⚡ CRÍTICO
- [ ] Integrar Admin Panel en App.jsx
- [ ] Deploy en Vercel
- [ ] Test: agregar 2-3 productos manualmente

### MEDIANO PLAZO (1 semana)
- [ ] Precarga completa (15 zonas toxina, 30+ dosis recomendadas, 60+ compatibilidades)
- [ ] IA Vision (Claude API para análisis 5 fotos)
- [ ] Generador de 3 planes de tratamiento (Conservador/Estándar/Intensivo)
- [ ] Consentimientos dinámicos NOM-004

### LARGO PLAZO (2-3 semanas)
- [ ] Historia clínica estética (6 secciones)
- [ ] Dashboard KPI (GAIS promedio, complicaciones, NPS)
- [ ] Módulo WhatsApp automático (0h, 24h, 48h, 1 mes)
- [ ] Integración nutrición (protocolo post-procedimiento)

---

## 💰 PRECIOS MANUALES — GUÍA

El sistema calcula **automáticamente:**

```
Utilidad Bruta    = Precio Venta − Costo Compra
% Ganancia        = (Utilidad / Costo) × 100
Costo/Paciente    = Costo Total / Número Pacientes
Precio/Paciente   = Precio Total / Número Pacientes
```

**Ejemplo Dr. Félix (Xeomeen 100U):**
- Costo compra: $3,600 MXN
- Precio venta: $4,500 MXN
- Utilidad bruta: **$900 MXN** ✅
- % ganancia: **25%** ✅

**Para 2 pacientes × 50U cada uno:**
- Costo/paciente: $1,800 MXN
- Precio/paciente: $2,250 MXN
- % ganancia sigue siendo 25%

---

## 🔐 SEGURIDAD

✅ **Ya implementado:**
- RLS en todas las tablas (solo Dr. Félix puede editar)
- Validación: precio_venta ≥ costo_compra (SQL + React)
- Audit trail: tabla `audit_productos` registra cambios
- UNIQUE constraint: (marca, presentacion, numero_lote)

---

## 📱 INTEGRACIÓN FUTURA: iPad

El Admin Panel está diseñado para **funcionar en iPad:**
- Formulario responsive (max-width: 500px)
- Teclado iPad: numeric para precios, text para nombres
- Tabla scrollable en pantallas pequeñas

**Uso esperado:**
```
1. Dr. Félix abre clinica-gft.vercel.app en iPad
2. Toca "💊 Medicina Estética"
3. Toca "➕ Agregar Producto"
4. Llena costo/precio → sistema calcula utilidad en tiempo real
5. Guarda → se sincroniza automáticamente en Supabase
```

---

## 🐛 TROUBLESHOOTING

### "Error: 23505 unique violation"
**Causa:** Intentaste insertar producto con (marca, presentacion, lote) duplicados  
**Solución:** Cambia el número de lote o elimina el producto anterior

### "Precio venta debe ser ≥ costo compra"
**Causa:** Ingresaste precio venta menor al costo  
**Solución:** Verifica los valores (costo compra < precio venta siempre)

### "No veo los productos en la tabla"
**Causa:** SQL no se ejecutó o te conectaste a otra base de datos  
**Solución:** Verifica:
```sql
SELECT * FROM supabase_migrations;  -- debe tener aesthetic-schema
SELECT COUNT(*) FROM productos_esteticos;
```

---

## 📞 CONTACTO

**Soporte técnico:** Dr. Gerardo Félix Tapia  
**Clínica:** CERA Clínica de Salud  
**Tel:** 662-298-4145 / 662-298-9679  
**Email:** drgerardofelixt@gmail.com  

---

## 📜 VERSIONES

| Fecha      | Versión | Cambios |
|------------|---------|---------|
| 2026-09-16 | 1.0     | Initial release - Admin Panel + SQL Schema |
| TBD        | 1.1     | Precarga completa + IA Vision |
| TBD        | 1.2     | Historia clínica + Consentimientos |
| TBD        | 2.0     | Completo - Integración WhatsApp + KPI |

---

**Estado:** 🚀 Listo para deploy  
**Prioridad:** ⚡ CRÍTICO — ejecutar SQL + integrar App.jsx esta semana
