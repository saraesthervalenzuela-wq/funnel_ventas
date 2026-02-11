const Anthropic = require('@anthropic-ai/sdk').default;
const metricsService = require('./metricsService');
const metaAdsService = require('./metaAdsService');
const { getLatestSnapshot, getOpportunitiesFromDB } = require('./supabaseService');

// Cache en memoria (10 min TTL)
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

const SYSTEM_PROMPT = `Eres un analista de ventas experto para Ciplastic, una clínica de cirugía plástica en México.
Tu trabajo es analizar las métricas del funnel de ventas y proporcionar un diagnóstico claro y accionable.

CONTEXTO DEL NEGOCIO:
- Ciplastic es una clínica de cirugía plástica que capta leads por Meta Ads (Facebook/Instagram), WhatsApp, Google, etc.
- El pipeline tiene 10 etapas: desde Nuevo Lead hasta Fecha de Cirugía Seleccionada
- "Calificados" = leads que avanzaron más allá de E1 (Nuevo Lead)
- "Cierres" = leads que llegaron a E9 (Depósito Realizado) o E10 (Fecha de Cirugía)
- Las valoraciones virtuales (VV) son el paso clave donde se evalúa al paciente y se envía cotización

ETAPAS DEL PIPELINE (en orden):
1. E1. NUEVO LEAD
2. E2. INTERES EN VV - PENDIENTE ENVIO DE FOTOS
3. E3. SEGUIMIENTO - FOTOS NO ENVIADAS
4. E4. FOTOS RECIBIDAS - PENDIENTE VV
5. E5. VALORACION VIRTUAL AGENDADA
6. VV RE AGENDADA
7. E6. VV AGENDADA - NO CONTESTO
8. E7. VALORACION REALIZADA - COTIZACION ENVIADA
9. E8. SEGUIMIENTO PARA CIERRE
10. E9. DEPOSITO REALIZADO - SIN FECHA DE CIRUGIA
11. E10. FECHA DE CIRUGIA SELECCIONADA

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
    {
      "tipo": "critico|advertencia|info",
      "titulo": "Título corto",
      "detalle": "Explicación detallada del problema o hallazgo",
      "metrica": "Valor de la métrica relevante",
      "recomendacion": "Qué hacer al respecto"
    }
  ],
  "insights": [
    {
      "categoria": "funnel|fuentes|campanas|tiempos|tendencia",
      "titulo": "Título del insight",
      "detalle": "Análisis detallado"
    }
  ],
  "recomendaciones": [
    {
      "prioridad": "alta|media|baja",
      "accion": "Qué hacer",
      "impactoEsperado": "Resultado esperado"
    }
  ]
}

CRITERIOS DE EVALUACIÓN:
- Tasa de contacto (calificados/total) saludable: >60%
- Tasa de conversión (cierres/total) saludable: >5%
- Tiempo promedio de cierre saludable: <30 días
- CPL (costo por lead de Meta) preocupante: >$15 USD
- Si hay días sin leads en la tendencia, es un foco rojo
- Si una fuente tiene muchos leads pero 0 cierres, es un cuello de botella
- Si E3 o E6 tienen muchos leads, el seguimiento está fallando`;

async function analyze(startDate, endDate) {
  // Verificar API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no configurada en .env');
  }

  // Revisar cache
  const cacheKey = `${startDate}_${endDate}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Recolectar datos
  console.log('🤖 Recolectando datos para análisis IA...');
  let summaryData;

  // Intentar snapshot primero
  const snapshot = await getLatestSnapshot(startDate, endDate);
  if (snapshot) {
    summaryData = snapshot;
  } else {
    const rawOpps = await getOpportunitiesFromDB(startDate, endDate);
    const opportunities = metricsService.filterByDateRange(rawOpps, startDate, endDate);
    summaryData = metricsService.calculateAllMetricsFromArray(opportunities);
  }

  // Obtener datos de Meta Ads (opcional, no bloquea si falla)
  let metaData = null;
  try {
    const metaSummary = await metaAdsService.getAccountSummary(startDate, endDate);
    metaData = {
      totalCampaigns: metaSummary.totalCampaigns,
      spend: metaSummary.spend,
      leads: metaSummary.leads,
      conversations: metaSummary.conversations,
      avgCostPerLead: metaSummary.avgCostPerLead,
      ctr: metaSummary.ctr,
      campaigns: (metaSummary.campaigns || []).map(c => ({
        name: c.campaignName,
        spend: c.spend,
        leads: c.leads,
        costPerLead: c.costPerLead,
        conversations: c.conversations
      }))
    };
  } catch (err) {
    console.log('⚠️ No se pudieron obtener datos de Meta Ads para análisis:', err.message);
  }

  // Construir el prompt con datos
  const dataPrompt = buildDataPrompt(summaryData, metaData, startDate, endDate);

  // Llamar a Claude API
  console.log('🤖 Enviando datos a Claude para análisis...');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: dataPrompt }]
  });

  // Extraer y parsear JSON
  const rawText = response.content[0].text;
  let analysis;
  try {
    analysis = JSON.parse(rawText);
  } catch {
    // Intentar extraer JSON del texto
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('La IA no devolvió JSON válido');
    }
  }

  // Guardar en cache
  const result = { analysis, cached: false };
  setCache(cacheKey, { analysis });

  console.log('✅ Análisis IA completado');
  return result;
}

function buildDataPrompt(data, metaData, startDate, endDate) {
  let prompt = `Analiza las siguientes métricas del funnel de ventas de Ciplastic para el periodo ${startDate} al ${endDate}:\n\n`;

  // Funnel
  if (data.funnel) {
    const f = data.funnel;
    prompt += `## MÉTRICAS DEL FUNNEL\n`;
    prompt += `- Total Leads: ${f.totalLeads}\n`;
    prompt += `- Leads Calificados: ${f.leadsCalificados}\n`;
    prompt += `- Agendadas para Valoración: ${f.agendadasValoracion || 0}\n`;
    prompt += `- Valoradas con Cotización: ${f.valoradasCotizacion || 0}\n`;
    prompt += `- No Contacto en Valoración: ${f.noContactoValoracion || 0}\n`;
    prompt += `- Oportunidades de Cierre: ${f.oportunidadesCierreTotal || 0}\n`;
    prompt += `- Depósitos Realizados: ${f.depositosRealizados || 0}\n`;
    prompt += `- Valor Total Depósitos: $${(f.totalDepositos || 0).toLocaleString()}\n`;
    prompt += `- Tasa de Contacto: ${f.tasaContacto || 0}%\n`;
    prompt += `- Tasa de Conversión: ${f.tasaConversion || 0}%\n`;
    prompt += `\nDesglose por etapa:\n`;
    if (f.porEtapa) {
      Object.entries(f.porEtapa).forEach(([key, val]) => {
        prompt += `  ${key}: ${val}\n`;
      });
    }
    prompt += '\n';
  }

  // Fuentes
  if (data.sources?.length) {
    prompt += `## RENDIMIENTO POR FUENTE\n`;
    data.sources.forEach(s => {
      prompt += `- ${s.source}: ${s.total} leads, ${s.calificados} calificados, ${s.depositos} cierres, $${(s.valorTotal || 0).toLocaleString()} valor, ${s.tasaConversion}% conversión\n`;
    });
    prompt += '\n';
  }

  // Etapas
  if (data.stages?.length) {
    prompt += `## DISTRIBUCIÓN POR ETAPAS\n`;
    data.stages.forEach(s => {
      prompt += `- ${s.stage}: ${s.count} oportunidades, $${(s.value || 0).toLocaleString()} valor\n`;
    });
    prompt += '\n';
  }

  // Tendencia
  if (data.trend?.length) {
    prompt += `## TENDENCIA DIARIA (últimos ${data.trend.length} días con actividad)\n`;
    data.trend.forEach(d => {
      prompt += `- ${d.date}: ${d.leads} leads, ${d.valoraciones || 0} valoraciones, ${d.depositos} cierres\n`;
    });
    prompt += '\n';
  }

  // Tiempos
  if (data.times) {
    const t = data.times;
    prompt += `## TIEMPOS DE CIERRE\n`;
    prompt += `- Promedio: ${t.promedioTiempoCierre || 0} días\n`;
    prompt += `- Mínimo: ${t.tiempoMinimoCierre || 0} días\n`;
    prompt += `- Máximo: ${t.tiempoMaximoCierre || 0} días\n`;
    prompt += `- Oportunidades analizadas: ${t.oportunidadesAnalizadas || 0}\n`;
    prompt += '\n';
  }

  // Meta Ads
  if (metaData) {
    prompt += `## META ADS (Facebook/Instagram)\n`;
    prompt += `- Campañas activas: ${metaData.totalCampaigns}\n`;
    prompt += `- Gasto total: $${(metaData.spend || 0).toLocaleString()}\n`;
    prompt += `- Leads generados: ${metaData.leads || 0}\n`;
    prompt += `- Conversaciones: ${metaData.conversations || 0}\n`;
    prompt += `- Costo por lead promedio: $${(metaData.avgCostPerLead || 0).toFixed(2)}\n`;
    prompt += `- CTR: ${metaData.ctr || '0'}%\n`;
    if (metaData.campaigns?.length) {
      prompt += `\nDesglose por campaña:\n`;
      metaData.campaigns.forEach(c => {
        prompt += `  - ${c.name}: gasto $${(c.spend || 0).toLocaleString()}, ${c.leads || 0} leads, CPL $${(c.costPerLead || 0).toFixed(2)}, ${c.conversations || 0} conversaciones\n`;
      });
    }
    prompt += '\n';
  }

  prompt += `\nProporciona tu análisis completo en formato JSON.`;
  return prompt;
}

module.exports = { analyze };
