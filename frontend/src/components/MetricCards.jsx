import React from 'react'
import { motion } from 'framer-motion'

function MetricCard({ title, value, subtitle, color, stale = 0, index = 0 }) {
  const formatNumber = (num) => {
    if (typeof num === 'number') {
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
      case 'orange': return 'from-orange-500 to-amber-400'
      case 'yellow': return 'from-yellow-500 to-amber-300'
      case 'pink': return 'from-pink-500 to-rose-400'
      case 'indigo': return 'from-indigo-500 to-blue-400'
      case 'emerald': return 'from-emerald-500 to-green-400'
      case 'slate': return 'from-slate-400 to-gray-300'
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
      case 'orange': return 'rgba(249, 115, 22, 0.5)'
      case 'yellow': return 'rgba(234, 179, 8, 0.5)'
      case 'pink': return 'rgba(236, 72, 153, 0.5)'
      case 'indigo': return 'rgba(99, 102, 241, 0.5)'
      case 'emerald': return 'rgba(16, 185, 129, 0.5)'
      case 'slate': return 'rgba(148, 163, 184, 0.5)'
      default: return 'rgba(20, 184, 166, 0.5)'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        delay: index * 0.05,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{
        y: -8,
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className="metric-card group cursor-default"
    >
      <motion.div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl"
        style={{ background: getGlowColor() }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.4 }}
      />

      <div className="flex items-center gap-2 mb-3 relative z-10">
        <motion.div
          className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${getGradient()}`}
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
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-white/35 font-display leading-tight">
          {title}
        </span>
      </div>

      <motion.p
        className="font-extrabold text-white mb-1 relative z-10 font-display text-3xl"
        style={{
          letterSpacing: '-0.04em',
          textShadow: `0 0 50px ${getGlowColor()}`
        }}
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
      >
        {formatNumber(value)}
      </motion.p>

      {subtitle && (
        <p className="text-xs text-white/45 font-medium relative z-10">
          {subtitle}
        </p>
      )}

      {stale > 0 && (
        <p className="text-[10px] text-amber-400/70 font-semibold relative z-10 mt-1.5">
          ⏳ {stale} con +7 dias
        </p>
      )}
    </motion.div>
  )
}

const STAGE_CARDS_CONFIG = [
  { key: 'e0_noInteresado', title: 'E0. No Interesado', color: 'slate', subtitle: 'Descartados' },
  { key: 'e1_nuevoLead', title: 'E1. Nuevo Lead', color: 'teal', subtitle: 'Leads nuevos' },
  { key: 'e2_interes', title: 'E2. Interes en VV', color: 'blue', subtitle: 'Pendiente envio fotos' },
  { key: 'e3_seguimiento', title: 'E3. Seguimiento Fotos', color: 'cyan', subtitle: 'Fotos no enviadas' },
  { key: 'e4_fotosRecibidas', title: 'E4. Fotos Recibidas', color: 'indigo', subtitle: 'Pendiente VV' },
  { key: 'e5_valoracionVirtual', title: 'E5. Valoracion Virtual', color: 'purple', subtitle: 'Agendada' },
  { key: 'vvReagendada', title: 'VV Re Agendada', color: 'orange', subtitle: 'Reagendadas' },
  { key: 'e6_noContesto', title: 'E6. No Contesto', color: 'red', subtitle: 'Sin respuesta' },
  { key: 'e7_valoracionRealizada', title: 'E7. Valoracion Realizada', color: 'pink', subtitle: 'Cotizacion enviada' },
  { key: 'e8_seguimientoCierre', title: 'E8. Seguimiento Cierre', color: 'yellow', subtitle: 'En proceso de cierre' },
  { key: 'e9_deposito', title: 'E9. Deposito Realizado', color: 'emerald', subtitle: 'Sin fecha de cirugia' },
  { key: 'e10_fechaCirugia', title: 'E10. Fecha Cirugia', color: 'green', subtitle: 'Fecha seleccionada' }
]

function MetricCards({ currentStages }) {
  if (!currentStages) return null

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="badge badge-teal">En vivo</span>
        <p className="text-sm text-white/40 font-medium">
          Estado actual del pipeline — {currentStages.total?.toLocaleString()} oportunidades totales
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {STAGE_CARDS_CONFIG.map((card, index) => {
          const stageData = currentStages.porEtapa?.[card.key]
          const count = typeof stageData === 'object' ? stageData.count : (stageData || 0)
          const stale = typeof stageData === 'object' ? stageData.stale : 0
          return (
            <MetricCard
              key={card.key}
              title={card.title}
              value={count}
              stale={stale}
              color={card.color}
              subtitle={card.subtitle}
              index={index}
            />
          )
        })}
      </div>
    </div>
  )
}

export default MetricCards
