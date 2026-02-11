const express = require('express');
const router = express.Router();
const aiAnalysisService = require('../services/aiAnalysisService');

// GET /api/ai/analyze — Análisis IA del funnel
router.get('/analyze', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate'
      });
    }

    const result = await aiAnalysisService.analyze(startDate, endDate);

    res.json({
      success: true,
      dateRange: { startDate, endDate },
      cached: result.cached,
      data: result.analysis
    });
  } catch (error) {
    console.error('Error en /api/ai/analyze:', error.message);

    const status = error.message.includes('no configurada') ? 503 : 500;
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
