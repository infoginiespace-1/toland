import express from 'express';
import { config } from './config';
import { router } from './routes';
import { whatsappService } from './services/whatsapp';
import { queueWorker } from './services/queue';

const app = express();
app.use(express.json());

// Secret authorization middleware enforcing x-bridge-secret header
app.use((req, res, next) => {
  // Allow health check without auth header for container monitoring
  if (req.path === '/health') return next();

  const authHeader = req.headers['x-bridge-secret'];
  if (!authHeader || authHeader !== config.WHATSAPP_BRIDGE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-bridge-secret header' });
  }
  next();
});

app.use(router);

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Bridge Error]:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.PORT, async () => {
  console.log(`[TOLAND Bridge] WhatsApp service listening on port ${config.PORT}`);

  try {
    // 1. Start Baileys WhatsApp client with Postgres auth state
    await whatsappService.start();

    // 2. Start background anti-ban queue worker
    queueWorker.start();
  } catch (err) {
    console.error('[TOLAND Bridge] Failed to initialize services on startup:', err);
  }
});

// Graceful shutdown handling for container termination
const shutdown = () => {
  console.log('[TOLAND Bridge] Shutting down gracefully...');
  queueWorker.stop();
  server.close(() => {
    console.log('[TOLAND Bridge] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
