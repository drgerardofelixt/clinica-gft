import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Convierte objeto paciente a fila de Supabase (solo columnas seguras)
const pacienteToRow = (p) => ({
  id: String(p.id),
  nombre: p.nombre || '',
  telefono: p.telefono || '',
  sexo: p.sexo || '',
  datos_clinicos: JSON.stringify(p)
})

// Reconstruye objeto paciente completo desde fila de Supabase
const rowToPaciente = (row) => {
  try {
    const datos = row.datos_clinicos ? JSON.parse(row.datos_clinicos) : {}
    return { ...datos, id: row.id, nombre: row.nombre, telefono: row.telefono, sexo: datos.sexo || row.sexo || '' }
  } catch {
    return { id: row.id, nombre: row.nombre || '', telefono: row.telefono || '', sexo: row.sexo || '' }
  }
}

export const getPacientes = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre, telefono, sexo, datos_clinicos')
    .order('nombre')
  if (error) throw error
  return (data || []).map(rowToPaciente)
}

export const savePaciente = async (paciente) => {
  const row = pacienteToRow(paciente)
  const { data, error } = await supabase
    .from('pacientes')
    .upsert(row, { onConflict: 'id' })
    .select('id, nombre, telefono, sexo, datos_clinicos')
  if (error) throw error
  return rowToPaciente(data[0])
}

export const deletePaciente = async (id) => {
  const { error } = await supabase.from('pacientes').delete().eq('id', id)
  if (error) throw error
}

export const saveConsulta = async () => {}
export const saveReceta = async () => {}
export const saveLaboratorio = async () => {}
export const saveCita = async () => {}

// ── CONFIGURACIÓN ──────────────────────────────────────────────

export const getConfig = async (clave) => {
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle()
  if (error) throw error
  return data?.valor || null
}

export const setConfig = async (clave, valor) => {
  const { error } = await supabase
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
  if (error) throw error
}

// ── ESTADÍSTICAS MENSUALES (snapshot re-generable por mes) ─────────────────────
export const guardarSnapshotMes = async (mes, datos) => {
  const { error } = await supabase
    .from('estadisticas_mensuales')
    .upsert({ mes, datos, actualizado: new Date().toISOString() }, { onConflict: 'mes' })
  if (error) throw error
}

export const listarSnapshots = async () => {
  const { data, error } = await supabase
    .from('estadisticas_mensuales')
    .select('mes, datos, actualizado')
    .order('mes', { ascending: true })
  if (error) throw error
  return data || []
}

export const obtenerSnapshot = async (mes) => {
  const { data, error } = await supabase
    .from('estadisticas_mensuales')
    .select('mes, datos, actualizado')
    .eq('mes', mes)
    .maybeSingle()
  if (error) throw error
  return data || null
}

// ── CITAS (Agenda v2) ──────────────────────────────────────────
// Hermosillo es UTC-7 fijo (sin horario de verano). Convertimos ISO local naive → instante exacto.
const aOffsetHermosillo = (iso) => {
  if (!iso) return iso
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(iso)) return iso          // ya trae offset/Z
  const base = iso.length === 16 ? iso + ':00' : iso          // YYYY-MM-DDTHH:MM → +segundos
  return base + '-07:00'
}

// Mapa campo-objeto (camelCase) → columna (snake_case) para updates parciales
const CITA_FIELD_MAP = {
  googleEventId: 'google_event_id', calendarId: 'calendar_id', pacienteId: 'paciente_id',
  pacienteNombre: 'paciente_nombre', tipo: 'tipo', medicamento: 'medicamento', dosis: 'dosis',
  numeroVisita: 'numero_visita', inicio: 'inicio', fin: 'fin', estado: 'estado',
  origen: 'origen',
  origenUltimoCambio: 'origen_ultimo_cambio', tituloGenerado: 'titulo_generado',
  pendienteSincronizar: 'pendiente_sincronizar',
}

const citaToRow = (c) => ({
  id: c.id,
  google_event_id: c.googleEventId || null,
  calendar_id: c.calendarId || null,
  paciente_id: c.pacienteId || null,
  paciente_nombre: c.pacienteNombre || '',
  tipo: c.tipo,
  medicamento: c.medicamento || null,
  dosis: c.dosis || null,
  origen: c.origen || null,
  numero_visita: c.numeroVisita != null ? c.numeroVisita : null,
  inicio: aOffsetHermosillo(c.inicio),
  fin: aOffsetHermosillo(c.fin),
  estado: c.estado || 'agendada',
  version: c.version || 1,
  ultima_modificacion: c.ultimaModificacion || new Date().toISOString(),
  origen_ultimo_cambio: c.origenUltimoCambio || 'app',
  titulo_generado: c.tituloGenerado || null,
  pendiente_sincronizar: !!c.pendienteSincronizar,
})

const rowToCita = (r) => ({
  id: r.id,
  googleEventId: r.google_event_id || null,
  calendarId: r.calendar_id || null,
  pacienteId: r.paciente_id || null,
  pacienteNombre: r.paciente_nombre || '',
  tipo: r.tipo,
  medicamento: r.medicamento || null,
  dosis: r.dosis || null,
  origen: r.origen || null,
  numeroVisita: r.numero_visita != null ? r.numero_visita : null,
  inicio: r.inicio,
  fin: r.fin,
  estado: r.estado || 'agendada',
  version: r.version || 1,
  ultimaModificacion: r.ultima_modificacion || null,
  origenUltimoCambio: r.origen_ultimo_cambio || 'app',
  tituloGenerado: r.titulo_generado || null,
  pendienteSincronizar: !!r.pendiente_sincronizar,
})

const citaPatchToRow = (cambios) => {
  const row = {}
  for (const [k, v] of Object.entries(cambios || {})) {
    const col = CITA_FIELD_MAP[k]
    if (!col) continue
    row[col] = (k === 'inicio' || k === 'fin') ? aOffsetHermosillo(v) : v
  }
  return row
}

export const crearCita = async (cita) => {
  const { data, error } = await supabase.from('citas').insert(citaToRow(cita)).select('*')
  if (error) throw error
  return rowToCita(data[0])
}

export const actualizarCita = async (id, cambios = {}) => {
  // Lee la versión actual para incrementarla atómicamente desde el cliente
  const { data: cur, error: e1 } = await supabase.from('citas').select('version').eq('id', id).single()
  if (e1) throw e1
  const patch = citaPatchToRow(cambios)
  patch.version = (cur?.version || 1) + 1
  patch.ultima_modificacion = new Date().toISOString()
  const { data, error } = await supabase.from('citas').update(patch).eq('id', id).select('*')
  if (error) throw error
  return rowToCita(data[0])
}

export const borrarCita = async (id) => {
  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) throw error
}

export const listarCitas = async ({ desde, hasta } = {}) => {
  let q = supabase.from('citas').select('*').order('inicio', { ascending: true })
  if (desde) q = q.gte('inicio', aOffsetHermosillo(desde))
  if (hasta) q = q.lte('inicio', aOffsetHermosillo(hasta))
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(rowToCita)
}

export const obtenerCitaPorGoogleEventId = async (googleEventId) => {
  if (!googleEventId) return null
  const { data, error } = await supabase.from('citas').select('*').eq('google_event_id', googleEventId).maybeSingle()
  if (error) throw error
  return data ? rowToCita(data) : null
}
