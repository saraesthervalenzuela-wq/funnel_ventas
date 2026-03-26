import React from 'react'
import { motion } from 'framer-motion'

function FunnelChart({ data, responseTime }) {
  if (!data) return null

  const stages = [
    {
      name: 'Total Leads',
      value: data.totalLeads,
      gradient: 'from-teal-500 to-teal-400',
      glow: 'rgba(20, 184, 166, 0.4)'
    },
    {
      name: 'Calificados',
      desc: 'Avanzaron de E1',
      value: data.leadsCalificados,
      gradient: 'from-cyan-500 to-cyan-400',
      glow: 'rgba(6, 182, 212, 0.4)'
    },
    {
      name: 'Agendados VV',
      desc: 'Valoracion programada',
      value: data.agendadasValoracion,
      gradient: 'from-blue-500 to-blue-400',
      glow: 'rgba(59, 130, 246, 0.4)'
    },
    {
      name: 'Valorados',
      desc: 'Cotizacion enviada',
      value: data.valoradasCotizacion,
      gradient: 'from-indigo-500 to-indigo-400',
      glow: 'rgba(99, 102, 241, 0.4)'
    },
    {
      name: 'Oport. Cierre',
      desc: 'En seguimiento',
      value: data.oportunidadesCierreTotal,
      gradient: 'from-purple-500 to-purple-400',
      glow: 'rgba(168, 85, 247, 0.4)'
    },
    {
      name: 'Cerrados',
      desc: 'Deposito realizado',
      value: data.depositosRealizados,
      gradient: 'from-green-500 to-emerald-400',
      glow: 'rgba(34, 197, 94, 0.5)'
    }
  ]

  const maxValue = Math.max(stages[0].value, 1)

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      {stages.map((stage, index) => {
        const percentage = (stage.value / maxValue) * 100
        const prevValue = index > 0 ? stages[index - 1].value : null
        const conversionRate = prevValue && prevValue > 0
          ? ((stage.value / prevValue) * 100).toFixed(0)
          : null

        return (
          <motion.div
            key={stage.name}
            className="group"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, x: 5 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white/50 group-hover:text-white/70 transition-colors font-display">
                  {stage.name}
                </span>
                {stage.desc && (
                  <span className="text-[10px] text-white/25 hidden sm:inline">
                    {stage.desc}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  {stage.value}
                </span>
                {conversionRate && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    parseInt(conversionRate) >= 50
                      ? 'text-green-400 bg-green-500/10'
                      : parseInt(conversionRate) >= 25
                        ? 'text-yellow-400 bg-yellow-500/10'
                        : 'text-red-400 bg-red-500/10'
                  }`}>
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-10 rounded-xl overflow-hidden"
                 style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-xl bg-gradient-to-r ${stage.gradient}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(percentage, 4)}%` }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1 + 0.2,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }}
                style={{ boxShadow: `0 0 20px ${stage.glow}` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
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

      {/* KPIs de conversión */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <motion.div
          className="p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(20, 184, 166, 0.08)',
            border: '1px solid rgba(20, 184, 166, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider font-display">Conversion Total</span>
          <p className="text-[9px] text-white/25 mt-0.5">Lead a Cierre</p>
          <motion.p
            className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 font-display mt-1"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1, duration: 0.5, type: 'spring' }}
          >
            {data.tasaConversion}%
          </motion.p>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider font-display">Tiempo Respuesta</span>
          <p className="text-[9px] text-white/25 mt-0.5">Promedio en conversaciones</p>
          <motion.p
            className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 font-display mt-1"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.5, type: 'spring' }}
          >
            {responseTime
              ? responseTime.avgMinutes >= 60
                ? `${Math.floor(responseTime.avgMinutes / 60)}h ${responseTime.avgMinutes % 60}m`
                : `${responseTime.avgMinutes} min`
              : '...'
            }
          </motion.p>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider font-display">Tasa Contacto</span>
          <p className="text-[9px] text-white/25 mt-0.5">Lead a Calificado</p>
          <motion.p
            className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400 font-display mt-1"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2, duration: 0.5, type: 'spring' }}
          >
            {data.tasaContacto}%
          </motion.p>
        </motion.div>

        <motion.div
          className="p-4 rounded-2xl relative overflow-hidden"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider font-display">No Contactadas</span>
          <p className="text-[9px] text-white/25 mt-0.5">Sin respuesta</p>
          <motion.p
            className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400 font-display mt-1"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 1.3, duration: 0.5, type: 'spring' }}
          >
            {data.noContactoValoracion}
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default FunnelChart
