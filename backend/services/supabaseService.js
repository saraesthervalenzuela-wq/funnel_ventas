// ============================================================
// backend/services/supabaseService.js
// SHIM de compatibilidad: la lógica real vive ahora en lib/db.js (Neon).
// Se mantiene este archivo para que backend/server.js (dev local con
// Express + node-cron) siga funcionando sin cambiar sus imports.
// Migrado de Supabase -> Neon (2026-06-24).
// ============================================================
module.exports = require("../../lib/db");
