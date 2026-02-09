const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURACIÓN
// ============================================
const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ============================================
// GHL SERVICE (inline para serverless)
// ============================================
const ghlClient = axios.create({
  baseURL: GHL_API_BASE,
  headers: {
    'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, url, options = {}, retryCount = 0) {
  try {
    await sleep(500);
    const response = await ghlClient[method](url, options);
    return response;
  } catch (error) {
    if (error.response?.status === 429 && retryCount < 3) {
      const waitTime = 2000 * Math.pow(2, retryCount);
      await sleep(waitTime);
      return makeRequest(method, url, options, retryCount + 1);
    }
    throw error;
  }
}

async function fetchAllOpportunities() {
  let allOpportunities = [];
  let hasMore = true;
  let startAfterId = null;
  let startAfter = null;

  while (hasMore) {
    const params = { limit: 100 };
    if (startAfterId) {
      params.startAfterId = startAfterId;
      params.startAfter = startAfter;
    }

    const response = await makeRequest('get', `/pipelines/${process.env.GHL_PIPELINE_ID}/opportunities`, { params });
    const opportunities = response.data.opportunities || [];
    allOpportunities = [...allOpportunities, ...opportunities];

    const meta = response.data.meta;
    if (meta && meta.nextPage && opportunities.length === 100) {
      startAfterId = meta.startAfterId;
      startAfter = meta.startAfter;
    } else {
      hasMore = false;
    }
  }

  return allOpportunities;
}

// ============================================
// SUPABASE CACHE
// ============================================
async function getCachedMetrics(startDate, endDate) {
  const { data, error } = await supabase
    .from('metrics_cache')
    .select('data, fetched_at')
    .eq('start_date', startDate)
    .eq('end_date', endDate)
    .single();

  if (error || !data) return null;

  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > CACHE_TTL_MS) return null;

  return data.data;
}

async function saveCachedMetrics(startDate, endDate, metricsData) {
  await supabase
    .from('metrics_cache')
    .upsert(
      {
        start_date: startDate,
        end_date: endDate,
        data: metricsData,
        fetched_at: new Date().toISOString()
      },
      { onConflict: 'start_date,end_date' }
    );
}

// ============================================
// METRICS SERVICE (inline para serverless)
// ============================================
const stageIds = {
  nuevoLead: 'a99b16a6-01b6-4570-b4c6-6bacc2fbf072',
  interesPendiente: '2d74b32b-c5d7-4e8a-9049-78d9ea7231c9',
  seguimientoFotos: '6e4785c2-cd9a-4bf5-860c-bb27129678c7',
  fotosRecibidas: 'd278fd60-a732-494a-b099-6ff1048c9331',
  valoracionVirtual: 'f5b43424-4061-4feb-8f91-d4603751c9d2',
  vvReagendada: '2542b349-23ea-45d0-bc0a-2e61e7f5fd71',
  vvNoContesto: 'e8091013-0c09-448c-99ac-282e3caa7542',
  valoracionRealizada: '9628011f-7a90-4e8e-82b0-0e0a15b22552',
  seguimientoCierre: '3f2b42a3-aff7-4c5a-b3ac-d7880414c2f2',
  depositoRealizado: '3a5c8cb1-b051-45c2-8469-260ff9e82703',
  fechaCirugia: 'ee8a731e-0713-4cd6-996d-431561b26a6c'
};

const stageNames = {
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

const stageOrder = [
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

function filterByDateRange(opportunities, startDate, endDate) {
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
  const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);

  return opportunities.filter(opp => {
    const createdAt = new Date(opp.createdAt || opp.dateAdded);
    return createdAt >= start && createdAt <= end;
  });
}

function buildFunnelMetrics(opportunities) {
  const countByStage = {};
  stageOrder.forEach(id => countByStage[id] = 0);
  opportunities.forEach(opp => {
    if (countByStage[opp.pipelineStageId] !== undefined) countByStage[opp.pipelineStageId]++;
  });

  const totalLeads = opportunities.length;
  const leadsCalificados = opportunities.filter(o => o.pipelineStageId !== stageIds.nuevoLead).length;

  const stagesAgendadas = [stageIds.valoracionVirtual, stageIds.vvReagendada, stageIds.vvNoContesto, stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
  const agendadasValoracion = opportunities.filter(o => stagesAgendadas.includes(o.pipelineStageId)).length;

  const stagesValoradas = [stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
  const valoradasCotizacion = opportunities.filter(o => stagesValoradas.includes(o.pipelineStageId)).length;

  const stagesCierre = [stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
  const oportunidadesCierre = opportunities.filter(o => stagesCierre.includes(o.pipelineStageId));
  const cierreAlta = oportunidadesCierre.filter(o => (parseFloat(o.monetaryValue) || 0) > 50000).length;
  const cierreMedia = oportunidadesCierre.filter(o => { const v = parseFloat(o.monetaryValue) || 0; return v > 0 && v <= 50000; }).length;

  const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  const depositosRealizados = opportunities.filter(o => stagesDeposito.includes(o.pipelineStageId));
  const totalDepositos = depositosRealizados.reduce((s, o) => s + (parseFloat(o.monetaryValue) || 0), 0);

  const depositosCampanas = depositosRealizados.filter(o => {
    const src = (o.source || '').toLowerCase();
    const tags = (o.contact?.tags || []).join(' ').toLowerCase();
    return src.includes('facebook') || src.includes('instagram') || src.includes('form') || src.includes('landing') || tags.includes('fb-ad') || tags.includes('instagram-ad');
  });
  const totalDepositosCampanas = depositosCampanas.reduce((s, o) => s + (parseFloat(o.monetaryValue) || 0), 0);

  return {
    totalLeads, leadsCalificados, agendadasValoracion, valoradasCotizacion,
    noContactoValoracion: countByStage[stageIds.vvNoContesto] || 0,
    oportunidadesCierreAlta: cierreAlta, oportunidadesCierreMedia: cierreMedia,
    oportunidadesCierreTotal: oportunidadesCierre.length,
    depositosRealizados: depositosRealizados.length, totalDepositos,
    depositosCampanas: depositosCampanas.length, totalDepositosCampanas,
    tasaConversion: totalLeads > 0 ? ((depositosRealizados.length / totalLeads) * 100).toFixed(2) : 0,
    tasaContacto: totalLeads > 0 ? ((leadsCalificados / totalLeads) * 100).toFixed(2) : 0,
    porEtapa: {
      e1_nuevoLead: countByStage[stageIds.nuevoLead] || 0,
      e2_interes: countByStage[stageIds.interesPendiente] || 0,
      e3_seguimiento: countByStage[stageIds.seguimientoFotos] || 0,
      e4_fotosRecibidas: countByStage[stageIds.fotosRecibidas] || 0,
      e5_valoracionVirtual: countByStage[stageIds.valoracionVirtual] || 0,
      vvReagendada: countByStage[stageIds.vvReagendada] || 0,
      e6_noContesto: countByStage[stageIds.vvNoContesto] || 0,
      e7_valoracionRealizada: countByStage[stageIds.valoracionRealizada] || 0,
      e8_seguimientoCierre: countByStage[stageIds.seguimientoCierre] || 0,
      e9_deposito: countByStage[stageIds.depositoRealizado] || 0,
      e10_fechaCirugia: countByStage[stageIds.fechaCirugia] || 0
    }
  };
}

function buildStageDistribution(opportunities) {
  const distribution = {};
  stageOrder.forEach(id => { distribution[id] = { count: 0, value: 0 }; });
  opportunities.forEach(opp => {
    if (distribution[opp.pipelineStageId]) {
      distribution[opp.pipelineStageId].count++;
      distribution[opp.pipelineStageId].value += parseFloat(opp.monetaryValue) || 0;
    }
  });
  return stageOrder.map(id => ({ stageId: id, stage: stageNames[id] || id, count: distribution[id].count, value: distribution[id].value }));
}

function buildAverageTimes(opportunities) {
  const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  const closed = opportunities.filter(o => stagesDeposito.includes(o.pipelineStageId));
  const tiempos = [];
  closed.forEach(o => {
    const days = Math.ceil((new Date(o.updatedAt || o.lastStatusChangeAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24));
    if (days > 0 && days < 365) tiempos.push(days);
  });
  const avg = tiempos.length > 0 ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;
  return {
    promedioTiempoCierre: avg, oportunidadesAnalizadas: closed.length,
    tiempoMinimoCierre: tiempos.length > 0 ? Math.min(...tiempos) : 0,
    tiempoMaximoCierre: tiempos.length > 0 ? Math.max(...tiempos) : 0
  };
}

function buildSourceMetrics(opportunities) {
  const sourceMetrics = {};
  opportunities.forEach(opp => {
    let source = opp.source || null;
    const tags = (opp.contact?.tags || []).join(' ').toLowerCase();
    if (!source) {
      if (tags.includes('fb-ad') || tags.includes('facebook')) source = 'Facebook Ads';
      else if (tags.includes('instagram-ad')) source = 'Instagram Ads';
      else if (tags.includes('inbound whatsapp')) source = 'WhatsApp Inbound';
      else source = 'Sin fuente';
    }
    if (!sourceMetrics[source]) sourceMetrics[source] = { total: 0, calificados: 0, valoraciones: 0, depositos: 0, valorTotal: 0 };
    sourceMetrics[source].total++;
    if (opp.pipelineStageId !== stageIds.nuevoLead) sourceMetrics[source].calificados++;
    const sv = [stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
    if (sv.includes(opp.pipelineStageId)) sourceMetrics[source].valoraciones++;
    const sd = [stageIds.depositoRealizado, stageIds.fechaCirugia];
    if (sd.includes(opp.pipelineStageId)) { sourceMetrics[source].depositos++; sourceMetrics[source].valorTotal += parseFloat(opp.monetaryValue) || 0; }
  });
  return Object.entries(sourceMetrics).map(([source, m]) => ({
    source, ...m, tasaConversion: m.total > 0 ? ((m.depositos / m.total) * 100).toFixed(2) : 0
  })).sort((a, b) => b.total - a.total);
}

function buildDailyTrend(opportunities) {
  const dailyData = {};
  const sv = [stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
  const sd = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  opportunities.forEach(opp => {
    const d = new Date(opp.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dailyData[key]) dailyData[key] = { leads: 0, valoraciones: 0, depositos: 0 };
    dailyData[key].leads++;
    if (sv.includes(opp.pipelineStageId)) dailyData[key].valoraciones++;
    if (sd.includes(opp.pipelineStageId)) dailyData[key].depositos++;
  });
  return Object.entries(dailyData).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ============================================
// HANDLER PRINCIPAL
// ============================================
const getCurrentMonthRange = () => {
  const now = new Date();
  const s = new Date(now.getFullYear(), now.getMonth(), 1);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(s), endDate: fmt(e) };
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Determinar el endpoint desde el path
    const path = event.path.replace('/.netlify/functions/metrics', '').replace('/api/metrics', '').replace(/^\//, '');
    const params = event.queryStringParameters || {};

    const startDate = params.startDate;
    const endDate = params.endDate;
    const dateRange = startDate && endDate
      ? { startDate, endDate }
      : getCurrentMonthRange();

    // Para el endpoint /summary (el principal que usa el dashboard)
    if (path === 'summary' || path === '' || !path) {
      // Intentar caché de Supabase primero
      const cached = await getCachedMetrics(dateRange.startDate, dateRange.endDate);
      if (cached) {
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ success: true, dateRange, source: 'cache', data: cached })
        };
      }

      // Consultar GHL
      const allOpportunities = await fetchAllOpportunities();
      const opportunities = filterByDateRange(allOpportunities, dateRange.startDate, dateRange.endDate);

      const data = {
        funnel: buildFunnelMetrics(opportunities),
        stages: buildStageDistribution(opportunities),
        times: buildAverageTimes(opportunities),
        sources: buildSourceMetrics(opportunities),
        trend: buildDailyTrend(opportunities)
      };

      // Guardar en caché (no bloquear)
      saveCachedMetrics(dateRange.startDate, dateRange.endDate, data).catch(() => {});

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, dateRange, source: 'ghl', data })
      };
    }

    // Endpoints individuales
    const allOpportunities = await fetchAllOpportunities();
    const opportunities = filterByDateRange(allOpportunities, dateRange.startDate, dateRange.endDate);

    let data;
    switch (path) {
      case 'funnel': data = buildFunnelMetrics(opportunities); break;
      case 'stages': data = buildStageDistribution(opportunities); break;
      case 'times': data = buildAverageTimes(opportunities); break;
      case 'sources': data = buildSourceMetrics(opportunities); break;
      case 'trend': data = buildDailyTrend(opportunities); break;
      default:
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint no encontrado' }) };
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ success: true, dateRange, data })
    };
  } catch (error) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
