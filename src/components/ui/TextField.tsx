import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

export const TextField: React.FC<Props> = ({
  label,
  error,
  hint,
  isPassword = false,
  multiline = false,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          multiline && styles.inputWrapperMultiline,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            style,
          ]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          placeholderTextColor="#A39E93"
          selectionColor={colors.primary}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={isFocused ? colors.primary : '#8C867A'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    flexShrink: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1.2,
    borderColor: '#E5E0D8',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    minHeight: 96,
    paddingVertical: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFDF9',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFFBFB',
  },
  input: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    paddingVertical: 2,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 72,
  },
  eyeButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  hintText: {
    fontSize: 11.5,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 16,
    flexShrink: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    lineHeight: 16,
    flexShrink: 1,
  },
});
