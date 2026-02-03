import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Header from './components/Header'
import MetricCards from './components/MetricCards'
import FunnelChart from './components/FunnelChart'
import StageDistribution from './components/StageDistribution'
import SourcesTable from './components/SourcesTable'
import TrendChart from './components/TrendChart'
import TimeMetrics from './components/TimeMetrics'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorAlert from './components/ErrorAlert'
import DarkVeil from './components/DarkVeil'

const API_BASE = '/api'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  })

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_BASE}/metrics/summary`, {
        params: dateRange
      })

      if (response.data.success) {
        setData(response.data.data)
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

  const handleDateChange = (newRange) => {
    setDateRange(newRange)
  }

  const handleRefresh = () => {
    fetchData()
  }

  const currentMonth = new Date(dateRange.startDate).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  })

  if (loading && !data) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#06070a' }}>
      {/* DarkVeil WebGL Background */}
      <div className="darkveil-container">
        <DarkVeil
          hueShift={180}
          noiseIntensity={0.02}
          scanlineIntensity={0}
          speed={0.3}
          scanlineFrequency={0}
          warpAmount={0.02}
        />
      </div>

      {/* Overlay to blend DarkVeil with content */}
      <div className="darkveil-overlay" />

      {/* Mesh overlay for extra depth */}
      <div className="mesh-overlay" />

      <Header
        dateRange={dateRange}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Hero Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/25 mb-3 font-display capitalize">
            {currentMonth}
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display">
            <span className="text-white">Funnel de Ventas </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
              Ciplastic
            </span>
          </h1>
          <p className="mt-4 text-white/40 text-lg max-w-xl">
            Métricas en tiempo real de tu pipeline de ventas conectado a Go High Level
          </p>
        </motion.div>

        {error && (
          <ErrorAlert
            message={error}
            onRetry={handleRefresh}
          />
        )}

        {data && (
          <div className="space-y-10">
            {/* Métricas principales */}
            <MetricCards metrics={data.funnel} />

            {/* Gráficos principales - 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Embudo de Conversión */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="chart-card"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight font-display">
                      Embudo de Conversión
                    </h3>
                    <p className="text-sm text-white/40 mt-1">Flujo de leads por etapa</p>
                  </div>
                  <span className="badge badge-teal">En vivo</span>
                </div>
                <FunnelChart data={data.funnel} />
              </motion.section>

              {/* Distribución por Etapas */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="chart-card"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight font-display">
                      Distribución por Etapas
                    </h3>
                    <p className="text-sm text-white/40 mt-1">Todas las etapas del pipeline</p>
                  </div>
                </div>
                <StageDistribution stages={data.stages} />
              </motion.section>
            </div>

            {/* Tendencia y Tiempos - 3 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tendencia - 2 columnas */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="chart-card lg:col-span-2"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight font-display">
                      Tendencia de Leads
                    </h3>
                    <p className="text-sm text-white/40 mt-1">Leads vs Cierres del periodo</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
                            style={{ boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)' }} />
                      <span className="text-white/50 text-sm">Leads</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"
                            style={{ boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)' }} />
                      <span className="text-white/50 text-sm">Cierres</span>
                    </span>
                  </div>
                </div>
                <TrendChart data={data.trend} />
              </motion.section>

              {/* Tiempos Promedio - 1 columna */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="chart-card"
              >
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white tracking-tight font-display">
                    Tiempos de Cierre
                  </h3>
                  <p className="text-sm text-white/40 mt-1">Velocidad del pipeline</p>
                </div>
                <TimeMetrics times={data.times} />
              </motion.section>
            </div>

            {/* Tabla de Fuentes */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="chart-card"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight font-display">
                    Rendimiento por Fuente
                  </h3>
                  <p className="text-sm text-white/40 mt-1">Análisis de campañas y canales de adquisición</p>
                </div>
              </div>
              <SourcesTable sources={data.sources} />
            </motion.section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] mt-20 py-10 relative z-10" style={{ background: 'rgba(6, 7, 10, 0.8)' }}>
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
    </div>
  )
}

export default App
