import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Recharts isolado — usado só em Chamados/Dashboard
          recharts: ['recharts'],
          // Papa Parse isolado — usado só em EnvioLote
          papaparse: ['papaparse'],
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Zustand + Axios (pequenos mas compartilhados)
          'app-vendor': ['zustand', 'axios'],
        },
      },
    },
  },
})
