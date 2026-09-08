import { migrator } from './umzug.js';
import { sequelize } from './sequelize.js';

/** Thin CLI wrapper: `npm run db:migrate` / `db:migrate:down -- --all`. */
async function main(): Promise<void> {
  const [command = 'up', ...rest] = process.argv.slice(2);

  if (command === 'up') {
    await migrator.up();
  } else if (command === 'down') {
    await migrator.down(rest.includes('--all') ? { to: 0 } : undefined);
  } else if (command === 'pending') {
    const pending = await migrator.pending();
    console.log(pending.length ? pending.map((m) => m.name).join('\n') : 'No pending migrations');
  } else {
    throw new Error(`Unknown command "${command}". Use: up | down [--all] | pending`);
  }

  await sequelize.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
