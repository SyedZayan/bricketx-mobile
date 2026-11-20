import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';

// Save your PNG logo at: assets/logo.png
const LOGO_SOURCE = require('../../../assets/logo.png');

export const AppSplashScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image source={LOGO_SOURCE} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7F4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 64,
  },
  spinner: {
    position: 'absolute',
    bottom: 64,
  },
});
