/// Mock browser APIs not available in jsdom
import { vi } from "vitest";

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });

// Clipboard API
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(""),
  },
  writable: true,
});

// Web Crypto API (minimal mock for key-generator, hash, etc.)
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: {
      subtle: {
        generateKey: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        exportKey: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        importKey: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        encrypt: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        decrypt: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        sign: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        verify: vi.fn().mockRejectedValue(new Error("Mock: not implemented")),
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      },
      randomUUID: () => "00000000-0000-4000-8000-000000000000",
    },
    writable: true,
  });
}

// ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
