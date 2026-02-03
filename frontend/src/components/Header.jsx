import React from 'react'
import { RefreshCw, Calendar, TrendingUp, Bell, Settings } from 'lucide-react'

function Header({ dateRange, onDateChange, onRefresh, loading }) {
  const handleStartDateChange = (e) => {
    onDateChange({ ...dateRange, startDate: e.target.value })
  }

  const handleEndDateChange = (e) => {
    onDateChange({ ...dateRange, endDate: e.target.value })
  }

  const setPresetRange = (preset) => {
    const now = new Date()
    let startDate, endDate

    switch (preset) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        startDate = weekStart.toISOString().split('T')[0]
        endDate = now.toISOString().split('T')[0]
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        break
      default:
        return
    }

    onDateChange({ startDate, endDate })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg">CIPLASTIC</span>
              <span className="text-gray-500 text-xs block">Sales Funnel</span>
            </div>
          </div>

          {/* Centro - Navegación */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-900/50 rounded-full p-1">
            <button className="px-4 py-2 rounded-full bg-teal-500 text-white text-sm font-medium">
              Dashboard
            </button>
            <button className="px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white transition">
              Reportes
            </button>
            <button className="px-4 py-2 rounded-full text-gray-400 text-sm font-medium hover:text-white transition">
              Análisis
            </button>
          </nav>

          {/* Derecha - Controles */}
          <div className="flex items-center gap-3">
            {/* Presets de fecha */}
            <div className="hidden lg:flex gap-1 bg-gray-900/50 rounded-lg p-1">
              {[
                { key: 'week', label: '7 días' },
                { key: 'month', label: '30 días' },
                { key: 'lastMonth', label: 'Mes Ant.' },
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setPresetRange(preset.key)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white
                           hover:bg-gray-800 rounded-md transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Selector de fechas */}
            <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg px-3 py-1.5">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={handleStartDateChange}
                className="bg-transparent text-sm text-gray-300 border-none focus:outline-none w-28"
              />
              <span className="text-gray-600">-</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={handleEndDateChange}
                className="bg-transparent text-sm text-gray-300 border-none focus:outline-none w-28"
              />
            </div>

            {/* Botón de refresh */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white
                       rounded-lg hover:bg-teal-600 transition-all disabled:opacity-50
                       font-medium text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
              CP
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
