import { defineConfig, mergeConfig } from 'vitest/config';
import vitestConfig from './vitest.config';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      include: ['**/__tests__/**/*.int.test.ts?(x)'],
      environment: 'node',
      setupFiles: ['./vitest.setup.int.ts'],
    },
  })
);
