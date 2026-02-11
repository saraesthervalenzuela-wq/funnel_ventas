const ghlService = require('./ghlService');

class MetricsService {
  constructor() {
    // IDs de las etapas del pipeline (obtenidos directamente de GHL)
    this.stageIds = {
      nuevoLead: 'a99b16a6-01b6-4570-b4c6-6bacc2fbf072',           // E1. NUEVO LEAD
      interesPendiente: '2d74b32b-c5d7-4e8a-9049-78d9ea7231c9',    // E2. INTERES EN VV
      seguimientoFotos: '6e4785c2-cd9a-4bf5-860c-bb27129678c7',    // E3. SEGUIMIENTO FOTOS
      fotosRecibidas: 'd278fd60-a732-494a-b099-6ff1048c9331',      // E4. FOTOS RECIBIDAS
      valoracionVirtual: 'f5b43424-4061-4feb-8f91-d4603751c9d2',   // E5. VALORACION VIRTUAL
      vvReagendada: '2542b349-23ea-45d0-bc0a-2e61e7f5fd71',        // VV RE AGENDADA
      vvNoContesto: 'e8091013-0c09-448c-99ac-282e3caa7542',        // E6. VV NO CONTESTO
      valoracionRealizada: '9628011f-7a90-4e8e-82b0-0e0a15b22552', // E7. VALORACION REALIZADA
      seguimientoCierre: '3f2b42a3-aff7-4c5a-b3ac-d7880414c2f2',   // E8. SEGUIMIENTO CIERRE
      depositoRealizado: '3a5c8cb1-b051-45c2-8469-260ff9e82703',   // E9. DEPOSITO REALIZADO
      fechaCirugia: 'ee8a731e-0713-4cd6-996d-431561b26a6c'         // E10. FECHA CIRUGIA
    };

    // Nombres legibles para cada etapa
    this.stageNames = {
      'a99b16a6-01b6-4570-b4c6-6bacc2fbf072': 'E1. NUEVO LEAD',
      '2d74b32b-c5d7-4e8a-9049-78d9ea7231c9': 'E2. INTERES EN VV',
      '6e4785c2-cd9a-4bf5-860c-bb27129678c7': 'E3. SEGUIMIENTO FOTOS',
      'd278fd60-a732-494a-b099-6ff1048c9331': 'E4. FOTOS RECIBIDAS',
      'f5b43424-4061-4feb-8f91-d4603751c9d2': 'E5. VALORACION VIRTUAL',
      '2542b349-23ea-45d0-bc0a-2e61e7f5fd71': 'VV RE AGENDADA',
      'e8091013-0c09-448c-99ac-282e3caa7542': 'E6. NO CONTESTO',
      '9628011f-7a90-4e8e-82b0-0e0a15b22552': 'E7. VALORACION REALIZADA',
      '3f2b42a3-aff7-4c5a-b3ac-d7880414c2f2': 'E8. SEGUIMIENTO CIERRE',
      '3a5c8cb1-b051-45c2-8469-260ff9e82703': 'E9. DEPOSITO REALIZADO',
      'ee8a731e-0713-4cd6-996d-431561b26a6c': 'E10. FECHA CIRUGIA'
    };

    // Orden de las etapas para el funnel
    this.stageOrder = [
      'a99b16a6-01b6-4570-b4c6-6bacc2fbf072',
      '2d74b32b-c5d7-4e8a-9049-78d9ea7231c9',
      '6e4785c2-cd9a-4bf5-860c-bb27129678c7',
      'd278fd60-a732-494a-b099-6ff1048c9331',
      'f5b43424-4061-4feb-8f91-d4603751c9d2',
      '2542b349-23ea-45d0-bc0a-2e61e7f5fd71',
      'e8091013-0c09-448c-99ac-282e3caa7542',
      '9628011f-7a90-4e8e-82b0-0e0a15b22552',
      '3f2b42a3-aff7-4c5a-b3ac-d7880414c2f2',
      '3a5c8cb1-b051-45c2-8469-260ff9e82703',
      'ee8a731e-0713-4cd6-996d-431561b26a6c'
    ];
  }

  // Filtrar oportunidades por rango de fechas
  filterByDateRange(opportunities, startDate, endDate) {
    // Parsear componentes manualmente para evitar bugs de timezone
    // new Date("YYYY-MM-DD") se parsea como UTC, pero setHours opera en hora local
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
    const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

    return opportunities.filter(opp => {
      const createdAt = new Date(opp.createdAt || opp.dateAdded);
      return createdAt >= start && createdAt <= end;
    });
  }

  // Calcular todas las métricas con una sola consulta a GHL
  async calculateAllMetrics(startDate, endDate) {
    const allOpportunities = await ghlService.getOpportunities();
    const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);

    console.log(`📊 Filtrado: ${opportunities.length} de ${allOpportunities.length} oportunidades para ${startDate} - ${endDate}`);

    return this.calculateAllMetricsFromArray(opportunities);
  }

  // Calcular todas las métricas desde un array de oportunidades ya filtradas
  calculateAllMetricsFromArray(opportunities) {
    return {
      funnel: this._buildFunnelMetrics(opportunities),
      stages: this._buildStageDistribution(opportunities),
      times: this._buildAverageTimes(opportunities),
      sources: this._buildSourceMetrics(opportunities),
      trend: this._buildDailyTrend(opportunities)
    };
  }

  // Calcular métricas principales del funnel
  async calculateFunnelMetrics(startDate, endDate) {
    try {
      const allOpportunities = await ghlService.getOpportunities();
      const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);
      return this._buildFunnelMetrics(opportunities);
    } catch (error) {
      console.error('Error calculando métricas:', error);
      throw error;
    }
  }

  _buildFunnelMetrics(opportunities) {
    const countByStage = {};
    this.stageOrder.forEach(id => countByStage[id] = 0);

    opportunities.forEach(opp => {
      const stageId = opp.pipelineStageId;
      if (countByStage[stageId] !== undefined) {
        countByStage[stageId]++;
      }
    });

    const totalLeads = opportunities.length;

    const leadsCalificados = opportunities.filter(opp =>
      opp.pipelineStageId !== this.stageIds.nuevoLead
    ).length;

    const stagesAgendadas = [
      this.stageIds.valoracionVirtual,
      this.stageIds.vvReagendada,
      this.stageIds.vvNoContesto,
      this.stageIds.valoracionRealizada,
      this.stageIds.seguimientoCierre,
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];
    const agendadasValoracion = opportunities.filter(opp =>
      stagesAgendadas.includes(opp.pipelineStageId)
    ).length;

    const stagesValoradas = [
      this.stageIds.valoracionRealizada,
      this.stageIds.seguimientoCierre,
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];
    const valoradasCotizacion = opportunities.filter(opp =>
      stagesValoradas.includes(opp.pipelineStageId)
    ).length;

    const noContactoValoracion = countByStage[this.stageIds.vvNoContesto] || 0;

    const stagesCierre = [
      this.stageIds.seguimientoCierre,
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];
    const oportunidadesCierre = opportunities.filter(opp =>
      stagesCierre.includes(opp.pipelineStageId)
    );

    const cierreAlta = oportunidadesCierre.filter(opp =>
      (parseFloat(opp.monetaryValue) || 0) > 50000
    ).length;

    const cierreMedia = oportunidadesCierre.filter(opp => {
      const value = parseFloat(opp.monetaryValue) || 0;
      return value > 0 && value <= 50000;
    }).length;

    const stagesDeposito = [
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];
    const depositosRealizados = opportunities.filter(opp =>
      stagesDeposito.includes(opp.pipelineStageId)
    );

    const totalDepositos = depositosRealizados.reduce((sum, opp) =>
      sum + (parseFloat(opp.monetaryValue) || 0), 0
    );

    const depositosCampanas = depositosRealizados.filter(opp => {
      const source = (opp.source || '').toLowerCase();
      const tags = (opp.contact?.tags || []).join(' ').toLowerCase();
      return source.includes('facebook') || source.includes('instagram') ||
             source.includes('form') || source.includes('landing') ||
             tags.includes('fb-ad') || tags.includes('instagram-ad');
    });

    const totalDepositosCampanas = depositosCampanas.reduce((sum, opp) =>
      sum + (parseFloat(opp.monetaryValue) || 0), 0
    );

    return {
      totalLeads,
      leadsCalificados,
      agendadasValoracion,
      valoradasCotizacion,
      noContactoValoracion,
      oportunidadesCierreAlta: cierreAlta,
      oportunidadesCierreMedia: cierreMedia,
      oportunidadesCierreTotal: oportunidadesCierre.length,
      depositosRealizados: depositosRealizados.length,
      totalDepositos,
      depositosCampanas: depositosCampanas.length,
      totalDepositosCampanas,
      tasaConversion: totalLeads > 0
        ? ((depositosRealizados.length / totalLeads) * 100).toFixed(2)
        : 0,
      tasaContacto: totalLeads > 0
        ? ((leadsCalificados / totalLeads) * 100).toFixed(2)
        : 0,
      porEtapa: {
        e1_nuevoLead: countByStage[this.stageIds.nuevoLead] || 0,
        e2_interes: countByStage[this.stageIds.interesPendiente] || 0,
        e3_seguimiento: countByStage[this.stageIds.seguimientoFotos] || 0,
        e4_fotosRecibidas: countByStage[this.stageIds.fotosRecibidas] || 0,
        e5_valoracionVirtual: countByStage[this.stageIds.valoracionVirtual] || 0,
        vvReagendada: countByStage[this.stageIds.vvReagendada] || 0,
        e6_noContesto: countByStage[this.stageIds.vvNoContesto] || 0,
        e7_valoracionRealizada: countByStage[this.stageIds.valoracionRealizada] || 0,
        e8_seguimientoCierre: countByStage[this.stageIds.seguimientoCierre] || 0,
        e9_deposito: countByStage[this.stageIds.depositoRealizado] || 0,
        e10_fechaCirugia: countByStage[this.stageIds.fechaCirugia] || 0
      }
    };
  }

  // Calcular distribución por etapas
  async calculateStageDistribution(startDate, endDate) {
    try {
      const allOpportunities = await ghlService.getOpportunities();
      const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);
      return this._buildStageDistribution(opportunities);
    } catch (error) {
      console.error('Error calculando distribución:', error);
      throw error;
    }
  }

  _buildStageDistribution(opportunities) {
    const distribution = {};
    this.stageOrder.forEach(id => {
      distribution[id] = { count: 0, value: 0 };
    });

    opportunities.forEach(opp => {
      const stageId = opp.pipelineStageId;
      if (distribution[stageId]) {
        distribution[stageId].count++;
        distribution[stageId].value += parseFloat(opp.monetaryValue) || 0;
      }
    });

    return this.stageOrder.map(stageId => ({
      stageId,
      stage: this.stageNames[stageId] || stageId,
      count: distribution[stageId].count,
      value: distribution[stageId].value
    }));
  }

  // Calcular tiempos promedio
  async calculateAverageTimeInStages(startDate, endDate) {
    try {
      const allOpportunities = await ghlService.getOpportunities();
      const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);
      return this._buildAverageTimes(opportunities);
    } catch (error) {
      console.error('Error calculando tiempos:', error);
      throw error;
    }
  }

  _buildAverageTimes(opportunities) {
    const stagesDeposito = [
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];

    const closedOpportunities = opportunities.filter(opp =>
      stagesDeposito.includes(opp.pipelineStageId)
    );

    const tiempos = [];
    closedOpportunities.forEach(opp => {
      const createdAt = new Date(opp.createdAt);
      const updatedAt = new Date(opp.updatedAt || opp.lastStatusChangeAt);
      const daysDiff = Math.ceil((updatedAt - createdAt) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0 && daysDiff < 365) {
        tiempos.push(daysDiff);
      }
    });

    const calcAverage = (arr) => {
      if (arr.length === 0) return 0;
      return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    };

    return {
      promedioTiempoCierre: calcAverage(tiempos),
      oportunidadesAnalizadas: closedOpportunities.length,
      tiempoMinimoCierre: tiempos.length > 0 ? Math.min(...tiempos) : 0,
      tiempoMaximoCierre: tiempos.length > 0 ? Math.max(...tiempos) : 0
    };
  }

  // Métricas por fuente/campaña
  async calculateSourceMetrics(startDate, endDate) {
    try {
      const allOpportunities = await ghlService.getOpportunities();
      const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);
      return this._buildSourceMetrics(opportunities);
    } catch (error) {
      console.error('Error calculando métricas por fuente:', error);
      throw error;
    }
  }

  // Determinar el canal a partir del source y tags
  _getChannel(source, tagsJoined) {
    const s = (source || '').toLowerCase();

    // 1. Ads de Meta (Facebook/Instagram) — prioridad alta
    if (tagsJoined.includes('fb-ad-lead') || tagsJoined.includes('fb-ad')) return 'Facebook Ads';
    if (tagsJoined.includes('instagram-ad-lead') || tagsJoined.includes('instagram-ad')) return 'Instagram Ads';

    // 2. Source explícito (cuando GHL sí lo tiene)
    if (s.includes('facebook') || s.includes('fb')) return 'Facebook Ads';
    if (s.includes('instagram')) return 'Instagram Ads';
    if (s.includes('google')) return 'Google';
    if (s.includes('tiktok') || tagsJoined.includes('tiktok')) return 'TikTok';

    // 3. WhatsApp orgánico/directo (sin tag de ad)
    if (s.includes('whatsapp') || tagsJoined.includes('inbound whatsapp') ||
        tagsJoined.includes('wa:') || tagsJoined.includes('wazz') ||
        tagsJoined.includes('whatsapp')) return 'WhatsApp';

    // 4. Email/Correo
    if (s.includes('email') || s.includes('correo') || tagsJoined.includes('correo')) return 'Correo';

    // 5. Source con valor pero no reconocido
    if (source) return 'Otros';

    // 6. Sin source ni tags reconocibles
    return 'Sin fuente';
  }

  _buildSourceMetrics(opportunities) {
    const channelMetrics = {};

    opportunities.forEach(opp => {
      const rawSource = opp.source || null;
      const rawTags = opp.contact?.tags || [];
      const tagsJoined = rawTags.join(' ').toLowerCase();

      // Agrupar por CANAL (Facebook, Instagram, WhatsApp, etc.)
      const channel = this._getChannel(rawSource, tagsJoined);

      // El nombre de campaña es el source original (o "Sin campaña" si no tiene)
      const campaignName = rawSource || 'Sin campaña';

      if (!channelMetrics[channel]) {
        channelMetrics[channel] = {
          total: 0, calificados: 0, valoraciones: 0, depositos: 0, valorTotal: 0,
          _campaigns: {}
        };
      }

      channelMetrics[channel].total++;
      const stageId = opp.pipelineStageId;

      if (stageId !== this.stageIds.nuevoLead) {
        channelMetrics[channel].calificados++;
      }

      const stagesValoradas = [
        this.stageIds.valoracionRealizada,
        this.stageIds.seguimientoCierre,
        this.stageIds.depositoRealizado,
        this.stageIds.fechaCirugia
      ];
      if (stagesValoradas.includes(stageId)) {
        channelMetrics[channel].valoraciones++;
      }

      const stagesDeposito = [this.stageIds.depositoRealizado, this.stageIds.fechaCirugia];
      const isDeposito = stagesDeposito.includes(stageId);
      if (isDeposito) {
        channelMetrics[channel].depositos++;
        channelMetrics[channel].valorTotal += parseFloat(opp.monetaryValue) || 0;
      }

      // Sub-agrupar por campaña (el source original)
      if (!channelMetrics[channel]._campaigns[campaignName]) {
        channelMetrics[channel]._campaigns[campaignName] = {
          total: 0, calificados: 0, depositos: 0, valorTotal: 0
        };
      }
      channelMetrics[channel]._campaigns[campaignName].total++;
      if (stageId !== this.stageIds.nuevoLead) {
        channelMetrics[channel]._campaigns[campaignName].calificados++;
      }
      if (isDeposito) {
        channelMetrics[channel]._campaigns[campaignName].depositos++;
        channelMetrics[channel]._campaigns[campaignName].valorTotal += parseFloat(opp.monetaryValue) || 0;
      }
    });

    return Object.entries(channelMetrics)
      .map(([source, metrics]) => ({
        source,
        total: metrics.total,
        calificados: metrics.calificados,
        valoraciones: metrics.valoraciones,
        depositos: metrics.depositos,
        valorTotal: metrics.valorTotal,
        tasaConversion: metrics.total > 0
          ? ((metrics.depositos / metrics.total) * 100).toFixed(2)
          : 0,
        campaigns: Object.entries(metrics._campaigns)
          .map(([campaign, cm]) => ({
            campaign,
            ...cm,
            tasaConversion: cm.total > 0
              ? ((cm.depositos / cm.total) * 100).toFixed(2)
              : 0
          }))
          .sort((a, b) => b.total - a.total)
      }))
      .sort((a, b) => b.total - a.total);
  }

  // Tendencia diaria
  async getDailyTrend(startDate, endDate) {
    try {
      const allOpportunities = await ghlService.getOpportunities();
      const opportunities = this.filterByDateRange(allOpportunities, startDate, endDate);
      return this._buildDailyTrend(opportunities);
    } catch (error) {
      console.error('Error obteniendo tendencia:', error);
      throw error;
    }
  }

  _buildDailyTrend(opportunities) {
    const dailyData = {};

    const stagesValoradas = [
      this.stageIds.valoracionRealizada,
      this.stageIds.seguimientoCierre,
      this.stageIds.depositoRealizado,
      this.stageIds.fechaCirugia
    ];
    const stagesDeposito = [this.stageIds.depositoRealizado, this.stageIds.fechaCirugia];

    opportunities.forEach(opp => {
      const date = new Date(opp.createdAt);
      // Usar fecha local en vez de UTC para la agrupación diaria
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { leads: 0, valoraciones: 0, depositos: 0 };
      }

      dailyData[dateKey].leads++;

      if (stagesValoradas.includes(opp.pipelineStageId)) {
        dailyData[dateKey].valoraciones++;
      }
      if (stagesDeposito.includes(opp.pipelineStageId)) {
        dailyData[dateKey].depositos++;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

module.exports = new MetricsService();
