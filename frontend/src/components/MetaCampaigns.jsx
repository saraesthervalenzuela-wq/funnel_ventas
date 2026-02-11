import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  DollarSign,
  Eye,
  MousePointerClick,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  UserCheck,
  BadgeDollarSign
} from 'lucide-react'

function MetaCampaigns({ dateRange }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return
    fetchCampaigns()
  }, [dateRange])

  const fetchCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const axios = (await import('axios')).default
      const response = await axios.get('/api/meta/campaigns', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate }
      })
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching Meta campaigns:', err)
      setError('No se pudieron cargar las campañas de Meta')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value.toFixed(0)}`
  }

  const getCPLBadge = (cpl) => {
    if (cpl <= 0) return { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.2)' }
    if (cpl < 50) return { color: '#4ade80', bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)' }
    if (cpl < 100) return { color: '#2dd4bf', bg: 'rgba(20, 184, 166, 0.15)', border: 'rgba(20, 184, 166, 0.3)' }
    return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-32 gap-3">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        <span className="text-white/40 text-sm">Cargando campañas de Meta...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">{error}</div>
    )
  }

  if (!data || data.campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        No hay campañas activas en este periodo
      </div>
    )
  }

  const ghl = data.ghlTotals || {}

  const summaryCards = [
    {
      label: 'Gasto Total',
      value: formatMoney(data.spend),
      icon: DollarSign,
      gradient: 'from-amber-500 to-orange-400'
    },
    {
      label: 'Conversaciones',
      value: data.leads.toLocaleString(),
      icon: MessageCircle,
      gradient: 'from-teal-500 to-cyan-400'
    },
    {
      label: 'Leads en CRM',
      value: (ghl.total || 0).toLocaleString(),
      icon: Users,
      gradient: 'from-blue-500 to-sky-400'
    },
    {
      label: 'Calificados',
      value: (ghl.calificados || 0).toLocaleString(),
      icon: UserCheck,
      gradient: 'from-purple-500 to-violet-400'
    },
    {
      label: 'Cierres',
      value: (ghl.cierres || 0).toLocaleString(),
      sub: ghl.valor > 0 ? formatMoney(ghl.valor) : null,
      icon: BadgeDollarSign,
      gradient: 'from-green-500 to-emerald-400'
    },
    {
      label: 'CPL Promedio',
      value: data.avgCostPerLead > 0 ? `$${data.avgCostPerLead.toFixed(0)}` : '—',
      icon: TrendingUp,
      gradient: 'from-rose-500 to-pink-400'
    }
  ]

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {summaryCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={i}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <p className="text-xl font-extrabold text-white font-display">{card.value}</p>
              {card.sub && <p className="text-xs text-white/30 mt-0.5">{card.sub}</p>}
            </motion.div>
          )
        })}
      </div>

      {/* Toggle campaigns list */}
      <motion.button
        className="flex items-center gap-2 mb-4 text-sm text-white/50 hover:text-white/70 transition-colors"
        onClick={() => setExpanded(!expanded)}
        whileTap={{ scale: 0.98 }}
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span className="font-medium">{data.campaigns.length} campañas en el periodo</span>
      </motion.button>

      {/* Campaigns Table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="overflow-x-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <th className="text-left py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Campaña
                  </th>
                  <th className="text-right py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Gasto
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Conversaciones
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    CPL
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display"
                      style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    Leads CRM
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Calificados
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Cierres
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Conversión
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign, index) => {
                  const cplBadge = getCPLBadge(campaign.costPerLead)
                  return (
                    <motion.tr
                      key={campaign.campaignId}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {campaign.status === 'ACTIVE' ? (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                                   border: '1px solid rgba(34, 197, 94, 0.35)',
                                   boxShadow: '0 0 12px rgba(34, 197, 94, 0.15)'
                                 }}>
                              <Megaphone className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{
                                   background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1), rgba(100, 116, 139, 0.1))',
                                   border: '1px solid rgba(148, 163, 184, 0.15)'
                                 }}>
                              <Megaphone className="w-4 h-4 text-slate-400/50" />
                            </div>
                          )}
                          <span className="font-medium text-white/80 text-sm max-w-[280px] truncate">
                            {campaign.campaignName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                          ${campaign.spend.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                          {campaign.leads}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: cplBadge.bg,
                            color: cplBadge.color,
                            border: `1px solid ${cplBadge.border}`
                          }}
                        >
                          {campaign.costPerLead > 0 ? `$${campaign.costPerLead.toFixed(0)}` : '—'}
                        </span>
                      </td>
                      {/* Columnas GHL Funnel */}
                      <td className="py-4 px-3 text-center" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <span className="text-sm font-medium text-white">
                          {campaign.ghlLeads || 0}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-sm font-medium text-purple-400">
                          {campaign.ghlCalificados || 0}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                          {campaign.ghlCierres || 0}
                        </span>
                        {(campaign.ghlValor || 0) > 0 && (
                          <div className="text-[10px] text-white/30 mt-0.5">
                            {formatMoney(campaign.ghlValor)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: parseFloat(campaign.ghlConversion || 0) > 0
                              ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                            color: parseFloat(campaign.ghlConversion || 0) > 0
                              ? '#4ade80' : '#94a3b8',
                            border: `1px solid ${parseFloat(campaign.ghlConversion || 0) > 0
                              ? 'rgba(34, 197, 94, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`
                          }}
                        >
                          {campaign.ghlConversion || '0.0'}%
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MetaCampaigns
