import React, { useEffect, useRef } from 'react';
import { View, FlatList } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import {
  startStopwatch,
  pause,
  resume,
  tick,
  finishWorkout,
  completeSet,
  uncompleteSet,
  saveProgress,
} from '@features/workout/store/workoutSlice';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardHeader, CardContent, Button, EmptyState, Badge, ProgressBar } from '@shared/components/ui';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export default function StopwatchScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { activeSession, stopwatch } = useAppSelector((s) => s.workout);
  const nav = useNavigation<any>();
  const startedRef = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!stopwatch.isRunning) {
        dispatch(startStopwatch());
      }
      return () => {};
    }, [dispatch, stopwatch.isRunning]),
  );

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
      <View style={{ flex: 1, padding: 16 }}>
        <EmptyState
          icon="barbell-outline"
          title="No active workout"
          description="Start a workout from the Exercise tab to begin tracking."
          actionLabel="Go to Exercise"
          onAction={() => nav.navigate('WorkoutTabs' as never)}
        />
      </View>
    );
  }

  // Calculate overall progress
  const totalSets = activeSession.exercises.reduce((acc, ex) => acc + ex.targetSets.length, 0);
  const completedSets = activeSession.exercises.reduce((acc, ex) => acc + ex.completedSets.length, 0);
  const overallProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={{ flex: 1, padding: 12, gap: 12 }}>
      {/* Stopwatch Card */}
      <Card>
        <CardHeader>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
                {activeSession.programName || 'Custom Workout'}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Stopwatch
              </Text>
            </View>
            <Badge variant={stopwatch.isPaused ? 'warning' : 'success'}>
              {stopwatch.isPaused ? 'Paused' : 'Active'}
            </Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text
            style={{
              fontSize: 48,
              fontWeight: '700',
              textAlign: 'center',
              color: theme.colors.primary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatMs(stopwatch.elapsedMs)}
          </Text>

          {/* Overall Progress */}
          <View style={{ marginVertical: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Overall Progress
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                {completedSets}/{totalSets} sets
              </Text>
            </View>
            <ProgressBar
              progress={overallProgress}
              variant={overallProgress >= 80 ? 'success' : overallProgress >= 50 ? 'warning' : 'default'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            {stopwatch.isPaused ? (
              <Button variant="primary" onPress={() => dispatch(resume())}>
                Resume
              </Button>
            ) : (
              <Button variant="outline" onPress={() => dispatch(pause())}>
                Pause
              </Button>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Exercises List */}
      <FlatList
        data={activeSession.exercises}
        keyExtractor={(item) => `${item.exerciseId}`}
        renderItem={({ item }) => {
          const progress = item.targetSets.length > 0 ? (item.completedSets.length / item.targetSets.length) * 100 : 0;
          const allCompleted = item.completedSets.length === item.targetSets.length && item.targetSets.length > 0;
          return (
            <Card style={{ marginVertical: 6 }}>
              <CardHeader>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontWeight: '600', color: theme.colors.onSurface }}>{item.exerciseName}</Text>
                    {item.muscleGroup && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {item.muscleGroup}
                      </Text>
                    )}
                  </View>
                  {allCompleted && <Badge variant="success">Done</Badge>}
                </View>
              </CardHeader>
              <CardContent>
                <ProgressBar
                  progress={progress}
                  variant={progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'default'}
                  size="sm"
                  style={{ marginBottom: 12 }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {item.targetSets.map((set) => {
                    const done = item.completedSets.some((cs) => cs.setNumber === set.setNumber);
                    return (
                      <Button
                        key={set.setNumber}
                        size="sm"
                        variant={done ? 'primary' : 'outline'}
                        onPress={() =>
                          done
                            ? dispatch(uncompleteSet({ exerciseId: item.exerciseId, setNumber: set.setNumber }))
                            : dispatch(
                                completeSet({
                                  exerciseId: item.exerciseId,
                                  setNumber: set.setNumber,
                                  reps: set.targetReps,
                                  weight: set.targetWeight,
                                }),
                              )
                        }
                      >
                        {`S${set.setNumber}`}
                      </Button>
                    );
                  })}
                </View>
              </CardContent>
            </Card>
          );
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Finish Button */}
      <View style={{ padding: 8 }}>
        <Button
          variant="primary"
          fullWidth
          onPress={async () => {
            await dispatch(finishWorkout(undefined));
            nav.navigate('WorkoutTabs' as never);
          }}
        >
          Finish Workout
        </Button>
      </View>
    </View>
  );
}
