/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Provider } from 'react-redux';
import store from './src/store';
import { TransactionHomeScreen } from './src/screens/TransactionHomeScreen';
import { InvestmentsScreen } from './src/screens/InvestmentsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { WTRegistryScreen } from './src/screens/WTRegistryScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Provider as PaperProvider,
  useTheme,
  Switch,
  MD3DarkTheme,
  MD3LightTheme,
  Divider,
} from 'react-native-paper';

// Initialize Firebase
import './src/config/firebase';

// Initialize balance preloader
import BalancePreloader from './src/services/BalancePreloader';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Transactions Dashboard with bottom tabs (Home, Investments, Reports)
function TransactionsDashboard() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
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
      <Tab.Screen name="Investments" component={InvestmentsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
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

export default function App() {
  const [dark, setDark] = useState(false);
  const theme = useMemo(() => (dark ? MD3DarkTheme : MD3LightTheme), [dark]);

  // Start balance preloader when app launches
  React.useEffect(() => {
    const preloader = BalancePreloader.getInstance();
    preloader.preloadBalance().catch(console.error);
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Drawer.Navigator
            initialRouteName="Transactions"
            drawerContent={(props) => (
              <CustomDrawerContent
                {...props}
                dark={dark}
                toggleTheme={() => setDark(d => !d)}
              />
            )}
            screenOptions={{
              drawerStyle: {
                backgroundColor: theme.colors.surface,
                width: 280,
              },
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.onPrimary,
              drawerActiveTintColor: theme.colors.primary,
              drawerInactiveTintColor: theme.colors.onSurface,
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
          </Drawer.Navigator>
        </NavigationContainer>
      </PaperProvider>
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