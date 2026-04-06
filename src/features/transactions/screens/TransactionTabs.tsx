import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TransactionHomeScreen } from './TransactionHomeScreen';
import { InvestmentsTab } from './InvestmentsTab';
import { ReportsTab } from './ReportsTab';
import { useColors } from '@shared/theme';

const Tab = createBottomTabNavigator();

export default function TransactionTabs() {
  const colors = useColors();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Home'
              ? 'wallet-outline'
              : route.name === 'Investments'
                ? 'trending-up-outline'
                : 'pie-chart-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foregroundMuted,
      })}
    >
      <Tab.Screen name="Home" component={TransactionHomeScreen} />
      <Tab.Screen name="Investments" component={InvestmentsTab} />
      <Tab.Screen name="Reports" component={ReportsTab} />
    </Tab.Navigator>
  );
}
