import { defineConfig } from 'vitest/config';

// Tests des règles Firestore : à lancer avec l'émulateur (npm run test:rules).
export default defineConfig({ test: { include: ['tests-rules/**/*.test.ts'], testTimeout: 20000, fileParallelism: false } });
