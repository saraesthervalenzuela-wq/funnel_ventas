const axios = require('axios');

// API v2 de GHL (Integraciones Privadas)
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

class GHLService {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.pipelineId = process.env.GHL_PIPELINE_ID;

    this.client = axios.create({
      baseURL: GHL_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': GHL_API_VERSION
      }
    });

    // Configuración de rate limiting
    this.requestDelay = 500; // 500ms entre peticiones
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2 segundos inicial para retry

    // Caché en memoria para evitar re-descargar en cada filtro
    this._cachedOpportunities = null;
    this._cacheTimestamp = null;
    this._cacheTTL = 5 * 60 * 1000; // 5 minutos
    this._fetchInProgress = null; // Evitar llamadas duplicadas simultáneas
  }

  // Función de delay
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Hacer petición con reintentos automáticos para errores 429
  async makeRequest(method, url, dataOrOptions = {}, retryCount = 0) {
    try {
      // Delay entre peticiones para evitar rate limiting
      await this.sleep(this.requestDelay);

      let response;
      if (method === 'post' || method === 'put' || method === 'patch') {
        response = await this.client[method](url, dataOrOptions);
      } else {
        response = await this.client[method](url, dataOrOptions);
      }
      return response;
    } catch (error) {
      // Si es error 429 (Too Many Requests), reintentar con backoff exponencial
      if (error.response?.status === 429 && retryCount < this.maxRetries) {
        const waitTime = this.retryDelay * Math.pow(2, retryCount); // Backoff exponencial
        console.log(`Rate limited (429). Esperando ${waitTime/1000}s antes de reintentar... (intento ${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(waitTime);
        return this.makeRequest(method, url, options, retryCount + 1);
      }
      throw error;
    }
  }

  // Obtener todas las oportunidades del pipeline (con caché en memoria)
  async getOpportunities(startDate = null, endDate = null) {
    // Si el caché es fresco, devolver inmediatamente
    if (this._cachedOpportunities && this._cacheTimestamp) {
      const age = Date.now() - this._cacheTimestamp;
      if (age < this._cacheTTL) {
        const ageSec = Math.round(age / 1000);
        console.log(`⚡ Cache memoria: ${this._cachedOpportunities.length} oportunidades (edad: ${ageSec}s)`);
        return this._cachedOpportunities;
      }
    }

    // Si ya hay una descarga en curso, esperar a que termine (evita duplicados)
    if (this._fetchInProgress) {
      console.log('⏳ Esperando descarga en curso...');
      return this._fetchInProgress;
    }

    // Descargar de GHL
    this._fetchInProgress = this._fetchAllOpportunities();
    try {
      const result = await this._fetchInProgress;
      this._cachedOpportunities = result;
      this._cacheTimestamp = Date.now();
      return result;
    } finally {
      this._fetchInProgress = null;
    }
  }

  async _fetchAllOpportunities() {
    try {
      let allOpportunities = [];
      let hasMore = true;
      let page = 1;
      let pageCount = 0;

      console.log('🔽 Descargando oportunidades de GHL (API v2)...');

      while (hasMore) {
        const params = new URLSearchParams({
          location_id: this.locationId,
          pipeline_id: this.pipelineId,
          limit: 100,
          page: page
        });

        const response = await this.makeRequest('get', `/opportunities/search?${params.toString()}`);

        const opportunities = response.data.opportunities || [];
        allOpportunities = [...allOpportunities, ...opportunities];
        pageCount++;

        console.log(`  Página ${pageCount}: ${opportunities.length} (Total: ${allOpportunities.length})`);

        const meta = response.data.meta;
        if (meta && meta.total > allOpportunities.length && opportunities.length === 100) {
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total oportunidades: ${allOpportunities.length} (cacheado por 5 min)`);
      return allOpportunities;
    } catch (error) {
      console.error('Error obteniendo oportunidades:', error.message);
      if (error.response?.data) {
        console.error('Detalle del error:', JSON.stringify(error.response.data));
      }
      if (error.response?.status === 429) {
        throw new Error('La API de Go High Level está limitando las solicitudes. Por favor espera unos minutos e intenta de nuevo.');
      }
      throw error;
    }
  }

  // Obtener etapas del pipeline (API v2)
  async getPipelineStages() {
    try {
      const response = await this.makeRequest('get', `/opportunities/pipelines/${this.pipelineId}`, {
        params: { locationId: this.locationId }
      });
      return response.data.stages || [];
    } catch (error) {
      console.error('Error obteniendo etapas:', error.message);
      throw error;
    }
  }

  // Obtener detalle de una oportunidad (API v2)
  async getOpportunityHistory(opportunityId) {
    try {
      const response = await this.makeRequest('get', `/opportunities/${opportunityId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error.message);
      throw error;
    }
  }

  // Obtener conversaciones recientes (API v2)
  async getRecentConversations(limit = 50) {
    try {
      const params = new URLSearchParams({
        locationId: this.locationId,
        limit: limit,
        sortBy: 'last_message_date',
        sortOrder: 'desc'
      });
      const response = await this.makeRequest('get', `/conversations/search?${params.toString()}`);
      return response.data.conversations || [];
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error.message);
      throw error;
    }
  }

  // Obtener mensajes de una conversación (API v2)
  async getConversationMessages(conversationId, limit = 20) {
    try {
      const response = await this.makeRequest('get', `/conversations/${conversationId}/messages?limit=${limit}`);
      return response.data.messages?.messages || [];
    } catch (error) {
      console.error('Error obteniendo mensajes:', error.message);
      return [];
    }
  }

  // Calcular tiempo promedio de respuesta
  async getAverageResponseTime(sampleSize = 30) {
    // Usar caché para no saturar la API
    if (this._cachedResponseTime && this._responseTimeCacheTs) {
      const age = Date.now() - this._responseTimeCacheTs;
      if (age < 10 * 60 * 1000) { // 10 min cache
        return this._cachedResponseTime;
      }
    }

    try {
      const conversations = await this.getRecentConversations(sampleSize);
      const responseTimes = [];

      for (const conv of conversations) {
        const messages = await this.getConversationMessages(conv.id, 20);
        if (!messages || messages.length < 2) continue;

        // Ordenar por fecha ascendente
        const sorted = [...messages].sort((a, b) =>
          new Date(a.dateAdded) - new Date(b.dateAdded)
        );

        // Buscar pares inbound → primer outbound
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].direction === 'inbound') {
            // Buscar el siguiente outbound
            for (let j = i + 1; j < sorted.length; j++) {
              if (sorted[j].direction === 'outbound') {
                const inTime = new Date(sorted[i].dateAdded);
                const outTime = new Date(sorted[j].dateAdded);
                const diffMinutes = (outTime - inTime) / (1000 * 60);
                // Solo contar si es razonable (< 24 horas)
                if (diffMinutes > 0 && diffMinutes < 1440) {
                  responseTimes.push(diffMinutes);
                }
                break;
              }
            }
          }
        }
      }

      const result = {
        avgMinutes: responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : 0,
        medianMinutes: responseTimes.length > 0
          ? Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)])
          : 0,
        samplesAnalyzed: responseTimes.length,
        conversationsChecked: conversations.length
      };

      this._cachedResponseTime = result;
      this._responseTimeCacheTs = Date.now();
      return result;
    } catch (error) {
      console.error('Error calculando tiempo de respuesta:', error.message);
      return { avgMinutes: 0, medianMinutes: 0, samplesAnalyzed: 0, conversationsChecked: 0 };
    }
  }

  // Obtener contacto con detalles (API v2)
  async getContact(contactId) {
    try {
      const response = await this.makeRequest('get', `/contacts/${contactId}`);
      return response.data.contact;
    } catch (error) {
      console.error('Error obteniendo contacto:', error.message);
      throw error;
    }
  }

  // Obtener todos los contactos (API v2)
  async getContacts(startDate = null, endDate = null) {
    try {
      let allContacts = [];
      let hasMore = true;
      let page = 1;

      while (hasMore) {
        const params = {
          locationId: this.locationId,
          limit: 100,
          page: page
        };

        const response = await this.makeRequest('get', '/contacts/', { params });
        const contacts = response.data.contacts || [];
        allContacts = [...allContacts, ...contacts];

        if (contacts.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }

      return allContacts;
    } catch (error) {
      console.error('Error obteniendo contactos:', error.message);
      throw error;
    }
  }
}

module.exports = new GHLService();
