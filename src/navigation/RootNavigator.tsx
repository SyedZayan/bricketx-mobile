import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { useSessionRestore } from '../hooks/useSessionRestore';
import { AppSplashScreen } from '../components/common/AppSplashScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { KycProfileViewScreen } from '../screens/account/KycProfileViewScreen';
import { AccountClosureScreen } from '../screens/account/AccountClosureScreen';
import { PackageDetailScreen } from '../screens/packages/PackageDetailScreen';
import { CommitmentModal } from '../screens/investments/commit/CommitmentModal';
import { InvestmentDetailScreen } from '../screens/investments/detail/InvestmentDetailScreen';
import { UpdatePasswordScreen } from '../screens/account/UpdatePasswordScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { EsignModal } from '../screens/investments/esign/EsignModal';
import { FundingInstructionsModal } from '../screens/investments/funding/FundingInstructionsModal';
import { SupportScreen } from '../screens/support/SupportScreen';
import { NewTicketScreen } from '../screens/support/NewTicketScreen';
import { TicketDetailScreen } from '../screens/support/TicketDetailScreen';
import { DocumentsScreen } from '../screens/documents/DocumentsScreen';
import { StatementsScreen } from '../screens/statements/StatementsScreen';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { KycStack } from './KycStack';
import { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isRestoring } = useSessionRestore();
  const status = useAppSelector((state) => state.auth.status);

  if (isRestoring) {
    return <AppSplashScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'authenticated' ? (
          <>
            <RootStack.Screen name="MainRoot" component={MainTabs} />
            <RootStack.Screen name="Dashboard" component={DashboardScreen} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
            <RootStack.Screen
              name="KycModal"
              component={KycStack}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen name="KycProfileView" component={KycProfileViewScreen} />
            <RootStack.Screen name="PackageDetail" component={PackageDetailScreen} />
            <RootStack.Screen
              name="CommitmentModal"
              component={CommitmentModal}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen name="InvestmentDetail" component={InvestmentDetailScreen} />
            <RootStack.Screen
              name="EsignModal"
              component={EsignModal}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen
              name="FundingInstructionsModal"
              component={FundingInstructionsModal}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen name="AccountClosure" component={AccountClosureScreen} />
            <RootStack.Screen name="Support" component={SupportScreen} />
            <RootStack.Screen name="NewTicket" component={NewTicketScreen} />
            <RootStack.Screen name="TicketDetail" component={TicketDetailScreen} />
            <RootStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
            <RootStack.Screen name="Documents" component={DocumentsScreen} />
            <RootStack.Screen name="Statements" component={StatementsScreen} />
          </>
        ) : (
          <RootStack.Screen name="AuthRoot" component={AuthStack} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
