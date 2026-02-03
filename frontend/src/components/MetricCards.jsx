import React from 'react'
import { motion } from 'framer-motion'

function MetricCard({ title, value, subtitle, color, isLarge = false, index = 0 }) {
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return num >= 10000 ? `$${(num / 1000).toFixed(0)}K` : num.toLocaleString()
      }
      return num.toLocaleString()
    }
    return num
  }

  const getGradient = () => {
    switch(color) {
      case 'teal': return 'from-teal-500 to-cyan-400'
      case 'green': return 'from-green-500 to-emerald-400'
      case 'red': return 'from-red-500 to-rose-400'
      case 'blue': return 'from-blue-500 to-sky-400'
      case 'purple': return 'from-purple-500 to-violet-400'
      case 'cyan': return 'from-cyan-500 to-teal-400'
      default: return 'from-teal-500 to-cyan-400'
    }
  }

  const getGlowColor = () => {
    switch(color) {
      case 'teal': return 'rgba(20, 184, 166, 0.5)'
      case 'green': return 'rgba(34, 197, 94, 0.5)'
      case 'red': return 'rgba(239, 68, 68, 0.5)'
      case 'blue': return 'rgba(59, 130, 246, 0.5)'
      case 'purple': return 'rgba(168, 85, 247, 0.5)'
      case 'cyan': return 'rgba(6, 182, 212, 0.5)'
      default: return 'rgba(20, 184, 166, 0.5)'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{
        y: -8,
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className="metric-card group cursor-default"
    >
      {/* Glow orb effect */}
      <motion.div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl"
        style={{ background: getGlowColor() }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.4 }}
      />

      {/* Header with indicator */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <motion.div
          className={`w-3 h-3 rounded-full bg-gradient-to-r ${getGradient()}`}
          style={{ boxShadow: `0 0 15px ${getGlowColor()}` }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/35 font-display">
          {title}
        </span>
      </div>

      {/* Value - Bold Typography with Manrope */}
      <motion.p
        className={`font-extrabold text-white mb-2 relative z-10 font-display ${isLarge ? 'text-5xl' : 'text-4xl'}`}
        style={{
          letterSpacing: '-0.04em',
          textShadow: `0 0 50px ${getGlowColor()}`
        }}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08 + 0.2, duration: 0.4 }}
      >
        {formatNumber(value)}
      </motion.p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-white/45 font-medium relative z-10">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

function MetricCards({ metrics }) {
  if (!metrics) return null

  const mainCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      color: 'teal',
      subtitle: 'Leads del periodo',
      isLarge: true
    },
    {
      title: 'Leads Calificados',
      value: metrics.leadsCalificados,
      color: 'blue',
      subtitle: `${metrics.tasaContacto}% contactados`,
      isLarge: true
    },
    {
      title: 'Valoraciones',
      value: metrics.valoradasCotizacion,
      color: 'purple',
      subtitle: 'Con cotización',
      isLarge: true
    },
    {
      title: 'Tasa Conversión',
      value: `${metrics.tasaConversion}%`,
      color: 'green',
      subtitle: 'Lead a cierre',
      isLarge: true
    }
  ]

  const secondaryCards = [
    {
      title: 'Agendadas',
      value: metrics.agendadasValoracion,
      color: 'cyan',
      subtitle: 'Citas programadas'
    },
    {
      title: 'No Contactadas',
      value: metrics.noContactoValoracion,
      color: 'red',
      subtitle: 'Pendientes'
    },
    {
      title: 'Oport. Cierre',
      value: metrics.oportunidadesCierreTotal,
      color: 'teal',
      subtitle: `${metrics.oportunidadesCierreAlta} alta / ${metrics.oportunidadesCierreMedia} media`
    },
    {
      title: 'Depósitos',
      value: metrics.depositosRealizados,
      color: 'green',
      subtitle: `$${metrics.totalDepositos?.toLocaleString() || 0}`
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main metrics - Hero cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {mainCards.map((card, index) => (
          <MetricCard key={index} {...card} index={index} />
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card, index) => (
          <MetricCard key={index} {...card} index={index + 4} />
        ))}
      </div>
    </div>
  )
}

export default MetricCards
