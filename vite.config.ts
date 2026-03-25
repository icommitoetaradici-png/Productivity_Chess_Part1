import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/chess-api': {
        target: 'https://chess-api.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/chess-api/, '/v1'),
      },
    },
  },
})
