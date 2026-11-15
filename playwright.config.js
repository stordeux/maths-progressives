// Tests de bout en bout : Chrome, tablette en hauteur (800 × 1280) et en largeur (1280 × 800).
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'line',
  use: { baseURL: 'http://localhost:8124/', locale: 'fr-FR', hasTouch: true },
  projects: [
    { name: 'portrait', use: { browserName: 'chromium', viewport: { width: 800, height: 1280 } } },
    { name: 'paysage', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: 'node tools/serve.mjs 8124', url: 'http://localhost:8124/', reuseExistingServer: !process.env.CI },
});
