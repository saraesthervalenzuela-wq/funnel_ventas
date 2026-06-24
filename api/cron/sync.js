// ============================================================
// api/cron/sync.js — Endpoint de sincronización programada (Vercel Cron)
// Protegido: acepta Vercel Cron (header x-vercel-cron) o
// Authorization: Bearer ${CRON_SECRET} para invocación manual.
// Llama a performSync('cron') de lib/db.js.
// ============================================================
const db = require("../../lib/db");

module.exports = async function handler(req, res) {
  // 1. Vercel Cron envía el header `x-vercel-cron` automáticamente.
  const isVercelCron = !!req.headers["x-vercel-cron"];

  // 2. Invocación manual / externa: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers["authorization"] || "";
  const secret = process.env.CRON_SECRET;
  const hasValidSecret = secret && authHeader === `Bearer ${secret}`;

  if (!isVercelCron && !hasValidSecret) {
    return res.status(401).json({ success: false, error: "No autorizado" });
  }

  try {
    const result = await db.performSync("cron");
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("❌ Cron sync falló:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
