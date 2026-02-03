import React from 'react'
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react'

function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="mb-8 p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30 blur-3xl"
           style={{ background: 'rgba(239, 68, 68, 0.5)' }} />

      <div className="flex items-start gap-5 relative z-10">
        <div
          className="p-3.5 rounded-2xl flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1))',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
          }}
        >
          <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-400 text-lg mb-2 tracking-tight">
            Error de Conexión
          </h3>
          <p className="text-sm text-white/60 mb-5 font-medium">
            {message}
          </p>

          {/* Suggestions */}
          <div
            className="p-4 rounded-xl mb-6 space-y-3"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.04)'
            }}
          >
            {[
              'Verifica que el archivo .env esté configurado correctamente',
              'Asegúrate de que tu API Key de GHL sea válida',
              'Confirma que el backend esté corriendo en el puerto 3001'
            ].map((tip, index) => (
              <p key={index} className="text-xs text-white/50 flex items-center gap-3 font-medium">
                <HelpCircle className="h-3.5 w-3.5 text-teal-400 flex-shrink-0" />
                {tip}
              </p>
            ))}
          </div>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 text-white
                     text-sm font-bold rounded-xl transition-all duration-300
                     hover:scale-105 active:scale-95 group"
            style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
              boxShadow: '0 0 30px rgba(20, 184, 166, 0.4)'
            }}
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Reintentar Conexión
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorAlert
