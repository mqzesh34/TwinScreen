import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/login': 'http://localhost:3001',
      '/validate-key': 'http://localhost:3001',
      '/notifications': 'http://localhost:3001',
      '/movies': 'http://localhost:3001',
      '/settings': 'http://localhost:3001',
      '/users': 'http://localhost:3001',
      '/private-rooms': 'http://localhost:3001',
    },
  },
  plugins: [react(), tailwindcss()],
})
