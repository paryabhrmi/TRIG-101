import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is published to GitHub Pages at https://<user>.github.io/TRIG-101/,
// so every asset URL needs that prefix. Local dev keeps the plain root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/TRIG-101/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    // The .riv file is the single heaviest asset (~670 kB); keeping the JS
    // chunks small matters more than usual on a phone connection.
    chunkSizeWarningLimit: 900,
  },
}))
