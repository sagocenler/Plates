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
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://localhost:5173', reuseExistingServer: true },
})
