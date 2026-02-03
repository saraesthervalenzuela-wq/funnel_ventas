import React from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-64 text-white/40 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        No hay datos de tendencia disponibles
      </motion.div>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    dateFormatted: new Date(item.date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short'
    })
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 rounded-2xl shadow-2xl"
             style={{
               background: 'rgba(5, 5, 8, 0.95)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(20px)'
             }}>
          <p className="font-bold text-white text-sm mb-3">
            {new Date(label).toLocaleDateString('es-MX', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                     style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                <span className="text-sm text-white/60">{entry.name}:</span>
                <span className="text-sm font-bold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      className="h-64 relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        style={{
          background: 'radial-gradient(ellipse at 50% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)'
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="gradientLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientDepositos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="strokeLeads" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="strokeDepositos" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Glow filters */}
            <filter id="glowLeads" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="glowDepositos" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 10, fill: 'rgba(255, 255, 255, 0.3)', fontWeight: 500, fontFamily: 'Red Hat Text' }}
            stroke="rgba(255, 255, 255, 0.06)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255, 255, 255, 0.3)', fontWeight: 500, fontFamily: 'Red Hat Text' }}
            stroke="rgba(255, 255, 255, 0.06)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="url(#strokeLeads)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradientLeads)"
            filter="url(#glowLeads)"
            animationBegin={200}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Area
            type="monotone"
            dataKey="depositos"
            name="Cierres"
            stroke="url(#strokeDepositos)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#gradientDepositos)"
            filter="url(#glowDepositos)"
            animationBegin={400}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export default TrendChart
