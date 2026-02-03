import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function SourcesTable({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No hay datos de fuentes disponibles
      </div>
    )
  }

  const getConversionBadge = (rate) => {
    const numRate = parseFloat(rate)
    if (numRate >= 10) return { bg: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', icon: TrendingUp }
    if (numRate >= 5) return { bg: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf', icon: Minus }
    return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: TrendingDown }
  }

  const COLORS = ['#14b8a6', '#4ade80', '#0f4c75', '#2dd4bf', '#1e5f8a', '#5eead4', '#3b82f6', '#8b5cf6']

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Fuente
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Leads
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Calificados
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cierres
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Valor
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Conversión
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source, index) => {
            const badge = getConversionBadge(source.tasaConversion)
            const Icon = badge.icon
            return (
              <tr
                key={index}
                className="transition-colors hover:bg-white/5"
                style={{ borderBottom: '1px solid #1a1a1a' }}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-white text-sm">
                      {source.source}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-semibold text-white">
                    {source.total}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm text-gray-400">
                    {source.calificados}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-sm font-semibold text-green-400">
                    {source.depositos}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-sm font-medium text-white">
                    ${source.valorTotal.toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    <Icon className="h-3 w-3" />
                    {source.tasaConversion}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Resumen totales */}
      <div className="mt-6 pt-4 flex flex-wrap gap-6 justify-end" style={{ borderTop: '1px solid #2a2a2a' }}>
        <div className="text-sm">
          <span className="text-gray-500">Total Leads: </span>
          <span className="font-semibold text-white">
            {sources.reduce((sum, s) => sum + s.total, 0)}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Cierres: </span>
          <span className="font-semibold text-green-400">
            {sources.reduce((sum, s) => sum + s.depositos, 0)}
          </span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Valor Total: </span>
          <span className="font-semibold text-teal-400">
            ${sources.reduce((sum, s) => sum + s.valorTotal, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SourcesTable
