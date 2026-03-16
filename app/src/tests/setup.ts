import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!("ResizeObserver" in globalThis)) {
  // Needed by Radix UI measurement hooks in jsdom tests.
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
    ResizeObserverMock;
}

// jsdom's implementation currently throws "Not implemented"; override in tests.
HTMLFormElement.prototype.requestSubmit = function requestSubmitPolyfill() {
  this.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
};
