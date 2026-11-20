import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { AccountScreen } from '../screens/account/AccountScreen';
import { PackagesScreen } from '../screens/packages/PackagesScreen';
import { InvestmentsScreen } from '../screens/investments/InvestmentsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Bar that physically respects the native Android Navigation Bar
const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 24 : 12
  );

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          let iconName: any = 'grid-outline';
          if (route.name === 'Dashboard') {
            iconName = isFocused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Packages') {
            iconName = isFocused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Investments') {
            iconName = isFocused ? 'trending-up' : 'trending-up-outline';
          } else if (route.name === 'Account') {
            iconName = isFocused ? 'person' : 'person-outline';
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={isFocused ? colors.primary : colors.slate}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primary : colors.slate },
                ]}
              >
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Packages"
        component={PackagesScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Investments"
        component={InvestmentsScreen}
        options={{ headerShown: false }}
      />
          <Tab.Screen
      name="Account"
      component={AccountScreen}
      options={{
        headerShown: false,
        tabBarLabel: 'Account',
      }}
    />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});