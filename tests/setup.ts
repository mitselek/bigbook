import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/svelte'
import { afterEach } from 'vitest'

// Node.js 25+ ships a native `localStorage` global that lacks `.clear()` and
// shadows jsdom's proper Storage implementation.  When vitest runs with
// environment: 'jsdom', jsdom stores its real Storage on window._localStorage
// but the Node.js global wins the name binding.  Restore the jsdom instance so
// every test file gets a fully-featured, spec-compliant localStorage.
const win = globalThis as unknown as Window & { _localStorage?: Storage }
if (typeof win._localStorage?.clear === 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: win._localStorage,
    writable: true,
    configurable: true,
    enumerable: true,
  })
}

afterEach(() => {
  cleanup()
})
