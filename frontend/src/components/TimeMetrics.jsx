import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Zap, Timer } from 'lucide-react'

function TimeMetrics({ times }) {
  if (!times) {
    return (
      <motion.div
        className="flex items-center justify-center h-full text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        No hay datos disponibles
      </motion.div>
    )
  }

  const metrics = [
    {
      icon: Clock,
      label: 'Promedio',
      value: times.promedioTiempoCierre,
      unit: 'días',
      gradient: 'from-teal-500 to-cyan-400',
      glow: 'rgba(20, 184, 166, 0.4)'
    },
    {
      icon: Zap,
      label: 'Más Rápido',
      value: times.tiempoMinimoCierre,
      unit: 'días',
      gradient: 'from-green-500 to-emerald-400',
      glow: 'rgba(34, 197, 94, 0.4)'
    },
    {
      icon: Timer,
      label: 'Más Lento',
      value: times.tiempoMaximoCierre,
      unit: 'días',
      gradient: 'from-blue-500 to-indigo-400',
      glow: 'rgba(59, 130, 246, 0.4)'
    }
  ]

  const efficiency = Math.max(100 - (times.promedioTiempoCierre / 60 * 100), 10)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={index}
            className="p-4 rounded-2xl group cursor-default"
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
            variants={itemVariants}
            whileHover={{
              scale: 1.03,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              transition: { duration: 0.2 }
            }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} relative`}
                style={{ boxShadow: `0 0 20px ${metric.glow}` }}
                whileHover={{
                  scale: 1.1,
                  boxShadow: `0 0 30px ${metric.glow}`,
                  transition: { duration: 0.2 }
                }}
              >
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </motion.div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1 font-display">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <motion.span
                    className="text-3xl font-extrabold text-white tracking-tight font-display"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.4, type: 'spring', stiffness: 200 }}
                  >
                    {metric.value}
                  </motion.span>
                  <span className="text-sm font-medium text-white/40">{metric.unit}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Info badge */}
      <motion.div
        className="p-3 rounded-xl text-center"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)'
        }}
        variants={itemVariants}
      >
        <p className="text-xs text-white/40">
          Basado en <span className="text-teal-400 font-bold">{times.oportunidadesAnalizadas}</span> cierres
        </p>
      </motion.div>

      {/* Efficiency bar */}
      <motion.div
        className="pt-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider font-display">Eficiencia</span>
          <motion.span
            className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {efficiency.toFixed(0)}%
          </motion.span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden relative"
             style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <motion.div
            className="h-full rounded-full relative"
            style={{
              background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
              boxShadow: '0 0 20px rgba(20, 184, 166, 0.5)'
            }}
            initial={{ width: 0 }}
            animate={{ width: `${efficiency}%` }}
            transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
                ease: 'linear'
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TimeMetrics
