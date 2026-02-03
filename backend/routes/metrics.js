const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');

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

// Resumen completo (todas las métricas)
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    const [funnel, stages, times, sources, trend] = await Promise.all([
      metricsService.calculateFunnelMetrics(dateRange.startDate, dateRange.endDate),
      metricsService.calculateStageDistribution(dateRange.startDate, dateRange.endDate),
      metricsService.calculateAverageTimeInStages(dateRange.startDate, dateRange.endDate),
      metricsService.calculateSourceMetrics(dateRange.startDate, dateRange.endDate),
      metricsService.getDailyTrend(dateRange.startDate, dateRange.endDate)
    ]);

    res.json({
      success: true,
      dateRange,
      data: {
        funnel,
        stages,
        times,
        sources,
        trend
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
