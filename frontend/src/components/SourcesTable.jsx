import React from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Facebook,
  Instagram,
  Globe,
  Users,
  Search,
  Video,
  Mail,
  MessageCircle,
  Megaphone,
  Smartphone
} from 'lucide-react'

// Mapeo de iconos por fuente
const SOURCE_ICONS = {
  'facebook': Facebook,
  'facebook ads': Facebook,
  'google': Search,
  'google ads': Search,
  'instagram': Instagram,
  'tiktok': Video,
  'tiktok ads': Video,
  'referidos': Users,
  'referral': Users,
  'orgánico': Globe,
  'orgánico web': Globe,
  'organic': Globe,
  'email': Mail,
  'whatsapp': MessageCircle,
  'linkedin': Megaphone,
  'sms': Smartphone,
  'default': Globe
}

const getSourceIcon = (sourceName) => {
  const normalizedName = sourceName.toLowerCase().trim()
  for (const [key, icon] of Object.entries(SOURCE_ICONS)) {
    if (normalizedName.includes(key)) {
      return icon
    }
  }
  return SOURCE_ICONS.default
}

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
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        delay: i * 0.12,
        duration: 0.6,
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
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <th className="text-left py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
              Fuente
            </th>
            <th className="text-center py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
              Leads
            </th>
            <th className="text-center py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
              Calificados
            </th>
            <th className="text-center py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
              Cierres
            </th>
            <th className="text-right py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
              Valor
            </th>
            <th className="text-center py-5 px-5 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
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
                whileInView="visible"
                viewport={{ once: true, margin: "-20px" }}
                whileHover={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  transition: { duration: 0.2 }
                }}
              >
                <td className="py-5 px-5">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const SourceIcon = getSourceIcon(source.source)
                      return (
                        <motion.div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} flex items-center justify-center`}
                          style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SourceIcon className="w-5 h-5 text-white" strokeWidth={2} />
                        </motion.div>
                      )
                    })()}
                    <span className="font-semibold text-white/90 text-base group-hover:text-white transition-colors">
                      {source.source}
                    </span>
                  </div>
                </td>
                <td className="py-5 px-5 text-center">
                  <span className="text-base font-bold text-white">
                    {source.total}
                  </span>
                </td>
                <td className="py-5 px-5 text-center">
                  <span className="text-base font-medium text-white/50">
                    {source.calificados}
                  </span>
                </td>
                <td className="py-5 px-5 text-center">
                  <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    {source.depositos}
                  </span>
                </td>
                <td className="py-5 px-5 text-right">
                  <span className="text-base font-bold text-white">
                    ${source.valorTotal.toLocaleString()}
                  </span>
                </td>
                <td className="py-5 px-5 text-center">
                  <motion.span
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
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
                    <Icon className="h-4 w-4" strokeWidth={2.5} />
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
        className="mt-10 pt-8 flex flex-wrap gap-12 justify-end"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="text-base"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/50 font-medium">Total Leads </span>
          <span className="font-bold text-white text-2xl ml-2 font-display">
            {sources.reduce((sum, s) => sum + s.total, 0)}
          </span>
        </motion.div>
        <motion.div
          className="text-base"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/50 font-medium">Cierres </span>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-2xl ml-2 font-display">
            {sources.reduce((sum, s) => sum + s.depositos, 0)}
          </span>
        </motion.div>
        <motion.div
          className="text-base"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-white/50 font-medium">Valor Total </span>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-400 text-2xl ml-2 font-display">
            ${sources.reduce((sum, s) => sum + s.valorTotal, 0).toLocaleString()}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default SourcesTable
