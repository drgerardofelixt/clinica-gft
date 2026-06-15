// ── PDF.js loader ────────────────────────────────────────────
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
    // Agrupar por posición Y con precisión de 3px para separar líneas
    const lm = new Map();
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      // Redondear Y a múltiplos de 3 para agrupar texto en la misma línea visual
      const y = Math.round(it.transform[5] / 3) * 3;
      if (!lm.has(y)) lm.set(y, []);
      lm.get(y).push({s: it.str.trim(), x: it.transform[4]});
    }
    // Ordenar de arriba a abajo (Y descendente en coordenadas PDF)
    const lines = [...lm.entries()]
      .sort((a,b) => b[0]-a[0])
      .map(([,arr]) => {
        // Ordenar por X dentro de la línea
        const sorted = arr.sort((a,b) => a.x-b.x);
        return sorted.map(i=>i.s).join(" ");
      })
      .filter(l => l.length>0);
    out += lines.join("\n") + "\n";
  }
  return out;
};

// ── Tanita parser ────────────────────────────────────────────
// kg: exec() filtrando rangos (char anterior '-'), deduplica whole-body [0-6]
// pero toma segmental RAW (sin dedup) para soportar valores iguales entre segmentos.
export const parseTanita = async (texto) => {
  console.log('TANITA TEXTO COMPLETO:', texto);
  // DEBUG TEMPORAL — líneas numeradas para identificar posiciones exactas
  texto.split('\n').forEach((l, i) => console.log(i, JSON.stringify(l)));

  // ── Pre-extracción: fecha ──────────────────────────────────────────────────
  const fechaMatch = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  let fechaPreExtracted = null;
  if (fechaMatch) {
    const dd = fechaMatch[1].padStart(2,'0');
    const mm = fechaMatch[2].padStart(2,'0');
    fechaPreExtracted = `${dd}/${mm}/${fechaMatch[3]}`;
  }

  // ── Pre-extracción: campos corporales totales ──────────────────────────────
  // Patrones robustos: \s* entre palabras, [:\-]? opcional, case-insensitive
  const rx = (pat) => { const m=texto.match(pat); return m ? parseFloat(m[1]) : null; };
  const pesoPreExtracted       = rx(/Weight\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const imcPreExtracted        = rx(/BMI\s*[:\-]?\s*(\d+\.?\d*)/i);
  const grasaPreExtracted      = rx(/Fat\s*%\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const grasaKgPreExtracted    = rx(/Fat\s*Mass\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const musculoPreExtracted    = rx(/Muscle\s*Mass\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const aguaPreExtracted       = rx(/Total\s*Body\s*Water\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const masaOseaPreExtracted   = rx(/Bone\s*Mass\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const visceralPreExtracted   = rx(/Visceral\s*Fat\s*Rating\s*[:\-]?\s*(\d+\.?\d*)/i);
  const edadMetPreExtracted    = rx(/Metabolic\s*Age\s*[:\-]?\s*(\d+\.?\d*)/i);
  // BMR: la línea muestra "kJ" primero y luego "kcal" — capturar el valor kcal
  const bmrPreExtracted        = rx(/BMR[\s\S]*?(\d+)\s*kcal/i);

  // ── Pre-extracción: segmentos músculo (kg) ─────────────────────────────────
  // Sufijo "kg" distingue la sección de músculo de la sección de grasa
  const segKg = (pat) => { const m=texto.match(pat); return m ? parseFloat(m[1]) : null; };
  const musculoTroncoP  = segKg(/Trunk\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const musculoBrazoIP  = segKg(/Left\s*Arm\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const musculoBrazoDP  = segKg(/Right\s*Arm\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const musculoPiernaIP = segKg(/Left\s*Leg\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);
  const musculoPiernaDP = segKg(/Right\s*Leg\s*[:\-]?\s*(\d+\.?\d*)\s*kg/i);

  // ── Pre-extracción: segmentos grasa (%) ───────────────────────────────────
  // Sufijo "%" distingue la sección de grasa de la sección de músculo
  const segPct = (pat) => { const m=texto.match(pat); return m ? parseFloat(m[1]) : null; };
  const grasaTroncoP  = segPct(/Trunk\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const grasaBrazoIP  = segPct(/Left\s*Arm\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const grasaBrazoDP  = segPct(/Right\s*Arm\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const grasaPiernaIP = segPct(/Left\s*Leg\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);
  const grasaPiernaDP = segPct(/Right\s*Leg\s*[:\-]?\s*(\d+\.?\d*)\s*%/i);

  console.log('TANITA PRE-EXTRACT:', {
    peso:pesoPreExtracted, imc:imcPreExtracted, grasa:grasaPreExtracted,
    grasaKg:grasaKgPreExtracted, musculo:musculoPreExtracted, agua:aguaPreExtracted,
    masaOsea:masaOseaPreExtracted, visceral:visceralPreExtracted,
    edadMet:edadMetPreExtracted, bmr:bmrPreExtracted,
    seg_musculo:{Tronco:musculoTroncoP,BrazoI:musculoBrazoIP,BrazoD:musculoBrazoDP,PiernaI:musculoPiernaIP,PiernaD:musculoPiernaDP},
    seg_grasa:{Tronco:grasaTroncoP,BrazoI:grasaBrazoIP,BrazoD:grasaBrazoDP,PiernaI:grasaPiernaIP,PiernaD:grasaPiernaDP},
  });

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You are a parser for Tanita RD-545 body composition scale PDF reports in English.

CRITICAL RULES:
1. Any value of -1 means "no data" — treat it as null, never use it.
2. IGNORE kJ values. For BMR the PDF shows two numbers: kJ first, kcal second — use only kcal.
3. For Total Body Water: use the percentage value (%), not the kg value.
4. For Muscle Mass whole-body: use the "Muscle Mass" total field, NOT "Fat Free Mass".
5. For Visceral Fat: use "Visceral Fat Rating" (integer or decimal, e.g. 8 or 5.5), not any segmental or -1 value.
6. For Fat %: extract the number only, without the % symbol.
7. Date: appears at the top as M/D/YYYY HH:MM — output as DD/MM/YYYY zero-padded. Never return null if a date is present.
8. For segmental values: muscle segments are in kg, fat segments are in %. Extract all 5 body segments for both.

EXACT LINE EXAMPLES:
- "11/6/2026 20:20" → fecha = "11/06/2026"
- "Fat %   33.10 %" → grasaCorporal = 33.10  (number only)
- "BMR     9021 kJ   2156 kcal" → metabolismoBasal = 2156  (kcal only)

FIELD MAPPING (PDF label → JSON key):
WHOLE-BODY:
- "Weight" → peso (kg)
- "Fat %" → grasaCorporal (number, no %)
- "Fat Mass" → grasaCorporalKg (kg)
- "Muscle Mass" → masaMuscular (kg, whole-body total)
- "Total Body Water" → aguaCorporal (% value only)
- "Bone Mass" → masaOsea (kg)
- "Visceral Fat Rating" → grasaVisceral (number)
- "BMI" → imc
- "BMR" kcal → metabolismoBasal (integer)
- "Metabolic Age" → edadMetabolica (number)
- "Protein" → proteina (kg — third kg value on the Fat Mass / Bone Mass line)
- date → fecha (DD/MM/YYYY)

SEGMENTAL (from the segmental analysis section of the PDF):
- "Trunk" muscle mass → musculoTronco (kg)
- "Left Arm" muscle mass → musculoBrazoI (kg)
- "Right Arm" muscle mass → musculoBrazoD (kg)
- "Left Leg" muscle mass → musculoPiernaI (kg)
- "Right Leg" muscle mass → musculoPiernaD (kg)
- "Trunk" fat % → grasaTronco (%)
- "Left Arm" fat % → grasaBrazoI (%)
- "Right Arm" fat % → grasaBrazoD (%)
- "Left Leg" fat % → grasaPiernaI (%)
- "Right Leg" fat % → grasaPiernaD (%)

Return ONLY valid JSON, no markdown, no explanations:
{
  "fecha": "DD/MM/YYYY or null",
  "peso": number or null,
  "imc": number or null,
  "grasaCorporal": number or null,
  "grasaCorporalKg": number or null,
  "masaMuscular": number or null,
  "aguaCorporal": number or null,
  "masaOsea": number or null,
  "grasaVisceral": number or null,
  "edadMetabolica": number or null,
  "metabolismoBasal": number or null,
  "proteina": number or null,
  "musculoTronco": number or null,
  "musculoBrazoI": number or null,
  "musculoBrazoD": number or null,
  "musculoPiernaI": number or null,
  "musculoPiernaD": number or null,
  "grasaTronco": number or null,
  "grasaBrazoI": number or null,
  "grasaBrazoD": number or null,
  "grasaPiernaI": number or null,
  "grasaPiernaD": number or null
}

TEXT:
${texto}`,
      }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic API error ${response.status}`);
  const apiData = await response.json();
  const raw = apiData.content[0].text.replace(/^```json\s*/,'').replace(/\s*```$/,'');
  try {
    const data = JSON.parse(raw);
    if (data.fecha && data.fecha.includes('undefined')) data.fecha = null;
    // Sobrescribir con pre-extracciones regex (fuente de verdad para valores numéricos)
    if (fechaPreExtracted)           data.fecha            = fechaPreExtracted;
    if (pesoPreExtracted!=null)      data.peso             = pesoPreExtracted;
    if (imcPreExtracted!=null)       data.imc              = imcPreExtracted;
    if (grasaPreExtracted!=null)     data.grasaCorporal    = grasaPreExtracted;
    if (grasaKgPreExtracted!=null)   data.grasaCorporalKg  = grasaKgPreExtracted;
    if (musculoPreExtracted!=null)   data.masaMuscular     = musculoPreExtracted;
    if (aguaPreExtracted!=null)      data.aguaCorporal     = aguaPreExtracted;
    if (masaOseaPreExtracted!=null)  data.masaOsea         = masaOseaPreExtracted;
    if (visceralPreExtracted!=null)  data.grasaVisceral    = visceralPreExtracted;
    if (edadMetPreExtracted!=null)   data.edadMetabolica   = edadMetPreExtracted;
    if (bmrPreExtracted!=null)       data.metabolismoBasal = bmrPreExtracted;
    // Segmentos: sobrescribir si el regex encontró el valor
    if (musculoTroncoP!=null)  data.musculoTronco  = musculoTroncoP;
    if (musculoBrazoIP!=null)  data.musculoBrazoI  = musculoBrazoIP;
    if (musculoBrazoDP!=null)  data.musculoBrazoD  = musculoBrazoDP;
    if (musculoPiernaIP!=null) data.musculoPiernaI = musculoPiernaIP;
    if (musculoPiernaDP!=null) data.musculoPiernaD = musculoPiernaDP;
    if (grasaTroncoP!=null)    data.grasaTronco    = grasaTroncoP;
    if (grasaBrazoIP!=null)    data.grasaBrazoI    = grasaBrazoIP;
    if (grasaBrazoDP!=null)    data.grasaBrazoD    = grasaBrazoDP;
    if (grasaPiernaIP!=null)   data.grasaPiernaI   = grasaPiernaIP;
    if (grasaPiernaDP!=null)   data.grasaPiernaD   = grasaPiernaDP;
    console.log('TANITA RESULTADO CLAUDE:', JSON.stringify(data, null, 2));
    return data;
  } catch { return {}; }
};
