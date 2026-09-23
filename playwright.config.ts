import { defineConfig } from '@playwright/test'

// 默认针对线上 demo 做端到端验证;也可用 BASE_URL 覆盖到本地:
//   BASE_URL=http://localhost:5173/ npx playwright test
export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://AnnLin2019.github.io/Atoms_demo/',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    locale: 'zh-CN',
  },
})