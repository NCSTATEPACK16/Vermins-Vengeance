/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';

// Engine tests are pure logic — no DOM needed, so we run them in Node.
// Component tests (added in a later loop) would switch to 'jsdom'.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**/*.ts'],
      exclude: ['src/game/**/*.{test,spec}.ts'],
      reporter: ['text', 'html'],
    },
  },
});
