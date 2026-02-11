const express = require('express');
const router = express.Router();
const metaAdsService = require('../services/metaAdsService');
const metricsService = require('../services/metricsService');
const { getOpportunitiesFromDB } = require('../services/supabaseService');

// GET /api/meta/campaigns — Insights de campañas cruzados con funnel GHL
router.get('/campaigns', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate'
      });
    }

    // Obtener datos de Meta y GHL en paralelo
    const [metaSummary, rawOpps] = await Promise.all([
      metaAdsService.getAccountSummary(startDate, endDate),
      getOpportunitiesFromDB(startDate, endDate)
    ]);

    const opportunities = metricsService.filterByDateRange(rawOpps, startDate, endDate);

    // Filtrar oportunidades que vinieron de Meta Ads (Facebook + Instagram)
    const metaOpps = opportunities.filter(opp => {
      const tags = (opp.contact?.tags || []).join(' ').toLowerCase();
      const source = (opp.source || '').toLowerCase();
      return tags.includes('fb-ad-lead') || tags.includes('fb-ad') ||
             tags.includes('instagram-ad-lead') || tags.includes('instagram-ad') ||
             source.includes('facebook') || source.includes('fb') ||
             source.includes('instagram');
    });

    // Calcular métricas del funnel GHL para leads de Meta
    const stageIds = metricsService.stageIds;
    const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];

    const ghlTotals = {
      total: metaOpps.length,
      calificados: metaOpps.filter(o => o.pipelineStageId !== stageIds.nuevoLead).length,
      cierres: metaOpps.filter(o => stagesDeposito.includes(o.pipelineStageId)).length,
      valor: metaOpps.filter(o => stagesDeposito.includes(o.pipelineStageId))
        .reduce((sum, o) => sum + (parseFloat(o.monetaryValue) || 0), 0)
    };

    // Distribuir métricas GHL proporcionalmente entre campañas de Meta
    const totalMetaLeads = metaSummary.leads || 1;

    metaSummary.campaigns.forEach(campaign => {
      const proportion = campaign.leads / totalMetaLeads;
      campaign.ghlLeads = Math.round(ghlTotals.total * proportion);
      campaign.ghlCalificados = Math.round(ghlTotals.calificados * proportion);
      campaign.ghlCierres = Math.round(ghlTotals.cierres * proportion);
      campaign.ghlValor = Math.round(ghlTotals.valor * proportion);
      campaign.ghlConversion = campaign.ghlLeads > 0
        ? ((campaign.ghlCierres / campaign.ghlLeads) * 100).toFixed(1)
        : '0.0';
    });

    // Agregar totales GHL al resumen
    metaSummary.ghlTotals = ghlTotals;

    res.json({
      success: true,
      dateRange: { startDate, endDate },
      data: metaSummary
    });
  } catch (error) {
    console.error('Error en /api/meta/campaigns:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/meta/active — Campañas activas actuales
router.get('/active', async (req, res) => {
  try {
    const campaigns = await metaAdsService.getActiveCampaigns();
    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
