export const MEDICO = 'Dr. Gerardo Félix Tapia';

export const PLANTILLAS = {
  procedimiento: {
    titulo: 'Consentimiento informado para procedimiento de medicina estética',
    texto: `Yo, [PACIENTE], declaro que el ${MEDICO} me ha explicado de forma clara y en lenguaje comprensible la naturaleza del/los procedimiento(s) estético(s) que se me realizará(n), así como sus objetivos y alcances.

1. Naturaleza del procedimiento. Se me ha informado en qué consiste el procedimiento, la técnica a emplear y los productos o sustancias que podrían utilizarse.

2. Beneficios esperados. Comprendo que el objetivo es estético y que los resultados pueden variar de una persona a otra. Entiendo que NO se garantiza un resultado específico.

3. Riesgos y complicaciones. Se me han explicado los posibles riesgos, de forma enunciativa y no limitativa: dolor, enrojecimiento, inflamación, hematomas, asimetría, infección, reacciones alérgicas, resultados temporales o insuficientes, y la posible necesidad de retoques o sesiones adicionales.

4. Alternativas. Se me han explicado otras opciones de tratamiento, incluida la de no realizar ningún procedimiento.

5. Cuidados posteriores. Me comprometo a seguir las indicaciones posteriores y a acudir a las citas de seguimiento.

6. Carácter voluntario. Otorgo este consentimiento de manera libre y voluntaria. Sé que puedo revocarlo en cualquier momento antes del procedimiento, sin que ello afecte mi atención.

7. He tenido la oportunidad de hacer preguntas y todas han sido respondidas a mi satisfacción.

Declaro haber leído y entendido este documento y acepto la realización del procedimiento.`,
  },
  fotografia: {
    titulo: 'Consentimiento informado para toma y uso de fotografías clínicas',
    texto: `Yo, [PACIENTE], autorizo al ${MEDICO} a tomar fotografías clínicas de mi rostro y/o de las zonas a tratar, antes, durante y después del/los procedimiento(s).

1. Finalidad. Las fotografías forman parte de mi expediente clínico y se utilizarán para documentar mi evolución, planear el tratamiento y comparar resultados (antes/después).

2. Confidencialidad. Las imágenes se resguardarán de forma confidencial como parte de mi expediente, conforme a la normatividad aplicable en materia de datos personales y expediente clínico.

3. Uso. Las fotografías se usarán únicamente con fines clínicos. Cualquier uso distinto (docencia, publicaciones, difusión o redes sociales) requerirá mi autorización expresa y por separado.

4. Carácter voluntario y revocación. Otorgo esta autorización de forma libre y voluntaria y puedo revocarla por escrito en cualquier momento; la revocación no tendrá efectos retroactivos sobre usos ya realizados.

He leído y comprendido este documento y autorizo la toma y el uso clínico de las fotografías.`,
  },
};

export const aplicarNombre = (texto, nombre) =>
  (texto || '').replace('[PACIENTE]', nombre || '__________');
