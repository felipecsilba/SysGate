import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // build carregado via file:// no app empacotado
  server: {
    port: 5174,
    strictPort: true,
    // Mesma origem para o backend local: o CORS allowlist do backend não precisa mudar
    proxy: { '/api': 'http://localhost:3101' },
  },
})
