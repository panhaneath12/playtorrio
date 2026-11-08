import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['chrome69', 'edge69', 'firefox60', 'safari11', 'es2015'],
    cssTarget: 'chrome69'
  }
})
