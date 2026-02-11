const axios = require('axios');

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0';

class MetaAdsService {
  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID;

    this.client = axios.create({
      baseURL: META_GRAPH_URL,
      params: { access_token: this.accessToken }
    });

    // Cache de 5 minutos
    this._cache = {};
    this._cacheTTL = 5 * 60 * 1000;
  }

  _getCacheKey(startDate, endDate) {
    return `${startDate}_${endDate}`;
  }

  _getFromCache(key) {
    const entry = this._cache[key];
    if (entry && (Date.now() - entry.timestamp) < this._cacheTTL) {
      return entry.data;
    }
    return null;
  }

  _setCache(key, data) {
    this._cache[key] = { data, timestamp: Date.now() };
  }

  // Obtener insights de campañas para un rango de fechas
  async getCampaignInsights(startDate, endDate) {
    const cacheKey = this._getCacheKey(startDate, endDate);
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log(`⚡ Meta Ads cache: ${cached.length} campañas`);
      return cached;
    }

    try {
      let allData = [];
      let url = `/${this.adAccountId}/insights`;
      let hasNext = true;

      while (hasNext) {
        const response = await this.client.get(url, {
          params: {
            fields: 'campaign_name,campaign_id,impressions,clicks,spend,actions,cost_per_action_type',
            time_range: JSON.stringify({ since: startDate, until: endDate }),
            level: 'campaign',
            limit: 100
          }
        });

        const data = response.data.data || [];
        allData = [...allData, ...data];

        if (response.data.paging?.next) {
          url = response.data.paging.next;
          // Para paginación con URL completa, usar axios directamente
          const nextResponse = await axios.get(response.data.paging.next);
          allData = [...allData, ...(nextResponse.data.data || [])];
          hasNext = !!nextResponse.data.paging?.next;
          if (hasNext) url = nextResponse.data.paging.next;
        } else {
          hasNext = false;
        }
      }

      // Procesar datos
      const campaigns = allData.map(item => this._processInsight(item));

      // Ordenar por gasto descendente
      campaigns.sort((a, b) => b.spend - a.spend);

      console.log(`📊 Meta Ads: ${campaigns.length} campañas con datos para ${startDate} - ${endDate}`);
      this._setCache(cacheKey, campaigns);
      return campaigns;
    } catch (error) {
      console.error('Error obteniendo insights de Meta:', error.response?.data || error.message);
      throw new Error(`Error Meta API: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Procesar un insight raw de Meta a formato limpio
  _processInsight(item) {
    const actions = item.actions || [];
    const costPerAction = item.cost_per_action_type || [];

    // Buscar leads (messaging_conversation_started o lead forms)
    const leads = this._getActionValue(actions, [
      'onsite_conversion.messaging_conversation_started_7d',
      'lead'
    ]);

    // Mensajes iniciados (conversaciones de WhatsApp/Messenger)
    const conversations = this._getActionValue(actions, [
      'onsite_conversion.messaging_conversation_started_7d'
    ]);

    // Respuestas del usuario
    const replies = this._getActionValue(actions, [
      'onsite_conversion.messaging_first_reply'
    ]);

    // Conexiones de mensajería
    const connections = this._getActionValue(actions, [
      'onsite_conversion.total_messaging_connection'
    ]);

    // Form leads
    const formLeads = this._getActionValue(actions, ['lead']);

    // Costo por lead/conversación
    const costPerLead = this._getCostPerAction(costPerAction, [
      'onsite_conversion.messaging_conversation_started_7d',
      'lead'
    ]);

    const spend = parseFloat(item.spend || 0);

    return {
      campaignId: item.campaign_id,
      campaignName: item.campaign_name,
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      spend: spend,
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

  // Extraer valor de una acción de la lista
  _getActionValue(actions, actionTypes) {
    for (const type of actionTypes) {
      const action = actions.find(a => a.action_type === type);
      if (action) return parseInt(action.value || 0);
    }
    return 0;
  }

  // Extraer costo por acción
  _getCostPerAction(costPerAction, actionTypes) {
    for (const type of actionTypes) {
      const cost = costPerAction.find(c => c.action_type === type);
      if (cost) return parseFloat(cost.value || 0);
    }
    return 0;
  }

  // Obtener campañas activas
  async getActiveCampaigns() {
    try {
      const response = await this.client.get(`/${this.adAccountId}/campaigns`, {
        params: {
          fields: 'name,status,objective,daily_budget,lifetime_budget,start_time',
          filtering: JSON.stringify([{ field: 'status', operator: 'IN', value: ['ACTIVE'] }]),
          limit: 50
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error obteniendo campañas activas:', error.response?.data || error.message);
      throw error;
    }
  }

  // Obtener status de todas las campañas (mapa id -> status)
  async _getCampaignStatuses() {
    try {
      const response = await this.client.get(`/${this.adAccountId}/campaigns`, {
        params: {
          fields: 'id,status',
          limit: 200
        }
      });
      const map = {};
      (response.data.data || []).forEach(c => { map[c.id] = c.status; });
      return map;
    } catch (error) {
      console.error('Error obteniendo status de campañas:', error.message);
      return {};
    }
  }

  // Resumen general de la cuenta
  async getAccountSummary(startDate, endDate) {
    const [campaigns, statusMap] = await Promise.all([
      this.getCampaignInsights(startDate, endDate),
      this._getCampaignStatuses()
    ]);

    // Agregar status a cada campaña
    campaigns.forEach(c => {
      c.status = statusMap[c.campaignId] || 'UNKNOWN';
    });

    const totals = campaigns.reduce((acc, c) => ({
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      spend: acc.spend + c.spend,
      leads: acc.leads + c.leads,
      conversations: acc.conversations + c.conversations,
      replies: acc.replies + c.replies,
      connections: acc.connections + c.connections
    }), { impressions: 0, clicks: 0, spend: 0, leads: 0, conversations: 0, replies: 0, connections: 0 });

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.spend > 0).length,
      ...totals,
      spendFormatted: `$${totals.spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      avgCostPerLead: totals.leads > 0 ? totals.spend / totals.leads : 0,
      ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00',
      campaigns
    };
  }
}

module.exports = new MetaAdsService();
