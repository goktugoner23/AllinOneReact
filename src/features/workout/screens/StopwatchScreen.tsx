import React, { useEffect } from 'react';
import { View, FlatList } from 'react-native';
import { Text, Button, Card, ProgressBar } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { startStopwatch, pause, resume, tick, finishWorkout, completeSet, uncompleteSet, saveProgress } from '@features/workout/store/workoutSlice';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export default function StopwatchScreen() {
  const dispatch = useAppDispatch();
  const { activeSession, stopwatch } = useAppSelector((s) => s.workout);

  useEffect(() => {
    if (!stopwatch.isRunning) dispatch(startStopwatch());
  }, [dispatch]);

  useEffect(() => {
    const id = setInterval(() => dispatch(tick()), 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  useEffect(() => {
    const id = setInterval(() => dispatch(saveProgress()), 5000);
    return () => clearInterval(id);
  }, [dispatch]);

  if (!activeSession) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text variant="titleMedium">No active workout</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12, gap: 12 }}>
      <Card>
        <Card.Title title={activeSession.programName || 'Custom Workout'} subtitle="Stopwatch" />
        <Card.Content>
          <Text variant="displaySmall" style={{ textAlign: 'center', marginVertical: 8 }}>
            {formatMs(stopwatch.elapsedMs)}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            {stopwatch.isPaused ? (
              <Button mode="contained" onPress={() => dispatch(resume())}>Resume</Button>
            ) : (
              <Button mode="contained" onPress={() => dispatch(pause())}>Pause</Button>
            )}
          </View>
        </Card.Content>
      </Card>

      <FlatList
        data={activeSession.exercises}
        keyExtractor={(item) => `${item.exerciseId}`}
        renderItem={({ item }) => {
          const progress = item.targetSets.length > 0 ? item.completedSets.length / item.targetSets.length : 0;
          return (
            <Card style={{ marginVertical: 6 }}>
              <Card.Title title={item.exerciseName} subtitle={item.muscleGroup || undefined} />
              <Card.Content>
                <ProgressBar progress={progress} style={{ marginVertical: 6 }} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {item.targetSets.map((set) => {
                    const done = item.completedSets.some((cs) => cs.setNumber === set.setNumber);
                    return (
                      <Button
                        key={set.setNumber}
                        compact
                        mode={done ? 'contained' : 'outlined'}
                        onPress={() =>
                          done
                            ? dispatch(uncompleteSet({ exerciseId: item.exerciseId, setNumber: set.setNumber }))
                            : dispatch(completeSet({ exerciseId: item.exerciseId, setNumber: set.setNumber, reps: set.targetReps, weight: set.targetWeight }))
                        }
                      >
                        S{set.setNumber}
                      </Button>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          );
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      <View style={{ padding: 8 }}>
        <Button mode="contained" onPress={() => dispatch(finishWorkout(undefined))}>Finish Workout</Button>
      </View>
    </View>
  );
}


