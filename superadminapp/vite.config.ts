
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  define: {
    'process.env': {},
  },
  server: {
    host: '127.0.0.1',
    port: 5172,
    strictPort: true,
  },
})
