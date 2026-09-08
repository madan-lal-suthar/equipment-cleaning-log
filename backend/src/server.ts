import { createApp } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';

async function start(): Promise<void> {
  // Fail fast with a clear message if the database is unreachable.
  await sequelize.authenticate();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => async () => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
