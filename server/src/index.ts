import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc/router';
import { createContext } from './trpc/context';
import { testConnection } from './db';
import { config } from './config';
import authRoutes from './routes/auth';

const app = express();

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── tRPC ─────────────────────────────────────────────────────────────────────
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// ─── Auth routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Healthcheck HTTP directo ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await testConnection();
    console.log('✓ Conexión a MySQL establecida');
  } catch (err) {
    console.error('✗ No se pudo conectar a MySQL:', err);
    process.exit(1);
  }

  app.listen(config.PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${config.PORT}`);
    console.log(`  Entorno: ${config.NODE_ENV}`);
  });
}

start();
