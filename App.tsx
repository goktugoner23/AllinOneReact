/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import store from '@shared/store/rootStore';
import { queryClient } from '@shared/lib';
import { TransactionHomeScreen, InvestmentsTab, ReportsTab } from '@features/transactions/screens';
import { WTRegistryScreen } from '@features/wtregistry/screens';
import { CalendarScreen } from '@features/calendar/screens';
import { HistoryScreen } from '@features/history/screens';
import { NotesScreen, EditNoteScreen } from '@features/notes/screens';
import { TasksScreen } from '@features/tasks/screens';
import { InstagramScreen } from '@features/instagram/screens';
import { WorkoutTabs } from '@features/workout';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { enableFreeze } from 'react-native-screens';
import { Switch, Divider } from '@shared/components/ui';
import StopwatchScreen from '@features/workout/screens/StopwatchScreen';
import { ThemeProvider, useAppTheme, useColors } from '@shared/theme';

// Initialize Firebase
import '@shared/services/firebase/firebase';

// Global error handler to suppress Firestore assertion errors
const setupGlobalErrorHandler = () => {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('INTERNAL ASSERTION FAILED')) {
      console.warn('⚠️ Suppressing Firestore assertion error:', message);
      return;
    }
    originalConsoleError.apply(console, args);
  };
};

// Balance preloader removed to avoid initialization issues

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const WorkoutStack = createStackNavigator();

// Transactions Dashboard with bottom tabs (Home, Investments, Reports)
function TransactionsDashboard() {
  const colors = useColors();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Investments') {
            iconName = 'trending-up-outline';
          } else if (route.name === 'Reports') {
            iconName = 'bar-chart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foreground,
      })}
    >
      <Tab.Screen name="Home" component={TransactionHomeScreen} />
      <Tab.Screen name="Investments" component={InvestmentsTab} />
      <Tab.Screen name="Reports" component={ReportsTab} />
    </Tab.Navigator>
  );
}

// Notes Stack Navigator
function NotesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NotesList" component={NotesScreen} />
      <Stack.Screen name="EditNote" component={EditNoteScreen} />
    </Stack.Navigator>
  );
}

// Workout stack: tabs + separate stopwatch page
function WorkoutNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutTabs" component={WorkoutTabs} />
      <WorkoutStack.Screen name="Stopwatch" component={StopwatchScreen} />
    </WorkoutStack.Navigator>
  );
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { isDark, toggleTheme, colors } = useAppTheme();

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: colors.foreground }]}>AllInOne App</Text>
      </View>
      <Divider />
      <DrawerItemList {...props} />
      <Divider style={styles.divider} />
      {/** Settings removed per request */}
      <View style={styles.themeToggle}>
        <Text style={[styles.themeLabel, { color: colors.foreground }]}>Dark Mode</Text>
        <Switch value={isDark} onChange={toggleTheme} />
      </View>
    </DrawerContentScrollView>
  );
}

function AppContent() {
  const { colors, isDark } = useAppTheme();

  return (
    <NavigationContainer
      documentTitle={{ enabled: false }}
      theme={{
        dark: isDark,
        colors: {
          background: colors.background,
          card: colors.surface,
          text: colors.foreground,
          border: colors.border,
          primary: colors.primary,
          notification: colors.accent,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Drawer.Navigator
        initialRouteName="Transactions"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 280,
          },
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.foreground,
        }}
      >
        <Drawer.Screen
          name="Transactions"
          component={TransactionsDashboard}
          options={{
            title: 'Transactions',
            drawerIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="WT Registry"
          component={WTRegistryScreen}
          options={{
            title: 'WT Registry',
            drawerIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            title: 'Calendar',
            drawerIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Notes"
          component={NotesStack}
          options={{
            title: 'Notes',
            drawerIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            title: 'Tasks',
            drawerIcon: ({ color, size }) => <Ionicons name="checkbox-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Instagram"
          component={InstagramScreen}
          options={{
            title: 'Instagram',
            drawerIcon: ({ color, size }) => <Ionicons name="logo-instagram" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="Workout"
          component={WorkoutNavigator}
          options={{
            title: 'Workout',
            drawerIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} />,
          }}
        />
        <Drawer.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'History',
            drawerIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // Setup global error handler to suppress Firestore assertion errors
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  // Enable freezing offscreen screens to reduce JS work during navigation
  useEffect(() => {
    try {
      enableFreeze(true);
    } catch (_) {}
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
  },
  themeLabel: {
    fontSize: 16,
  },
});
