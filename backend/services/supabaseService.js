const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

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

  console.log(`📦 Cache hit para ${startDate} - ${endDate} (edad: ${Math.round(age / 1000)}s)`);
  return data.data;
}

async function saveCachedMetrics(startDate, endDate, metricsData) {
  const { error } = await supabase
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

  if (error) {
    console.error('❌ Error guardando cache en Supabase:', error.message);
  } else {
    console.log(`💾 Datos guardados en Supabase para ${startDate} - ${endDate}`);
  }
}

module.exports = { getCachedMetrics, saveCachedMetrics };
