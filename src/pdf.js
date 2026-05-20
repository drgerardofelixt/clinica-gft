// ── Generador de PDFs reales con jsPDF + html2canvas ──────────
// Este archivo solo funciona fuera del sandbox de Claude (en producción)

export const generarPDF = async (elementoRef, titulo) => {
  // Importar dinámicamente (tree-shaking friendly)
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ])

  const elemento = elementoRef.current
  if (!elemento) throw new Error('Elemento no encontrado')

  // Capturar contenido como canvas en alta resolución
  const canvas = await html2canvas(elemento, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 5000,
  })

  // Crear PDF tamaño carta
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  const margin = 10
  const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2
  const pdfHeight = pdf.internal.pageSize.getHeight() - margin * 2
  const imgData = canvas.toDataURL('image/png', 0.95)
  const ratio = canvas.height / canvas.width
  const imgHeight = pdfWidth * ratio

  if (imgHeight <= pdfHeight) {
    // Todo cabe en una página
    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeight)
  } else {
    // Dividir en múltiples páginas
    let yPos = 0
    while (yPos < imgHeight) {
      if (yPos > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, margin - yPos, pdfWidth, imgHeight)
      yPos += pdfHeight
    }
  }

  return pdf
}

// Descargar PDF directamente
export const descargarPDF = async (elementoRef, titulo) => {
  const pdf = await generarPDF(elementoRef, titulo)
  const nombre = titulo.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf'
  pdf.save(nombre)
}

// Compartir PDF por WhatsApp (Web Share API)
export const compartirPDF = async (elementoRef, titulo) => {
  const pdf = await generarPDF(elementoRef, titulo)
  const nombre = titulo.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pdf'
  const blob = pdf.output('blob')
  const file = new File([blob], nombre, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: titulo,
      text: `${titulo} - Dr. Gerardo Félix Tapia`
    })
    return true
  } else {
    // Fallback: descargar
    pdf.save(nombre)
    return false
  }
}
