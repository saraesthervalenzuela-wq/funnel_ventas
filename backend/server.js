require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const ghlRoutes = require('./routes/ghl');
const metricsRoutes = require('./routes/metrics');
const metaRoutes = require('./routes/meta');
const aiRoutes = require('./routes/ai');
const { performSync } = require('./services/supabaseService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/ghl', ghlRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Ciplastic Funnel Dashboard API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Dashboard disponible en http://localhost:${PORT}`);

  // Sync inicial al arrancar (con delay de 5s para dejar que todo se inicialice)
  setTimeout(async () => {
    try {
      console.log('🚀 Ejecutando sync inicial...');
      await performSync('startup');
      console.log('✅ Sync inicial completado');
    } catch (err) {
      console.error('⚠️ Sync inicial falló (el dashboard seguirá funcionando):', err.message);
    }
  }, 5000);

  // Auto-sync cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('⏰ Auto-sync programado...');
      await performSync('auto');
    } catch (err) {
      console.error('⚠️ Auto-sync falló:', err.message);
    }
  });

  console.log('⏰ Auto-sync configurado: cada 5 minutos');
});
