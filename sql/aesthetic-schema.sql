-- SCHEMA: MÓDULO DE MEDICINA ESTÉTICA — PRODUCTOS Y PRECIOS
-- Dr. Gerardo Félix Tapia · clinica-gft
-- Creado: 2026-09-16

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: categorias_producto
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categorias_producto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  icono VARCHAR(50),
  color_hex VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categorias_producto (nombre, descripcion, icono, color_hex) VALUES
('Toxina Botulínica', 'Neuromoduladores - Relajación muscular', '💉', '#FF6B9D'),
('Rellenos ácido hialurónico', 'Ácido hialurónico reticulado', '💧', '#4A90E2'),
('Bioestimuladores', 'Estimulación de colágeno endógeno', '⚡', '#7ED321'),
('Peelings químicos', 'Renovación de piel', '🧪', '#F5A623'),
('Dermapen/Microneedling', 'Estimulación mecánica', '🔹', '#BD10E0'),
('Enzimas lipiolíticas', 'Disolución de grasa', '💛', '#F8E71C'),
('Otros', 'Otros procedimientos estéticos', '✨', '#999999')
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: productos_esteticos (MEJORADA CON PRECIOS MANUALES)
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS productos_esteticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- INFORMACIÓN GENERAL
  nombre VARCHAR(200) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  tipo_procedimiento VARCHAR(50) NOT NULL,
  presentacion VARCHAR(100) NOT NULL,
  cantidad_base DECIMAL(10,2) NOT NULL,
  unidad_base VARCHAR(20) NOT NULL,
  
  -- DILUCIÓN Y PREPARACIÓN
  diluente_recomendado VARCHAR(200),
  volumen_diluente_ml DECIMAL(5,2),
  dosis_por_ml DECIMAL(10,2),
  
  -- ALMACENAJE
  temperatura_min INT DEFAULT 2,
  temperatura_max INT DEFAULT 8,
  tiempo_viabilidad_horas INT,
  evitar_agitacion BOOLEAN DEFAULT FALSE,
  
  -- TÉCNICA INYECCIÓN
  profundidad_mm DECIMAL(3,1),
  tamano_aguja_gauge INT,
  volumen_inyeccion_ml DECIMAL(5,2),
  duracion_meses INT,
  mecanismo_accion VARCHAR(500),
  
  -- INFORMACIÓN REGULATORIA
  laboratorio VARCHAR(100) NOT NULL,
  numero_registro_cofepris VARCHAR(100),
  numero_registro_invima VARCHAR(100),
  registro_valido BOOLEAN DEFAULT TRUE,
  fecha_aprobacion_mexico DATE,
  
  -- INDICACIONES Y CONTRAINDICACIONES
  indicaciones TEXT,
  contraindicaciones TEXT,
  efectos_adversos_frecuentes TEXT,
  
  -- 💰 PRECIOS MANUALES (TÚ LOS CONTROLAS)
  costo_compra_mxn DECIMAL(10,2),
  precio_venta_mxn DECIMAL(10,2),
  utilidad_mxn DECIMAL(10,2) GENERATED ALWAYS AS (precio_venta_mxn - costo_compra_mxn) STORED,
  porcentaje_utilidad DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN costo_compra_mxn > 0 
      THEN ROUND(((precio_venta_mxn - costo_compra_mxn) / costo_compra_mxn * 100), 2)
      ELSE 0
    END
  ) STORED,
  
  -- LOTES Y STOCK
  numero_lote VARCHAR(50),
  fecha_vencimiento DATE,
  stock_actual INT DEFAULT 0,
  proveedor VARCHAR(100),
  
  -- CATEGORÍA
  categoria_id UUID REFERENCES categorias_producto(id),
  
  -- TIMESTAMP Y AUDITORÍA
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  
  UNIQUE(marca, presentacion, numero_lote),
  CONSTRAINT precio_valid CHECK (precio_venta_mxn >= costo_compra_mxn)
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: costo_por_paciente (CÁLCULOS AUTOMÁTICOS)
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS costo_por_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  
  numero_pacientes INT NOT NULL,
  dosis_por_paciente DECIMAL(10,2) NOT NULL,
  
  costo_por_paciente_mxn DECIMAL(10,2) GENERATED ALWAYS AS (
    (SELECT costo_compra_mxn FROM productos_esteticos WHERE id = producto_id) / numero_pacientes
  ) STORED,
  
  precio_por_paciente_mxn DECIMAL(10,2) GENERATED ALWAYS AS (
    (SELECT precio_venta_mxn FROM productos_esteticos WHERE id = producto_id) / numero_pacientes
  ) STORED,
  
  utilidad_por_paciente_mxn DECIMAL(10,2) GENERATED ALWAYS AS (
    precio_por_paciente_mxn - costo_por_paciente_mxn
  ) STORED,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: dosis_recomendadas_por_zona
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dosis_recomendadas_por_zona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  
  zona_facial VARCHAR(100) NOT NULL,
  dosis_minima DECIMAL(10,2),
  dosis_maxima DECIMAL(10,2),
  dosis_recomendada_media DECIMAL(10,2),
  
  tecnica_recomendada VARCHAR(255),
  numero_inyecciones INT,
  espaciamiento_inyecciones_cm DECIMAL(3,1),
  profundidad_especifica_mm DECIMAL(3,1),
  
  resultados_esperados TEXT,
  complicaciones_zona_especifica TEXT,
  nota_clinica TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: esquemas_dilucion
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS esquemas_dilucion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  
  cantidad_producto DECIMAL(10,2),
  unidad_producto VARCHAR(20),
  volumen_diluente_ml DECIMAL(5,2),
  resultado_final_ml DECIMAL(5,2),
  concentracion_final VARCHAR(50),
  
  paso_a_paso TEXT,
  laboratorio_recomendacion_url VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: compatibilidad_productos
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS compatibilidad_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_1_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  producto_2_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  
  compatible BOOLEAN,
  tiempo_espera_minimo_dias INT,
  notas VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: audit_productos (RASTREO DE CAMBIOS DE PRECIO)
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID REFERENCES productos_esteticos(id) ON DELETE CASCADE,
  
  campo_cambio VARCHAR(50),
  valor_anterior DECIMAL(10,2),
  valor_nuevo DECIMAL(10,2),
  razon_cambio VARCHAR(200),
  cambiado_por UUID,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- TABLA: photo_analysis (ANÁLISIS IA DE FOTOS)
-- ════════════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS photo_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID,
  
  analysis_json JSONB,
  glogau_detected VARCHAR(10),
  fitzpatrick_detected VARCHAR(5),
  
  three_plans JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(paciente_id, created_at)
);

-- ════════════════════════════════════════════════════════════════════════════════════
-- PRECARGA: TOXINAS BOTULÍNICAS (MÉXICO 2026)
-- ════════════════════════════════════════════════════════════════════════════════════

-- Botox 100U (Allergan, ✅ COFEPRIS)
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Botox 100 Unidades', 'Botox', 'toxina', 'Vial 100U',
  100, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 2.5, 4.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh en unión neuromuscular',
  'Allergan', 'COFEPRIS_BOTOX_100', TRUE,
  '["Arrugas glabelares", "Patas de gallo", "Frente", "Axilas hiperhidrosis", "Cuello", "Escote"]',
  1200, 1400,
  'Distribuidor Local Sonora', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- Botox 50U
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Botox 50 Unidades', 'Botox', 'toxina', 'Vial 50U',
  50, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 1.25, 4.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh en unión neuromuscular',
  'Allergan', 'COFEPRIS_BOTOX_50', TRUE,
  '["Arrugas glabelares", "Patas de gallo", "Frente"]',
  650, 750,
  'Distribuidor Local Sonora', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- Dysport 300U (Galderma, ✅ COFEPRIS)
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Dysport 300 Unidades', 'Dysport', 'toxina', 'Vial 300U',
  300, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 1.5, 20.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh - difusión más rápida que Botox',
  'Galderma', 'COFEPRIS_DYSPORT_300', TRUE,
  '["Arrugas glabelares", "Patas de gallo", "Frente"]',
  850, 900,
  'Distribuidor Galderma Sonora', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- Dysport 500U
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Dysport 500 Unidades', 'Dysport', 'toxina', 'Vial 500U',
  500, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 2.5, 20.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh - difusión más rápida que Botox',
  'Galderma', 'COFEPRIS_DYSPORT_500', TRUE,
  '["Arrugas glabelares", "Patas de gallo", "Frente", "Axilas", "Cuello"]',
  950, 1100,
  'Distribuidor Galderma Sonora', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- Xeomeen 100U (Merz, ✅ COFEPRIS)
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Xeomeen 100 Unidades', 'Xeomeen', 'toxina', 'Vial 100U',
  100, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 2.5, 4.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh - FORMULACIÓN PURA (sin complejos proteicos)',
  'Merz', 'COFEPRIS_XEOMEEN_100', TRUE,
  '["Arrugas glabelares", "Patas de gallo", "Frente", "Axilas hiperhidrosis"]',
  3600, 4500,
  'Distribuidor Merz Sonora', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- Linurase 100U (Prollenium, ❌ SIN COFEPRIS)
INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml, dosis_por_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Linurase 100 Unidades', 'Linurase', 'toxina', 'Vial 100U',
  100, 'U',
  'Cloruro de sodio 0.9% sin conservantes', 2.5, 4.0,
  2, 8, 24,
  4, 27, 3,
  'Bloqueo de ACh - NO AUTORIZADO EN MÉXICO',
  'Prollenium', NULL, FALSE,
  '⚠️ USO NO AUTORIZADO EN MÉXICO - Prohibido por COFEPRIS desde 2024',
  0, 0,
  'NO DISPONIBLE', id
FROM categorias_producto WHERE nombre = 'Toxina Botulínica'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════════
-- PRECARGA: RELLENOS ÁCIDO HIALURÓNICO
-- ════════════════════════════════════════════════════════════════════════════════════

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Juvéderm Ultra Plus XC', 'Juvéderm', 'relleno_ah', 'Jeringa 0.55mL',
  0.55, 'mL',
  2, 8, 720,
  2.5, 27, 9,
  'ácido Hialurónico reticulado + lidocaína',
  'Allergan', 'COFEPRIS_JUVEDERM', TRUE,
  '["Arrugas nasolabiales", "Pliegues moderados profundos", "Volumen labial"]',
  650, 750,
  'Distribuidor Allergan', id
FROM categorias_producto WHERE nombre = 'Rellenos ácido hialurónico'
ON CONFLICT DO NOTHING;

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Juvéderm Voluma XC', 'Juvéderm', 'relleno_ah', 'Jeringa 0.8mL',
  0.8, 'mL',
  2, 8, 720,
  3.5, 27, 18,
  'ácido Hialurónico reticulado altamente viscoso',
  'Allergan', 'COFEPRIS_JUVEDERM_VOLUMA', TRUE,
  '["Pómulos", "Mejillas", "Pérdida volumen"]',
  800, 900,
  'Distribuidor Allergan', id
FROM categorias_producto WHERE nombre = 'Rellenos ácido hialurónico'
ON CONFLICT DO NOTHING;

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Radiesse', 'Radiesse', 'relleno_ah', 'Jeringa 0.8mL',
  0.8, 'mL',
  15, 25, 720,
  3.5, 27, 15,
  'Microesferas CaHA + gel carreador',
  'Merz', 'COFEPRIS_RADIESSE', TRUE,
  '["Pómulos", "Mejillas", "Surcos nasolabiales profundos", "Dorso manos"]',
  750, 850,
  'Distribuidor Merz', id
FROM categorias_producto WHERE nombre = 'Rellenos ácido hialurónico'
ON CONFLICT DO NOTHING;

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Restylane Lyft', 'Restylane', 'relleno_ah', 'Jeringa 0.5mL',
  0.5, 'mL',
  2, 8, 720,
  3, 27, 12,
  'ácido Hialurónico con lidocaína',
  'Galderma', 'COFEPRIS_RESTYLANE', TRUE,
  '["Mejillas", "Dorso manos", "Arrugas moderadas"]',
  600, 700,
  'Distribuidor Galderma', id
FROM categorias_producto WHERE nombre = 'Rellenos ácido hialurónico'
ON CONFLICT DO NOTHING;

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Profhilo', 'Profhilo', 'relleno_ah', 'Jeringa 0.64mL',
  0.64, 'mL',
  2, 8, 720,
  2, 30, 12,
  'ácido Hialurónico ultra puro 95%',
  'Anteis', 'COFEPRIS_PROFHILO', TRUE,
  '["Hidratación profunda", "Elasticidad", "Luminosidad", "Rostro, cuello, escote"]',
  600, 700,
  'Distribuidor Especializado', id
FROM categorias_producto WHERE nombre = 'Rellenos ácido hialurónico'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════════
-- PRECARGA: BIOESTIMULADORES
-- ════════════════════════════════════════════════════════════════════════════════════

INSERT INTO productos_esteticos (
  nombre, marca, tipo_procedimiento, presentacion, cantidad_base, unidad_base,
  diluente_recomendado, volumen_diluente_ml,
  temperatura_min, temperatura_max, tiempo_viabilidad_horas,
  profundidad_mm, tamano_aguja_gauge, duracion_meses,
  mecanismo_accion, laboratorio, numero_registro_cofepris, registro_valido,
  indicaciones, costo_compra_mxn, precio_venta_mxn,
  proveedor, categoria_id
)
SELECT
  'Sculptra Aesthetic', 'Sculptra', 'bioestimulador', 'Vial 0.5g',
  0.5, 'g',
  'NaCl 0.9% + lidocaína', 150,
  15, 25, 240,
  4.5, 25, 36,
  'Microesferas PLLA → síntesis de colágeno',
  'Galderma', 'COFEPRIS_SCULPTRA', TRUE,
  '["Flacidez facial", "Pérdida volumen", "Arrugas profundas"]',
  2500, 2800,
  'Distribuidor Especializado', id
FROM categorias_producto WHERE nombre = 'Bioestimuladores'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════════
-- COSTO POR PACIENTE (EJEMPLOS)
-- ════════════════════════════════════════════════════════════════════════════════════

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 2, 50 FROM productos_esteticos WHERE nombre = 'Xeomeen 100 Unidades'
ON CONFLICT DO NOTHING;

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 2, 50 FROM productos_esteticos WHERE nombre = 'Botox 100 Unidades'
ON CONFLICT DO NOTHING;

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 3, 100 FROM productos_esteticos WHERE nombre = 'Dysport 300 Unidades'
ON CONFLICT DO NOTHING;

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 5, 100 FROM productos_esteticos WHERE nombre = 'Dysport 500 Unidades'
ON CONFLICT DO NOTHING;

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 2, 0.275 FROM productos_esteticos WHERE nombre = 'Juvéderm Ultra Plus XC'
ON CONFLICT DO NOTHING;

INSERT INTO costo_por_paciente (producto_id, numero_pacientes, dosis_por_paciente)
SELECT id, 2, 0.4 FROM productos_esteticos WHERE nombre = 'Radiesse'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA PERFORMANCE
-- ════════════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_productos_tipo_registro 
  ON productos_esteticos(tipo_procedimiento, registro_valido);
  
CREATE INDEX IF NOT EXISTS idx_productos_categoria 
  ON productos_esteticos(categoria_id);
  
CREATE INDEX IF NOT EXISTS idx_dosis_producto_zona 
  ON dosis_recomendadas_por_zona(producto_id, zona_facial);
  
CREATE INDEX IF NOT EXISTS idx_photo_analysis_paciente 
  ON photo_analysis(paciente_id, created_at DESC);
