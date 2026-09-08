import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from './sequelize.js';
import * as initialSchema from './migrations/001-initial-schema.js';

/**
 * Umzug drives the migrations rather than sequelize-cli: it runs the TypeScript
 * migrations directly (via tsx), so the whole project stays one typed codebase.
 *
 * Migrations are listed explicitly instead of globbed — the list is the ordering,
 * it type-checks, and it behaves identically under tsx, plain node and vitest.
 */
export const migrator = new Umzug({
  migrations: [{ name: '001-initial-schema', ...initialSchema }],
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
  logger: console,
});
