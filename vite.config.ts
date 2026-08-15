import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig(() => ({
  plugins: [
    react(),
    // A browser with no ES-module support skips the module script entirely and
    // renders nothing at all — a blank white page with no error. This emits a
    // `nomodule` bundle plus the polyfills those browsers need.
    legacy({
      targets: ['defaults', 'not IE 11', 'iOS >= 12', 'Android >= 6'],
      modernPolyfills: true,
    }),
  ],
  build: {
    outDir: 'dist',
    // No `target` here on purpose: plugin-legacy owns it, emitting a modern
    // bundle plus the `nomodule` one, and warns if this config fights it.
    // The .riv file is the single heaviest asset (~670 kB); keeping the JS
    // chunks small matters more than usual on a phone connection.
    chunkSizeWarningLimit: 900,
  },
}))
