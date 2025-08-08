import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from 'react-native-paper';
import WorkoutPrograms from './tabs/WorkoutPrograms';
import WorkoutExercise from './tabs/WorkoutExercise';
import WorkoutStats from './tabs/WorkoutStats';
import { useAppDispatch } from '@shared/store/hooks';
import { initializeSession } from '@features/workout/store/workoutSlice';

const Tab = createBottomTabNavigator();

export default function WorkoutTabs() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeSession());
  }, [dispatch]);

  return (
    <Tab.Navigator
      initialRouteName="Exercise"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === 'Exercise'
              ? 'barbell-outline'
              : route.name === 'Program'
              ? 'list-outline'
              : 'stats-chart-outline';
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen name="Exercise" component={WorkoutExercise} />
      <Tab.Screen name="Program" component={WorkoutPrograms} />
      <Tab.Screen name="Stats" component={WorkoutStats} />
    </Tab.Navigator>
  );
}


