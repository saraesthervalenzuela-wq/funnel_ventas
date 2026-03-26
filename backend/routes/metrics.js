const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');
const {
  getLatestSnapshot,
  insertSnapshot,
  getOpportunitiesFromDB,
  getOpportunityCount,
  performSync,
  getLastSyncInfo
} = require('../services/supabaseService');

// Helper para obtener fechas del mes actual
const getCurrentMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// Snapshot actual: oportunidades por etapa SIN filtro de fecha
router.get('/current-stages', async (req, res) => {
  try {
    const data = await metricsService.getCurrentSnapshot();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tiempo promedio de respuesta en conversaciones
router.get('/response-time', async (req, res) => {
  try {
    const ghlService = require('../services/ghlService');
    const data = await ghlService.getAverageResponseTime(30);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Métricas principales del funnel
router.get('/funnel', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const metrics = await metricsService.calculateFunnelMetrics(
      dateRange.startDate,
      dateRange.endDate
    );

    res.json({
      success: true,
      dateRange,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Distribución por etapas
router.get('/stages', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const distribution = await metricsService.calculateStageDistribution(
      dateRange.startDate,
      dateRange.endDate
    );

    res.json({
      success: true,
      dateRange,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tiempos promedio
router.get('/times', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const times = await metricsService.calculateAverageTimeInStages(
      dateRange.startDate,
      dateRange.endDate
    );

    res.json({
      success: true,
      dateRange,
      data: times
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Métricas por fuente/campaña
router.get('/sources', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const sourceMetrics = await metricsService.calculateSourceMetrics(
      dateRange.startDate,
      dateRange.endDate
    );

    res.json({
      success: true,
      dateRange,
      data: sourceMetrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Tendencia diaria
router.get('/trend', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const trend = await metricsService.getDailyTrend(
      dateRange.startDate,
      dateRange.endDate
    );

    res.json({
      success: true,
      dateRange,
      data: trend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resumen completo — calcula desde caché GHL en memoria (5 min TTL)
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, force } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const forceRefresh = force === 'true';

    // Si force, invalidar caché y re-sync
    if (forceRefresh) {
      console.log('🔄 Refresh forzado — ejecutando sync completo...');
      await performSync('manual');
    }

    // Calcular métricas desde GHL (usa caché en memoria de 5 min)
    const data = await metricsService.calculateAllMetrics(dateRange.startDate, dateRange.endDate);

    res.json({
      success: true,
      dateRange,
      source: forceRefresh ? 'sync' : 'cache',
      data
    });

  } catch (error) {
    console.error('❌ Error en /summary:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Info del último sync
router.get('/sync-info', async (req, res) => {
  try {
    const info = await getLastSyncInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger sync manual
router.post('/sync', async (req, res) => {
  try {
    const result = await performSync('manual');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
