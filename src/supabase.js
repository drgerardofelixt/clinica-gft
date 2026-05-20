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
    .select(`*, consultas(*), recetas(*), laboratorios(*), citas(*)`)
    .order('nombre')
  if (error) throw error
  return data || []
}

export const savePaciente = async (paciente) => {
  // Separar datos anidados del objeto paciente
  const { consultas, recetas, laboratorios, citas, resultadosLabs, ...pacData } = paciente

  // Guardar paciente principal
  const { data, error } = await supabase
    .from('pacientes')
    .upsert(pacData, { onConflict: 'id' })
    .select()
  if (error) throw error
  const saved = data[0]

  // Guardar consultas
  if (consultas && consultas.length > 0) {
    for (const c of consultas) {
      const { consultas: _c, recetas: _r, laboratorios: _l, citas: _ci, ...cData } = c
      await supabase.from('consultas').upsert(
        { ...cData, paciente_id: saved.id },
        { onConflict: 'id' }
      )
    }
  }

  // Guardar recetas
  if (recetas && recetas.length > 0) {
    for (const r of recetas) {
      await supabase.from('recetas').upsert(
        { ...r, paciente_id: saved.id },
        { onConflict: 'id' }
      )
    }
  }

  // Guardar laboratorios
  if (laboratorios && laboratorios.length > 0) {
    for (const l of laboratorios) {
      await supabase.from('laboratorios').upsert(
        { ...l, paciente_id: saved.id },
        { onConflict: 'id' }
      )
    }
  }

  // Guardar citas
  if (citas && citas.length > 0) {
    for (const ci of citas) {
      await supabase.from('citas').upsert(
        { ...ci, paciente_id: saved.id },
        { onConflict: 'id' }
      )
    }
  }

  return saved
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

export const saveLaboratorio = async (lab) => {
  const { data, error } = await supabase
    .from('laboratorios')
    .upsert(lab, { onConflict: 'id' })
    .select()
  if (error) throw error
  return data[0]
}

// ── CITAS ──────────────────────────────────────────────────────

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
