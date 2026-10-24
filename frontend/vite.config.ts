import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { buildContentSecurityPolicy } from './csp.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL ?? 'http://localhost:8080'

  // Report-only by default: the browser logs what the policy WOULD block
  // without breaking the page. Set CSP_ENFORCE=true once the console is clean.
  const cspHeader =
    env.CSP_ENFORCE === 'true'
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only'

  return {
    plugins: [react()],
    // Headers for `vite preview`, which serves the production build.
    // The dev server is intentionally left alone: HMR needs inline scripts.
    preview: {
      headers: {
        [cspHeader]: buildContentSecurityPolicy(apiUrl),
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  }
})
