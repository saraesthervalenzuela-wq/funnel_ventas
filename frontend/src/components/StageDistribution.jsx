import React from 'react'
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

const COLORS = [
  '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
  '#0f4c75', '#1e5f8a', '#2980b9', '#3498db',
  '#4ade80', '#22c55e', '#16a34a'
]

function StageDistribution({ stages }) {
  if (!stages || stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos de etapas disponibles
      </div>
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
    fill: COLORS[index % COLORS.length]
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="p-3 rounded-lg shadow-xl" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <p className="font-medium text-white text-sm mb-1">{data.stage}</p>
          <p className="text-sm text-gray-400">
            <span className="font-semibold text-teal-400">{data.count}</span> oportunidades
          </p>
          {data.value > 0 && (
            <p className="text-sm text-green-400">
              ${data.value.toLocaleString()} valor
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#666' }}
            stroke="#2a2a2a"
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 10, fill: '#888' }}
            stroke="#2a2a2a"
            width={90}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20,184,166,0.1)' }} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StageDistribution
