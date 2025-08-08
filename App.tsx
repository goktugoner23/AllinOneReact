/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Provider } from 'react-redux';
import store from '@shared/store/rootStore';
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
import {
  Provider as PaperProvider,
  useTheme,
  Switch,
  Divider,
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import { lightTheme, darkTheme } from '@theme';

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

// Transactions Dashboard with bottom tabs (Home, Investments, Reports)
function TransactionsDashboard() {
  const theme = useTheme();
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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
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

interface CustomDrawerContentProps extends DrawerContentComponentProps {
  dark: boolean;
  toggleTheme: () => void;
}

function CustomDrawerContent(props: CustomDrawerContentProps) {
  const { dark, toggleTheme, ...drawerProps } = props;
  const theme = useTheme();
  
  return (
    <DrawerContentScrollView {...drawerProps} style={styles.drawerContent}>
      <View style={styles.drawerHeader}>
        <Text style={[styles.drawerTitle, { color: theme.colors.onSurface }]}>
          AllInOne App
        </Text>
      </View>
      <Divider />
      <DrawerItemList {...drawerProps} />
      <Divider style={styles.divider} />
      <DrawerItem
        label="Settings"
        icon={({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <View style={styles.themeToggle}>
        <Text style={[styles.themeLabel, { color: theme.colors.onSurface }]}>
          Dark Mode
        </Text>
        <Switch value={dark} onValueChange={toggleTheme} />
      </View>
    </DrawerContentScrollView>
  );
}

export const ThemeContext = createContext({
  theme: lightTheme,
  setTheme: (theme: typeof lightTheme) => {},
});

export function useAppTheme() {
  return useContext(ThemeContext);
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

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

  // Balance preloading removed - will load when needed

  return (
    <Provider store={store}>
      <ThemeContext.Provider value={{ theme, setTheme: (t) => setIsDark(t.mode === 'dark') }}>
        <PaperProvider
          theme={{
            ...(isDark ? MD3DarkTheme : MD3LightTheme),
            colors: {
              ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
              primary: theme.primary,
              secondary: theme.accent,
              background: theme.background,
              surface: theme.surface,
              error: theme.expense,
              onSurface: theme.text,
              onBackground: theme.text,
            },
          }}
        >
          <NavigationContainer
            documentTitle={{ enabled: false }}
            theme={{
            dark: isDark,
            colors: {
              background: theme.background,
              card: theme.surface,
              text: theme.text,
              border: theme.border,
              primary: theme.primary,
              notification: theme.accent
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
              drawerContent={(props) => (
                <CustomDrawerContent
                  {...props}
                  dark={isDark}
                  toggleTheme={() => setIsDark(d => !d)}
                />
              )}
              screenOptions={{
                drawerStyle: {
                  backgroundColor: theme.surface,
                  width: 280,
                },
                headerStyle: {
                  backgroundColor: theme.primary,
                },
                headerTintColor: '#FFFFFF',
                drawerActiveTintColor: theme.primary,
                drawerInactiveTintColor: theme.text,
              }}
            >
              <Drawer.Screen
                name="Transactions"
                component={TransactionsDashboard}
                options={{
                  title: 'Transactions',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="card-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="WT Registry"
                component={WTRegistryScreen}
                options={{
                  title: 'WT Registry',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="school-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="Calendar"
                component={CalendarScreen}
                options={{
                  title: 'Calendar',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="calendar-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="History"
                component={HistoryScreen}
                options={{
                  title: 'History',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="time-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="Notes"
                component={NotesStack}
                options={{
                  title: 'Notes',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="document-text-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                  title: 'Tasks',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="checkbox-outline" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="Instagram"
                component={InstagramScreen}
                options={{
                  title: 'Instagram',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="logo-instagram" size={size} color={color} />
                  ),
                }}
              />
              <Drawer.Screen
                name="Workout"
                component={WorkoutTabs}
                options={{
                  title: 'Workout',
                  drawerIcon: ({ color, size }) => (
                    <Ionicons name="barbell-outline" size={size} color={color} />
                  ),
                }}
              />
            </Drawer.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </ThemeContext.Provider>
    </Provider>
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