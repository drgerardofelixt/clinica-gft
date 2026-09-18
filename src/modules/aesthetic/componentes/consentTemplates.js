// Plantillas de consentimiento informado — estructura conforme a la
// NOM-004-SSA3-2012 (expediente clínico) y estándar reforzado para estética
// (SCJN, 2021). Textos EDITABLES; conviene validación legal antes de uso real.

export const MEDICO = 'Dr. Gerardo Félix Tapia';
export const ESTABLECIMIENTO = 'Consultorio del Dr. Gerardo Félix Tapia — Hermosillo, Sonora';

// Riesgos específicos por tipo de procedimiento (enunciativos, no limitativos).
const RIESGOS = {
  toxina:
    'dolor o ardor en el sitio de inyección, enrojecimiento, edema (inflamación), hematoma (moretón), cefalea (dolor de cabeza), asimetría de los resultados, ptosis palpebral (caída del párpado), descenso o caída de la ceja, sensación de pesadez, efecto de carácter TEMPORAL que requiere aplicaciones periódicas para mantenerse, y con menor frecuencia reacciones alérgicas o diseminación del efecto a músculos vecinos',
  relleno:
    'dolor, edema, enrojecimiento, hematoma, coloración anormal de la piel, infección, reacción alérgica, reactivación de herpes labial, formación de nódulos, grumos o irregularidades, migración o palpación del producto, y —de forma poco frecuente pero GRAVE— oclusión vascular que puede provocar necrosis (muerte) de la piel y, de manera excepcional, alteraciones visuales o pérdida de la visión. Entiendo que ante datos de oclusión vascular puede requerirse tratamiento urgente (por ejemplo, aplicación de hialuronidasa)',
  bioestimulador:
    'dolor, eritema, edema y hematoma en el sitio de aplicación, formación de nódulos o pápulas palpables (que pueden requerir masaje o tratamiento adicional), granulomas, infección, reacción alérgica, irregularidades o asimetría, resultados de aparición PROGRESIVA que habitualmente requieren varias sesiones y no son inmediatos, y —de forma poco frecuente pero GRAVE— oclusión vascular con necrosis de la piel',
  peeling:
    'enrojecimiento, ardor, sensación de tirantez, descamación y formación de costras propias del procedimiento, sensibilidad cutánea, hiperpigmentación o hipopigmentación (con MAYOR riesgo en pieles morenas u oscuras, fototipos IV a VI), reactivación de herpes labial, infección, y —si la profundidad excede lo indicado para el tipo de piel— cicatrices. Me comprometo a evitar la exposición solar y a usar protector solar de forma estricta durante la recuperación',
  mesoterapia:
    'dolor o molestias por los múltiples pinchazos, enrojecimiento, edema (hinchazón), hematomas, comezón, pigmentación en los sitios de punción, infección local, reacción alérgica a los productos infiltrados y, en mesoterapia capilar, sensación temporal de acorchamiento del cuero cabelludo. Los resultados son variables y suelen requerir varias sesiones',
  hilos:
    'dolor, inflamación, edema, hematomas, sensación de tirantez, pliegues o irregularidades de la piel, hoyuelos, asimetría, palpación o visibilidad temporal de los hilos, extrusión (salida) del hilo, infección, reacción alérgica, y resultado de duración limitada que requiere sesiones de mantenimiento',
  prp:
    'al obtenerse de mi propia sangre (autólogo): molestias o hematoma en el sitio de extracción venosa; y en el sitio de aplicación, dolor, enrojecimiento, edema, hematoma (que suele reabsorberse en unos días), infección, y con menor frecuencia lesión de estructuras adyacentes o de troncos nerviosos con alteraciones de la sensibilidad. Los resultados son variables y suelen requerir varias sesiones',
  laser:
    'enrojecimiento, edema perifolicular y molestias durante y después de la sesión y, de forma menos frecuente, QUEMADURAS, ampollas, costras, erupciones acneiformes e hiper o hipopigmentación (habitualmente transitorias, con mayor riesgo en pieles bronceadas u oscuras). Requiere varias sesiones, NO garantiza la eliminación permanente del vello y obliga a evitar la exposición solar y el bronceado antes y después del tratamiento',
  microneedling:
    'enrojecimiento, irritación, descamación y sensibilidad que pueden durar algunos días, edema y hematomas, y como complicaciones graves aunque evitables, infección y formación de queloides o cicatrices. Requiere varias sesiones y fotoprotección estricta',
  lipolisis:
    'dolor, hinchazón (que puede ser marcada), hematomas, endurecimiento o nódulos temporales, entumecimiento o alteración de la sensibilidad en la zona, enrojecimiento, y de forma poco frecuente lesión nerviosa (por ejemplo, debilidad temporal de la sonrisa) o dificultad para tragar. Los resultados son graduales y suelen requerir varias sesiones',
  general:
    'dolor, enrojecimiento, inflamación, hematomas, infección, reacciones alérgicas, hiperpigmentación o cambios de coloración, cicatrización anormal, resultados temporales o insuficientes y la posible necesidad de sesiones o retoques adicionales',
};

const TITULOS = {
  toxina: 'Consentimiento informado para aplicación de toxina botulínica',
  relleno: 'Consentimiento informado para aplicación de rellenos dérmicos (ácido hialurónico u otros)',
  bioestimulador: 'Consentimiento informado para aplicación de bioestimuladores de colágeno',
  peeling: 'Consentimiento informado para peeling químico',
  mesoterapia: 'Consentimiento informado para mesoterapia',
  hilos: 'Consentimiento informado para colocación de hilos tensores (PDO)',
  prp: 'Consentimiento informado para aplicación de plasma rico en plaquetas (PRP)',
  laser: 'Consentimiento informado para depilación láser',
  microneedling: 'Consentimiento informado para microneedling (microagujas)',
  lipolisis: 'Consentimiento informado para lipólisis inyectable',
  general: 'Consentimiento informado para procedimiento de medicina estética',
};

const cuerpo = (tituloProc, riesgos) =>
`${tituloProc}

Establecimiento: ${ESTABLECIMIENTO}
Médico tratante: ${MEDICO} · Cédula profesional: __________
Lugar y fecha: __________________________

Yo, [PACIENTE], en pleno uso de mis facultades, declaro que el médico me ha explicado en lenguaje claro y comprensible la naturaleza, los objetivos y los alcances del procedimiento estético que autorizo, el cual se realiza de manera voluntaria y con fines ESTÉTICOS (no curativos).

1. Acto autorizado y en qué consiste. Se me ha informado en qué consiste el procedimiento, la técnica a emplear y los productos o sustancias que podrían utilizarse.

2. Beneficios esperados. Comprendo que el objetivo es estético, que los resultados pueden variar de una persona a otra y que NO se me garantiza un resultado específico.

3. Riesgos y complicaciones. Se me han explicado los posibles riesgos, de forma enunciativa y no limitativa: ${riesgos}.

4. Alternativas. Se me han explicado otras opciones de tratamiento, incluida la de NO realizar ningún procedimiento.

5. Cuidados posteriores y seguimiento. Me comprometo a seguir las indicaciones posteriores y a acudir a las citas de control.

6. Productos utilizados. Autorizo el uso de los productos indicados; se registrarán marca, lote y caducidad en mi expediente clínico.

7. Atención de contingencias y urgencias. Autorizo al personal de salud para que, atendiendo al principio de libertad prescriptiva, me brinde la atención necesaria ante contingencias o urgencias derivadas del procedimiento.

8. Preguntas. He tenido la oportunidad de hacer preguntas y todas mis dudas han sido resueltas a mi satisfacción.

Declaro haber leído y comprendido la totalidad de este documento y otorgo mi consentimiento de forma libre e informada.`;

export const PLANTILLA_FOTOGRAFIA = {
  titulo: 'Consentimiento informado para toma y uso de fotografías clínicas',
  texto:
`Consentimiento informado para toma y uso de fotografías clínicas

Establecimiento: ${ESTABLECIMIENTO}
Médico tratante: ${MEDICO}
Lugar y fecha: __________________________

Yo, [PACIENTE], autorizo al ${MEDICO} a tomar fotografías clínicas de mi rostro y/o de las zonas a tratar, antes, durante y después del/los procedimiento(s).

1. Finalidad. Las fotografías forman parte de mi expediente clínico y se utilizarán para documentar mi evolución, planear el tratamiento y comparar resultados (antes/después).

2. Confidencialidad. Las imágenes se resguardarán de forma confidencial como parte de mi expediente, conforme a la normatividad aplicable en materia de datos personales y expediente clínico.

3. Uso. Las fotografías se usarán ÚNICAMENTE con fines clínicos. Cualquier uso distinto (docencia, publicaciones, difusión o redes sociales) requerirá mi autorización expresa y por separado.

4. Carácter voluntario y revocación. Otorgo esta autorización de forma libre y voluntaria y puedo revocarla por escrito en cualquier momento; la revocación no tendrá efectos retroactivos sobre usos ya realizados.

He leído y comprendido este documento y autorizo la toma y el uso clínico de las fotografías.`,
};

// Construye {titulo, texto} para un tipo de procedimiento ('toxina'|'relleno'|'general')
export const construirConsentimiento = (tipoKey = 'general') => {
  const k = TITULOS[tipoKey] ? tipoKey : 'general';
  return { titulo: TITULOS[k], texto: cuerpo(TITULOS[k], RIESGOS[k]) };
};

// Detecta el tipo de plantilla a partir del texto libre "tipo de procedimiento"
export const plantillaPorTipo = (tipoProcedimiento = '') => {
  const t = tipoProcedimiento.toLowerCase();
  if (/botox|toxina|xeomin|dysport|bocouture|neuronox/.test(t)) return 'toxina';
  if (/bioestimul|sculptra|pol[ií]l[aá]ctico|plla|radiesse|hidroxiapatita|caha|policaprolactona|\bpcl\b|ellans[eé]|lanluma|gouri|harmonyca/.test(t)) return 'bioestimulador';
  if (/hilo|\bpdo\b|tensor|thread|polidioxanona/.test(t)) return 'hilos';
  if (/\bprp\b|plasma|plaquet|bioregener/.test(t)) return 'prp';
  if (/l[aá]ser|depilaci[oó]n|diodo|alejandrita|\bipl\b|luz pulsada|fotodepil/.test(t)) return 'laser';
  if (/microneedl|microaguj|dermapen|dermaroller|micropunci[oó]n/.test(t)) return 'microneedling';
  if (/lip[oó]lisis|lipol[ií]tico|desoxic[oó]lico|deoxic[oó]lico|grasa localizada|adiposidad|papada/.test(t)) return 'lipolisis';
  if (/peeling|exfoliaci[oó]n|tca|glic[oó]lico|salic[ií]lico|jessner|despigment|retinoico/.test(t)) return 'peeling';
  if (/mesoterapia|\bmeso\b|intradermoterapia|c[oó]ctel|vitaminas intrad/.test(t)) return 'mesoterapia';
  if (/juv[eé]derm|hialur|relleno|filler|restylane|belotero|teosyal|stylage/.test(t)) return 'relleno';
  return 'general';
};

// Tipos disponibles para el selector de plantilla (orden de la UI)
export const TIPOS_CONSENT = [
  { k: 'toxina', l: 'Toxina' },
  { k: 'relleno', l: 'Rellenos' },
  { k: 'bioestimulador', l: 'Bioestimuladores' },
  { k: 'hilos', l: 'Hilos (PDO)' },
  { k: 'peeling', l: 'Peeling' },
  { k: 'mesoterapia', l: 'Mesoterapia' },
  { k: 'prp', l: 'PRP' },
  { k: 'laser', l: 'Depilación láser' },
  { k: 'microneedling', l: 'Microneedling' },
  { k: 'lipolisis', l: 'Lipólisis' },
  { k: 'general', l: 'General' },
];

// Compatibilidad: estructura usada por la pestaña de Consentimientos standalone.
export const PLANTILLAS = {
  procedimiento: construirConsentimiento('general'),
  fotografia: PLANTILLA_FOTOGRAFIA,
};

export const aplicarNombre = (texto, nombre) =>
  (texto || '').replace('[PACIENTE]', nombre || '__________');
