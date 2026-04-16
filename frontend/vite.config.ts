import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  resolve: {
    alias: {
      // "@/components/Button" resolves to "src/components/Button"
      // This is what Shadcn uses internally for all its imports
      '@': path.resolve(__dirname, './src'),
    },
  },
})
