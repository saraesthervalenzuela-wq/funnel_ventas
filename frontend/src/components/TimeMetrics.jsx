import React from 'react'
import { Clock, Zap, Timer } from 'lucide-react'

function TimeMetrics({ times }) {
  if (!times) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No hay datos disponibles
      </div>
    )
  }

  const metrics = [
    {
      icon: Clock,
      label: 'Promedio',
      value: times.promedioTiempoCierre,
      unit: 'días',
      color: '#14b8a6'
    },
    {
      icon: Zap,
      label: 'Más Rápido',
      value: times.tiempoMinimoCierre,
      unit: 'días',
      color: '#4ade80'
    },
    {
      icon: Timer,
      label: 'Más Lento',
      value: times.tiempoMaximoCierre,
      unit: 'días',
      color: '#0f4c75'
    }
  ]

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <div
            key={index}
            className="p-4 rounded-xl transition-all"
            style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${metric.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: metric.color }} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{metric.value}</span>
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Info adicional */}
      <div className="p-3 rounded-lg" style={{ backgroundColor: '#141414' }}>
        <p className="text-xs text-gray-500">
          Basado en <span className="text-teal-400 font-medium">{times.oportunidadesAnalizadas}</span> cierres
        </p>
      </div>

      {/* Barra de eficiencia */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500">Eficiencia</span>
          <span className="text-xs text-teal-400">
            {Math.max(100 - (times.promedioTiempoCierre / 60 * 100), 10).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(100 - (times.promedioTiempoCierre / 60 * 100), 10)}%`,
              background: 'linear-gradient(90deg, #14b8a6, #2dd4bf)'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default TimeMetrics
