import React from 'react';
import { Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

const TextWithDefaults = Text as typeof Text & {
  defaultProps?: { maxFontSizeMultiplier?: number };
};
const TextInputWithDefaults = TextInput as typeof TextInput & {
  defaultProps?: { maxFontSizeMultiplier?: number };
};

TextWithDefaults.defaultProps = {
  ...(TextWithDefaults.defaultProps || {}),
  maxFontSizeMultiplier: 1.35,
};

TextInputWithDefaults.defaultProps = {
  ...(TextInputWithDefaults.defaultProps || {}),
  maxFontSizeMultiplier: 1.35,
};

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
