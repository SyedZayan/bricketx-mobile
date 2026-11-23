import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const SAVED_EMAIL_KEY = 'biometrics_saved_email';
const BIOMETRIC_CREDENTIAL_KEY = 'biometrics_persisted_token';

export interface BiometricAuthResult {
  success: boolean;
  cancelled?: boolean;
  lockedOut?: boolean;
  message?: string;
}

export const BiometricsService = {
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      return await LocalAuthentication.isEnrolledAsync();
    } catch {
      return false;
    }
  },

  async getBiometricTypeName(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }
      return 'Biometrics';
    } catch {
      return 'Biometrics';
    }
  },

  async isEnabled(): Promise<boolean> {
    try {
      const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setEnabled(enabled: boolean, email?: string, refreshToken?: string): Promise<void> {
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
      if (email) {
        await SecureStore.setItemAsync(SAVED_EMAIL_KEY, email.trim().toLowerCase());
      }
      if (refreshToken) {
        await SecureStore.setItemAsync(BIOMETRIC_CREDENTIAL_KEY, refreshToken);
      }
    } else {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
      await this.clearCredentials();
    }
  },

  async clearCredentials(): Promise<void> {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(SAVED_EMAIL_KEY),
      SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIAL_KEY),
    ]);
  },

  async getSavedEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SAVED_EMAIL_KEY);
    } catch {
      return null;
    }
  },

  async getBiometricToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(BIOMETRIC_CREDENTIAL_KEY);
    } catch {
      return null;
    }
  },

  async authenticate(
    promptMessage = 'Unlock your BricketX Investor Portal'
  ): Promise<BiometricAuthResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          message: 'Biometric authentication is not set up on this device.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Password',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      if (result.error === 'user_cancel' || result.error === 'system_cancel') {
        return { success: false, cancelled: true };
      }

      if (result.error === 'lockout') {
        return {
          success: false,
          lockedOut: true,
          message: 'Too many failed attempts. Unlock your device or sign in with your password.',
        };
      }

      return {
        success: false,
        message: 'Biometric verification was not completed. Please try again or use your password.',
      };
    } catch {
      return {
        success: false,
        message: 'Could not start biometric verification. Please sign in with your password.',
      };
    }
  },
};