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
} from '@react-navigation/drawer';
import { Provider } from 'react-redux';
import store from './src/store';
import { TransactionHomeScreen } from './src/screens/TransactionHomeScreen';
import { InvestmentsScreen } from './src/screens/InvestmentsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { WTRegistryScreen } from './src/screens/WTRegistryScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Provider as PaperProvider,
  useTheme,
  Switch,
  MD3DarkTheme,
  MD3LightTheme,
} from 'react-native-paper';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function BottomTabs() {
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

function CustomDrawerContent(props: any) {
  const { dark, toggleTheme } = props;
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label={() => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Text>Dark Mode</Text>
            <Switch value={dark} onValueChange={toggleTheme} />
          </View>
        )}
        onPress={() => {}}
        style={{ marginTop: 32, borderTopWidth: 1, borderColor: '#eee' }}
      />
    </DrawerContentScrollView>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const theme = useMemo(() => (dark ? MD3DarkTheme : MD3LightTheme), [dark]);

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Drawer.Navigator
            drawerContent={props => (
              <CustomDrawerContent
                {...props}
                dark={dark}
                toggleTheme={() => setDark(d => !d)}
              />
            )}
          >
            <Drawer.Screen
              name="Main"
              component={BottomTabs}
              options={{ headerShown: false }}
            />
            <Drawer.Screen name="Home" component={TransactionHomeScreen} />
            <Drawer.Screen name="Investments" component={InvestmentsScreen} />
            <Drawer.Screen name="Reports" component={ReportsScreen} />
            <Drawer.Screen 
              name="WT Registry" 
              component={WTRegistryScreen}
              options={{
                drawerIcon: ({ color, size }) => (
                  <Ionicons name="people-outline" size={size} color={color} />
                ),
              }}
            />
            <Drawer.Screen 
              name="Calendar" 
              component={CalendarScreen}
              options={{
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
