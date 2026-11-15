// Tests de bout en bout : Chrome, tablette en hauteur (800 × 1280) et en largeur (1280 × 800).
import { defineConfig } from '@playwright/test';
const port = +(process.env.PW_PORT || 8124); // un port par copie de travail si plusieurs tests tournent en même temps
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'line',
  use: { baseURL: `http://localhost:${port}/`, locale: 'fr-FR', hasTouch: true },
  projects: [
    { name: 'portrait', use: { browserName: 'chromium', viewport: { width: 800, height: 1280 } } },
    { name: 'paysage', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
  webServer: { command: `node tools/serve.mjs ${port}`, url: `http://localhost:${port}/`, reuseExistingServer: !process.env.CI },
});
