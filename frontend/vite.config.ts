import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

let backendPort = 3001;
try {
  const configPath = path.resolve(__dirname, '../backend/data/config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (config.PORT) {
      backendPort = config.PORT;
    }
  }
} catch (error) {
  console.log('Backend config okunamadı, varsayılan 3001 kullanılıyor.');
}

const target = `http://localhost:${backendPort}`;

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/socket.io': {
        target: target,
        ws: true,
      },
      '/login': target,
      '/validate-key': target,
      '/notifications': target,
      '/movies': target,
      '/settings': target,
      '/users': target,
      '/private-rooms': target,
      '/push': target,
      '/install': target,
    },
  },
  plugins: [react(), tailwindcss()],
})
