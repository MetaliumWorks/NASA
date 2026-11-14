import '@testing-library/jest-dom/vitest';

// Each test starts with empty storage, so a saved state never leaks from one test into the next.
beforeEach(() => {
  window.localStorage.clear();
});

// jsdom has no canvas; the star field is decoration and simply does not draw in tests.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
