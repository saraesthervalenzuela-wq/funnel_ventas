import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Tema claro profesional
const C = {
  white: [255, 255, 255],
  bg: [248, 250, 252],       // gris muy claro para cards
  text: [15, 23, 42],        // slate-900
  textMid: [71, 85, 105],    // slate-500
  textLight: [148, 163, 184],// slate-400
  teal: [13, 148, 136],      // teal-600
  tealLight: [204, 251, 241],// teal-100
  green: [22, 163, 74],      // green-600
  amber: [217, 119, 6],      // amber-600
  purple: [124, 58, 237],    // violet-600
  rose: [225, 29, 72],       // rose-600
  cyan: [8, 145, 178],       // cyan-600
  border: [226, 232, 240],   // slate-200
  headerBg: [241, 245, 249]  // slate-100
}

const PAGE_BOTTOM = 28
const SPACING = 10

async function loadLogo() {
  try {
    const res = await fetch('/logo-ciplastic.png')
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result)
      reader.onerror = () => r(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

// Cargar logo y obtener sus dimensiones reales
async function loadLogoWithSize() {
  const dataUrl = await loadLogo()
  if (!dataUrl) return null
  return new Promise(r => {
    const img = new Image()
    img.onload = () => r({ data: dataUrl, w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => r(null)
    img.src = dataUrl
  })
}

function drawFooter(doc, pageNum, totalPages) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(20, h - 18, w - 20, h - 18)
  doc.setFontSize(7)
  doc.setTextColor(...C.textLight)
  doc.text('CIPLASTIC - Reporte Confidencial', 20, h - 12)
  doc.text(`${pageNum} / ${totalPages}`, w - 20, h - 12, { align: 'right' })
}

function drawHeader(doc, logoInfo, dateLabel, dateRange) {
  const w = doc.internal.pageSize.getWidth()
  let x = 20

  // Logo con proporcion correcta
  if (logoInfo) {
    try {
      const maxH = 16
      const ratio = logoInfo.w / logoInfo.h
      const logoW = maxH * ratio
      doc.addImage(logoInfo.data, 'PNG', x, 8, logoW, maxH)
      x += logoW + 6
    } catch {
      x = 20
    }
  }

  // Titulo
  doc.setFontSize(16)
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte de Ventas', x, 19)

  // Fecha a la derecha
  const rx = w - 20
  doc.setFontSize(9)
  doc.setTextColor(...C.textMid)
  doc.setFont('helvetica', 'normal')
  doc.text(dateLabel || '', rx, 15, { align: 'right' })
  if (dateRange) {
    doc.setFontSize(8)
    doc.setTextColor(...C.textLight)
    doc.text(`${dateRange.startDate}  a  ${dateRange.endDate}`, rx, 22, { align: 'right' })
  }

  // Linea teal
  doc.setDrawColor(...C.teal)
  doc.setLineWidth(0.8)
  doc.line(20, 30, w - 20, 30)

  return 38
}

function sectionTitle(doc, title, y) {
  doc.setFillColor(...C.teal)
  doc.roundedRect(20, y, 3, 14, 1.5, 1.5, 'F')
  doc.setFontSize(13)
  doc.setTextColor(...C.text)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 28, y + 10)
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.line(20, y + 18, doc.internal.pageSize.getWidth() - 20, y + 18)
  return y + 24
}

function metricCard(doc, x, y, w, h, label, value, color) {
  doc.setFillColor(...C.bg)
  doc.roundedRect(x, y, w, h, 2, 2, 'F')
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.2)
  doc.roundedRect(x, y, w, h, 2, 2, 'S')
  doc.setFontSize(6.5)
  doc.setTextColor(...C.textLight)
  doc.setFont('helvetica', 'bold')
  doc.text(label.toUpperCase(), x + w / 2, y + 10, { align: 'center' })
  doc.setFontSize(14)
  doc.setTextColor(...(color || C.text))
  doc.setFont('helvetica', 'bold')
  doc.text(String(value), x + w / 2, y + 23, { align: 'center' })
}

function ensureSpace(doc, y, need) {
  if (y + need > doc.internal.pageSize.getHeight() - PAGE_BOTTOM) {
    doc.addPage()
    return 20
  }
  return y
}

// Estilos comunes para autoTable (tema claro)
function tableStyles() {
  return {
    theme: 'grid',
    styles: {
      fillColor: C.white,
      textColor: C.textMid,
      fontSize: 8,
      cellPadding: 4,
      lineColor: C.border,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: C.headerBg,
      textColor: C.teal,
      fontStyle: 'bold',
      fontSize: 7.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  }
}

// --- Resumen del Funnel ---
function renderFunnel(doc, data, startY) {
  let y = ensureSpace(doc, startY, 95)
  y = sectionTitle(doc, 'Resumen del Funnel', y)
  const f = data.funnel
  if (!f) return y

  const w = doc.internal.pageSize.getWidth()
  const cw = (w - 60) / 4, ch = 30

  const m = [
    { l: 'Total Leads', v: f.totalLeads?.toLocaleString() || '0' },
    { l: 'Calificados', v: f.leadsCalificados?.toLocaleString() || '0' },
    { l: 'Agendadas', v: (f.agendadasValoracion || 0).toLocaleString() },
    { l: 'Valoradas', v: (f.valoradasCotizacion || 0).toLocaleString() },
    { l: 'Oport. Cierre', v: (f.oportunidadesCierreTotal || 0).toLocaleString() },
    { l: 'Depositos', v: (f.depositosRealizados || 0).toLocaleString(), c: C.green },
    { l: 'Tasa Contacto', v: `${f.tasaContacto || 0}%`, c: C.teal },
    { l: 'Tasa Conversion', v: `${f.tasaConversion || 0}%`, c: C.teal }
  ]

  m.forEach((item, i) => {
    metricCard(doc, 20 + (i % 4) * (cw + 5), y + Math.floor(i / 4) * (ch + 4), cw, ch, item.l, item.v, item.c)
  })

  return y + Math.ceil(m.length / 4) * (ch + 4) + SPACING
}

// --- Rendimiento por Fuente ---
function renderSources(doc, data, startY) {
  let y = ensureSpace(doc, startY, 80)
  y = sectionTitle(doc, 'Rendimiento por Fuente', y)
  if (!data.sources?.length) return y

  autoTable(doc, {
    startY: y, margin: { left: 20, right: 20 },
    head: [['Fuente', 'Leads', 'Calificados', 'Cierres', 'Valor', 'Conv.']],
    body: data.sources.map(s => [
      s.source, s.total, s.calificados, s.depositos,
      `$${(s.valorTotal || 0).toLocaleString()}`, `${s.tasaConversion}%`
    ]),
    ...tableStyles(),
    columnStyles: {
      0: { textColor: C.text, fontStyle: 'bold' },
      1: { halign: 'center', textColor: C.text, fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', textColor: C.green, fontStyle: 'bold' },
      4: { halign: 'right', textColor: C.text },
      5: { halign: 'center', textColor: C.teal, fontStyle: 'bold' }
    }
  })

  const endY = doc.lastAutoTable?.finalY || y + 50
  const tl = data.sources.reduce((s, r) => s + r.total, 0)
  const tc = data.sources.reduce((s, r) => s + r.depositos, 0)
  const tv = data.sources.reduce((s, r) => s + r.valorTotal, 0)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textLight)
  doc.text(`Total Leads: ${tl}   |   Cierres: ${tc}   |   Valor: $${tv.toLocaleString()}`, 20, endY + 5)
  return endY + 5 + SPACING
}

// --- Campanas Meta Ads ---
function renderMeta(doc, metaCampaigns, startY) {
  let y = ensureSpace(doc, startY, 90)
  y = sectionTitle(doc, 'Campanas Meta Ads', y)
  if (!metaCampaigns?.campaigns?.length) {
    doc.setFontSize(9)
    doc.setTextColor(...C.textLight)
    doc.text('No hay datos de campanas Meta disponibles', 20, y + 8)
    return y + 16 + SPACING
  }

  const camps = metaCampaigns.campaigns
  const gt = metaCampaigns.ghlTotals || {}
  const spend = camps.reduce((s, c) => s + (c.spend || 0), 0)
  const conv = camps.reduce((s, c) => s + (c.leads || 0), 0)

  const w = doc.internal.pageSize.getWidth()
  const cw = (w - 70) / 5
  const cards = [
    { l: 'Gasto Ads', v: `$${spend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, c: C.amber },
    { l: 'Conversaciones', v: conv.toLocaleString(), c: C.cyan },
    { l: 'Leads CRM', v: (gt.total || 0).toLocaleString() },
    { l: 'Calificados', v: (gt.calificados || 0).toLocaleString(), c: C.purple },
    { l: 'Cierres', v: (gt.cierres || 0).toLocaleString(), c: C.green }
  ]

  y = ensureSpace(doc, y, 44)
  cards.forEach((item, i) => metricCard(doc, 20 + i * (cw + 5), y, cw, 30, item.l, item.v, item.c))
  y += 38

  autoTable(doc, {
    startY: y, margin: { left: 20, right: 20 },
    head: [['Campana', 'Gasto', 'Conv.', 'Leads CRM', 'Calif.', 'Cierres', 'Valor']],
    body: camps.map(c => [
      c.campaignName || c.campaign || '',
      `$${(c.spend || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      c.leads || 0, c.ghlLeads || 0, c.ghlCalificados || 0,
      c.ghlCierres || 0, `$${(c.ghlValor || 0).toLocaleString()}`
    ]),
    ...tableStyles(),
    styles: { ...tableStyles().styles, fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { textColor: C.text, cellWidth: 55 },
      1: { halign: 'right', textColor: C.amber, fontStyle: 'bold' },
      2: { halign: 'center', textColor: C.cyan, fontStyle: 'bold' },
      3: { halign: 'center', textColor: C.text, fontStyle: 'bold' },
      4: { halign: 'center', textColor: C.purple },
      5: { halign: 'center', textColor: C.green, fontStyle: 'bold' },
      6: { halign: 'right', textColor: C.text }
    }
  })

  return (doc.lastAutoTable?.finalY || y + 50) + SPACING
}

// --- Distribucion por Etapas ---
function renderStages(doc, data, startY) {
  let y = ensureSpace(doc, startY, 80)
  y = sectionTitle(doc, 'Distribucion por Etapas', y)
  if (!data.stages?.length) return y

  autoTable(doc, {
    startY: y, margin: { left: 20, right: 20 },
    head: [['Etapa', 'Oportunidades', 'Valor']],
    body: data.stages.map(s => [s.stage || s.name || '', s.count, `$${(s.value || 0).toLocaleString()}`]),
    ...tableStyles(),
    columnStyles: {
      0: { textColor: C.text, fontStyle: 'bold' },
      1: { halign: 'center', textColor: C.text, fontStyle: 'bold' },
      2: { halign: 'right', textColor: C.text }
    }
  })

  return (doc.lastAutoTable?.finalY || y + 50) + SPACING
}

// --- Tendencia de Leads ---
function renderTrend(doc, data, startY) {
  let y = ensureSpace(doc, startY, 90)
  y = sectionTitle(doc, 'Tendencia de Leads', y)
  if (!data.trend?.length) return y

  const w = doc.internal.pageSize.getWidth()
  const tl = data.trend.reduce((s, d) => s + d.leads, 0)
  const tc = data.trend.reduce((s, d) => s + d.depositos, 0)
  const days = data.trend.length
  const avg = days > 0 ? (tl / days).toFixed(1) : '0'

  const cw = (w - 55) / 4
  const cards = [
    { l: 'Total Leads', v: tl.toLocaleString() },
    { l: 'Total Cierres', v: tc.toLocaleString(), c: C.cyan },
    { l: 'Dias', v: String(days) },
    { l: 'Leads/Dia', v: avg, c: C.teal }
  ]

  y = ensureSpace(doc, y, 40)
  cards.forEach((item, i) => metricCard(doc, 20 + i * (cw + 5), y, cw, 30, item.l, item.v, item.c))
  y += 38

  autoTable(doc, {
    startY: y, margin: { left: 20, right: 20 },
    head: [['Fecha', 'Leads', 'Valoraciones', 'Cierres']],
    body: data.trend.map(d => [d.date, d.leads, d.valoraciones || 0, d.depositos]),
    ...tableStyles(),
    styles: { ...tableStyles().styles, fontSize: 7.5, cellPadding: 3.5 },
    columnStyles: {
      0: { textColor: C.text },
      1: { halign: 'center', textColor: C.text, fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', textColor: C.green, fontStyle: 'bold' }
    }
  })

  return (doc.lastAutoTable?.finalY || y + 50) + SPACING
}

// --- Tiempos de Cierre ---
function renderTimes(doc, data, startY) {
  let y = ensureSpace(doc, startY, 70)
  y = sectionTitle(doc, 'Tiempos de Cierre', y)
  if (!data.times) return y

  const t = data.times
  const w = doc.internal.pageSize.getWidth()
  const cw = (w - 50) / 3

  const cards = [
    { l: 'Promedio', v: `${t.promedioTiempoCierre || t.promedio || 0} dias` },
    { l: 'Mas Rapido', v: `${t.tiempoMinimoCierre || t.minimo || 0} dias`, c: C.green },
    { l: 'Mas Lento', v: `${t.tiempoMaximoCierre || t.maximo || 0} dias`, c: C.rose }
  ]

  cards.forEach((item, i) => metricCard(doc, 20 + i * (cw + 5), y, cw, 34, item.l, item.v, item.c))
  y += 40

  doc.setFontSize(7)
  doc.setTextColor(...C.textLight)
  doc.text(`Oportunidades analizadas: ${t.oportunidadesAnalizadas || 0}`, 20, y)
  return y + SPACING
}

// --- FUNCION PRINCIPAL ---
export async function generateReport({ selectedSections, data, metaCampaigns, dateRange, dateLabel }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Logo con dimensiones reales
  const logoInfo = await loadLogoWithSize()

  let currentY = drawHeader(doc, logoInfo, dateLabel, dateRange)

  const order = ['funnel', 'sources', 'metaCampaigns', 'stages', 'trend', 'times']
  const toRender = order.filter(id => selectedSections.has(id))

  for (const id of toRender) {
    switch (id) {
      case 'funnel': currentY = renderFunnel(doc, data, currentY); break
      case 'sources': currentY = renderSources(doc, data, currentY); break
      case 'metaCampaigns': currentY = renderMeta(doc, metaCampaigns, currentY); break
      case 'stages': currentY = renderStages(doc, data, currentY); break
      case 'trend': currentY = renderTrend(doc, data, currentY); break
      case 'times': currentY = renderTimes(doc, data, currentY); break
    }
  }

  const total = doc.internal.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    drawFooter(doc, p, total)
  }

  const name = dateRange
    ? `Ciplastic_Reporte_${dateRange.startDate}_${dateRange.endDate}.pdf`
    : `Ciplastic_Reporte_${new Date().toISOString().split('T')[0]}.pdf`

  doc.save(name)
}
