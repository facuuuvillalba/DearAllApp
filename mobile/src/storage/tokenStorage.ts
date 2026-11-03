import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'auth_token';

/**
 * JWT en Keychain/Keystore vía expo-secure-store en iOS/Android.
 * En web (solo desarrollo) SecureStore no existe, se usa sessionStorage.
 */
export const tokenStorage = {
  get: async (): Promise<string | null> =>
    Platform.OS === 'web' ? window.sessionStorage.getItem(KEY) : SecureStore.getItemAsync(KEY),

  set: async (token: string): Promise<void> => {
    if (Platform.OS === 'web') window.sessionStorage.setItem(KEY, token);
    else await SecureStore.setItemAsync(KEY, token);
  },

  clear: async (): Promise<void> => {
    if (Platform.OS === 'web') window.sessionStorage.removeItem(KEY);
    else await SecureStore.deleteItemAsync(KEY);
  },
};
