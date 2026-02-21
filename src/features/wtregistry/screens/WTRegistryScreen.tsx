import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '@shared/theme';
import { StudentsTab } from '@features/wtregistry/screens/StudentsTab';
import { RegisterTab } from '@features/wtregistry/screens/RegisterTab';
import { LessonsTab } from '@features/wtregistry/screens/LessonsTab';
import { SeminarsTab } from '@features/wtregistry/screens/SeminarsTab';

const Tab = createBottomTabNavigator();

export function WTRegistryScreen() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Register') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'Lessons') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Seminars') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foregroundSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Students" component={StudentsTab} />
      <Tab.Screen name="Register" component={RegisterTab} />
      <Tab.Screen name="Lessons" component={LessonsTab} />
      <Tab.Screen name="Seminars" component={SeminarsTab} />
    </Tab.Navigator>
  );
}
