/**
 * Integration tests run against a real Postgres (the same one docker-compose
 * starts), in a throwaway database so they never touch development data.
 */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://cleaning:cleaning@localhost:5433/cleaning_log_test';
