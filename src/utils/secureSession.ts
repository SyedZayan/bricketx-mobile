import * as SecureStore from 'expo-secure-store';

const REFRESH_KEY = 'bx.refreshToken';

const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureSession = {
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY, STORE_OPTIONS);
    } catch {
      return null;
    }
  },
  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_KEY, token, STORE_OPTIONS);
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_KEY, STORE_OPTIONS);
    } catch {
      // Ignore if key is absent
    }
  },
};