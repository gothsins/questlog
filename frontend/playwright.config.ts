import { defineConfig, devices } from '@playwright/test'
import { FRONTEND_ORIGIN, MOCK_API_ORIGIN } from './e2e/network'

const port = new URL(FRONTEND_ORIGIN).port

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI ? [['list']] : [['list'], ['html', { open: 'never' }]],
    outputDir: 'test-results',
    use: {
        baseURL: FRONTEND_ORIGIN,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: process.env.LIBRARY_MOTION_CAPTURE === '1' ? 'on' : 'off',
        serviceWorkers: 'block',
    },
    projects: [
        { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
    ],
    webServer: {
        command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
        url: FRONTEND_ORIGIN,
        reuseExistingServer: false,
        timeout: 60_000,
        env: { VITE_API_URL: MOCK_API_ORIGIN },
    },
})
