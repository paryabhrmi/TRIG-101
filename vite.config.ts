import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is published to GitHub Pages at https://<user>.github.io/TRIG-101/,
// so every asset URL needs that prefix. Local dev keeps the plain root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/TRIG-101/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Vite 8 defaults to "baseline widely available", which is Safari 16+.
    // An older phone then hits syntax it cannot parse and renders a blank
    // white page with no visible error. Transpile down instead — the bundle
    // grows by a few kB and stops failing silently.
    target: ['es2019', 'safari13', 'chrome79', 'firefox72'],
    // The .riv file is the single heaviest asset (~670 kB); keeping the JS
    // chunks small matters more than usual on a phone connection.
    chunkSizeWarningLimit: 900,
  },
}))
