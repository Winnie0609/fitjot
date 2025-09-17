import { defineConfig, mergeConfig } from 'vitest/config';

import vitestConfig from './vitest.config';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      include: ['**/__tests__/**/*.unit.test.ts?(x)'],
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.unit.ts'],
    },
  })
);
