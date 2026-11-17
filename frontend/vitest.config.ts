import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false,
    // Le script de captures est joué par Playwright (npm run help:capture), jamais par vitest.
    include: ['src/**/*.test.{ts,tsx}'] },
});
