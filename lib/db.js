// ============================================================
// lib/db.js — Capa de datos Neon (Postgres serverless)
// Reemplaza supabase-js 1:1. Mismas funciones de negocio,
// mismo comportamiento. Tagged templates parametrizados.
// ============================================================
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutos

// ============================================================
// MAPPERS
// ============================================================

// Mapear oportunidad de GHL al formato de la tabla
function mapOppToDB(opp) {
  return {
    id: opp.id,
    pipeline_stage_id: opp.pipelineStageId,
    contact_id: opp.contact?.id || null,
    contact_name:
      opp.contact?.firstName || opp.contact?.lastName
        ? `${opp.contact?.firstName || ""} ${opp.contact?.lastName || ""}`.trim()
        : opp.contact?.name || null,
    contact_email: opp.contact?.email || null,
    contact_phone: opp.contact?.phone || null,
    contact_tags: opp.contact?.tags || [],
    created_at: opp.createdAt || opp.dateAdded,
    updated_at: opp.updatedAt || opp.lastStatusChangeAt || null,
    monetary_value: parseFloat(opp.monetaryValue) || 0,
    source: opp.source || null,
    status: opp.status || "open",
    raw_json: opp,
    synced_at: new Date().toISOString(),
  };
}

// Mapear de DB al formato que espera metricsService
function mapOppFromDB(row) {
  const rawJson = row.raw_json || {};
  return {
    id: row.id,
    pipelineStageId: row.pipeline_stage_id,
    createdAt: row.created_at,
    dateAdded: row.created_at,
    updatedAt: row.updated_at,
    lastStageChangeAt:
      rawJson.lastStageChangeAt || rawJson.lastStatusChangeAt || row.updated_at,
    lastStatusChangeAt: rawJson.lastStatusChangeAt || row.updated_at,
    monetaryValue: row.monetary_value,
    source: row.source,
    status: row.status,
    assignedTo: rawJson.assignedTo || null,
    contact: {
      id: row.contact_id,
      name: row.contact_name,
      email: row.contact_email,
      phone: row.contact_phone,
      tags: row.contact_tags || [],
    },
  };
}

// ============================================================
// OPORTUNIDADES
// ============================================================

// Upsert oportunidades en batches de 100
// (= supabase.upsert(rows, { onConflict: 'id' }) por batch)
async function upsertOpportunities(opportunities) {
  const BATCH_SIZE = 100;
  let newCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const batch = opportunities.slice(i, i + BATCH_SIZE);
    const rows = batch.map(mapOppToDB);
    const ids = rows.map((r) => r.id);

    // Primero obtener IDs existentes para contar nuevos vs actualizados
    // (= supabase.from('opportunities').select('id').in('id', ids))
    const existing = await sql`
      SELECT id FROM opportunities WHERE id = ANY(${ids})
    `;
    const existingIds = new Set(existing.map((e) => e.id));
    const batchNew = rows.filter((r) => !existingIds.has(r.id)).length;
    newCount += batchNew;
    updatedCount += rows.length - batchNew;

    // Construir un INSERT multi-fila con ON CONFLICT (id) DO UPDATE.
    // unnest() recibe arrays por columna -> parametrizado, sin SQL injection.
    const idArr = rows.map((r) => r.id);
    const stageArr = rows.map((r) => r.pipeline_stage_id);
    const contactIdArr = rows.map((r) => r.contact_id);
    const contactNameArr = rows.map((r) => r.contact_name);
    const contactEmailArr = rows.map((r) => r.contact_email);
    const contactPhoneArr = rows.map((r) => r.contact_phone);
    // text[] por fila -> usamos jsonb de arrays y lo convertimos a text[] en SQL
    const contactTagsArr = rows.map((r) =>
      JSON.stringify(r.contact_tags || []),
    );
    const createdArr = rows.map((r) => r.created_at);
    const updatedArr = rows.map((r) => r.updated_at);
    const monetaryArr = rows.map((r) => r.monetary_value);
    const sourceArr = rows.map((r) => r.source);
    const statusArr = rows.map((r) => r.status);
    const rawArr = rows.map((r) => JSON.stringify(r.raw_json));
    const syncedArr = rows.map((r) => r.synced_at);

    await sql`
      INSERT INTO opportunities (
        id, pipeline_stage_id, contact_id, contact_name, contact_email,
        contact_phone, contact_tags, created_at, updated_at, monetary_value,
        source, status, raw_json, synced_at
      )
      SELECT
        t.id,
        t.pipeline_stage_id,
        t.contact_id,
        t.contact_name,
        t.contact_email,
        t.contact_phone,
        ARRAY(SELECT jsonb_array_elements_text(t.contact_tags))::text[],
        t.created_at::timestamptz,
        t.updated_at::timestamptz,
        t.monetary_value::numeric,
        t.source,
        t.status,
        t.raw_json::jsonb,
        t.synced_at::timestamptz
      FROM unnest(
        ${idArr}::text[],
        ${stageArr}::text[],
        ${contactIdArr}::text[],
        ${contactNameArr}::text[],
        ${contactEmailArr}::text[],
        ${contactPhoneArr}::text[],
        ${contactTagsArr}::jsonb[],
        ${createdArr}::text[],
        ${updatedArr}::text[],
        ${monetaryArr}::numeric[],
        ${sourceArr}::text[],
        ${statusArr}::text[],
        ${rawArr}::jsonb[],
        ${syncedArr}::text[]
      ) AS t(
        id, pipeline_stage_id, contact_id, contact_name, contact_email,
        contact_phone, contact_tags, created_at, updated_at, monetary_value,
        source, status, raw_json, synced_at
      )
      ON CONFLICT (id) DO UPDATE SET
        pipeline_stage_id = EXCLUDED.pipeline_stage_id,
        contact_id        = EXCLUDED.contact_id,
        contact_name      = EXCLUDED.contact_name,
        contact_email     = EXCLUDED.contact_email,
        contact_phone     = EXCLUDED.contact_phone,
        contact_tags      = EXCLUDED.contact_tags,
        created_at        = EXCLUDED.created_at,
        updated_at        = EXCLUDED.updated_at,
        monetary_value    = EXCLUDED.monetary_value,
        source            = EXCLUDED.source,
        status            = EXCLUDED.status,
        raw_json          = EXCLUDED.raw_json,
        synced_at         = EXCLUDED.synced_at
    `;

    console.log(
      `  📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${rows.length} oportunidades`,
    );
  }

  return { total: opportunities.length, new: newCount, updated: updatedCount };
}

// Leer TODAS las oportunidades (sin pre-filtro de fecha).
// (= supabase.from('opportunities').select('*').range() paginado)
async function getOpportunitiesFromDB() {
  let allRows = [];
  let offset = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const rows = await sql`
      SELECT * FROM opportunities
      ORDER BY id
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;
    allRows = allRows.concat(rows || []);
    if (!rows || rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`📋 DB: ${allRows.length} oportunidades totales cargadas`);
  return allRows.map(mapOppFromDB);
}

// Leer oportunidades con buffer de timezone de ±1 día por created_at.
// Equivalente a getOpportunitiesFromDB() de netlify/functions/ai.js:
// expande el rango 1 día a cada lado y filtra por created_at.
async function getOpportunitiesByCreatedRange(startDate, endDate) {
  const start = new Date(startDate);
  start.setDate(start.getDate() - 1);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  const startISO = start.toISOString().split("T")[0] + "T00:00:00";
  const endISO = end.toISOString().split("T")[0] + "T23:59:59";

  let allRows = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const rows = await sql`
      SELECT * FROM opportunities
      WHERE created_at >= ${startISO}::timestamptz
        AND created_at <= ${endISO}::timestamptz
      ORDER BY id
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;
    allRows = allRows.concat(rows || []);
    if (!rows || rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allRows.map(mapOppFromDB);
}

// Leer un subconjunto de columnas de TODAS las oportunidades
// (= select('id, pipeline_stage_id, raw_json') paginado de /current-stages)
async function getOpportunitiesLight() {
  let allRows = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const rows = await sql`
      SELECT id, pipeline_stage_id, raw_json FROM opportunities
      ORDER BY id
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `;
    allRows = allRows.concat(rows || []);
    if (!rows || rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allRows;
}

// Contar total de oportunidades.
// (= supabase.select('*', { count: 'exact', head: true }))
async function getOpportunityCount() {
  try {
    const rows = await sql`SELECT count(*)::int AS count FROM opportunities`;
    return rows[0]?.count || 0;
  } catch (err) {
    return 0;
  }
}

// ============================================================
// SNAPSHOTS DE MÉTRICAS
// ============================================================

// Obtener snapshot reciente (< 5 min).
// owners: la columna no existe en el schema Neon (igual que Supabase),
// por eso siempre devolvemos [] -> comportamiento 1:1.
async function getLatestSnapshot(startDate, endDate) {
  const cutoff = new Date(Date.now() - SNAPSHOT_TTL_MS).toISOString();

  const rows = await sql`
    SELECT * FROM metrics_snapshots
    WHERE start_date = ${startDate}
      AND end_date = ${endDate}
      AND created_at >= ${cutoff}::timestamptz
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const data = rows[0] ?? null;
  if (!data) return null;

  console.log(`📦 Snapshot encontrado para ${startDate} - ${endDate}`);
  return {
    funnel: data.funnel,
    stages: data.stages,
    times: data.times,
    sources: data.sources,
    trend: data.trend,
    owners: data.owners || [],
  };
}

// Guardar nuevo snapshot.
// owners NO se persiste (la columna no existe en el schema), igual que hoy.
async function insertSnapshot(
  startDate,
  endDate,
  syncType,
  metricsData,
  oppCount,
) {
  try {
    await sql`
      INSERT INTO metrics_snapshots (
        start_date, end_date, sync_type, funnel, stages, times, sources, trend, opportunity_count
      ) VALUES (
        ${startDate},
        ${endDate},
        ${syncType},
        ${JSON.stringify(metricsData.funnel)}::jsonb,
        ${JSON.stringify(metricsData.stages)}::jsonb,
        ${JSON.stringify(metricsData.times)}::jsonb,
        ${JSON.stringify(metricsData.sources)}::jsonb,
        ${JSON.stringify(metricsData.trend)}::jsonb,
        ${oppCount}
      )
    `;
    console.log(
      `💾 Snapshot guardado (${syncType}) para ${startDate} - ${endDate}`,
    );
  } catch (error) {
    console.error("❌ Error guardando snapshot:", error.message);
  }
}

// ============================================================
// SYNC LOG
// ============================================================

async function insertSyncLog(entry) {
  try {
    await sql`
      INSERT INTO sync_log (
        sync_type, status, opportunities_total, opportunities_new,
        opportunities_updated, error_message, duration_ms
      ) VALUES (
        ${entry.sync_type},
        ${entry.status},
        ${entry.opportunities_total ?? null},
        ${entry.opportunities_new ?? null},
        ${entry.opportunities_updated ?? null},
        ${entry.error_message ?? null},
        ${entry.duration_ms ?? null}
      )
    `;
  } catch (error) {
    console.error("❌ Error guardando sync log:", error.message);
  }
}

async function getLastSyncInfo() {
  const rows = await sql`
    SELECT * FROM sync_log
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ============================================================
// SYNC COMPLETO (orquestador) — idéntico a supabaseService.performSync
// ============================================================

async function performSync(syncType = "manual") {
  const startTime = Date.now();
  console.log(`\n🔄 === SYNC ${syncType.toUpperCase()} INICIADO ===`);

  try {
    // 1. Descargar oportunidades de GHL
    const ghlService = require("../backend/services/ghlService");
    // Invalidar caché en memoria para obtener datos frescos
    ghlService._cachedOpportunities = null;
    ghlService._cacheTimestamp = null;

    const opportunities = await ghlService.getOpportunities();
    console.log(`📥 Descargadas ${opportunities.length} oportunidades de GHL`);

    // 2. Upsert en Neon
    const upsertResult = await upsertOpportunities(opportunities);
    console.log(
      `✅ Upsert: ${upsertResult.new} nuevas, ${upsertResult.updated} actualizadas`,
    );

    // 3. Calcular métricas del mes actual desde los datos frescos
    const metricsService = require("../backend/services/metricsService");
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;

    const filtered = metricsService.filterByDateRange(
      opportunities,
      startDate,
      endDate,
    );
    const metricsData = metricsService.calculateAllMetricsFromArray(filtered);

    // 4. Guardar snapshot
    await insertSnapshot(
      startDate,
      endDate,
      syncType,
      metricsData,
      filtered.length,
    );

    // 5. Registrar en sync_log
    const duration = Date.now() - startTime;
    await insertSyncLog({
      sync_type: syncType,
      status: "success",
      opportunities_total: opportunities.length,
      opportunities_new: upsertResult.new,
      opportunities_updated: upsertResult.updated,
      duration_ms: duration,
    });

    console.log(
      `✅ === SYNC ${syncType.toUpperCase()} COMPLETADO en ${duration}ms ===\n`,
    );
    return { success: true, ...upsertResult, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `❌ === SYNC ${syncType.toUpperCase()} FALLIDO: ${error.message} ===`,
    );

    await insertSyncLog({
      sync_type: syncType,
      status: "error",
      error_message: error.message,
      duration_ms: duration,
    });

    throw error;
  }
}

module.exports = {
  sql,
  mapOppToDB,
  mapOppFromDB,
  upsertOpportunities,
  getOpportunitiesFromDB,
  getOpportunitiesByCreatedRange,
  getOpportunitiesLight,
  getOpportunityCount,
  getLatestSnapshot,
  insertSnapshot,
  insertSyncLog,
  getLastSyncInfo,
  performSync,
};
