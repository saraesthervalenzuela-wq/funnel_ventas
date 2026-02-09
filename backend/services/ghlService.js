const axios = require('axios');

const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

class GHLService {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.pipelineId = process.env.GHL_PIPELINE_ID;

    this.client = axios.create({
      baseURL: GHL_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
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
  async makeRequest(method, url, options = {}, retryCount = 0) {
    try {
      // Delay entre peticiones para evitar rate limiting
      await this.sleep(this.requestDelay);

      const response = await this.client[method](url, options);
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
      let startAfterId = null;
      let startAfter = null;
      let pageCount = 0;

      console.log('🔽 Descargando oportunidades de GHL...');

      while (hasMore) {
        const params = { limit: 100 };
        if (startAfterId) {
          params.startAfterId = startAfterId;
          params.startAfter = startAfter;
        }

        const response = await this.makeRequest('get', `/pipelines/${this.pipelineId}/opportunities`, {
          params
        });

        const opportunities = response.data.opportunities || [];
        allOpportunities = [...allOpportunities, ...opportunities];
        pageCount++;

        console.log(`  Página ${pageCount}: ${opportunities.length} (Total: ${allOpportunities.length})`);

        const meta = response.data.meta;
        if (meta && meta.nextPage && opportunities.length === 100) {
          startAfterId = meta.startAfterId;
          startAfter = meta.startAfter;
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Total oportunidades: ${allOpportunities.length} (cacheado por 5 min)`);
      return allOpportunities;
    } catch (error) {
      console.error('Error obteniendo oportunidades:', error.message);
      if (error.response?.status === 429) {
        throw new Error('La API de Go High Level está limitando las solicitudes. Por favor espera unos minutos e intenta de nuevo.');
      }
      throw error;
    }
  }

  // Obtener etapas del pipeline
  async getPipelineStages() {
    try {
      const response = await this.makeRequest('get', `/pipelines/${this.pipelineId}`);
      return response.data.stages || [];
    } catch (error) {
      console.error('Error obteniendo etapas:', error.message);
      throw error;
    }
  }

  // Obtener historial de una oportunidad (para calcular tiempos)
  async getOpportunityHistory(opportunityId) {
    try {
      const response = await this.makeRequest('get', `/pipelines/opportunities/${opportunityId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error.message);
      throw error;
    }
  }

  // Obtener contacto con detalles
  async getContact(contactId) {
    try {
      const response = await this.makeRequest('get', `/contacts/${contactId}`);
      return response.data.contact;
    } catch (error) {
      console.error('Error obteniendo contacto:', error.message);
      throw error;
    }
  }

  // Obtener todos los contactos
  async getContacts(startDate = null, endDate = null) {
    try {
      const params = { limit: 100 };
      if (startDate) params.startAfter = startDate;

      let allContacts = [];
      let hasMore = true;
      let startAfterId = null;

      while (hasMore) {
        const requestParams = { ...params };
        if (startAfterId) requestParams.startAfterId = startAfterId;

        const response = await this.makeRequest('get', '/contacts/', { params: requestParams });
        const contacts = response.data.contacts || [];
        allContacts = [...allContacts, ...contacts];

        if (contacts.length < 100) {
          hasMore = false;
        } else {
          startAfterId = contacts[contacts.length - 1].id;
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
