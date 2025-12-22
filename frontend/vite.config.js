import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external access
    strictPort: false,
    allowedHosts: ['.localhost', 'localhost', 'frontend-test', 'backend-test', '172.18.0.0/16'], // Allow Docker containers
    hmr: {
      clientPort: 5173,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
  },
  // Note: VITE_* environment variables are automatically exposed by Vite
  // No need for 'define' config - they work out of the box
})
