const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const stageIds = {
  nuevoLead: 'a99b16a6-01b6-4570-b4c6-6bacc2fbf072',
  depositoRealizado: '3a5c8cb1-b051-45c2-8469-260ff9e82703',
  fechaCirugia: 'ee8a731e-0713-4cd6-996d-431561b26a6c'
};

// Leer oportunidades de Supabase con buffer de timezone
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
      .from('opportunities')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    allRows = allRows.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows.map(row => ({
    id: row.id,
    pipelineStageId: row.pipeline_stage_id,
    createdAt: row.created_at,
    dateAdded: row.created_at,
    monetaryValue: row.monetary_value,
    source: row.source,
    status: row.status,
    contact: {
      id: row.contact_id,
      name: row.contact_name,
      tags: row.contact_tags || []
    }
  }));
}

// Filtrar por rango de fechas en timezone local
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

function getActionValue(actions, actionTypes) {
  for (const type of actionTypes) {
    const action = actions.find(a => a.action_type === type);
    if (action) return parseInt(action.value || 0);
  }
  return 0;
}

function getCostPerAction(costPerAction, actionTypes) {
  for (const type of actionTypes) {
    const cost = costPerAction.find(c => c.action_type === type);
    if (cost) return parseFloat(cost.value || 0);
  }
  return 0;
}

function processInsight(item) {
  const actions = item.actions || [];
  const costPerAction = item.cost_per_action_type || [];

  const leads = getActionValue(actions, [
    'onsite_conversion.messaging_conversation_started_7d',
    'lead'
  ]);
  const conversations = getActionValue(actions, [
    'onsite_conversion.messaging_conversation_started_7d'
  ]);
  const replies = getActionValue(actions, [
    'onsite_conversion.messaging_first_reply'
  ]);
  const connections = getActionValue(actions, [
    'onsite_conversion.total_messaging_connection'
  ]);
  const formLeads = getActionValue(actions, ['lead']);

  const costPerLead = getCostPerAction(costPerAction, [
    'onsite_conversion.messaging_conversation_started_7d',
    'lead'
  ]);

  const spend = parseFloat(item.spend || 0);

  return {
    campaignId: item.campaign_id,
    campaignName: item.campaign_name,
    impressions: parseInt(item.impressions || 0),
    clicks: parseInt(item.clicks || 0),
    spend,
    spendFormatted: `$${spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    leads,
    conversations,
    replies,
    connections,
    formLeads,
    costPerLead: costPerLead > 0 ? costPerLead : (leads > 0 ? spend / leads : 0),
    ctr: item.impressions > 0 ? ((parseInt(item.clicks || 0) / parseInt(item.impressions)) * 100).toFixed(2) : '0.00'
  };
}

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
    const params = event.queryStringParameters || {};
    const { startDate, endDate } = params;

    if (!startDate || !endDate) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ success: false, error: 'Se requieren startDate y endDate' })
      };
    }

    // Obtener insights + status de campañas en paralelo
    const [insightsResponse, statusResponse] = await Promise.all([
      axios.get(`${META_GRAPH_URL}/${META_AD_ACCOUNT_ID}/insights`, {
        params: {
          access_token: META_ACCESS_TOKEN,
          fields: 'campaign_name,campaign_id,impressions,clicks,spend,actions,cost_per_action_type',
          time_range: JSON.stringify({ since: startDate, until: endDate }),
          level: 'campaign',
          limit: 100
        }
      }),
      axios.get(`${META_GRAPH_URL}/${META_AD_ACCOUNT_ID}/campaigns`, {
        params: {
          access_token: META_ACCESS_TOKEN,
          fields: 'id,status',
          limit: 200
        }
      }).catch(() => ({ data: { data: [] } }))
    ]);

    // Mapa de status por campaign ID
    const statusMap = {};
    (statusResponse.data.data || []).forEach(c => { statusMap[c.id] = c.status; });

    const rawData = insightsResponse.data.data || [];
    const campaigns = rawData.map(item => {
      const processed = processInsight(item);
      processed.status = statusMap[item.campaign_id] || 'UNKNOWN';
      return processed;
    });
    campaigns.sort((a, b) => b.spend - a.spend);

    // Calcular totales
    const totals = campaigns.reduce((acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      spend: acc.spend + c.spend,
      leads: acc.leads + c.leads,
      conversations: acc.conversations + c.conversations,
      replies: acc.replies + c.replies,
      connections: acc.connections + c.connections
    }), { impressions: 0, clicks: 0, spend: 0, leads: 0, conversations: 0, replies: 0, connections: 0 });

    // === Cruce con GHL: obtener oportunidades de Supabase ===
    let ghlTotals = { total: 0, calificados: 0, cierres: 0, valor: 0 };
    try {
      const rawOpps = await getOpportunitiesFromDB(startDate, endDate);
      const opportunities = filterByDateRange(rawOpps, startDate, endDate);

      // Filtrar oportunidades que vinieron de Meta Ads
      const metaOpps = opportunities.filter(opp => {
        const tags = (opp.contact?.tags || []).join(' ').toLowerCase();
        const source = (opp.source || '').toLowerCase();
        return tags.includes('fb-ad-lead') || tags.includes('fb-ad') ||
               tags.includes('instagram-ad-lead') || tags.includes('instagram-ad') ||
               source.includes('facebook') || source.includes('fb') ||
               source.includes('instagram');
      });

      const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];

      ghlTotals = {
        total: metaOpps.length,
        calificados: metaOpps.filter(o => o.pipelineStageId !== stageIds.nuevoLead).length,
        cierres: metaOpps.filter(o => stagesDeposito.includes(o.pipelineStageId)).length,
        valor: metaOpps.filter(o => stagesDeposito.includes(o.pipelineStageId))
          .reduce((sum, o) => sum + (parseFloat(o.monetaryValue) || 0), 0)
      };

      // Distribuir proporcionalmente entre campañas de Meta
      const totalMetaLeads = totals.leads || 1;
      campaigns.forEach(campaign => {
        const proportion = campaign.leads / totalMetaLeads;
        campaign.ghlLeads = Math.round(ghlTotals.total * proportion);
        campaign.ghlCalificados = Math.round(ghlTotals.calificados * proportion);
        campaign.ghlCierres = Math.round(ghlTotals.cierres * proportion);
        campaign.ghlValor = Math.round(ghlTotals.valor * proportion);
        campaign.ghlConversion = campaign.ghlLeads > 0
          ? ((campaign.ghlCierres / campaign.ghlLeads) * 100).toFixed(1)
          : '0.0';
      });
    } catch (ghlError) {
      console.error('Error obteniendo datos GHL para cruce:', ghlError.message);
      // Si falla GHL, las campañas se devuelven sin datos de funnel
      campaigns.forEach(campaign => {
        campaign.ghlLeads = 0;
        campaign.ghlCalificados = 0;
        campaign.ghlCierres = 0;
        campaign.ghlValor = 0;
        campaign.ghlConversion = '0.0';
      });
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        dateRange: { startDate, endDate },
        data: {
          totalCampaigns: campaigns.length,
          activeCampaigns: campaigns.filter(c => c.spend > 0).length,
          ...totals,
          spendFormatted: `$${totals.spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          avgCostPerLead: totals.leads > 0 ? totals.spend / totals.leads : 0,
          ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00',
          ghlTotals,
          campaigns
        }
      })
    };
  } catch (error) {
    console.error('Error Meta API:', error.response?.data || error.message);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ success: false, error: error.response?.data?.error?.message || error.message })
    };
  }
};
