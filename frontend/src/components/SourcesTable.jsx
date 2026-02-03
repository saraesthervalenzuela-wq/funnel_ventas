import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function SourcesTable({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-32 text-white/40 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        No hay datos de fuentes disponibles
      </motion.div>
    )
  }

  const getConversionBadge = (rate) => {
    const numRate = parseFloat(rate)
    if (numRate >= 10) return {
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
      glow: 'rgba(34, 197, 94, 0.3)',
      icon: TrendingUp
    }
    if (numRate >= 5) return {
      bg: 'rgba(20, 184, 166, 0.15)',
      border: 'rgba(20, 184, 166, 0.3)',
      color: '#2dd4bf',
      glow: 'rgba(20, 184, 166, 0.3)',
      icon: Minus
    }
    return {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      color: '#f87171',
      glow: 'rgba(239, 68, 68, 0.3)',
      icon: TrendingDown
    }
  }

  const GRADIENTS = [
    'from-teal-500 to-cyan-400',
    'from-green-500 to-emerald-400',
    'from-blue-500 to-sky-400',
    'from-purple-500 to-violet-400',
    'from-amber-500 to-yellow-400',
    'from-pink-500 to-rose-400',
    'from-indigo-500 to-blue-400',
    'from-cyan-500 to-teal-400'
  ]

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  }

  return (
    <motion.div
      className="overflow-x-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <table className="w-full">
        <thead>
          <motion.tr
            style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <th className="text-left py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Fuente
            </th>
            <th className="text-center py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Leads
            </th>
            <th className="text-center py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Calificados
            </th>
            <th className="text-center py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Cierres
            </th>
            <th className="text-right py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Valor
            </th>
            <th className="text-center py-4 px-4 text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] font-display">
              Conversión
            </th>
          </motion.tr>
        </thead>
        <tbody>
          {sources.map((source, index) => {
            const badge = getConversionBadge(source.tasaConversion)
            const Icon = badge.icon
            return (
              <motion.tr
                key={index}
                className="group cursor-default"
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                whileHover={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  transition: { duration: 0.2 }
                }}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${GRADIENTS[index % GRADIENTS.length]}`}
                      style={{ boxShadow: '0 0 10px rgba(20, 184, 166, 0.4)' }}
                      whileHover={{ scale: 1.3 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span className="font-semibold text-white/80 text-sm group-hover:text-white transition-colors">
                      {source.source}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-bold text-white">
                    {source.total}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-medium text-white/50">
                    {source.calificados}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    {source.depositos}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-bold text-white">
                    ${source.valorTotal.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <motion.span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      boxShadow: `0 0 15px ${badge.glow}`
                    }}
                    whileHover={{
                      scale: 1.1,
                      boxShadow: `0 0 25px ${badge.glow}`,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.5} />
                    {source.tasaConversion}%
                  </motion.span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>

      {/* Summary totals */}
      <motion.div
        className="mt-8 pt-6 flex flex-wrap gap-8 justify-end"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sources.length * 0.08 + 0.3, duration: 0.5 }}
      >
        <motion.div
          className="text-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/40 font-medium">Total Leads </span>
          <span className="font-bold text-white text-lg ml-1 font-display">
            {sources.reduce((sum, s) => sum + s.total, 0)}
          </span>
        </motion.div>
        <motion.div
          className="text-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/40 font-medium">Cierres </span>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-lg ml-1 font-display">
            {sources.reduce((sum, s) => sum + s.depositos, 0)}
          </span>
        </motion.div>
        <motion.div
          className="text-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/40 font-medium">Valor Total </span>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 text-lg ml-1 font-display">
            ${sources.reduce((sum, s) => sum + s.valorTotal, 0).toLocaleString()}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default SourcesTable
