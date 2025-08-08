import React from 'react';
import { View } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { startWorkout } from '@features/workout/store/workoutSlice';

export default function WorkoutDashboard() {
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.workout.activeSession);

  return (
    <View style={{ flex: 1, padding: 12, gap: 12 }}>
      <Card>
        <Card.Title title="Workout" subtitle="Dashboard" />
        <Card.Content>
          {active ? (
            <>
              <Text>Active session: {active.programName || 'Custom'}</Text>
              <Button style={{ marginTop: 8 }} mode="contained" onPress={() => nav.navigate('Stopwatch')}>Open Stopwatch</Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => { dispatch(startWorkout(undefined)); nav.navigate('Stopwatch'); }}>Start Workout</Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}


