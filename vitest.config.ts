import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: '.env.local' });

// This is the base config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.config.{js,ts,mjs}',
        '**/*.d.ts',
        '**/vitest.setup.{ts,js}',
        'e2e/**',
        'playwright-report/**',
        'test-results/**',
        '**/__tests__/**',
        'scripts/**',
        'service_account.json',
        'storageState.json',
      ],
      // scope to business code
      include: [
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
      ],
    },
  },
});
