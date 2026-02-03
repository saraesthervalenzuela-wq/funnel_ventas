import React, { useState, useEffect } from 'react'
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

  // Obtener mes actual para el título
  const currentMonth = new Date(dateRange.startDate).toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  })

  if (loading && !data) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <Header
        dateRange={dateRange}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título principal */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-1 capitalize">{currentMonth}</p>
          <h1 className="text-3xl font-bold">
            <span className="text-white">Funnel de Ventas </span>
            <span className="text-teal-400">Ciplastic</span>
          </h1>
        </div>

        {error && (
          <ErrorAlert
            message={error}
            onRetry={handleRefresh}
          />
        )}

        {data && (
          <div className="space-y-8 animate-fade-in">
            {/* Métricas principales - Grid superior */}
            <MetricCards metrics={data.funnel} />

            {/* Gráficos principales - 2 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Embudo de Conversión */}
              <section className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Embudo de Conversión</h3>
                  <span className="badge-teal badge">En vivo</span>
                </div>
                <FunnelChart data={data.funnel} />
              </section>

              {/* Distribución por Etapas */}
              <section className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold">Distribución por Etapas</h3>
                  <span className="text-gray-500 text-sm">Todas las etapas</span>
                </div>
                <StageDistribution stages={data.stages} />
              </section>
            </div>

            {/* Tendencia y Tiempos - 3 columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tendencia - 2 columnas */}
              <section className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-white font-semibold">Tendencia de Leads</h3>
                    <p className="text-gray-500 text-sm">Leads vs Cierres del periodo</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                      <span className="text-gray-400">Leads</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span className="text-gray-400">Cierres</span>
                    </span>
                  </div>
                </div>
                <TrendChart data={data.trend} />
              </section>

              {/* Tiempos Promedio - 1 columna */}
              <section className="card">
                <h3 className="text-white font-semibold mb-6">Tiempos de Cierre</h3>
                <TimeMetrics times={data.times} />
              </section>
            </div>

            {/* Tabla de Fuentes */}
            <section className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold">Rendimiento por Fuente</h3>
                  <p className="text-gray-500 text-sm">Análisis de campañas y canales</p>
                </div>
              </div>
              <SourcesTable sources={data.sources} />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            Ciplastic Dashboard - Conectado a Go High Level
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
