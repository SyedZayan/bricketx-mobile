import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotificationVisualMeta } from '../../features/notifications/notificationHelpers';
import { colors } from '../../theme/colors';

interface ToastProps {
  visible: boolean;
  title: string;
  text: string;
  type?: string;
  onPress: () => void;
  onDismiss: () => void;
}

export const InAppNotificationToast: React.FC<ToastProps> = ({
  visible,
  title,
  text,
  type,
  onPress,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -140,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -140,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  if (!visible) return null;

  const meta = getNotificationVisualMeta(type);

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          top: insets.top + 6,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastCard}
        onPress={() => {
          handleDismiss();
          onPress();
        }}
        activeOpacity={0.9}
      >
        <View style={[styles.iconRing, { backgroundColor: meta.bgColor }]}>
          <Ionicons name={meta.icon} size={18} color={meta.iconColor} />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.topRow}>
            <Text style={styles.toastTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.timeLabel}>Now</Text>
          </View>
          <Text style={styles.toastText} numberOfLines={2}>
            {text}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    marginRight: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: 8,
  },
  toastTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  timeLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
  },
  toastText: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 15,
  },
});
