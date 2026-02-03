import React from 'react'
import { motion } from 'framer-motion'

function FunnelChart({ data }) {
  if (!data) return null

  const stages = [
    { name: 'Total Leads', value: data.totalLeads, gradient: 'from-teal-500 to-teal-400', glow: 'rgba(20, 184, 166, 0.4)' },
    { name: 'Calificados', value: data.leadsCalificados, gradient: 'from-teal-400 to-cyan-400', glow: 'rgba(34, 211, 238, 0.4)' },
    { name: 'Agendados', value: data.agendadasValoracion, gradient: 'from-cyan-400 to-sky-400', glow: 'rgba(56, 189, 248, 0.4)' },
    { name: 'Valorados', value: data.valoradasCotizacion, gradient: 'from-sky-500 to-blue-500', glow: 'rgba(59, 130, 246, 0.4)' },
    { name: 'Oport. Cierre', value: data.oportunidadesCierreTotal, gradient: 'from-blue-500 to-indigo-500', glow: 'rgba(99, 102, 241, 0.4)' },
    { name: 'Cerrados', value: data.depositosRealizados, gradient: 'from-green-500 to-emerald-400', glow: 'rgba(34, 197, 94, 0.5)' }
  ]

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stages.map((stage, index) => {
        const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
        const conversionRate = index > 0 && stages[index - 1].value > 0
          ? ((stage.value / stages[index - 1].value) * 100).toFixed(0)
          : null

        return (
          <motion.div
            key={stage.name}
            className="group"
            variants={itemVariants}
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors font-display">
                {stage.name}
              </span>
              <div className="flex items-center gap-3">
                <motion.span
                  className="text-sm font-bold text-white"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                >
                  {stage.value}
                </motion.span>
                {conversionRate && (
                  <motion.span
                    className="text-[10px] font-semibold text-white/30 bg-white/5 px-2 py-0.5 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    {conversionRate}%
                  </motion.span>
                )}
              </div>
            </div>
            <div className="relative h-10 rounded-xl overflow-hidden"
                 style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r ${stage.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(percentage, 4)}%` }}
                transition={{
                  delay: index * 0.1 + 0.2,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{
                  boxShadow: `0 0 20px ${stage.glow}`
                }}
                whileHover={{
                  boxShadow: `0 0 35px ${stage.glow}`,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'linear'
                  }}
                />

                {percentage > 20 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/90">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </motion.div>
            </div>
          </motion.div>
        )
      })}

      {/* Resumen de conversión */}
      <motion.div
        className="mt-8 p-5 rounded-2xl relative overflow-hidden group cursor-default"
        style={{
          background: 'rgba(20, 184, 166, 0.08)',
          border: '1px solid rgba(20, 184, 166, 0.2)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{
          scale: 1.02,
          borderColor: 'rgba(20, 184, 166, 0.4)',
          transition: { duration: 0.3 }
        }}
      >
        {/* Animated glow effect */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.15) 0%, transparent 70%)' }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider font-display">Conversión Total</span>
            <p className="text-[10px] text-white/30 mt-0.5">Lead a Cierre</p>
          </div>
          <motion.span
            className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-display"
            style={{ textShadow: '0 0 40px rgba(20, 184, 166, 0.5)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5, type: 'spring', stiffness: 200 }}
          >
            {data.tasaConversion}%
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default FunnelChart
