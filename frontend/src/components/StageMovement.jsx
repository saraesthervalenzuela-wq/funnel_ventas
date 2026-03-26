import React from 'react'
import { motion } from 'framer-motion'

const STAGE_CONFIG = [
  { key: 'e0_noInteresado', label: 'E0. No Interesado', color: '#94a3b8' },
  { key: 'e1_nuevoLead', label: 'E1. Nuevo Lead', color: '#14b8a6' },
  { key: 'e2_interes', label: 'E2. Interes en VV', color: '#3b82f6' },
  { key: 'e3_seguimiento', label: 'E3. Seguimiento Fotos', color: '#06b6d4' },
  { key: 'e4_fotosRecibidas', label: 'E4. Fotos Recibidas', color: '#6366f1' },
  { key: 'e5_valoracionVirtual', label: 'E5. Valoracion Virtual', color: '#8b5cf6' },
  { key: 'vvReagendada', label: 'VV Re Agendada', color: '#f97316' },
  { key: 'e6_noContesto', label: 'E6. No Contesto', color: '#ef4444' },
  { key: 'e7_valoracionRealizada', label: 'E7. Valoracion Realizada', color: '#ec4899' },
  { key: 'e8_seguimientoCierre', label: 'E8. Seguimiento Cierre', color: '#eab308' },
  { key: 'e9_deposito', label: 'E9. Deposito Realizado', color: '#10b981' },
  { key: 'e10_fechaCirugia', label: 'E10. Fecha Cirugia', color: '#22c55e' }
]

function StageMovement({ funnel }) {
  if (!funnel?.porEtapa) return null

  const porEtapa = funnel.porEtapa
  const total = Object.values(porEtapa).reduce((sum, v) => sum + v, 0)
  const maxCount = Math.max(...Object.values(porEtapa), 1)

  return (
    <div className="space-y-3">
      {STAGE_CONFIG.map((stage, index) => {
        const count = porEtapa[stage.key] || 0
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0

        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            className="flex items-center gap-4"
          >
            <div className="w-44 sm:w-52 shrink-0">
              <span className="text-xs sm:text-sm font-semibold text-white/60 truncate block">
                {stage.label}
              </span>
            </div>
            <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stage.color}, ${stage.color}cc)`,
                  boxShadow: `0 0 12px ${stage.color}40`
                }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 + 0.2, duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="w-12 text-right shrink-0">
              <span className="text-sm font-bold text-white/80">{count}</span>
            </div>
          </motion.div>
        )
      })}
      <div className="pt-3 border-t border-white/10 flex justify-between">
        <span className="text-sm text-white/40 font-medium">Total movimientos en el periodo</span>
        <span className="text-sm font-bold text-white/70">{total}</span>
      </div>
    </div>
  )
}

export default StageMovement
