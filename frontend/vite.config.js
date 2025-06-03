import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://folktale-render.onrender.com',
        changeOrigin: true,
        secure: false, // set to true if your target has a valid SSL
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
