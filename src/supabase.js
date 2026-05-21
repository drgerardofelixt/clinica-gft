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
    return { ...datos, id: row.id, nombre: row.nombre, telefono: row.telefono, sexo: row.sexo }
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
