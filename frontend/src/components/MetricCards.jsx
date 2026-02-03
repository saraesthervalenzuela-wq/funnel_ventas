import React from 'react'
import {
  Users,
  UserCheck,
  Calendar,
  FileCheck,
  PhoneOff,
  Target,
  DollarSign,
  Megaphone,
  Percent
} from 'lucide-react'

function MetricCard({ title, value, subtitle, color }) {
  const formatNumber = (num) => {
    if (typeof num === 'number') {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`
      } else if (num >= 1000) {
        return num >= 10000 ? `$${(num / 1000).toFixed(0)}K` : num.toLocaleString()
      }
      return num.toLocaleString()
    }
    return num
  }

  const getIndicatorColor = () => {
    switch(color) {
      case 'teal': return 'bg-teal-500'
      case 'green': return 'bg-green-500'
      case 'red': return 'bg-red-500'
      case 'blue': return 'bg-blue-500'
      case 'purple': return 'bg-purple-500'
      case 'cyan': return 'bg-cyan-500'
      case 'navy': return 'bg-blue-800'
      default: return 'bg-teal-500'
    }
  }

  return (
    <div className="metric-card group">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${getIndicatorColor()}`}></span>
        <span className="text-gray-500 text-xs uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{formatNumber(value)}</p>
      {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  )
}

function MetricCards({ metrics }) {
  if (!metrics) return null

  const mainCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      color: 'teal',
      subtitle: 'Leads del periodo'
    },
    {
      title: 'Leads Calificados',
      value: metrics.leadsCalificados,
      color: 'blue',
      subtitle: `${metrics.tasaContacto}% contactados`
    },
    {
      title: 'Valoraciones',
      value: metrics.valoradasCotizacion,
      color: 'purple',
      subtitle: 'Con cotización'
    },
    {
      title: 'Tasa Conversión',
      value: `${metrics.tasaConversion}%`,
      color: 'green',
      subtitle: 'Lead a cierre'
    }
  ]

  const secondaryCards = [
    {
      title: 'Agendadas',
      value: metrics.agendadasValoracion,
      color: 'cyan',
      subtitle: 'Citas programadas'
    },
    {
      title: 'No Contactadas',
      value: metrics.noContactoValoracion,
      color: 'red',
      subtitle: 'Pendientes'
    },
    {
      title: 'Oport. Cierre',
      value: metrics.oportunidadesCierreTotal,
      color: 'teal',
      subtitle: `${metrics.oportunidadesCierreAlta} alta / ${metrics.oportunidadesCierreMedia} media`
    },
    {
      title: 'Depósitos',
      value: metrics.depositosRealizados,
      color: 'green',
      subtitle: `$${metrics.totalDepositos.toLocaleString()}`
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main metrics - larger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>

      {/* Secondary metrics - smaller */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryCards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>
    </div>
  )
}

export default MetricCards
