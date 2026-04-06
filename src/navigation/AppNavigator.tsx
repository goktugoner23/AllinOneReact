import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAppTheme } from '@shared/theme';
import { DrawerContent } from './DrawerContent';
import { Header } from './Header';
import { DashboardScreen } from '@features/dashboard';
import TasksScreen from '@features/tasks/screens/TasksScreen';
import { TransactionHomeScreen } from '@features/transactions/screens/TransactionHomeScreen';
import NotesScreen from '@features/notes/screens/NotesScreen';
import { CalendarScreen } from '@features/calendar/screens/CalendarScreen';
import WorkoutTabs from '@features/workout/screens/WorkoutTabs';
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
  { name: 'Transactions', component: TransactionHomeScreen },
  { name: 'Tasks', component: TasksScreen },
  { name: 'Notes', component: NotesScreen },
  { name: 'Calendar', component: CalendarScreen },
  { name: 'Workout', component: WorkoutTabs },
  { name: 'WTRegistry', component: WTRegistryScreen },
  { name: 'History', component: HistoryScreen },
  { name: 'Muninn', component: MuninnScreen },
];

export function AppNavigator() {
  const { colors, isDark } = useAppTheme();

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
        screenOptions={({ navigation, route }) => ({
          drawerStyle: {
            backgroundColor: colors.sidebar,
            width: 292,
          },
          header: () => (
            <Header
              routeName={route.name}
              onMenuPress={() => navigation.toggleDrawer()}
              onMuninnPress={() => navigation.navigate('Muninn')}
            />
          ),
        })}
      >
        {SCREENS.map(({ name, component }) => (
          <Drawer.Screen key={name} name={name} component={component} />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
