import React from 'react'
import { TrendingUp } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050508' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, transparent 70%)' }} />
      </div>

      <div className="text-center relative z-10">
        <div className="relative inline-block">
          {/* Logo container with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-50"
                 style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)' }} />
            <div className="relative bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-500 p-6 rounded-3xl"
                 style={{ boxShadow: '0 0 60px rgba(20, 184, 166, 0.4)' }}>
              <TrendingUp className="h-14 w-14 text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Spinner rings */}
          <div className="absolute -inset-4 border-2 border-white/5 rounded-full" />
          <div className="absolute -inset-4 border-2 border-transparent border-t-teal-500/50 rounded-full animate-spin" />
          <div className="absolute -inset-8 border border-white/[0.03] rounded-full" />
          <div className="absolute -inset-8 border border-transparent border-t-cyan-400/30 rounded-full animate-spin"
               style={{ animationDuration: '2s' }} />
        </div>

        <h2 className="text-2xl font-bold text-white mt-12 mb-2 tracking-tight">
          Cargando Dashboard
        </h2>
        <p className="text-white/40 font-medium">
          Conectando con Go High Level...
        </p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
                boxShadow: '0 0 10px rgba(20, 184, 166, 0.5)',
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
