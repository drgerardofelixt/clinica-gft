import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltan variables de entorno de Supabase')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Campos que existen como columnas reales en la tabla pacientes
const CAMPOS_PACIENTE = ['id','nombre','telefono','email','sexo','fecha_nacimiento','activo','created_at']

// Serializa el objeto paciente completo a un registro de Supabase
const pacienteToRow = (p) => {
  const row = {
    id: p.id,
    nombre: p.nombre || '',
    telefono: p.telefono || '',
    email: p.email || '',
    sexo: p.sexo || '',
    activo: p.activo !== false,
    datos_clinicos: JSON.stringify(p) // Guarda todo el objeto completo
  }
  return row
}

// Deserializa un registro de Supabase al objeto paciente completo
const rowToPaciente = (row) => {
  try {
    const datos = row.datos_clinicos ? JSON.parse(row.datos_clinicos) : {}
    return {
      ...datos,
      id: row.id,
      nombre: row.nombre,
      telefono: row.telefono,
      email: row.email,
      sexo: row.sexo,
      activo: row.activo,
    }
  } catch {
    return { id: row.id, nombre: row.nombre, telefono: row.telefono }
  }
}

// ── PACIENTES ──────────────────────────────────────────────────

export const getPacientes = async () => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('nombre')
  if (error) throw error
  return (data || []).map(rowToPaciente)
}

export const savePaciente = async (paciente) => {
  const row = pacienteToRow(paciente)
  const { data, error } = await supabase
    .from('pacientes')
    .upsert(row, { onConflict: 'id' })
    .select()
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
