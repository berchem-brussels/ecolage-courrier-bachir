/**
 * Configuration du script de captures de l'aide (standard v3.3, section 13.1).
 * Cible : une instance qui porte les données de démonstration (HELP_BASE_URL), par exemple celle de `npm run help:demo`.
 * Jamais une instance de production : les captures montrent des écrans pleins de données.
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: /(capture|audit-fiches)\.spec\.ts/,
  timeout: 10 * 60 * 1000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.HELP_BASE_URL || 'http://127.0.0.1:8461', ignoreHTTPSErrors: true, viewport: { width: 1440, height: 900 } },
});
