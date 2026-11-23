import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  errorTitle: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorTitle: 'Unexpected Screen Error',
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      errorTitle: 'Unexpected Screen Error',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      errorTitle: 'Unexpected Screen Error',
    });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="warning-outline" size={32} color={colors.error} />
              </View>

              <Text style={styles.kicker} numberOfLines={1}>
                RECOVERY MODE
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {this.state.errorTitle}
              </Text>

              <Text style={styles.message}>
                Something unexpected happened while rendering this screen. Your account data and saved progress are safe.
              </Text>

              <View style={styles.nextStepBox}>
                <Ionicons
                  name="compass-outline"
                  size={16}
                  color={colors.primary}
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <Text style={styles.nextStepText}>
                  What to do next: Tap Reload Screen below to return to a clean view. If it happens again, restart the app or contact support.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={this.handleReset}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
                <Text style={styles.primaryBtnText} numberOfLines={2}>
                  Reload Screen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F7F4',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    flexShrink: 0,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.primary,
  },
  title: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    flexShrink: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
    flexShrink: 1,
  },
  nextStepBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E7D7C1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  nextStepText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    color: colors.text,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
});