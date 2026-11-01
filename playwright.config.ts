import { defineConfig, devices } from '@playwright/test';

// Puerto distinto al de `npm run dev` (4321) para no probar contra el servidor de desarrollo.
const puerto = 4322;
const baseURL = `http://localhost:${puerto}`;

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  use: { baseURL },
  // Los dos proyectos usan Chromium para instalar un solo navegador.
  projects: [
    {
      name: 'movil',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${puerto}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
