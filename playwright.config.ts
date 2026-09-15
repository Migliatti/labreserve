import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Banco compartilhado: ver regra de recurso exclusivo por teste em tests/e2e/reservations.spec.ts.
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  webServer: [
    { command: 'tsx src/server/main.ts', port: 3000, reuseExistingServer: false, env: { ...process.env, PORT: '3000', DATABASE_PATH: ':memory:' } },
    { command: 'npm run dev -- --host 127.0.0.1 --port 5173', port: 5173, reuseExistingServer: false },
  ],
});
