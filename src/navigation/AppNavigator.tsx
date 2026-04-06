import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/theme';
import { DrawerContent } from './DrawerContent';
import { DashboardScreen } from '@features/dashboard';
import TasksScreen from '@features/tasks/screens/TasksScreen';
import TransactionTabs from '@features/transactions/screens/TransactionTabs';
import NotesStack from '@features/notes/screens/NotesStack';
import { CalendarScreen } from '@features/calendar/screens/CalendarScreen';
import WorkoutStack from '@features/workout/screens/WorkoutStack';
import { WTRegistryScreen } from '@features/wtregistry/screens/WTRegistryScreen';
import { HistoryScreen } from '@features/history/screens/HistoryScreen';
import MuninnScreen from '@features/muninn/screens/MuninnScreen';

export type DrawerParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Tasks: undefined;
  Notes: undefined;
  Calendar: undefined;
  Workout: undefined;
  WTRegistry: undefined;
  History: undefined;
  Muninn: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const SCREENS: Array<{
  name: keyof DrawerParamList;
  component: React.ComponentType<any>;
}> = [
  { name: 'Dashboard', component: DashboardScreen },
  { name: 'Transactions', component: TransactionTabs },
  { name: 'Tasks', component: TasksScreen },
  { name: 'Notes', component: NotesStack },
  { name: 'Calendar', component: CalendarScreen },
  { name: 'Workout', component: WorkoutStack },
  { name: 'WTRegistry', component: WTRegistryScreen },
  { name: 'History', component: HistoryScreen },
  { name: 'Muninn', component: MuninnScreen },
];

export function AppNavigator() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer
      documentTitle={{ enabled: false }}
      theme={{
        dark: isDark,
        colors: {
          background: colors.background,
          card: colors.sidebar,
          text: colors.foreground,
          border: colors.border,
          primary: colors.primary,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Drawer.Navigator
        initialRouteName="Dashboard"
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            backgroundColor: colors.sidebar,
            width: 292,
          },
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          sceneStyle: {},
        }}
      >
        {SCREENS.map(({ name, component }) => (
          <Drawer.Screen key={name} name={name} component={component} />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
