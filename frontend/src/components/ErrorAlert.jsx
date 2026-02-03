import React from 'react'
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react'

function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="mb-6 p-5 rounded-xl"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-xl flex-shrink-0"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
        >
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-400 text-lg mb-2">
            Error de Conexión
          </h3>
          <p className="text-sm text-red-300/80 mb-4">
            {message}
          </p>

          {/* Sugerencias */}
          <div
            className="p-4 rounded-lg mb-5 space-y-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          >
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-teal-500" />
              Verifica que el archivo .env esté configurado correctamente
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-teal-500" />
              Asegúrate de que tu API Key de GHL sea válida
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-teal-500" />
              Confirma que el backend esté corriendo en el puerto 3001
            </p>
          </div>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white
                     text-sm font-semibold rounded-xl transition-all duration-200
                     hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #14b8a6, #2dd4bf)',
              boxShadow: '0 4px 15px rgba(20, 184, 166, 0.3)'
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar Conexión
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorAlert
