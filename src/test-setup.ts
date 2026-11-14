import '@testing-library/jest-dom/vitest';

// Each test starts with empty storage, so a saved state never leaks from one test into the next.
beforeEach(() => {
  window.localStorage.clear();
});
