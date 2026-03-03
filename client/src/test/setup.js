import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  observe() {}

  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock
