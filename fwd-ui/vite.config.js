import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import configPlugin from './vite-plugin-config.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [configPlugin(), react()],
})
