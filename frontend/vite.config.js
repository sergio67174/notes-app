import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:4000'),
  },
})
