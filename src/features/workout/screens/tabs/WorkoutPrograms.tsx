import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { workoutService } from '@features/workout/services/workout';
import { Program } from '@features/workout/types/Workout';
import { useAppDispatch } from '@shared/store/hooks';
import { startWorkout } from '@features/workout/store/workoutSlice';
import { useNavigation } from '@react-navigation/native';

export default function WorkoutPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const dispatch = useAppDispatch();
  const nav = useNavigation<any>();

  useEffect(() => {
    workoutService.getPrograms().then(setPrograms);
  }, []);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={programs}
        keyExtractor={(p) => p.id.toString()}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <Card.Title title={item.name} subtitle={`${item.exercises.length} exercises`} />
            <Card.Actions>
              <Button onPress={() => { dispatch(startWorkout(item)); nav.navigate('Stopwatch'); }}>Start</Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No programs yet.</Text>}
      />
    </View>
  );
}


