import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "16a8-2403-a080-1c-6165-383d-662-fe94-2f49.ngrok-free.app",
      "8e44-2403-a080-1d-113c-a8a7-c1e1-5aa7-bd86.ngrok-free.app",
      "3bf2-2403-a080-1c-85ca-7d16-5d1a-2fe5-9b.ngrok-free.app",
      "98e1-2403-a080-1c-c9ac-3d1c-6849-69db-cc6f.ngrok-free.app"
    ]
  }
})
