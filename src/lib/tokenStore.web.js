// Web token storage. localStorage is not a secure enclave — it is readable by
// any script on the origin — so this is for local development in the browser.
// Native builds get the keychain-backed ./tokenStore.js.
const memory = new Map();

const store = (() => {
  try {
    const probe = '__kb_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    // Private browsing or blocked storage: fall back to in-memory for the session.
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    };
  }
})();

export const getItem = async (key) => store.getItem(key) ?? null;
export const setItem = async (key, value) => {
  store.setItem(key, value);
};
export const removeItem = async (key) => {
  store.removeItem(key);
};
