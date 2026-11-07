import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'iphone', use: { ...devices['iPhone 14'], browserName: 'chromium' } }],
  webServer: [
    // Real-backend smoke test server (only when a test account is provided).
    ...(process.env.E2E_SUPABASE_EMAIL ? [{ command: 'npm run dev:supabase', url: 'http://localhost:5175', reuseExistingServer: true }] : []),
    { command: 'npm run dev -- --port 5173', url: 'http://localhost:5173', reuseExistingServer: true },
    // Production build: needed to test the service worker (disabled in dev).
    { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120_000 },
  ],
})
