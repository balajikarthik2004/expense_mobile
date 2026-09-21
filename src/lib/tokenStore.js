// Native token storage, backed by the device keychain / keystore.
// The web build resolves ./tokenStore.web.js instead — expo-secure-store has no
// web implementation, so importing it in a browser yields a stub whose methods
// are undefined.
import * as SecureStore from 'expo-secure-store';

export const getItem = (key) => SecureStore.getItemAsync(key);
export const setItem = (key, value) => SecureStore.setItemAsync(key, value);
export const removeItem = (key) => SecureStore.deleteItemAsync(key);
