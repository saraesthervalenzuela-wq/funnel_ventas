import React from 'react'

function FunnelChart({ data }) {
  if (!data) return null

  const stages = [
    { name: 'Total Leads', value: data.totalLeads, color: '#14b8a6' },
    { name: 'Calificados', value: data.leadsCalificados, color: '#2dd4bf' },
    { name: 'Agendados', value: data.agendadasValoracion, color: '#5eead4' },
    { name: 'Valorados', value: data.valoradasCotizacion, color: '#0f4c75' },
    { name: 'Oport. Cierre', value: data.oportunidadesCierreTotal, color: '#1e5f8a' },
    { name: 'Cerrados', value: data.depositosRealizados, color: '#4ade80' }
  ]

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
        const conversionRate = index > 0 && stages[index - 1].value > 0
          ? ((stage.value / stages[index - 1].value) * 100).toFixed(0)
          : null

        return (
          <div key={stage.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">{stage.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{stage.value}</span>
                {conversionRate && (
                  <span className="text-xs text-gray-500">
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-8 rounded-lg overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out flex items-center"
                style={{
                  width: `${Math.max(percentage, 3)}%`,
                  backgroundColor: stage.color,
                }}
              >
                {percentage > 15 && (
                  <span className="absolute right-2 text-xs font-medium text-white/80">
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Resumen de conversión */}
      <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)' }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Conversión Total</span>
            <p className="text-xs text-gray-500">Lead a Cierre</p>
          </div>
          <span className="text-3xl font-bold text-teal-400">
            {data.tasaConversion}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default FunnelChart
