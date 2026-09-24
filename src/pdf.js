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
    scale: 1.6,               // ≈154 dpi: nítido para imprimir y ligero (antes 2 = PDFs pesados)
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
  const ratio = canvas.height / canvas.width
  const imgHeight = pdfWidth * ratio

  // JPEG (no PNG) sobre fondo blanco: reduce el peso ~10x. Convierte el canvas o una franja a JPEG.
  const aJpeg = (y, hPx) => {
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width; tmp.height = hPx
    const ctx = tmp.getContext('2d')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tmp.width, tmp.height)
    ctx.drawImage(canvas, 0, y, canvas.width, hPx, 0, 0, canvas.width, hPx)
    return tmp.toDataURL('image/jpeg', 0.78)
  }

  if (imgHeight <= pdfHeight) {
    pdf.addImage(aJpeg(0, canvas.height), 'JPEG', margin, margin, pdfWidth, imgHeight)
  } else {
    // Paginado por REBANADAS: cada hoja lleva solo su franja (antes se incrustaba la imagen completa en
    // cada página → el PDF pesaba N veces de más).
    const pxPorMm = canvas.width / pdfWidth
    const pageHpx = Math.floor(pdfHeight * pxPorMm)
    let y = 0, primera = true
    while (y < canvas.height) {
      const slicePx = Math.min(pageHpx, canvas.height - y)
      if (!primera) pdf.addPage()
      pdf.addImage(aJpeg(y, slicePx), 'JPEG', margin, margin, pdfWidth, slicePx / pxPorMm)
      primera = false; y += slicePx
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
