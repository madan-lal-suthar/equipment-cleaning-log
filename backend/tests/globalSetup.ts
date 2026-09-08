import { Client } from 'pg';
import { TEST_DATABASE_URL } from './testDatabase.js';

/**
 * Recreates the test database from scratch and runs the migrations, so the
 * suite exercises the real schema (enums, FKs, indexes) rather than a
 * `sequelize.sync()` approximation of it.
 */
export default async function setup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  const url = new URL(TEST_DATABASE_URL);
  const databaseName = url.pathname.slice(1);

  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
  } catch (error) {
    throw new Error(
      `Cannot reach Postgres at ${adminUrl.host}. Start it with \`docker compose up -d db\` ` +
        `or point TEST_DATABASE_URL at your own instance.\nOriginal error: ${(error as Error).message}`,
    );
  }

  await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await admin.end();

  const { migrator } = await import('../src/db/umzug.js');
  const { sequelize } = await import('../src/db/sequelize.js');
  await migrator.up();
  await sequelize.close();
}
