import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed as a GitHub Pages project site at /thikaana-coaching-erp/, with the
// production build output copied to the repo root (see ../). In dev the app is
// served from '/' so the in-app browser preview works without a path prefix.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/thikaana-coaching-erp/' : '/',
  server: { port: 8130 },
  build: {
    outDir: '../dist-site',
    emptyOutDir: true
  }
}))
