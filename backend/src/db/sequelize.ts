import { Sequelize } from 'sequelize';
import { env } from '../config/env.js';

/**
 * A single Sequelize instance shared by the whole process. Models are attached
 * to it in `models/index.ts`; migrations borrow its connection via `queryInterface`.
 */
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  logging: env.DB_LOGGING ? console.log : false,
  pool: { max: 10, min: 0, idle: 10_000 },
  define: {
    underscored: true,
    freezeTableName: false,
  },
});
