import React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Minus, Tag, Megaphone, DollarSign, MessageCircle } from 'lucide-react'

function CampaignDetail({ source, onClose }) {
  if (!source || !source.campaigns) return null

  const campaigns = source.campaigns
  const isMeta = source.isMeta

  const getConversionBadge = (rate) => {
    const numRate = parseFloat(rate)
    if (numRate >= 10) return {
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
      icon: TrendingUp
    }
    if (numRate >= 5) return {
      bg: 'rgba(20, 184, 166, 0.15)',
      border: 'rgba(20, 184, 166, 0.3)',
      color: '#2dd4bf',
      icon: Minus
    }
    return {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      color: '#f87171',
      icon: TrendingDown
    }
  }

  const formatMoney = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value.toFixed(0)}`
  }

  // Calcular totales Meta si es fuente Meta
  const metaTotals = isMeta ? {
    spend: campaigns.reduce((sum, c) => sum + (c.metaSpend || 0), 0),
    conversations: campaigns.reduce((sum, c) => sum + (c.metaConversations || 0), 0)
  } : null

  const summaryMetrics = isMeta
    ? [
        { label: 'Gasto Ads', value: formatMoney(metaTotals.spend), gradient: 'from-amber-500 to-orange-400' },
        { label: 'Conversaciones', value: metaTotals.conversations, gradient: 'from-cyan-500 to-blue-400' },
        { label: 'Leads CRM', value: source.total, gradient: 'from-teal-500 to-cyan-400' },
        { label: 'Calificados', value: source.calificados, gradient: 'from-purple-500 to-violet-400' },
        { label: 'Cierres', value: source.depositos, gradient: 'from-green-500 to-emerald-400' },
        { label: 'Valor Total', value: `$${source.valorTotal.toLocaleString()}`, gradient: 'from-sky-500 to-indigo-400' }
      ]
    : [
        { label: 'Leads', value: source.total },
        { label: 'Calificados', value: source.calificados },
        { label: 'Cierres', value: source.depositos },
        { label: 'Valor Total', value: `$${source.valorTotal.toLocaleString()}` }
      ]

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className={`fixed inset-x-4 top-[8%] bottom-[8%] z-50 overflow-hidden rounded-2xl lg:rounded-3xl flex flex-col ${
          isMeta ? 'sm:inset-x-[4%] lg:inset-x-[8%]' : 'sm:inset-x-[8%] lg:inset-x-[15%]'
        }`}
        style={{
          background: 'rgba(6, 7, 10, 0.88)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Gradient top glow */}
        <div className="absolute top-0 left-0 right-0 h-[100px] pointer-events-none"
             style={{ background: 'linear-gradient(180deg, rgba(20, 184, 166, 0.06) 0%, transparent 100%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 lg:px-8 py-5 shrink-0"
             style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div>
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-teal-400/60 mb-1 font-display">
              {isMeta ? 'Desglose por Campaña Meta' : 'Desglose por Campaña'}
            </p>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-display">
              {source.source}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isMeta && (
              <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase"
                    style={{
                      background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.15))',
                      border: '1px solid rgba(20, 184, 166, 0.3)',
                      color: '#2dd4bf'
                    }}>
                Meta API
              </span>
            )}
            <motion.button
              onClick={onClose}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>
        </div>

        {/* Summary bar */}
        <div className={`grid gap-4 px-6 lg:px-8 py-5 shrink-0 ${
          isMeta ? 'grid-cols-3 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'
        }`}
             style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          {summaryMetrics.map((metric, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/35 font-display">
                {metric.label}
              </p>
              <p className="text-xl font-extrabold text-white mt-1 font-display">
                {metric.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Campaigns table */}
        <div className="overflow-y-auto flex-1 px-6 lg:px-8 py-4">
          {campaigns.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 font-medium">
              No hay datos de campañas para esta fuente
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <th className="text-left py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Campaña
                  </th>
                  {isMeta && (
                    <>
                      <th className="text-right py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                        Gasto
                      </th>
                      <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                        Conversaciones
                      </th>
                      <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display"
                          style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        Leads CRM
                      </th>
                    </>
                  )}
                  {!isMeta && (
                    <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                      Leads
                    </th>
                  )}
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Calificados
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Cierres
                  </th>
                  <th className="text-right py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Valor
                  </th>
                  <th className="text-center py-4 px-3 text-xs font-bold text-white/40 uppercase tracking-[0.12em] font-display">
                    Conversión
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, index) => {
                  const badge = getConversionBadge(campaign.tasaConversion)
                  const BadgeIcon = badge.icon
                  return (
                    <motion.tr
                      key={index}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3">
                          {isMeta ? (
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
                                   background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(6, 182, 212, 0.15))',
                                   border: '1px solid rgba(20, 184, 166, 0.2)'
                                 }}>
                              <Tag className="w-4 h-4 text-teal-400/70" />
                            </div>
                          )}
                          <span className="font-medium text-white/80 text-sm max-w-[280px] truncate">
                            {campaign.campaign}
                          </span>
                        </div>
                      </td>
                      {isMeta && (
                        <>
                          <td className="py-4 px-3 text-right">
                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                              ${(campaign.metaSpend || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-center">
                            <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                              {campaign.metaConversations || 0}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-center" style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <span className="text-sm font-bold text-white">{campaign.total}</span>
                          </td>
                        </>
                      )}
                      {!isMeta && (
                        <td className="py-4 px-3 text-center">
                          <span className="text-sm font-bold text-white">{campaign.total}</span>
                        </td>
                      )}
                      <td className="py-4 px-3 text-center">
                        <span className="text-sm font-medium text-purple-400">{campaign.calificados}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                          {campaign.depositos}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-right">
                        <span className="text-sm font-bold text-white">
                          ${(campaign.valorTotal || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}
                        >
                          <BadgeIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {campaign.tasaConversion}%
                        </span>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </>,
    document.body
  )
}

export default CampaignDetail
