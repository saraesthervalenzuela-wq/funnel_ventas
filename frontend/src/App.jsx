import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header'
import MetricCards from './components/MetricCards'
import FunnelChart from './components/FunnelChart'
import StageDistribution from './components/StageDistribution'
import SourcesTable from './components/SourcesTable'
import TrendChart from './components/TrendChart'
import TimeMetrics from './components/TimeMetrics'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorAlert from './components/ErrorAlert'
import MetaCampaigns from './components/MetaCampaigns'
import ReportBuilder from './components/ReportBuilder'
import AnalysisView from './components/AnalysisView'
import DarkVeil from './components/DarkVeil'
import mockData from './mockData'

// Cambiar a false para usar el API real de GHL
const USE_MOCK_DATA = false

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  })

  const fetchData = async (force = false) => {
    setLoading(true)
    setError(null)

    // Usar datos mock para visualizar el diseño
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setData(mockData)
      setLoading(false)
      return
    }

    try {
      const axios = (await import('axios')).default
      const params = { ...dateRange }
      if (force) params.force = 'true'
      const response = await axios.get('/api/metrics/summary', {
        params
      })

      if (response.data.success) {
        setData(response.data.data)
        setError(null)
      } else {
        setError('Error al obtener los datos')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(
        err.response?.data?.error ||
        'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateRange])

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [dateRange])

  const handleDateChange = (newRange) => {
    setDateRange(newRange)
  }

  const handleRefresh = () => {
    fetchData(true)
  }

  const dateLabel = (() => {
    const [sY, sM, sD] = dateRange.startDate.split('-').map(Number)
    const [eY, eM, eD] = dateRange.endDate.split('-').map(Number)

    const startObj = new Date(sY, sM - 1, sD)
    const endObj = new Date(eY, eM - 1, eD)

    // Mismo día → "9 de Febrero de 2026"
    if (dateRange.startDate === dateRange.endDate) {
      return startObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Mes completo (día 1 al último día del mes, mismo mes) → "Febrero de 2026"
    const lastDayOfMonth = new Date(sY, sM, 0).getDate()
    if (sD === 1 && eD === lastDayOfMonth && sM === eM && sY === eY) {
      return startObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    }

    // Mismo mes → "3 al 10 de Febrero de 2026"
    if (sM === eM && sY === eY) {
      const monthYear = endObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
      return `${sD} al ${eD} de ${monthYear}`
    }

    // Diferentes meses → "3 de Enero al 10 de Febrero de 2026"
    const startStr = startObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    const endStr = endObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${startStr} al ${endStr}`
  })()

  if (loading && !data) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen relative py-2 px-0 sm:py-3 sm:px-1 lg:py-4 lg:px-2" style={{ background: 'transparent' }}>
      {/* DarkVeil WebGL Background - Azul */}
      <div className="darkveil-container">
        <DarkVeil
          hueShift={200}
          noiseIntensity={0.12}
          scanlineIntensity={0.04}
          speed={0.6}
          scanlineFrequency={600}
          warpAmount={0.08}
        />
      </div>

      {/* Mesh overlay for extra depth - sin overlay oscuro */}
      <div className="mesh-overlay" />

      {/* Extra ambient glow orbs - Azules como el logo */}
      <div className="fixed inset-0 pointer-events-none z-[-3]">
        <div className="absolute top-[5%] left-[2%] w-[600px] h-[600px] rounded-full bg-cyan-500/30 blur-[150px] animate-pulse" />
        <div className="absolute top-[50%] right-[5%] w-[500px] h-[500px] rounded-full bg-blue-500/25 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[5%] left-[20%] w-[450px] h-[450px] rounded-full bg-sky-500/25 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* GLASSMORPHISM CONTAINER - Modal principal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)] rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(6, 7, 10, 0.72)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl lg:rounded-3xl pointer-events-none"
             style={{
               background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, transparent 50%, rgba(168, 85, 247, 0.08) 100%)',
               mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
               maskComposite: 'exclude',
               WebkitMaskComposite: 'xor',
               padding: '1px'
             }} />

        <Header
          dateRange={dateRange}
          onDateChange={handleDateChange}
          onRefresh={handleRefresh}
          loading={loading}
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {activeView === 'dashboard' && (
        <main className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-10 lg:py-12">
        {/* Hero Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-10 lg:mb-12"
        >
          <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-teal-400/60 mb-2 sm:mb-3 font-display">
            {dateLabel}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-tight">
            <span className="text-white/95">Funnel de Ventas </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400"
                  style={{ textShadow: '0 0 60px rgba(20, 184, 166, 0.3)' }}>
              Ciplastic
            </span>
          </h1>
        </motion.div>

        {error && (
          <ErrorAlert
            message={error}
            onRetry={handleRefresh}
          />
        )}

        {data && (
          <div className={`space-y-6 sm:space-y-8 lg:space-y-10 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* Métricas principales */}
            <MetricCards metrics={data.funnel} />

            {/* Gráficos principales - 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {/* Embudo de Conversión */}
              <motion.section
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="chart-card"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                      Embudo de Conversión
                    </h3>
                    <p className="text-base text-white/40 mt-2">Flujo de leads por etapa</p>
                  </div>
                  <span className="badge badge-teal">En vivo</span>
                </div>
                <FunnelChart data={data.funnel} />
              </motion.section>

              {/* Distribución por Etapas */}
              <motion.section
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="chart-card"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                      Distribución por Etapas
                    </h3>
                    <p className="text-base text-white/40 mt-2">Todas las etapas del pipeline</p>
                  </div>
                </div>
                <StageDistribution stages={data.stages} />
              </motion.section>
            </div>

            {/* Tendencia y Tiempos - 3 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Tendencia - 2 columnas */}
              <motion.section
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="chart-card lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                      Tendencia de Leads
                    </h3>
                    <p className="text-base text-white/40 mt-2">Leads vs Cierres del periodo</p>
                  </div>
                  <div className="flex gap-6 text-base">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                            style={{ boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)' }} />
                      <span className="text-white/50">Leads</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"
                            style={{ boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)' }} />
                      <span className="text-white/50">Cierres</span>
                    </span>
                  </div>
                </div>
                <TrendChart data={data.trend} />
              </motion.section>

              {/* Tiempos Promedio - 1 columna */}
              <motion.section
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="chart-card"
              >
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                    Tiempos de Cierre
                  </h3>
                  <p className="text-base text-white/40 mt-2">Velocidad del pipeline</p>
                </div>
                <TimeMetrics times={data.times} />
              </motion.section>
            </div>

            {/* Tabla de Fuentes */}
            <motion.section
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="chart-card"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                    Rendimiento por Fuente
                  </h3>
                  <p className="text-base text-white/40 mt-2">Análisis de campañas y canales de adquisición</p>
                </div>
              </div>
              <SourcesTable sources={data.sources} dateRange={dateRange} />
            </motion.section>

            {/* Campañas de Meta Ads */}
            <motion.section
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="chart-card"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight font-display">
                    Campañas Meta Ads
                  </h3>
                  <p className="text-base text-white/40 mt-2">Rendimiento de Facebook e Instagram Ads</p>
                </div>
                <span className="badge badge-teal">Meta API</span>
              </div>
              <MetaCampaigns dateRange={dateRange} />
            </motion.section>
          </div>
        )}
      </main>
        )}

        {activeView === 'analisis' && (
          <main className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-10 lg:py-12">
            <AnalysisView data={data} dateRange={dateRange} dateLabel={dateLabel} />
          </main>
        )}

        {activeView === 'reportes' && (
          <main className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-10 lg:py-12">
            <ReportBuilder data={data} dateRange={dateRange} dateLabel={dateLabel} />
          </main>
        )}

        {/* Footer */}
        <footer className="border-t border-white/[0.06] mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse"
                   style={{ boxShadow: '0 0 10px rgba(20, 184, 166, 0.5)' }} />
              <p className="text-center text-white/30 text-sm font-medium">
                Ciplastic Dashboard — Conectado a Go High Level
              </p>
            </div>
          </div>
        </footer>
      </motion.div>
    </div>
  )
}

export default App
