const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ============================================================
// OPORTUNIDADES
// ============================================================

// Mapear oportunidad de GHL al formato de la tabla
function mapOppToDB(opp) {
  return {
    id: opp.id,
    pipeline_stage_id: opp.pipelineStageId,
    contact_id: opp.contact?.id || null,
    contact_name: opp.contact?.name || opp.contact?.firstName
      ? `${opp.contact?.firstName || ''} ${opp.contact?.lastName || ''}`.trim()
      : null,
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

// Mapear de DB al formato que espera metricsService
function mapOppFromDB(row) {
  return {
    id: row.id,
    pipelineStageId: row.pipeline_stage_id,
    createdAt: row.created_at,
    dateAdded: row.created_at,
    updatedAt: row.updated_at,
    monetaryValue: row.monetary_value,
    source: row.source,
    status: row.status,
    contact: {
      id: row.contact_id,
      name: row.contact_name,
      email: row.contact_email,
      phone: row.contact_phone,
      tags: row.contact_tags || []
    }
  };
}

// Upsert oportunidades en batches de 100
async function upsertOpportunities(opportunities) {
  const BATCH_SIZE = 100;
  let newCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const batch = opportunities.slice(i, i + BATCH_SIZE);
    const rows = batch.map(mapOppToDB);

    // Primero obtener IDs existentes para contar nuevos vs actualizados
    const ids = rows.map(r => r.id);
    const { data: existing } = await supabase
      .from('opportunities')
      .select('id')
      .in('id', ids);

    const existingIds = new Set((existing || []).map(e => e.id));
    const batchNew = rows.filter(r => !existingIds.has(r.id)).length;
    newCount += batchNew;
    updatedCount += rows.length - batchNew;

    const { error } = await supabase
      .from('opportunities')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error upserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      throw error;
    }

    console.log(`  📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${rows.length} oportunidades`);
  }

  return { total: opportunities.length, new: newCount, updated: updatedCount };
}

// Leer oportunidades de Supabase por rango de fechas
// Usa buffer de 1 día para compensar diferencias de timezone (UTC vs local)
// El filtro exacto por hora local se aplica después con metricsService.filterByDateRange
async function getOpportunitiesFromDB(startDate, endDate) {
  // Buffer de 1 día antes y después para cubrir cualquier timezone
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

    if (error) {
      console.error('❌ Error leyendo oportunidades de DB:', error.message);
      throw error;
    }

    allRows = allRows.concat(data || []);

    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`📋 DB: ${allRows.length} oportunidades para ${startDate} - ${endDate}`);
  return allRows.map(mapOppFromDB);
}

// Contar total de oportunidades en la DB
async function getOpportunityCount() {
  const { count, error } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  if (error) return 0;
  return count || 0;
}

// ============================================================
// SNAPSHOTS DE MÉTRICAS
// ============================================================

// Obtener snapshot reciente (< 5 min)
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

  console.log(`📦 Snapshot encontrado para ${startDate} - ${endDate}`);
  return {
    funnel: data.funnel,
    stages: data.stages,
    times: data.times,
    sources: data.sources,
    trend: data.trend
  };
}

// Guardar nuevo snapshot
async function insertSnapshot(startDate, endDate, syncType, metricsData, oppCount) {
  const { error } = await supabase
    .from('metrics_snapshots')
    .insert({
      start_date: startDate,
      end_date: endDate,
      sync_type: syncType,
      funnel: metricsData.funnel,
      stages: metricsData.stages,
      times: metricsData.times,
      sources: metricsData.sources,
      trend: metricsData.trend,
      opportunity_count: oppCount
    });

  if (error) {
    console.error('❌ Error guardando snapshot:', error.message);
  } else {
    console.log(`💾 Snapshot guardado (${syncType}) para ${startDate} - ${endDate}`);
  }
}

// ============================================================
// SYNC LOG
// ============================================================

async function insertSyncLog(entry) {
  const { error } = await supabase
    .from('sync_log')
    .insert(entry);

  if (error) {
    console.error('❌ Error guardando sync log:', error.message);
  }
}

async function getLastSyncInfo() {
  const { data, error } = await supabase
    .from('sync_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

// ============================================================
// SYNC COMPLETO (orquestador)
// ============================================================

async function performSync(syncType = 'manual') {
  const startTime = Date.now();
  console.log(`\n🔄 === SYNC ${syncType.toUpperCase()} INICIADO ===`);

  try {
    // 1. Descargar oportunidades de GHL
    const ghlService = require('./ghlService');
    // Invalidar caché en memoria para obtener datos frescos
    ghlService._cachedOpportunities = null;
    ghlService._cacheTimestamp = null;

    const opportunities = await ghlService.getOpportunities();
    console.log(`📥 Descargadas ${opportunities.length} oportunidades de GHL`);

    // 2. Upsert en Supabase
    const upsertResult = await upsertOpportunities(opportunities);
    console.log(`✅ Upsert: ${upsertResult.new} nuevas, ${upsertResult.updated} actualizadas`);

    // 3. Calcular métricas del mes actual desde los datos frescos
    const metricsService = require('./metricsService');
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const filtered = metricsService.filterByDateRange(opportunities, startDate, endDate);
    const metricsData = metricsService.calculateAllMetricsFromArray(filtered);

    // 4. Guardar snapshot
    await insertSnapshot(startDate, endDate, syncType, metricsData, filtered.length);

    // 5. Registrar en sync_log
    const duration = Date.now() - startTime;
    await insertSyncLog({
      sync_type: syncType,
      status: 'success',
      opportunities_total: opportunities.length,
      opportunities_new: upsertResult.new,
      opportunities_updated: upsertResult.updated,
      duration_ms: duration
    });

    console.log(`✅ === SYNC ${syncType.toUpperCase()} COMPLETADO en ${duration}ms ===\n`);
    return { success: true, ...upsertResult, duration };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ === SYNC ${syncType.toUpperCase()} FALLIDO: ${error.message} ===`);

    await insertSyncLog({
      sync_type: syncType,
      status: 'error',
      error_message: error.message,
      duration_ms: duration
    });

    throw error;
  }
}

module.exports = {
  upsertOpportunities,
  getOpportunitiesFromDB,
  getOpportunityCount,
  getLatestSnapshot,
  insertSnapshot,
  insertSyncLog,
  getLastSyncInfo,
  performSync
};
