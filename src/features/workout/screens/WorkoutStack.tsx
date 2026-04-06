import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WorkoutTabs from './WorkoutTabs';
import StopwatchScreen from './StopwatchScreen';
import { useColors } from '@shared/theme';

export type WorkoutStackParamList = {
  WorkoutTabs: undefined;
  Stopwatch: undefined;
};

const Stack = createStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  const colors = useColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="WorkoutTabs" component={WorkoutTabs} />
      <Stack.Screen name="Stopwatch" component={StopwatchScreen} />
    </Stack.Navigator>
  );
}
