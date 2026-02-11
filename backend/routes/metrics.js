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

// Resumen completo — lee de Supabase DB, sync solo con force=true
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, force } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const forceRefresh = force === 'true';

    // === FORCE: Sync completo desde GHL ===
    if (forceRefresh) {
      console.log('🔄 Refresh forzado — ejecutando sync completo...');
      const syncResult = await performSync('manual');

      // Leer oportunidades frescas de la DB y filtrar con timezone local
      const rawOpps = await getOpportunitiesFromDB(dateRange.startDate, dateRange.endDate);
      const opportunities = metricsService.filterByDateRange(rawOpps, dateRange.startDate, dateRange.endDate);
      const data = metricsService.calculateAllMetricsFromArray(opportunities);

      // Guardar snapshot para este rango específico
      await insertSnapshot(dateRange.startDate, dateRange.endDate, 'manual', data, opportunities.length);

      return res.json({
        success: true,
        dateRange,
        source: 'sync',
        syncInfo: {
          total: syncResult.total,
          new: syncResult.new,
          updated: syncResult.updated,
          duration: syncResult.duration
        },
        data
      });
    }

    // === NORMAL: Intentar snapshot reciente ===
    const snapshot = await getLatestSnapshot(dateRange.startDate, dateRange.endDate);
    if (snapshot) {
      return res.json({
        success: true,
        dateRange,
        source: 'snapshot',
        data: snapshot
      });
    }

    // === Sin snapshot: Leer de tabla opportunities ===
    const dbCount = await getOpportunityCount();

    if (dbCount === 0) {
      // Primera vez — hacer bootstrap sync
      console.log('🚀 DB vacía — ejecutando sync inicial (bootstrap)...');
      await performSync('bootstrap');
    }

    // Leer oportunidades del rango desde DB y filtrar con timezone local
    const rawOpps = await getOpportunitiesFromDB(dateRange.startDate, dateRange.endDate);
    const opportunities = metricsService.filterByDateRange(rawOpps, dateRange.startDate, dateRange.endDate);
    const data = metricsService.calculateAllMetricsFromArray(opportunities);

    // Guardar snapshot
    await insertSnapshot(dateRange.startDate, dateRange.endDate, 'query', data, opportunities.length);

    res.json({
      success: true,
      dateRange,
      source: 'database',
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
