// Mock data para visualizar el diseño sin depender del API de GHL

export const mockData = {
  funnel: {
    totalLeads: 847,
    leadsCalificados: 623,
    tasaContacto: 73.5,
    agendadasValoracion: 412,
    noContactoValoracion: 89,
    valoradasCotizacion: 287,
    oportunidadesCierreTotal: 156,
    oportunidadesCierreAlta: 89,
    oportunidadesCierreMedia: 67,
    depositosRealizados: 94,
    totalDepositos: 1847500,
    tasaConversion: 11.1
  },
  stages: [
    { stage: 'Nuevo Lead', count: 124, value: 0 },
    { stage: 'Contactado', count: 198, value: 0 },
    { stage: 'Calificado', count: 156, value: 0 },
    { stage: 'Cita Agendada', count: 134, value: 0 },
    { stage: 'Valoración Realizada', count: 98, value: 245000 },
    { stage: 'Cotización Enviada', count: 87, value: 567000 },
    { stage: 'Negociación', count: 45, value: 890000 },
    { stage: 'Cierre Pendiente', count: 28, value: 456000 },
    { stage: 'Depósito Realizado', count: 94, value: 1847500 },
    { stage: 'Perdido', count: 67, value: 0 }
  ],
  trend: [
    { date: '2026-01-01', leads: 28, depositos: 3 },
    { date: '2026-01-02', leads: 35, depositos: 4 },
    { date: '2026-01-03', leads: 22, depositos: 2 },
    { date: '2026-01-04', leads: 31, depositos: 5 },
    { date: '2026-01-05', leads: 45, depositos: 3 },
    { date: '2026-01-06', leads: 18, depositos: 2 },
    { date: '2026-01-07', leads: 12, depositos: 1 },
    { date: '2026-01-08', leads: 38, depositos: 4 },
    { date: '2026-01-09', leads: 42, depositos: 6 },
    { date: '2026-01-10', leads: 29, depositos: 3 },
    { date: '2026-01-11', leads: 51, depositos: 5 },
    { date: '2026-01-12', leads: 33, depositos: 4 },
    { date: '2026-01-13', leads: 27, depositos: 2 },
    { date: '2026-01-14', leads: 15, depositos: 1 },
    { date: '2026-01-15', leads: 44, depositos: 5 },
    { date: '2026-01-16', leads: 52, depositos: 7 },
    { date: '2026-01-17', leads: 38, depositos: 4 },
    { date: '2026-01-18', leads: 29, depositos: 3 },
    { date: '2026-01-19', leads: 47, depositos: 6 },
    { date: '2026-01-20', leads: 19, depositos: 2 },
    { date: '2026-01-21', leads: 11, depositos: 1 },
    { date: '2026-01-22', leads: 36, depositos: 4 },
    { date: '2026-01-23', leads: 41, depositos: 5 },
    { date: '2026-01-24', leads: 33, depositos: 3 },
    { date: '2026-01-25', leads: 48, depositos: 6 },
    { date: '2026-01-26', leads: 25, depositos: 2 },
    { date: '2026-01-27', leads: 39, depositos: 4 },
    { date: '2026-01-28', leads: 14, depositos: 1 },
    { date: '2026-01-29', leads: 43, depositos: 5 },
    { date: '2026-01-30', leads: 56, depositos: 8 },
    { date: '2026-01-31', leads: 37, depositos: 4 }
  ],
  times: {
    promedioTiempoCierre: 18,
    tiempoMinimoCierre: 3,
    tiempoMaximoCierre: 45,
    oportunidadesAnalizadas: 94
  },
  sources: [
    {
      source: 'Facebook Ads',
      total: 312,
      calificados: 234,
      depositos: 38,
      valorTotal: 756000,
      tasaConversion: 12.2
    },
    {
      source: 'Google Ads',
      total: 198,
      calificados: 156,
      depositos: 24,
      valorTotal: 489000,
      tasaConversion: 12.1
    },
    {
      source: 'Instagram',
      total: 156,
      calificados: 112,
      depositos: 15,
      valorTotal: 298000,
      tasaConversion: 9.6
    },
    {
      source: 'Referidos',
      total: 89,
      calificados: 78,
      depositos: 12,
      valorTotal: 234500,
      tasaConversion: 13.5
    },
    {
      source: 'Orgánico Web',
      total: 67,
      calificados: 45,
      depositos: 4,
      valorTotal: 56000,
      tasaConversion: 6.0
    },
    {
      source: 'TikTok Ads',
      total: 25,
      calificados: 18,
      depositos: 1,
      valorTotal: 14000,
      tasaConversion: 4.0
    }
  ]
}

export default mockData
