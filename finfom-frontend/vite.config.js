import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Polyfill these Node core modules
      globals: {
        Buffer: true, // for buffer
        process: true, // for process.version
        global: true,
      },
      protocolImports: true,
    }),
  ],
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  define: {
    'process.env': {},
  },
})