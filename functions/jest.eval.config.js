/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/evals'],
  testMatch: ['**/*.eval.ts'],
  testTimeout: 120000,
  // Run serially to avoid rate limiting and control costs
  maxWorkers: 1,
  detectOpenHandles: true,
  setupFiles: ['<rootDir>/src/evals/setup.ts'],
};
