import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL;
    if (!apiUrl || !/^https:\/\/.+\/api\/v1\/?$/.test(apiUrl)) {
      throw new Error('VITE_API_URL must be an HTTPS URL ending in /api/v1 for production builds');
    }
  }

  return {
    plugins: [react()],
    server: { port: 5173, host: '0.0.0.0' },
  };
});
