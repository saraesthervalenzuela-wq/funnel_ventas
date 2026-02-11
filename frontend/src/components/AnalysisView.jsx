import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, AlertTriangle, AlertCircle, Info, Lightbulb, Target, RefreshCw, Sparkles, TrendingUp, Users, Megaphone, Clock, BarChart3, ChevronRight } from 'lucide-react'

const alertConfig = {
  critico: {
    border: 'rgba(239, 68, 68, 0.4)',
    bg: 'rgba(239, 68, 68, 0.08)',
    glow: '0 0 20px rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    icon: AlertTriangle,
    label: 'Critico'
  },
  advertencia: {
    border: 'rgba(245, 158, 11, 0.4)',
    bg: 'rgba(245, 158, 11, 0.08)',
    glow: '0 0 20px rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    icon: AlertCircle,
    label: 'Advertencia'
  },
  info: {
    border: 'rgba(20, 184, 166, 0.4)',
    bg: 'rgba(20, 184, 166, 0.08)',
    glow: '0 0 20px rgba(20, 184, 166, 0.15)',
    color: '#2dd4bf',
    icon: Info,
    label: 'Info'
  }
}

const categoryIcons = {
  funnel: TrendingUp,
  fuentes: Users,
  campanas: Megaphone,
  tiempos: Clock,
  tendencia: BarChart3
}

const prioridadConfig = {
  alta: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  media: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  baja: { color: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.3)' }
}

function HealthGauge({ score }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#2dd4bf' : score >= 40 ? '#fbbf24' : '#f87171'

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-extrabold text-white font-display"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">de 100</span>
      </div>
    </div>
  )
}

function AnalysisView({ data, dateRange, dateLabel }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const axios = (await import('axios')).default
      const response = await axios.get('/api/ai/analyze', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
      })
      if (response.data.success) {
        setAnalysis(response.data.data)
      } else {
        setError(response.data.error || 'Error al obtener análisis')
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      if (msg.includes('no configurada')) {
        setError('API key de Anthropic no configurada. Agrega ANTHROPIC_API_KEY en el archivo .env del backend.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[9px] sm:text-[10px] font-bold tracking-[0.3em] uppercase text-teal-400/60 mb-2 sm:mb-3 font-display">
          {dateLabel}
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-tight">
              <span className="text-white/95">Analisis </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
                Inteligente
              </span>
            </h1>
            <p className="text-white/40 text-sm mt-2">Diagnostico del funnel de ventas con IA</p>
          </div>
          <motion.button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm text-white
                     transition-all duration-300 disabled:opacity-50 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
              boxShadow: loading ? 'none' : '0 0 30px rgba(20, 184, 166, 0.4)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analizando...' : analysis ? 'Re-analizar' : 'Analizar con IA'}
          </motion.button>
        </div>
      </motion.div>

      {/* Estado inicial — sin análisis */}
      {!analysis && !loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-card flex flex-col items-center justify-center py-16 gap-5"
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.15))',
                 border: '1px solid rgba(20, 184, 166, 0.2)',
                 boxShadow: '0 0 40px rgba(20, 184, 166, 0.1)'
               }}>
            <Brain className="w-10 h-10 text-teal-400" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-lg font-medium">Presiona "Analizar con IA" para obtener</p>
            <p className="text-white/40 text-sm mt-1">un diagnostico completo de tu funnel de ventas</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {['Focos rojos', 'Cuellos de botella', 'Recomendaciones', 'Tendencias'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="chart-card flex flex-col items-center justify-center py-16 gap-5"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{
                   background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.2))',
                   border: '1px solid rgba(20, 184, 166, 0.3)',
                   boxShadow: '0 0 40px rgba(20, 184, 166, 0.2)'
                 }}>
              <Sparkles className="w-8 h-8 text-teal-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-lg font-semibold">Analizando metricas con IA...</p>
            <p className="text-white/35 text-sm mt-1">Evaluando funnel, fuentes, campanas y tendencias</p>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-teal-400"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chart-card p-6"
          style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 font-semibold">Error en el analisis</p>
              <p className="text-white/50 text-sm mt-1">{error}</p>
              <button onClick={runAnalysis} className="text-teal-400 text-sm font-medium mt-3 hover:underline">
                Intentar de nuevo
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resultados */}
      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Puntuación + Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gauge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="chart-card flex flex-col items-center justify-center py-6 lg:col-span-3"
            >
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/35 mb-4 font-display">
                Salud del Funnel
              </p>
              <HealthGauge score={analysis.puntuacionSalud || 0} />
              <p className="text-xs text-white/40 mt-3 font-medium">
                {analysis.puntuacionSalud >= 70 ? 'Buen estado' : analysis.puntuacionSalud >= 40 ? 'Requiere atención' : 'Estado critico'}
              </p>
            </motion.div>

            {/* Resumen ejecutivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="chart-card p-6 lg:col-span-9 flex flex-col justify-center"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-teal-400/60 font-display">
                  Resumen Ejecutivo
                </p>
              </div>
              <p className="text-white/80 text-base leading-relaxed">
                {analysis.resumenEjecutivo}
              </p>
            </motion.div>
          </div>

          {/* Alertas */}
          {analysis.alertas?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-display mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Alertas
              </h2>
              <div className="space-y-3">
                {analysis.alertas.map((alerta, i) => {
                  const config = alertConfig[alerta.tipo] || alertConfig.info
                  const Icon = config.icon
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="rounded-xl p-4"
                      style={{
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                        boxShadow: config.glow
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                             style={{ background: `${config.bg}`, border: `1px solid ${config.border}` }}>
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold" style={{ color: config.color }}>
                              {alerta.titulo}
                            </span>
                            {alerta.metrica && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                    style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}>
                                {alerta.metrica}
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-sm">{alerta.detalle}</p>
                          {alerta.recomendacion && (
                            <div className="flex items-start gap-1.5 mt-2">
                              <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: config.color }} />
                              <p className="text-xs font-medium" style={{ color: config.color }}>
                                {alerta.recomendacion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Insights + Recomendaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights */}
            {analysis.insights?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight font-display mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-cyan-400" />
                  Insights
                </h2>
                <div className="space-y-3">
                  {analysis.insights.map((insight, i) => {
                    const CatIcon = categoryIcons[insight.categoria] || BarChart3
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.08 }}
                        className="chart-card p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                               style={{
                                 background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.15))',
                                 border: '1px solid rgba(20, 184, 166, 0.2)'
                               }}>
                            <CatIcon className="w-4 h-4 text-teal-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white/80">{insight.titulo}</p>
                            <p className="text-xs text-white/45 mt-1 leading-relaxed">{insight.detalle}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {analysis.recomendaciones?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight font-display mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Recomendaciones
                </h2>
                <div className="space-y-3">
                  {analysis.recomendaciones.map((rec, i) => {
                    const pConfig = prioridadConfig[rec.prioridad] || prioridadConfig.media
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="chart-card p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5"
                                style={{ background: pConfig.bg, border: `1px solid ${pConfig.border}`, color: pConfig.color }}>
                            {rec.prioridad}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-white/80">{rec.accion}</p>
                            {rec.impactoEsperado && (
                              <p className="text-xs text-white/40 mt-1">
                                <span className="text-teal-400/60 font-semibold">Impacto:</span> {rec.impactoEsperado}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default AnalysisView
