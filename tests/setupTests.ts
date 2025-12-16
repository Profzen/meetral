import '@testing-library/jest-dom';

// Setup global fetch mock if needed
if (!globalThis.fetch) {
  // Provide a minimal fetch polyfill for tests using node-fetch (we rely on jsdom environment)
  // For advanced cases, tests will mock fetch per test using vi.fn()
}
