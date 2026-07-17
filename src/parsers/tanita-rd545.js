// ── PDF.js loader — conservado para archivoATexto (path de labs) ─────────────
let _pdfjs = null;
const loadPdfJs = () => {
  if (_pdfjs) return _pdfjs;
  _pdfjs = new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _pdfjs;
};

export const pdfToText = async (file) => {
  const lib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await lib.getDocument({data:buf}).promise;
  let out = "";
  for (let i=1; i<=pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lm = new Map();
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 3) * 3;
      if (!lm.has(y)) lm.set(y, []);
      lm.get(y).push({s: it.str.trim(), x: it.transform[4]});
    }
    const lines = [...lm.entries()]
      .sort((a,b) => b[0]-a[0])
      .map(([,arr]) => arr.sort((a,b) => a.x-b.x).map(i=>i.s).join(" "))
      .filter(l => l.length>0);
    out += lines.join("\n") + "\n";
  }
  return out;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Prompt ────────────────────────────────────────────────────────────────────
const PROMPT = `Eres un experto en análisis de composición corporal. Extrae todos los valores de esta báscula de bioimpedancia (Tanita, InBody, Omron, SECA u otras marcas). Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.

CAMPOS Y SUS SINÓNIMOS:
- nombre: nombre del paciente/perfil si aparece en el PDF (Name, Nombre, Perfil, Usuario). Muchas básculas solo muestran un ID numérico o nada: en ese caso devuelve null. NO inventes un nombre; devuelve null si no hay uno claro de persona.
- fecha: fecha del análisis. En el PDF aparece en el header como "Date D/M/YYYY HH:MM" en formato DÍA/MES/AÑO (día PRIMERO, ej. "23/6/2026 20:38" = 23 de junio de 2026). Interpreta SIEMPRE el primer número como día y el segundo como mes. Devuélvela como DD/MM/YYYY con ceros a la izquierda, SIN la hora (ej. "23/06/2026")
- peso: Weight, Peso (kg)
- imc: BMI, IMC
- grasaCorporal: Fat %, Body Fat %, % Grasa (porcentaje, NO kg)
- grasaCorporalKg: Fat Mass, Masa Grasa (kg)
- masaMuscular: Muscle Mass (kg) — NO es Fat Free Mass
- aguaCorporal: Total Body Water % (porcentaje)
- aguaCorporalKg: Total Body Water en kg (ej. 29.66)
- masaOsea: Bone Mass (kg) — valor pequeño entre 0.5-5 kg
- masaLibreGrasa: Fat Free Mass en kg (ej. 39.21)
- grasaVisceral: Visceral Fat Rating — índice entre 1-30, NO porcentaje
- edadMetabolica: Metabolic Age — puede ser MAYOR que la edad del paciente, NO confundir con la edad del paciente
- metabolismoBasal: BMR en kcal — NO en kJ (si ves kJ, conviértelo dividiendo entre 4.184)
- proteina: Protein (kg) — valor entre 5-15 kg
- musculoTronco: Trunk muscle (kg)
- musculoBrazoI: Left Arm muscle (kg)
- musculoBrazoD: Right Arm muscle (kg)
- musculoPiernaI: Left Leg muscle (kg)
- musculoPiernaD: Right Leg muscle (kg)
- grasaTronco: Trunk fat (%)
- grasaBrazoI: Left Arm fat (%)
- grasaBrazoD: Right Arm fat (%)
- grasaPiernaI: Left Leg fat (%)
- grasaPiernaD: Right Leg fat (%)

REGLAS:
- masaMuscular es Muscle Mass, NUNCA Fat Free Mass
- edadMetabolica es Metabolic Age, NUNCA la edad del paciente
- metabolismoBasal siempre en kcal
- masaOsea siempre es un valor pequeño (Bone Mass), nunca mayor de 5 kg
- proteina es Protein kg, nunca mayor de 20 kg
- Si un campo no está visible: null
- Responde SOLO con el JSON, sin explicaciones`;

// ── Parser universal de báscula ───────────────────────────────────────────────
export const parsearBascula = async (file) => {
  const base64 = await fileToBase64(file);
  const isPdf = file.type === 'application/pdf';

  const mediaBlock = isPdf
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    : { type: 'image',    source: { type: 'base64', media_type: file.type,           data: base64 } };

  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: [mediaBlock, { type: 'text', text: PROMPT }] }]
    })
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);
  const apiData = await response.json();
  const raw = apiData.content[0].text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};
