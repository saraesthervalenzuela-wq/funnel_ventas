// ============================================================
// api/ai.js — Vercel Serverless Function
// Port 1:1 de netlify/functions/ai.js.
// Query layer supabase -> lib/db.js (Neon). @anthropic-ai/sdk intacto.
// ============================================================
const Anthropic = require("@anthropic-ai/sdk").default;
const db = require("../lib/db");

const stageIds = {
  nuevoLead: "a99b16a6-01b6-4570-b4c6-6bacc2fbf072",
  depositoRealizado: "3a5c8cb1-b051-45c2-8469-260ff9e82703",
  fechaCirugia: "ee8a731e-0713-4cd6-996d-431561b26a6c",
};

// Cache en memoria (10 min)
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

// --- Filtrar por fecha local ---
function filterByDateRange(opportunities, startDate, endDate) {
  const [sY, sM, sD] = startDate.split("-").map(Number);
  const [eY, eM, eD] = endDate.split("-").map(Number);
  const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
  const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
  return opportunities.filter((opp) => {
    const createdAt = new Date(opp.createdAt || opp.dateAdded);
    return createdAt >= start && createdAt <= end;
  });
}

// --- Métricas inline simplificadas (para el prompt) ---
const stageNames = {
  "a99b16a6-01b6-4570-b4c6-6bacc2fbf072": "E1. NUEVO LEAD",
  "2d74b32b-c5d7-4e8a-9049-78d9ea7231c9": "E2. INTERES EN VV",
  "6e4785c2-cd9a-4bf5-860c-bb27129678c7": "E3. SEGUIMIENTO FOTOS",
  "d278fd60-a732-494a-b099-6ff1048c9331": "E4. FOTOS RECIBIDAS",
  "f5b43424-4061-4feb-8f91-d4603751c9d2": "E5. VALORACION VIRTUAL",
  "2542b349-23ea-45d0-bc0a-2e61e7f5fd71": "VV RE AGENDADA",
  "e8091013-0c09-448c-99ac-282e3caa7542": "E6. NO CONTESTO",
  "9628011f-7a90-4e8e-82b0-0e0a15b22552": "E7. VALORACION REALIZADA",
  "3f2b42a3-aff7-4c5a-b3ac-d7880414c2f2": "E8. SEGUIMIENTO CIERRE",
  "3a5c8cb1-b051-45c2-8469-260ff9e82703": "E9. DEPOSITO REALIZADO",
  "ee8a731e-0713-4cd6-996d-431561b26a6c": "E10. FECHA CIRUGIA",
};
const stageOrder = Object.keys(stageNames);

function buildSimpleMetrics(opportunities) {
  const countByStage = {};
  stageOrder.forEach((id) => (countByStage[id] = 0));
  opportunities.forEach((opp) => {
    if (countByStage[opp.pipelineStageId] !== undefined)
      countByStage[opp.pipelineStageId]++;
  });

  const totalLeads = opportunities.length;
  const leadsCalificados = opportunities.filter(
    (o) => o.pipelineStageId !== stageIds.nuevoLead,
  ).length;
  const stagesDeposito = [stageIds.depositoRealizado, stageIds.fechaCirugia];
  const depositos = opportunities.filter((o) =>
    stagesDeposito.includes(o.pipelineStageId),
  );
  const totalDepositos = depositos.reduce(
    (s, o) => s + (parseFloat(o.monetaryValue) || 0),
    0,
  );

  // Tiempos
  const tiempos = [];
  depositos.forEach((o) => {
    const days = Math.ceil(
      (new Date(o.updatedAt) - new Date(o.createdAt)) / (1000 * 60 * 60 * 24),
    );
    if (days > 0 && days < 365) tiempos.push(days);
  });

  return {
    funnel: {
      totalLeads,
      leadsCalificados,
      depositosRealizados: depositos.length,
      totalDepositos,
      tasaConversion:
        totalLeads > 0 ? ((depositos.length / totalLeads) * 100).toFixed(2) : 0,
      tasaContacto:
        totalLeads > 0 ? ((leadsCalificados / totalLeads) * 100).toFixed(2) : 0,
      porEtapa: Object.fromEntries(
        stageOrder.map((id) => [stageNames[id], countByStage[id]]),
      ),
    },
    stages: stageOrder.map((id) => ({
      stage: stageNames[id],
      count: countByStage[id],
    })),
    times: {
      promedioTiempoCierre:
        tiempos.length > 0
          ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
          : 0,
      tiempoMinimoCierre: tiempos.length > 0 ? Math.min(...tiempos) : 0,
      tiempoMaximoCierre: tiempos.length > 0 ? Math.max(...tiempos) : 0,
      oportunidadesAnalizadas: depositos.length,
    },
  };
}

// --- System prompt ---
const SYSTEM_PROMPT = `Analista de ventas para Ciplastic (clínica de cirugía plástica, México). Pipeline: 10 etapas, E1=Nuevo Lead, E9=Depósito, E10=Fecha Cirugía. Calificados=avanzaron de E1. Cierres=E9+E10. Tasa contacto sana:>60%, conversión sana:>5%, cierre sano:<30 días.

Responde SOLO JSON válido, SIN markdown. Sé breve y directo. Máximo 3 alertas, 2 insights, 2 recomendaciones.

{"resumenEjecutivo":"string","puntuacionSalud":number,"alertas":[{"tipo":"critico|advertencia|info","titulo":"string","detalle":"string","metrica":"string","recomendacion":"string"}],"insights":[{"categoria":"funnel|fuentes|campanas|tiempos|tendencia","titulo":"string","detalle":"string"}],"recomendaciones":[{"prioridad":"alta|media|baja","accion":"string","impactoEsperado":"string"}]}`;

function buildDataPrompt(data, startDate, endDate) {
  let p = `Analiza las siguientes métricas del funnel de ventas de Ciplastic para el periodo ${startDate} al ${endDate}:\n\n`;

  if (data.funnel) {
    const f = data.funnel;
    p += `## MÉTRICAS DEL FUNNEL\n`;
    p += `- Total Leads: ${f.totalLeads}\n- Calificados: ${f.leadsCalificados}\n- Depósitos: ${f.depositosRealizados}\n`;
    p += `- Valor Depósitos: $${(f.totalDepositos || 0).toLocaleString()}\n- Tasa Contacto: ${f.tasaContacto}%\n- Tasa Conversión: ${f.tasaConversion}%\n`;
    if (f.porEtapa) {
      p += `\nPor etapa:\n`;
      Object.entries(f.porEtapa).forEach(([k, v]) => {
        p += `  ${k}: ${v}\n`;
      });
    }
    p += "\n";
  }
  if (data.stages?.length) {
    p += `## DISTRIBUCIÓN POR ETAPAS\n`;
    data.stages.forEach((s) => {
      p += `- ${s.stage}: ${s.count}\n`;
    });
    p += "\n";
  }
  if (data.times) {
    const t = data.times;
    p += `## TIEMPOS DE CIERRE\n- Promedio: ${t.promedioTiempoCierre} días\n- Mínimo: ${t.tiempoMinimoCierre} días\n- Máximo: ${t.tiempoMaximoCierre} días\n- Analizadas: ${t.oportunidadesAnalizadas}\n\n`;
  }
  p += `\nResponde JSON breve.`;
  return p;
}

// --- Handler (firma Vercel) ---
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res
        .status(503)
        .json({ success: false, error: "ANTHROPIC_API_KEY no configurada" });
    }

    const params = req.query || {};
    const { startDate, endDate } = params;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, error: "Se requieren startDate y endDate" });
    }

    // Cache
    const cacheKey = `${startDate}_${endDate}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res
        .status(200)
        .json({
          success: true,
          dateRange: { startDate, endDate },
          cached: true,
          data: cached,
        });
    }

    // Obtener datos de la DB (rápido)
    let summaryData;
    const snapshot = await db.getLatestSnapshot(startDate, endDate);
    if (snapshot) {
      summaryData = snapshot;
    } else {
      const rawOpps = await db.getOpportunitiesByCreatedRange(
        startDate,
        endDate,
      );
      const opportunities = filterByDateRange(rawOpps, startDate, endDate);
      summaryData = buildSimpleMetrics(opportunities);
    }
    // Llamar a Claude con modelo rápido
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const dataPrompt = buildDataPrompt(summaryData, startDate, endDate);

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: dataPrompt },
        { role: "assistant", content: "{" },
      ],
    });

    let rawText = "{" + response.content[0].text;

    // Si la respuesta fue truncada (stop_reason: max_tokens), cerrar el JSON
    if (
      response.stop_reason === "max_tokens" ||
      response.stop_reason === "end_turn"
    ) {
      let fixed = rawText.replace(/,\s*$/, "");
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      const quoteCount = (fixed.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) fixed += '"';
      for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
      rawText = fixed;
    }

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      let cleaned = rawText.replace(/,\s*([}\]])/g, "$1");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          let last = jsonMatch[0]
            .replace(/,\s*([}\]])/g, "$1")
            .replace(/[\x00-\x1F\x7F]/g, " ");
          analysis = JSON.parse(last);
        }
      } else {
        throw new Error("La IA no devolvió JSON válido");
      }
    }

    // Guardar en cache
    cache.set(cacheKey, { data: analysis, timestamp: Date.now() });

    return res
      .status(200)
      .json({
        success: true,
        dateRange: { startDate, endDate },
        cached: false,
        data: analysis,
      });
  } catch (error) {
    console.error("Error AI analyze:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
