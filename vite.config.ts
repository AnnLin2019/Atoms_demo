import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 相对路径,便于部署到任意静态托管(含子路径,如 GitHub Pages)
  base: './',
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
  },
})