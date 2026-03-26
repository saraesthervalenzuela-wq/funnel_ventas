const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURACIÓN - API v2 (Integraciones Privadas)
// ============================================
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

// ============================================
// GHL SERVICE (API v2)
// ============================================
const ghlClient = axios.create({
  baseURL: GHL_API_BASE,
  headers: {
    'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
    'Version': GHL_API_VERSION
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(method, url, dataOrOptions = {}, retryCount = 0) {
  try {
    await sleep(500);
    const response = await ghlClient[method](url, dataOrOptions);
    return response;
  } catch (error) {
    if (error.response?.status === 429 && retryCount < 3) {
      await sleep(2000 * Math.pow(2, retryCount));
      return makeRequest(method, url, dataOrOptions, retryCount + 1);
    }
    throw error;
  }
}

async function fetchAllOpportunities() {
  let allOpportunities = [];
  let hasMore = true;
  let page = 1;

  while (hasMore) {
    const params = new URLSearchParams({
      location_id: process.env.GHL_LOCATION_ID,
      pipeline_id: process.env.GHL_PIPELINE_ID,
      limit: 100,
      page: page
    });

    const response = await makeRequest('get', `/opportunities/search?${params.toString()}`);
    const opportunities = response.data.opportunities || [];
    allOpportunities = [...allOpportunities, ...opportunities];

    const meta = response.data.meta;
    if (meta && meta.total > allOpportunities.length && opportunities.length === 100) {
      page++;
    } else {
      hasMore = false;
    }
  }

  return allOpportunities;
}

async function getRecentConversations(limit = 30) {
  try {
    const params = new URLSearchParams({
      locationId: process.env.GHL_LOCATION_ID,
      limit: limit,
      sortBy: 'last_message_date',
      sortOrder: 'desc'
    });
    const response = await makeRequest('get', `/conversations/search?${params.toString()}`);
    return response.data.conversations || [];
  } catch (error) {
    return [];
  }
}

async function getConversationMessages(conversationId, limit = 20) {
  try {
    const response = await makeRequest('get', `/conversations/${conversationId}/messages?limit=${limit}`);
    return response.data.messages?.messages || [];
  } catch (error) {
    return [];
  }
}

async function calculateResponseTime(sampleSize = 30) {
  try {
    const conversations = await getRecentConversations(sampleSize);
    const responseTimes = [];

    for (const conv of conversations) {
      const messages = await getConversationMessages(conv.id, 20);
      if (!messages || messages.length < 2) continue;

      const sorted = [...messages].sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));

      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].direction === 'inbound') {
          for (let j = i + 1; j < sorted.length; j++) {
            if (sorted[j].direction === 'outbound') {
              const diffMinutes = (new Date(sorted[j].dateAdded) - new Date(sorted[i].dateAdded)) / (1000 * 60);
              if (diffMinutes > 0 && diffMinutes < 1440) {
                responseTimes.push(diffMinutes);
              }
              break;
            }
          }
        }
      }
    }

    return {
      avgMinutes: responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
      medianMinutes: responseTimes.length > 0
        ? Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)])
        : 0,
      samplesAnalyzed: responseTimes.length,
      conversationsChecked: conversations.length
    };
  } catch (error) {
    return { avgMinutes: 0, medianMinutes: 0, samplesAnalyzed: 0, conversationsChecked: 0 };
  }
}

// ============================================
// SUPABASE
// ============================================

function mapOppToDB(opp) {
  return {
    id: opp.id,
    pipeline_stage_id: opp.pipelineStageId,
    contact_id: opp.contact?.id || null,
    contact_name: opp.contact?.name || null,
    contact_email: opp.contact?.email || null,
    contact_phone: opp.contact?.phone || null,
    contact_tags: opp.contact?.tags || [],
    created_at: opp.createdAt || opp.dateAdded,
    updated_at: opp.updatedAt || opp.lastStatusChangeAt || null,
    monetary_value: parseFloat(opp.monetaryValue) || 0,
    source: opp.source || null,
    status: opp.status || 'open',
    raw_json: opp,
    synced_at: new Date().toISOString()
  };
}

async function upsertOpportunities(opportunities) {
  const BATCH_SIZE = 100;
  let newCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const batch = opportunities.slice(i, i + BATCH_SIZE);
    const rows = batch.map(mapOppToDB);
    const ids = rows.map(r => r.id);
    const { data: existing } = await supabase.from('opportunities').select('id').in('id', ids);
    const existingIds = new Set((existing || []).map(e => e.id));
    newCount += rows.filter(r => !existingIds.has(r.id)).length;
    updatedCount += rows.length - rows.filter(r => !existingIds.has(r.id)).length;
    const { error } = await supabase.from('opportunities').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }

  return { total: opportunities.length, new: newCount, updated: updatedCount };
}

async function getLatestSnapshot(startDate, endDate) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .eq('start_date', startDate)
    .eq('end_date', endDate)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return { funnel: data.funnel, stages: data.stages, times: data.times, sources: data.sources, trend: data.trend };
}

async function insertSnapshot(startDate, endDate, syncType, metricsData, oppCount) {
  await supabase.from('metrics_snapshots').insert({
    start_date: startDate, end_date: endDate, sync_type: syncType,
    funnel: metricsData.funnel, stages: metricsData.stages,
    times: metricsData.times, sources: metricsData.sources,
    trend: metricsData.trend, opportunity_count: oppCount
  }).catch(() => {});
}

// ============================================
// METRICS SERVICE
// ============================================
const stageIds = {
  noInteresado: '31db8524-1bd5-412d-974f-df98831b1212',
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
  '31db8524-1bd5-412d-974f-df98831b1212': 'E0. NO INTERESADO',
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
  '31db8524-1bd5-412d-974f-df98831b1212',
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
    const stageDate = new Date(opp.lastStageChangeAt || opp.lastStatusChangeAt || opp.createdAt || opp.dateAdded);
    return stageDate >= start && stageDate <= end;
  });
}

function buildFunnelMetrics(opportunities) {
  const countByStage = {};
  stageOrder.forEach(id => countByStage[id] = 0);
  opportunities.forEach(opp => {
    if (countByStage[opp.pipelineStageId] !== undefined) countByStage[opp.pipelineStageId]++;
  });

  const totalLeads = opportunities.length;
  const leadsCalificados = opportunities.filter(o => o.pipelineStageId !== stageIds.nuevoLead && o.pipelineStageId !== stageIds.noInteresado).length;

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
      e0_noInteresado: countByStage[stageIds.noInteresado] || 0,
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

function getChannel(source, tagsJoined) {
  const s = (source || '').toLowerCase();
  if (tagsJoined.includes('fb-ad-lead') || tagsJoined.includes('fb-ad')) return 'Facebook Ads';
  if (tagsJoined.includes('instagram-ad-lead') || tagsJoined.includes('instagram-ad')) return 'Instagram Ads';
  if (s.includes('facebook') || s.includes('fb')) return 'Facebook Ads';
  if (s.includes('instagram')) return 'Instagram Ads';
  if (s.includes('google')) return 'Google';
  if (s.includes('tiktok') || tagsJoined.includes('tiktok')) return 'TikTok';
  if (s.includes('whatsapp') || tagsJoined.includes('inbound whatsapp') || tagsJoined.includes('wa:') || tagsJoined.includes('wazz') || tagsJoined.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('email') || s.includes('correo') || tagsJoined.includes('correo')) return 'Correo';
  if (source) return 'Otros';
  return 'Sin fuente';
}

function buildSourceMetrics(opportunities) {
  const channelMetrics = {};
  opportunities.forEach(opp => {
    const rawSource = opp.source || null;
    const tagsJoined = (opp.contact?.tags || []).join(' ').toLowerCase();
    const channel = getChannel(rawSource, tagsJoined);
    const campaignName = rawSource || 'Sin campaña';

    if (!channelMetrics[channel]) channelMetrics[channel] = { total: 0, calificados: 0, valoraciones: 0, depositos: 0, valorTotal: 0, _campaigns: {} };
    channelMetrics[channel].total++;
    const stageId = opp.pipelineStageId;
    if (stageId !== stageIds.nuevoLead && stageId !== stageIds.noInteresado) channelMetrics[channel].calificados++;
    const sv = [stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
    if (sv.includes(stageId)) channelMetrics[channel].valoraciones++;
    const sd = [stageIds.depositoRealizado, stageIds.fechaCirugia];
    const isDeposito = sd.includes(stageId);
    if (isDeposito) { channelMetrics[channel].depositos++; channelMetrics[channel].valorTotal += parseFloat(opp.monetaryValue) || 0; }

    if (!channelMetrics[channel]._campaigns[campaignName]) channelMetrics[channel]._campaigns[campaignName] = { total: 0, calificados: 0, depositos: 0, valorTotal: 0 };
    channelMetrics[channel]._campaigns[campaignName].total++;
    if (stageId !== stageIds.nuevoLead && stageId !== stageIds.noInteresado) channelMetrics[channel]._campaigns[campaignName].calificados++;
    if (isDeposito) { channelMetrics[channel]._campaigns[campaignName].depositos++; channelMetrics[channel]._campaigns[campaignName].valorTotal += parseFloat(opp.monetaryValue) || 0; }
  });
  return Object.entries(channelMetrics).map(([source, m]) => ({
    source, total: m.total, calificados: m.calificados, valoraciones: m.valoraciones, depositos: m.depositos, valorTotal: m.valorTotal,
    tasaConversion: m.total > 0 ? ((m.depositos / m.total) * 100).toFixed(2) : 0,
    campaigns: Object.entries(m._campaigns).map(([campaign, cm]) => ({
      campaign, ...cm, tasaConversion: cm.total > 0 ? ((cm.depositos / cm.total) * 100).toFixed(2) : 0
    })).sort((a, b) => b.total - a.total)
  })).sort((a, b) => b.total - a.total);
}

function buildDailyTrend(opportunities) {
  const dailyData = {};
  const sv = [stageIds.valoracionRealizada, stageIds.seguimientoCierre, stageIds.depositoRealizado, stageIds.fechaCirugia];
  const sd = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  opportunities.forEach(opp => {
    const d = new Date(opp.lastStageChangeAt || opp.lastStatusChangeAt || opp.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!dailyData[key]) dailyData[key] = { leads: 0, valoraciones: 0, depositos: 0 };
    dailyData[key].leads++;
    if (sv.includes(opp.pipelineStageId)) dailyData[key].valoraciones++;
    if (sd.includes(opp.pipelineStageId)) dailyData[key].depositos++;
  });
  return Object.entries(dailyData).map(([date, data]) => ({ date, ...data })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function calculateAllMetrics(opportunities) {
  return {
    funnel: buildFunnelMetrics(opportunities),
    stages: buildStageDistribution(opportunities),
    times: buildAverageTimes(opportunities),
    sources: buildSourceMetrics(opportunities),
    trend: buildDailyTrend(opportunities)
  };
}

function buildCurrentSnapshot(allOpportunities) {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const countByStage = {};
  const staleByStage = {};
  stageOrder.forEach(id => { countByStage[id] = 0; staleByStage[id] = 0; });

  allOpportunities.forEach(opp => {
    const stageId = opp.pipelineStageId;
    if (countByStage[stageId] !== undefined) {
      countByStage[stageId]++;
      const stageDate = new Date(opp.lastStageChangeAt || opp.lastStatusChangeAt || opp.createdAt);
      if (now - stageDate.getTime() > oneWeekMs) staleByStage[stageId]++;
    }
  });

  const build = (id) => ({ count: countByStage[id] || 0, stale: staleByStage[id] || 0 });

  return {
    total: allOpportunities.length,
    porEtapa: {
      e0_noInteresado: build(stageIds.noInteresado),
      e1_nuevoLead: build(stageIds.nuevoLead),
      e2_interes: build(stageIds.interesPendiente),
      e3_seguimiento: build(stageIds.seguimientoFotos),
      e4_fotosRecibidas: build(stageIds.fotosRecibidas),
      e5_valoracionVirtual: build(stageIds.valoracionVirtual),
      vvReagendada: build(stageIds.vvReagendada),
      e6_noContesto: build(stageIds.vvNoContesto),
      e7_valoracionRealizada: build(stageIds.valoracionRealizada),
      e8_seguimientoCierre: build(stageIds.seguimientoCierre),
      e9_deposito: build(stageIds.depositoRealizado),
      e10_fechaCirugia: build(stageIds.fechaCirugia)
    }
  };
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
    const path = event.path.replace('/.netlify/functions/metrics', '').replace('/api/metrics', '').replace(/^\//, '');
    const params = event.queryStringParameters || {};

    const dateRange = params.startDate && params.endDate
      ? { startDate: params.startDate, endDate: params.endDate }
      : getCurrentMonthRange();

    // /current-stages — snapshot actual sin filtro de fecha (lee de Supabase)
    if (path === 'current-stages') {
      let allRows = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: rows, error } = await supabase
          .from('opportunities')
          .select('id, pipeline_stage_id, raw_json')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allRows = allRows.concat(rows || []);
        if (!rows || rows.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      const opps = allRows.map(row => ({
        pipelineStageId: row.pipeline_stage_id,
        lastStageChangeAt: row.raw_json?.lastStageChangeAt || row.raw_json?.lastStatusChangeAt,
        lastStatusChangeAt: row.raw_json?.lastStatusChangeAt,
        createdAt: row.raw_json?.createdAt
      }));

      const data = buildCurrentSnapshot(opps);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // /response-time — tiempo promedio de respuesta
    if (path === 'response-time') {
      const data = await calculateResponseTime(30);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
    }

    // /summary — endpoint principal (usa snapshots de Supabase para evitar timeout)
    if (path === 'summary' || path === '' || !path) {
      // 1. Intentar snapshot reciente (< 5 min)
      const snapshot = await getLatestSnapshot(dateRange.startDate, dateRange.endDate);
      if (snapshot) {
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ success: true, dateRange, source: 'snapshot', data: snapshot })
        };
      }

      // 2. Sin snapshot: leer oportunidades de Supabase DB
      let allRows = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      while (true) {
        const { data: rows, error } = await supabase
          .from('opportunities')
          .select('*')
          .range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allRows = allRows.concat(rows || []);
        if (!rows || rows.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      if (allRows.length === 0) {
        return {
          statusCode: 200, headers,
          body: JSON.stringify({ success: true, dateRange, source: 'empty', data: calculateAllMetrics([]) })
        };
      }

      // Mapear de DB y extraer lastStageChangeAt de raw_json
      const opportunities = allRows.map(row => {
        const raw = row.raw_json || {};
        return {
          id: row.id, pipelineStageId: row.pipeline_stage_id,
          createdAt: row.created_at, dateAdded: row.created_at,
          updatedAt: row.updated_at, monetaryValue: row.monetary_value,
          source: row.source, status: row.status,
          lastStageChangeAt: raw.lastStageChangeAt || raw.lastStatusChangeAt || row.updated_at,
          lastStatusChangeAt: raw.lastStatusChangeAt || row.updated_at,
          contact: { id: row.contact_id, name: row.contact_name, email: row.contact_email, phone: row.contact_phone, tags: row.contact_tags || [] }
        };
      });

      const filtered = filterByDateRange(opportunities, dateRange.startDate, dateRange.endDate);
      const data = calculateAllMetrics(filtered);

      // Guardar snapshot para próximas consultas
      insertSnapshot(dateRange.startDate, dateRange.endDate, 'query', data, filtered.length);

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, dateRange, source: 'database', data })
      };
    }

    // /sync-info
    if (path === 'sync-info') {
      const { data } = await supabase.from('sync_log').select('*').order('created_at', { ascending: false }).limit(1).single();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, data }) };
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

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, dateRange, data }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
