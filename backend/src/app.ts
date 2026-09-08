import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes.js';
import { currentUser } from './middleware/currentUser.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * The app is built separately from the server so tests can mount it with
 * supertest without opening a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      allowedHeaders: ['Content-Type', 'X-User-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(currentUser);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
