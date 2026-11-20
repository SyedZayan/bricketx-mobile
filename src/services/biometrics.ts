import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const SAVED_EMAIL_KEY = 'biometrics_saved_email';
const BIOMETRIC_CREDENTIAL_KEY = 'biometrics_persisted_token';

export const BiometricsService = {
  /** Check if device has biometric hardware and enrolled fingerprints or face */
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  /** Get biometric display name (Face ID, Touch ID, Fingerprint) */
  async getBiometricTypeName(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Fingerprint';
    }
    return 'Biometrics';
  },

  /** Check if user previously toggled biometrics ON */
  async isEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
    return val === 'true';
  },

  /** Toggle biometrics preference */
  async setEnabled(enabled: boolean, email?: string, refreshToken?: string): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? 'true' : 'false');
    if (enabled) {
      if (email) await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email);
      if (refreshToken) await SecureStore.setItemAsync(BIOMETRIC_CREDENTIAL_KEY, refreshToken);
    } else {
      await SecureStore.deleteItemAsync(SAVED_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIAL_KEY);
    }
  },

  /** Retrieve the last authenticated investor email */
  async getSavedEmail(): Promise<string | null> {
    return SecureStore.getItemAsync(SAVED_EMAIL_KEY);
  },

  /** Retrieve persisted biometric refresh token */
  async getBiometricToken(): Promise<string | null> {
    return SecureStore.getItemAsync(BIOMETRIC_CREDENTIAL_KEY);
  },

  /** Prompt Face ID / Fingerprint popup */
  async authenticate(promptMessage = 'Unlock your BricketX Investor Portal'): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Password',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },
};