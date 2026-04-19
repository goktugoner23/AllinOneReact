import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import WorkoutPrograms from './tabs/WorkoutPrograms';
import WorkoutExercise from './tabs/WorkoutExercise';
import WorkoutStats from './tabs/WorkoutStats';
import { DietLogScreen } from '@features/diet';
import { useColors } from '@shared/theme';

const Tab = createBottomTabNavigator();

export default function WorkoutTabs() {
  const colors = useColors();

  return (
    <Tab.Navigator
      initialRouteName="Exercise"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Exercise'
              ? 'barbell-outline'
              : route.name === 'Program'
                ? 'list-outline'
                : route.name === 'Stats'
                  ? 'stats-chart-outline'
                  : 'restaurant-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foregroundMuted,
      })}
    >
      <Tab.Screen name="Exercise" component={WorkoutExercise} />
      <Tab.Screen name="Program" component={WorkoutPrograms} />
      <Tab.Screen name="Stats" component={WorkoutStats} />
      <Tab.Screen name="Diet" component={DietLogScreen} />
    </Tab.Navigator>
  );
}
