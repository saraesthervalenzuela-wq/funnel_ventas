import React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const GRADIENTS = [
  { start: '#14b8a6', end: '#2dd4bf' },
  { start: '#0ea5e9', end: '#38bdf8' },
  { start: '#8b5cf6', end: '#a78bfa' },
  { start: '#f59e0b', end: '#fbbf24' },
  { start: '#22c55e', end: '#4ade80' },
  { start: '#ec4899', end: '#f472b6' },
  { start: '#6366f1', end: '#818cf8' },
  { start: '#14b8a6', end: '#5eead4' }
]

function StageDistribution({ stages }) {
  if (!stages || stages.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center h-64 text-white/40 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        No hay datos de etapas disponibles
      </motion.div>
    )
  }

  const formatStageName = (name) => {
    if (name.length > 15) {
      return name.substring(0, 13) + '...'
    }
    return name
  }

  const chartData = stages.map((stage, index) => ({
    ...stage,
    shortName: formatStageName(stage.stage),
    gradient: GRADIENTS[index % GRADIENTS.length]
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="p-4 rounded-2xl shadow-2xl"
             style={{
               background: 'rgba(5, 5, 8, 0.95)',
               border: '1px solid rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(20px)'
             }}>
          <p className="font-bold text-white text-sm mb-2">{data.stage}</p>
          <div className="space-y-1">
            <p className="text-sm text-white/60">
              <span className="font-bold text-teal-400">{data.count}</span> oportunidades
            </p>
            {data.value > 0 && (
              <p className="text-sm text-green-400 font-semibold">
                ${data.value.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      className="h-72 relative"
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
          background: 'radial-gradient(ellipse at 20% 50%, rgba(20, 184, 166, 0.08) 0%, transparent 50%)'
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={entry.gradient.start} />
                <stop offset="100%" stopColor={entry.gradient.end} />
              </linearGradient>
            ))}
            {/* Glow filter */}
            <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)', fontWeight: 500, fontFamily: 'Red Hat Text' }}
            stroke="rgba(255,255,255,0.06)"
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)', fontWeight: 600, fontFamily: 'Manrope' }}
            stroke="rgba(255,255,255,0.06)"
            width={100}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.08)' }} />
          <Bar
            dataKey="count"
            radius={[0, 8, 8, 0]}
            maxBarSize={28}
            animationBegin={100}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient-${index})`}
                filter="url(#barGlow)"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

export default StageDistribution
