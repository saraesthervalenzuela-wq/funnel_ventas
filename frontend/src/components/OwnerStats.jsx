import React from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

const OWNER_STYLES = {
  'Alexa':  { gradient: 'from-pink-500 to-rose-400',    glow: 'rgba(236, 72, 153, 0.5)' },
  'Misael': { gradient: 'from-blue-500 to-cyan-400',    glow: 'rgba(59, 130, 246, 0.5)' },
  'Pedro':  { gradient: 'from-emerald-500 to-teal-400', glow: 'rgba(16, 185, 129, 0.5)' }
}

function OwnerCard({ owner, index }) {
  const style = OWNER_STYLES[owner.name] || { gradient: 'from-teal-500 to-cyan-400', glow: 'rgba(20, 184, 166, 0.5)' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3 } }}
      className="metric-card relative overflow-hidden group"
    >
      <motion.div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl"
        style={{ background: style.glow }}
        initial={{ opacity: 0.25 }}
        whileHover={{ opacity: 0.55 }}
        transition={{ duration: 0.4 }}
      />

      <div className="flex items-center gap-3 mb-5 relative z-10">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shrink-0`}
             style={{ boxShadow: `0 0 20px ${style.glow}` }}>
          <User className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/35 font-display leading-tight">
            Owner
          </p>
          <h4 className="text-lg font-bold text-white font-display leading-tight">
            {owner.name}
          </h4>
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-bold tracking-wider uppercase text-white/35 mb-1">Total Leads</p>
        <p className="text-4xl font-extrabold text-white font-display"
           style={{ letterSpacing: '-0.04em', textShadow: `0 0 30px ${style.glow}` }}>
          {owner.totalLeads.toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5 relative z-10">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Calificados</p>
          <p className="text-lg font-bold text-white mt-0.5">{owner.calificados.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Cierres</p>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{owner.cierres.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Conv.</p>
          <p className="text-lg font-bold text-teal-400 mt-0.5">{owner.tasaConversion}%</p>
        </div>
      </div>
    </motion.div>
  )
}

function OwnerStats({ owners }) {
  if (!owners || owners.length === 0) {
    return (
      <p className="text-white/40 text-sm py-6 text-center">
        Sin datos de leads por owner en el periodo seleccionado.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {owners.map((owner, i) => (
        <OwnerCard key={owner.ownerId} owner={owner} index={i} />
      ))}
    </div>
  )
}

export default OwnerStats
