import React from 'react'
import { TrendingUp } from 'lucide-react'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="text-center">
        <div className="relative inline-block">
          {/* Logo animado */}
          <div className="bg-gradient-to-br from-teal-400 to-teal-600 p-5 rounded-2xl mb-8 animate-pulse">
            <TrendingUp className="h-12 w-12 text-white" />
          </div>

          {/* Spinner circular */}
          <div className="absolute -inset-3 border-4 border-gray-800 rounded-full animate-spin border-t-teal-500" />
        </div>

        <h2 className="text-xl font-bold text-white mt-8 mb-2">
          Cargando Dashboard
        </h2>
        <p className="text-gray-500">
          Conectando con Go High Level...
        </p>

        {/* Dots animados */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner
