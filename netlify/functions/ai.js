const Anthropic = require('@anthropic-ai/sdk').default;
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const SNAPSHOT_TTL_MS = 5 * 60 * 1000;

const stageIds = {
  nuevoLead: 'a99b16a6-01b6-4570-b4c6-6bacc2fbf072',
  depositoRealizado: '3a5c8cb1-b051-45c2-8469-260ff9e82703',
  fechaCirugia: 'ee8a731e-0713-4cd6-996d-431561b26a6c'
};

// Cache en memoria (10 min)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

// --- Supabase helpers (mismo patrón que metrics.js) ---
async function getOpportunitiesFromDB(startDate, endDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() - 1);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  const startISO = start.toISOString().split('T')[0] + 'T00:00:00';
  const endISO = end.toISOString().split('T')[0] + 'T23:59:59';

  let allRows = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('opportunities').select('*')
      .gte('created_at', startISO).lte('created_at', endISO)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allRows = allRows.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows.map(row => ({
    id: row.id, pipelineStageId: row.pipeline_stage_id,
    createdAt: row.created_at, dateAdded: row.created_at,
    updatedAt: row.updated_at, monetaryValue: row.monetary_value,
    source: row.source, status: row.status,
    contact: { id: row.contact_id, name: row.contact_name, tags: row.contact_tags || [] }
  }));
}

async function getLatestSnapshot(startDate, endDate) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from('metrics_snapshots').select('*')
    .eq('start_date', startDate).eq('end_date', endDate)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false }).limit(1).single();
  if (error || !data) return null;
  return { funnel: data.funnel, stages: data.stages, times: data.times, sources: data.sources, trend: data.trend };
}

// --- Filtrar por fecha local ---
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

// --- Métricas inline simplificadas (para el prompt) ---
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
const stageOrder = Object.keys(stageNames);

function buildSimpleMetrics(opportunities) {
  const countByStage = {};
  stageOrder.forEach(id => countByStage[id] = 0);
  opportunities.forEach(opp => { if (countByStage[opp.pipelineStageId] !== undefined) countByStage[opp.pipelineStageId]++; });

  const totalLeads = opportunities.length;
  const leadsCalificados = opportunities.filter(o => o.pipelineStageId !== stageIds.nuevoLead).length;
  const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  const depositos = opportunities.filter(o => stagesDeposito.includes(o.pipelineStageId));
  const totalDepositos = depositos.reduce((s, o) => s + (parseFloat(o.monetaryValue) || 0), 0);

  // Tiempos
  const tiempos = [];
  depositos.forEach(o => {
    const days = Math.ceil((new Date(o.updatedAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24));
    if (days > 0 && days < 365) tiempos.push(days);
  });

  return {
    funnel: {
      totalLeads, leadsCalificados,
      depositosRealizados: depositos.length, totalDepositos,
      tasaConversion: totalLeads > 0 ? ((depositos.length / totalLeads) * 100).toFixed(2) : 0,
      tasaContacto: totalLeads > 0 ? ((leadsCalificados / totalLeads) * 100).toFixed(2) : 0,
      porEtapa: Object.fromEntries(stageOrder.map(id => [stageNames[id], countByStage[id]]))
    },
    stages: stageOrder.map(id => ({ stage: stageNames[id], count: countByStage[id] })),
    times: {
      promedioTiempoCierre: tiempos.length > 0 ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0,
      tiempoMinimoCierre: tiempos.length > 0 ? Math.min(...tiempos) : 0,
      tiempoMaximoCierre: tiempos.length > 0 ? Math.max(...tiempos) : 0,
      oportunidadesAnalizadas: depositos.length
    }
  };
}

// --- Meta Ads data ---
async function getMetaData(startDate, endDate) {
  if (!process.env.META_ACCESS_TOKEN || !process.env.META_AD_ACCOUNT_ID) return null;
  try {
    const res = await axios.get(`${META_GRAPH_URL}/${process.env.META_AD_ACCOUNT_ID}/insights`, {
      params: {
        access_token: process.env.META_ACCESS_TOKEN,
        fields: 'campaign_name,campaign_id,impressions,clicks,spend,actions,cost_per_action_type',
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        level: 'campaign', limit: 100
      }
    });
    const raw = res.data.data || [];
    let totalSpend = 0, totalLeads = 0, totalConv = 0;
    const campaigns = raw.map(item => {
      const actions = item.actions || [];
      const leads = getActionValue(actions, ['onsite_conversion.messaging_conversation_started_7d', 'lead']);
      const conv = getActionValue(actions, ['onsite_conversion.messaging_conversation_started_7d']);
      const spend = parseFloat(item.spend || 0);
      totalSpend += spend; totalLeads += leads; totalConv += conv;
      return { name: item.campaign_name, spend, leads, conversations: conv, costPerLead: leads > 0 ? spend / leads : 0 };
    });
    return { totalCampaigns: campaigns.length, spend: totalSpend, leads: totalLeads, conversations: totalConv, avgCostPerLead: totalLeads > 0 ? totalSpend / totalLeads : 0, campaigns };
  } catch (e) { return null; }
}

function getActionValue(actions, types) {
  for (const type of types) {
    const a = actions.find(a => a.action_type === type);
    if (a) return parseInt(a.value || 0);
  }
  return 0;
}

// --- System prompt ---
const SYSTEM_PROMPT = `Eres un analista de ventas experto para Ciplastic, una clínica de cirugía plástica en México.
Tu trabajo es analizar las métricas del funnel de ventas y proporcionar un diagnóstico claro y accionable.

CONTEXTO DEL NEGOCIO:
- Ciplastic es una clínica de cirugía plástica que capta leads por Meta Ads (Facebook/Instagram), WhatsApp, Google, etc.
- El pipeline tiene 10 etapas: desde Nuevo Lead hasta Fecha de Cirugía Seleccionada
- "Calificados" = leads que avanzaron más allá de E1 (Nuevo Lead)
- "Cierres" = leads que llegaron a E9 (Depósito Realizado) o E10 (Fecha de Cirugía)
- Las valoraciones virtuales (VV) son el paso clave donde se evalúa al paciente y se envía cotización

INSTRUCCIONES:
- Analiza los datos proporcionados para detectar focos rojos, cuellos de botella, y oportunidades
- Sé específico con números y porcentajes
- Da recomendaciones prácticas y accionables
- Responde en español
- Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks, sin texto adicional)

ESTRUCTURA DE RESPUESTA (JSON):
{
  "resumenEjecutivo": "2-3 oraciones del estado general del funnel",
  "puntuacionSalud": <número 0-100>,
  "alertas": [
    { "tipo": "critico|advertencia|info", "titulo": "Título corto", "detalle": "Explicación detallada", "metrica": "Valor relevante", "recomendacion": "Qué hacer" }
  ],
  "insights": [
    { "categoria": "funnel|fuentes|campanas|tiempos|tendencia", "titulo": "Título", "detalle": "Análisis detallado" }
  ],
  "recomendaciones": [
    { "prioridad": "alta|media|baja", "accion": "Qué hacer", "impactoEsperado": "Resultado esperado" }
  ]
}

CRITERIOS:
- Tasa de contacto saludable: >60%
- Tasa de conversión saludable: >5%
- Tiempo promedio de cierre saludable: <30 días
- CPL preocupante: >$15 USD
- Días sin leads = foco rojo
- Fuente con muchos leads pero 0 cierres = cuello de botella`;

function buildDataPrompt(data, metaData, startDate, endDate) {
  let p = `Analiza las siguientes métricas del funnel de ventas de Ciplastic para el periodo ${startDate} al ${endDate}:\n\n`;

  if (data.funnel) {
    const f = data.funnel;
    p += `## MÉTRICAS DEL FUNNEL\n`;
    p += `- Total Leads: ${f.totalLeads}\n- Calificados: ${f.leadsCalificados}\n- Depósitos: ${f.depositosRealizados}\n`;
    p += `- Valor Depósitos: $${(f.totalDepositos || 0).toLocaleString()}\n- Tasa Contacto: ${f.tasaContacto}%\n- Tasa Conversión: ${f.tasaConversion}%\n`;
    if (f.porEtapa) { p += `\nPor etapa:\n`; Object.entries(f.porEtapa).forEach(([k, v]) => { p += `  ${k}: ${v}\n`; }); }
    p += '\n';
  }
  if (data.stages?.length) {
    p += `## DISTRIBUCIÓN POR ETAPAS\n`;
    data.stages.forEach(s => { p += `- ${s.stage}: ${s.count}\n`; });
    p += '\n';
  }
  if (data.times) {
    const t = data.times;
    p += `## TIEMPOS DE CIERRE\n- Promedio: ${t.promedioTiempoCierre} días\n- Mínimo: ${t.tiempoMinimoCierre} días\n- Máximo: ${t.tiempoMaximoCierre} días\n- Analizadas: ${t.oportunidadesAnalizadas}\n\n`;
  }
  if (metaData) {
    p += `## META ADS\n- Gasto: $${(metaData.spend || 0).toLocaleString()}\n- Leads: ${metaData.leads}\n- CPL: $${(metaData.avgCostPerLead || 0).toFixed(2)}\n`;
    if (metaData.campaigns?.length) {
      p += `\nCampañas:\n`;
      metaData.campaigns.forEach(c => { p += `  - ${c.name}: gasto $${(c.spend || 0).toLocaleString()}, ${c.leads} leads, CPL $${(c.costPerLead || 0).toFixed(2)}\n`; });
    }
    p += '\n';
  }
  p += `\nProporciona tu análisis completo en formato JSON.`;
  return p;
}

// --- Handler ---
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return { statusCode: 503, headers, body: JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY no configurada' }) };
    }

    const params = event.queryStringParameters || {};
    const { startDate, endDate } = params;
    if (!startDate || !endDate) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Se requieren startDate y endDate' }) };
    }

    // Cache
    const cacheKey = `${startDate}_${endDate}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, dateRange: { startDate, endDate }, cached: true, data: cached }) };
    }

    // Obtener datos
    let summaryData;
    const snapshot = await getLatestSnapshot(startDate, endDate);
    if (snapshot) {
      summaryData = snapshot;
    } else {
      const rawOpps = await getOpportunitiesFromDB(startDate, endDate);
      const opportunities = filterByDateRange(rawOpps, startDate, endDate);
      summaryData = buildSimpleMetrics(opportunities);
    }

    const metaData = await getMetaData(startDate, endDate);

    // Llamar a Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const dataPrompt = buildDataPrompt(summaryData, metaData, startDate, endDate);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: dataPrompt }]
    });

    const rawText = response.content[0].text;
    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) { analysis = JSON.parse(jsonMatch[0]); }
      else { throw new Error('La IA no devolvió JSON válido'); }
    }

    // Guardar en cache
    cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ success: true, dateRange: { startDate, endDate }, cached: false, data: analysis })
    };
  } catch (error) {
    console.error('Error AI analyze:', error.message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
