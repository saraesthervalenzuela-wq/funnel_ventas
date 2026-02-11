import React, { useState } from 'react'
import { RefreshCw, Calendar, TrendingUp, Sparkles } from 'lucide-react'

function Header({ dateRange, onDateChange, onRefresh, loading, activeView, onViewChange }) {
  const [activePreset, setActivePreset] = useState(null)
  const [showRangePicker, setShowRangePicker] = useState(false)

  const handleStartDateChange = (e) => {
    onDateChange({ ...dateRange, startDate: e.target.value })
  }

  const handleEndDateChange = (e) => {
    onDateChange({ ...dateRange, endDate: e.target.value })
  }

  // Formatear fecha local sin problemas de timezone (toISOString usa UTC)
  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const setPresetRange = (preset) => {
    if (preset === 'range') {
      setActivePreset('range')
      setShowRangePicker(true)
      return
    }

    setShowRangePicker(false)
    setActivePreset(preset)

    const now = new Date()
    let startDate, endDate

    switch (preset) {
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        startDate = formatDate(yesterday)
        endDate = formatDate(yesterday)
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        startDate = formatDate(weekStart)
        endDate = formatDate(now)
        break
      case 'month':
        // Últimos 30 días desde hoy (ej: 9 ene → 9 feb)
        const monthStart = new Date(now)
        monthStart.setMonth(now.getMonth() - 1)
        startDate = formatDate(monthStart)
        endDate = formatDate(now)
        break
      default:
        return
    }

    onDateChange({ startDate, endDate })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl"
            style={{
              background: 'rgba(5, 5, 8, 0.5)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)'
            }}>
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 py-2 sm:py-3 lg:py-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg"
                   style={{ boxShadow: '0 0 30px rgba(20, 184, 166, 0.4)' }}>
                <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050508] animate-pulse" />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">CIPLASTIC</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span className="text-white/40 text-xs font-medium tracking-wide">Sales Funnel</span>
              </div>
            </div>
          </div>

          {/* Centro - Navegación Pill */}
          <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl"
               style={{
                 background: 'rgba(255, 255, 255, 0.03)',
                 border: '1px solid rgba(255, 255, 255, 0.06)'
               }}>
            {[
              { key: 'dashboard', label: 'Dashboard' },
              { key: 'reportes', label: 'Reportes' },
              { key: 'analisis', label: 'Análisis' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => onViewChange(tab.key)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeView !== tab.key ? 'text-white/40 font-medium hover:text-white hover:bg-white/[0.04]' : ''
                }`}
                style={activeView === tab.key ? {
                  background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
                  boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)'
                } : {}}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Derecha - Controles */}
          <div className="flex items-center gap-3">
            {/* Presets de fecha */}
            <div className="hidden sm:flex gap-1 p-1 rounded-xl"
                 style={{
                   background: 'rgba(255, 255, 255, 0.03)',
                   border: '1px solid rgba(255, 255, 255, 0.06)'
                 }}>
              {[
                { key: 'yesterday', label: 'Ayer' },
                { key: 'week', label: 'Semana' },
                { key: 'month', label: 'Mes' },
                { key: 'range', label: 'Rango' },
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setPresetRange(preset.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    activePreset === preset.key
                      ? 'text-white'
                      : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  style={activePreset === preset.key ? {
                    background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
                    boxShadow: '0 0 15px rgba(20, 184, 166, 0.3)'
                  } : {}}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Selector de rango de fechas */}
            {showRangePicker && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                   style={{
                     background: 'rgba(255, 255, 255, 0.03)',
                     border: '1px solid rgba(255, 255, 255, 0.06)'
                   }}>
                <Calendar className="h-4 w-4 text-white/30" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={handleStartDateChange}
                  className="bg-transparent text-sm text-white/70 border-none focus:outline-none w-28 font-medium"
                />
                <span className="text-white/20 font-light">/</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={handleEndDateChange}
                  className="bg-transparent text-sm text-white/70 border-none focus:outline-none w-28 font-medium"
                />
              </div>
            )}

            {/* Botón de refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm
                       transition-all duration-300 disabled:opacity-50 group"
              style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
                boxShadow: loading ? 'none' : '0 0 25px rgba(20, 184, 166, 0.4)'
              }}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg"
                 style={{ boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)' }}>
              CP
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
