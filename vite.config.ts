import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // The skeleton drawing is bundled with the script so the app runs without a network.
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    globals: true,
    css: false,
  },
});
