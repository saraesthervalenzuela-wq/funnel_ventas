const express = require('express');
const router = express.Router();
const ghlService = require('../services/ghlService');

// Obtener todas las oportunidades
router.get('/opportunities', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const opportunities = await ghlService.getOpportunities(startDate, endDate);
    res.json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener etapas del pipeline
router.get('/stages', async (req, res) => {
  try {
    const stages = await ghlService.getPipelineStages();
    res.json({
      success: true,
      data: stages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener detalle de una oportunidad
router.get('/opportunities/:id', async (req, res) => {
  try {
    const opportunity = await ghlService.getOpportunityHistory(req.params.id);
    res.json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Obtener contactos
router.get('/contacts', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const contacts = await ghlService.getContacts(startDate, endDate);
    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test de conexión
router.get('/test', async (req, res) => {
  try {
    const stages = await ghlService.getPipelineStages();
    res.json({
      success: true,
      message: 'Conexión exitosa con Go High Level',
      pipelineStages: stages.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error conectando con Go High Level',
      error: error.message
    });
  }
});

module.exports = router;
