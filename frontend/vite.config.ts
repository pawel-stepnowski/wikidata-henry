import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Base URL for GitHub Pages project site: https://<user>.github.io/wiki-humans/
  base: '/wiki-humans/',
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from one level up to import ../../README.md?raw
      allow: ['..']
    }
  }
})
