import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Globe,
  Megaphone,
  BarChart3,
  LineChart,
  Clock,
  Check,
  FileDown,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react'

const REPORT_SECTIONS = [
  {
    id: 'funnel',
    label: 'Resumen del Funnel',
    description: 'Total leads, calificados, cierres y tasas de conversion',
    icon: TrendingUp,
    gradient: 'from-teal-500 to-cyan-400'
  },
  {
    id: 'sources',
    label: 'Rendimiento por Fuente',
    description: 'Desglose por canal: Facebook, Instagram, WhatsApp, etc.',
    icon: Globe,
    gradient: 'from-blue-500 to-sky-400'
  },
  {
    id: 'metaCampaigns',
    label: 'Campanas Meta Ads',
    description: 'Gasto, conversaciones, leads y cierres por campana',
    icon: Megaphone,
    gradient: 'from-purple-500 to-violet-400'
  },
  {
    id: 'stages',
    label: 'Distribucion por Etapas',
    description: 'Oportunidades en cada etapa del pipeline',
    icon: BarChart3,
    gradient: 'from-amber-500 to-yellow-400'
  },
  {
    id: 'trend',
    label: 'Tendencia de Leads',
    description: 'Leads vs cierres diarios en el periodo',
    icon: LineChart,
    gradient: 'from-green-500 to-emerald-400'
  },
  {
    id: 'times',
    label: 'Tiempos de Cierre',
    description: 'Promedio, minimo y maximo dias para cerrar',
    icon: Clock,
    gradient: 'from-rose-500 to-pink-400'
  }
]

function ReportBuilder({ data, dateRange, dateLabel }) {
  const [selectedSections, setSelectedSections] = useState(new Set())
  const [generating, setGenerating] = useState(false)
  const [metaCampaigns, setMetaCampaigns] = useState(null)
  const [loadingMeta, setLoadingMeta] = useState(false)

  // Fetch Meta campaigns cuando se selecciona esa seccion
  useEffect(() => {
    if (selectedSections.has('metaCampaigns') && !metaCampaigns && dateRange) {
      fetchMetaCampaigns()
    }
  }, [selectedSections])

  const fetchMetaCampaigns = async () => {
    setLoadingMeta(true)
    try {
      const axios = (await import('axios')).default
      const response = await axios.get('/api/meta/campaigns', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
      })
      if (response.data.success) {
        setMetaCampaigns(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching Meta campaigns:', err)
    } finally {
      setLoadingMeta(false)
    }
  }

  const toggleSection = (id) => {
    setSelectedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedSections(new Set(REPORT_SECTIONS.map(s => s.id)))
  }

  const deselectAll = () => {
    setSelectedSections(new Set())
  }

  const handleExportPDF = async () => {
    if (selectedSections.size === 0) return
    setGenerating(true)
    try {
      const { generateReport } = await import('../utils/pdfGenerator')
      await generateReport({
        selectedSections,
        data,
        metaCampaigns,
        dateRange,
        dateLabel
      })
    } catch (err) {
      console.error('Error generating PDF:', err)
    } finally {
      setGenerating(false)
    }
  }

  const formatMoney = (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(0)}`

  // Render preview para cada seccion
  const renderPreview = (sectionId) => {
    switch (sectionId) {
      case 'funnel':
        if (!data?.funnel) return null
        const f = data.funnel
        const funnelItems = [
          ['Total Leads', f.totalLeads],
          ['Calificados', f.leadsCalificados],
          ['Agendadas', f.agendadasValoracion || 0],
          ['Valoradas', f.valoradasCotizacion || 0],
          ['Cierres', f.oportunidadesCierreTotal || 0],
          ['Depositos', f.depositosRealizados || 0],
          ['Tasa Contacto', `${f.tasaContacto}%`],
          ['Tasa Conversion', `${f.tasaConversion}%`]
        ]
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {funnelItems.map(([label, value], i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-lg font-extrabold text-white mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              </div>
            ))}
          </div>
        )

      case 'sources':
        if (!data?.sources) return null
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Fuente', 'Leads', 'Calificados', 'Cierres', 'Valor', 'Conv.'].map(h => (
                    <th key={h} className="py-2 px-2 text-[10px] font-bold text-white/40 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sources.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-2 px-2 text-white/80 font-medium">{s.source}</td>
                    <td className="py-2 px-2 text-white font-bold">{s.total}</td>
                    <td className="py-2 px-2 text-white/50">{s.calificados}</td>
                    <td className="py-2 px-2 text-cyan-400 font-bold">{s.depositos}</td>
                    <td className="py-2 px-2 text-white">${s.valorTotal.toLocaleString()}</td>
                    <td className="py-2 px-2 text-teal-400">{s.tasaConversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'metaCampaigns':
        if (loadingMeta) return <div className="flex items-center gap-2 py-4"><Loader2 className="w-4 h-4 text-teal-400 animate-spin" /><span className="text-white/40 text-sm">Cargando campanas...</span></div>
        if (!metaCampaigns) return <p className="text-white/30 text-sm py-4">Selecciona para cargar datos de Meta Ads</p>
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Campana', 'Gasto', 'Conv.', 'Leads CRM', 'Calif.', 'Cierres'].map(h => (
                    <th key={h} className="py-2 px-2 text-[10px] font-bold text-white/40 uppercase tracking-wider text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metaCampaigns.campaigns.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-2 px-2 text-white/80 font-medium max-w-[200px] truncate">{c.campaignName}</td>
                    <td className="py-2 px-2 text-amber-400 font-bold">${c.spend.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td className="py-2 px-2 text-cyan-400 font-bold">{c.leads}</td>
                    <td className="py-2 px-2 text-white font-bold">{c.ghlLeads || 0}</td>
                    <td className="py-2 px-2 text-purple-400">{c.ghlCalificados || 0}</td>
                    <td className="py-2 px-2 text-green-400 font-bold">{c.ghlCierres || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'stages':
        if (!data?.stages) return null
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.stages.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-white/60 truncate mr-2">{s.stage || s.name}</span>
                <span className="text-sm font-bold text-white">{s.count}</span>
              </div>
            ))}
          </div>
        )

      case 'trend':
        if (!data?.trend) return null
        const totalLeads = data.trend.reduce((s, d) => s + d.leads, 0)
        const totalCierres = data.trend.reduce((s, d) => s + d.depositos, 0)
        return (
          <div className="flex items-center gap-6">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Total Leads</p>
              <p className="text-xl font-extrabold text-white">{totalLeads}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Total Cierres</p>
              <p className="text-xl font-extrabold text-cyan-400">{totalCierres}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Dias</p>
              <p className="text-xl font-extrabold text-white">{data.trend.length}</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Leads/Dia</p>
              <p className="text-xl font-extrabold text-white">{data.trend.length > 0 ? (totalLeads / data.trend.length).toFixed(1) : 0}</p>
            </div>
          </div>
        )

      case 'times':
        if (!data?.times) return null
        const t = data.times
        return (
          <div className="flex items-center gap-6">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Promedio</p>
              <p className="text-xl font-extrabold text-white">{t.promedioTiempoCierre || t.promedio || 0} dias</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Mas Rapido</p>
              <p className="text-xl font-extrabold text-green-400">{t.tiempoMinimoCierre || t.minimo || 0} dias</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Mas Lento</p>
              <p className="text-xl font-extrabold text-rose-400">{t.tiempoMaximoCierre || t.maximo || 0} dias</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const orderedSelected = REPORT_SECTIONS.filter(s => selectedSections.has(s.id))

  return (
    <div>
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8 sm:mb-10"
      >
        <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-teal-400/60 mb-2 sm:mb-3 font-display">
          {dateLabel}
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-tight">
          <span className="text-white/95">Generador de </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
            Reportes
          </span>
        </h1>
        <p className="text-base text-white/40 mt-3">Selecciona las secciones que deseas incluir y exporta como PDF</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Panel izquierdo - Selector */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="chart-card sticky top-20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-display">Secciones</h3>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] font-bold text-teal-400 hover:text-teal-300 uppercase tracking-wider transition-colors">
                  Todas
                </button>
                <span className="text-white/20">|</span>
                <button onClick={deselectAll} className="text-[10px] font-bold text-white/40 hover:text-white/60 uppercase tracking-wider transition-colors">
                  Ninguna
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {REPORT_SECTIONS.map((section, i) => {
                const isSelected = selectedSections.has(section.id)
                const Icon = section.icon
                return (
                  <motion.div
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className="p-3.5 rounded-xl cursor-pointer transition-all duration-300"
                    style={{
                      background: isSelected ? 'rgba(20, 184, 166, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isSelected ? 'rgba(20, 184, 166, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 border-teal-400'
                          : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{section.label}</p>
                        <p className="text-[11px] text-white/35 truncate">{section.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Boton exportar */}
            <motion.button
              onClick={handleExportPDF}
              disabled={selectedSections.size === 0 || generating}
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm
                       transition-all duration-300 disabled:opacity-30 group w-full justify-center mt-6"
              style={{
                background: selectedSections.size > 0
                  ? 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)'
                  : 'rgba(255,255,255,0.05)',
                boxShadow: selectedSections.size > 0 && !generating
                  ? '0 0 30px rgba(20, 184, 166, 0.4)' : 'none'
              }}
              whileHover={selectedSections.size > 0 ? { scale: 1.02 } : {}}
              whileTap={selectedSections.size > 0 ? { scale: 0.98 } : {}}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  <span>Exportar PDF {selectedSections.size > 0 ? `(${selectedSections.size})` : ''}</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Panel derecho - Preview */}
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {orderedSelected.length === 0 ? (
            <div className="chart-card flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-4"
                   style={{ border: '1px solid rgba(20, 184, 166, 0.2)' }}>
                <FileDown className="w-8 h-8 text-teal-400/40" />
              </div>
              <p className="text-white/40 font-medium text-lg">Selecciona secciones para tu reporte</p>
              <p className="text-white/25 text-sm mt-2">Las secciones seleccionadas se mostraran aqui como vista previa</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {orderedSelected.map((section, i) => {
                  const Icon = section.icon
                  return (
                    <motion.div
                      key={section.id}
                      className="chart-card"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      layout
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-lg font-bold text-white font-display">{section.label}</h3>
                      </div>
                      {renderPreview(section.id)}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ReportBuilder
