// ── Normalización y similitud de nombres de pacientes ─────────────────────────
// Se usa para: (a) detectar duplicados al agendar/importar, (b) verificar que un PDF
// de báscula corresponda al expediente abierto. NO usa teléfono (puede ser compartido).

// Sufijos/anotaciones que la agenda de Google Calendar suele pegar al nombre:
// origen (CON/FARM/CONS), medicamento, y pauta de dosis. Se comparan ya normalizados.
const SUFIJOS = new Set([
  "con","farm","cons","consultorio","farmacia",
  "mounjaro","wegovy","ozempic","saxenda","semaglutida","tirzepatida","moun","weg",
  "semanal","mensual","quincenal","mant","mantenimiento","clicks","click","clics",
  "aplicar","cada","semana","dosis","mg","ml","pluma",
]);

const sinAcentos = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");

// Normaliza un nombre: sin acentos, minúsculas, sin puntuación, sin sufijos de agenda,
// espacios colapsados. Conserva typos (los detecta la similitud), no los "arregla".
export const normalizarNombre = (nombre) => {
  const original = (nombre || "").trim();
  if (!original) return "";
  // ¿el nombre completo viene en MAYÚSCULAS? (ej. "MARIO ALBERTO CONTRERAS MURO")
  // Si es así, NO aplicamos la heurística de "palabra en mayúsculas al final" (rompería el apellido).
  const soloLetras = original.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const todoMayus = soloLetras.length > 0 && soloLetras === soloLetras.toUpperCase();

  const clave = (t) => sinAcentos(t).toLowerCase().replace(/[^a-z0-9]/g, "");
  const esSufijo = (t) => {
    const k = clave(t);
    if (!k) return true;                       // token de pura puntuación (".", "-")
    if (SUFIJOS.has(k)) return true;           // sufijo conocido
    if (/^[0-9]+(mg|ml)?$/.test(k)) return true; // dosis numérica ("5mg", "0.5")
    // palabra suelta EN MAYÚSCULAS al final (anotación tipo "... MOUNJARO MANT"), solo si el nombre no es todo mayúsculas
    if (!todoMayus && /[A-Z]/.test(t) && t === t.toUpperCase()) return true;
    return false;
  };

  let toks = original.split(/\s+/).filter(Boolean);
  // recorta sufijos al final, dejando SIEMPRE al menos 2 tokens (nombre + apellido)
  while (toks.length > 2 && esSufijo(toks[toks.length - 1])) toks.pop();

  return sinAcentos(toks.join(" "))
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Distancia de Levenshtein (edición) entre dos strings.
const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
};

// ¿Es "nombre parcial"? (uno contenido en el otro quitando 1-2 palabras intermedias,
// respetando el orden). Ej: "carmen segundo felix" ⊂ "carmen dolores segundo felix".
// Distinto de un typo: aquí las palabras compartidas coinciden EXACTO.
const esNombreParcial = (na, nb) => {
  const A = na.split(" ").filter(Boolean), B = nb.split(" ").filter(Boolean);
  const [corto, largo] = A.length <= B.length ? [A, B] : [B, A];
  if (corto.length < 2 || largo.length === corto.length) return false;
  if (largo.length - corto.length > 2) return false;   // demasiada diferencia
  let i = 0;                                            // subsecuencia en orden
  for (const t of largo) { if (i < corto.length && corto[i] === t) i++; }
  return i === corto.length;
};

// Busca pacientes con nombre similar (typos o nombre parcial). Umbral prudente:
// mejor sobrar candidatos que faltar. NO usa teléfono. Devuelve [{paciente, score, tipo}] ordenado.
export const buscarPacientesSimilares = (nombreNuevo, listaPacientes, opts = {}) => {
  const umbral = opts.umbral != null ? opts.umbral : 0.80;
  const nn = normalizarNombre(nombreNuevo);
  if (!nn) return [];
  const cand = [];
  for (const p of (listaPacientes || [])) {
    const np = normalizarNombre(p && p.nombre);
    if (!np) continue;
    if (np === nn) { cand.push({ paciente: p, score: 1, tipo: "exacto" }); continue; }
    const dist = levenshtein(nn, np);
    const sim = 1 - dist / Math.max(nn.length, np.length);
    const parcial = esNombreParcial(nn, np);
    if (sim >= umbral || parcial) {
      cand.push({ paciente: p, score: parcial ? Math.max(sim, 0.9) : sim, tipo: parcial ? "parcial" : "similar" });
    }
  }
  return cand.sort((a, b) => b.score - a.score);
};

// ¿Dos nombres son el MISMO tras normalizar? (para dedup automático de lotes, sin fuzzy).
export const mismoNombreNormalizado = (a, b) => {
  const na = normalizarNombre(a);
  return !!na && na === normalizarNombre(b);
};
