import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createAppServer } from './app-server.js';

const port = Number(process.env.PORT ?? 3000);
const databasePath = process.env.DATABASE_PATH ?? 'data/labreserve.sqlite';
if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });

const app = createAppServer({ databasePath });
await app.listen(port, '127.0.0.1');
console.log(`LabReserve API listening on http://127.0.0.1:${port}`);

async function shutdown(): Promise<void> {
  await app.close();
  process.exit(0);
}
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());
