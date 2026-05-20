import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno de Supabase')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ── PACIENTES ──────────────────────────────────────────────────

export const getPacientes = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select(`
      *,
      consultas(*),
      recetas(*),
      laboratorios(*),
      citas(*)
    `)
    .order('nombre')
  if (error) throw error
  return data || []
}

export const savePaciente = async (paciente) => {
  const { data, error } = await supabase
    .from('pacientes')
    .upsert(paciente, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

export const deletePaciente = async (id) => {
  const { error } = await supabase.from('pacientes').delete().eq('id', id)
  if (error) throw error
}

// ── CONSULTAS ──────────────────────────────────────────────────

export const saveConsulta = async (consulta) => {
  const { data, error } = await supabase
    .from('consultas')
    .upsert(consulta, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

export const deleteConsulta = async (id) => {
  const { error } = await supabase.from('consultas').delete().eq('id', id)
  if (error) throw error
}

// ── RECETAS ────────────────────────────────────────────────────

export const saveReceta = async (receta) => {
  const { data, error } = await supabase
    .from('recetas')
    .upsert(receta, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

// ── LABORATORIOS ───────────────────────────────────────────────

export const saveLab = async (lab) => {
  const { data, error } = await supabase
    .from('laboratorios')
    .upsert(lab, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

// ── CITAS ──────────────────────────────────────────────────────

export const getCitas = async (fechaDesde, fechaHasta) => {
  let query = supabase
    .from('citas')
    .select('*, pacientes(nombre, telefono)')
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  if (fechaDesde) query = query.gte('fecha', fechaDesde)
  if (fechaHasta) query = query.lte('fecha', fechaHasta)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const saveCita = async (cita) => {
  const { data, error } = await supabase
    .from('citas')
    .upsert(cita, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

export const deleteCita = async (id) => {
  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) throw error
}

// ── ARCHIVOS / STORAGE ─────────────────────────────────────────

export const subirArchivo = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

export const getArchivoUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ── AUTENTICACIÓN ──────────────────────────────────────────────

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async () => {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export const onAuthChange = (callback) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}
