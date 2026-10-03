import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { CredentialStorage } from './native-auth-client';

const key = 'revuping-refresh-v1';
const options = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
async function supported() {
  if (Platform.OS === 'web' || !(await SecureStore.isAvailableAsync()))
    throw new Error(
      'Real mobile authentication requires native SecureStore. Use the web app for browser authentication.',
    );
}
export const secureCredentials: CredentialStorage = {
  async get() {
    await supported();
    return SecureStore.getItemAsync(key, options);
  },
  async set(value) {
    await supported();
    await SecureStore.setItemAsync(key, value, options);
  },
  async remove() {
    await supported();
    await SecureStore.deleteItemAsync(key, options);
  },
};
