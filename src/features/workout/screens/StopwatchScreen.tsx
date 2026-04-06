import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Card, CardHeader, CardContent, Button, EmptyState, Badge, ProgressBar } from '@shared/components/ui';
import { useColors, spacing, textStyles } from '@shared/theme';
import { workoutService } from '@features/workout/services/workout';
import {
  CompletedSet,
  CompletedWorkout,
  SessionExercise,
  WorkoutExercise,
  WorkoutSession,
  calculateCompletionPercentage,
} from '@features/workout/types/Workout';

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export default function StopwatchScreen() {
  const colors = useColors();
  const nav = useNavigation<any>();

  // Session state
  const [session, setSession] = useState<WorkoutSession | null>(null);

  // Stopwatch state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [totalPausedMs, setTotalPausedMs] = useState(0);

  const startTimeMsRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active session from AsyncStorage on mount
  useFocusEffect(
    useCallback(() => {
      workoutService.getActiveSession().then((s) => {
        if (s) {
          setSession(s);
          // Start stopwatch if not already running
          if (!startTimeMsRef.current) {
            startTimeMsRef.current = Date.now();
            setIsRunning(true);
            setIsPaused(false);
          }
        }
      });
    }, []),
  );

  // Tick interval -- update elapsed every second
  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      if (!isRunning || isPaused || startTimeMsRef.current == null) return;
      setElapsedMs(Date.now() - startTimeMsRef.current);
    }, 1000);
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isRunning, isPaused]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      if (session) workoutService.saveActiveSession(session);
    }, 5000);
    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [session]);

  const handlePause = () => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    pauseStartedAtRef.current = Date.now();
  };

  const handleResume = () => {
    if (!isRunning || !isPaused) return;
    const pausedFor = pauseStartedAtRef.current ? Date.now() - pauseStartedAtRef.current : 0;
    setTotalPausedMs((prev) => prev + pausedFor);
    pauseStartedAtRef.current = null;
    setIsPaused(false);
  };

  const handleCompleteSet = (exerciseId: number, setNumber: number, reps: number = 0, weight: number = 0) => {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        if (ex.completedSets.some((s) => s.setNumber === setNumber)) return ex;
        const cs: CompletedSet = { setNumber, actualReps: reps, actualWeight: weight, completedAt: new Date().toISOString() };
        const completedSets = [...ex.completedSets, cs];
        return { ...ex, completedSets, isCompleted: completedSets.length >= ex.targetSets.length };
      });
      return { ...prev, exercises };
    });
  };

  const handleUncompleteSet = (exerciseId: number, setNumber: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const completedSets = ex.completedSets.filter((s) => s.setNumber !== setNumber);
        return { ...ex, completedSets, isCompleted: false };
      });
      return { ...prev, exercises };
    });
  };

  const handleFinishWorkout = async () => {
    if (!session) return;
    const endTime = new Date().toISOString();
    const activeMs = Math.max(0, elapsedMs - totalPausedMs);
    const exercises: WorkoutExercise[] = session.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup ?? null,
      sets: ex.completedSets.map((cs) => ({
        setNumber: cs.setNumber,
        reps: cs.actualReps,
        weight: cs.actualWeight,
        completed: true,
      })),
    }));
    const totalVolume = session.exercises.reduce(
      (sum, e) => sum + e.completedSets.reduce((s, c) => s + c.actualWeight * c.actualReps, 0),
      0,
    );
    const completed: CompletedWorkout = {
      id: session.id,
      programId: session.programId ?? null,
      programName: session.programName ?? null,
      startTime: session.startTime,
      endTime,
      durationMs: elapsedMs,
      activeDurationMs: activeMs,
      exercises,
      notes: null,
      completionPercentage: calculateCompletionPercentage(session.exercises),
      totalSetsCompleted: session.exercises.reduce((s, e) => s + e.completedSets.length, 0),
      totalSetsPlanned: session.exercises.reduce((s, e) => s + e.targetSets.length, 0),
      totalVolume,
    };
    await workoutService.saveCompletedWorkout(completed);
    await workoutService.clearActiveSession();
    nav.navigate('WorkoutTabs' as never);
  };

  if (!session) {
    return (
      <View style={{ flex: 1, padding: spacing[4], backgroundColor: colors.background }}>
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
  const totalSets = session.exercises.reduce((acc, ex) => acc + ex.targetSets.length, 0);
  const completedSets = session.exercises.reduce((acc, ex) => acc + ex.completedSets.length, 0);
  const overallProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <View style={{ flex: 1, padding: spacing[3], gap: spacing[3], backgroundColor: colors.background }}>
      {/* Stopwatch Card */}
      <Card>
        <CardHeader>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[textStyles.h4, { color: colors.foreground }]}>
                {session.programName || 'Custom Workout'}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Stopwatch</Text>
            </View>
            <Badge variant={isPaused ? 'warning' : 'success'}>
              {isPaused ? 'Paused' : 'Active'}
            </Badge>
          </View>
        </CardHeader>
        <CardContent>
          <Text
            style={{
              fontSize: 48,
              fontWeight: '700',
              textAlign: 'center',
              color: colors.primary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatMs(elapsedMs)}
          </Text>

          {/* Overall Progress */}
          <View style={{ marginVertical: spacing[3] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] }}>
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Overall Progress</Text>
              <Text style={[textStyles.bodySmall, { color: colors.foreground }]}>
                {completedSets}/{totalSets} sets
              </Text>
            </View>
            <ProgressBar
              progress={overallProgress}
              variant={overallProgress >= 80 ? 'success' : overallProgress >= 50 ? 'warning' : 'default'}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[3] }}>
            {isPaused ? (
              <Button variant="primary" onPress={handleResume}>
                Resume
              </Button>
            ) : (
              <Button variant="outline" onPress={handlePause}>
                Pause
              </Button>
            )}
          </View>
        </CardContent>
      </Card>

      {/* Exercises List */}
      <FlatList
        data={session.exercises}
        keyExtractor={(item) => `${item.exerciseId}`}
        renderItem={({ item }) => {
          const progress = item.targetSets.length > 0 ? (item.completedSets.length / item.targetSets.length) * 100 : 0;
          const allCompleted = item.completedSets.length === item.targetSets.length && item.targetSets.length > 0;
          return (
            <Card style={{ marginVertical: spacing[1.5] }}>
              <CardHeader>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[textStyles.label, { color: colors.foreground }]}>{item.exerciseName}</Text>
                    {item.muscleGroup && (
                      <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>{item.muscleGroup}</Text>
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
                  style={{ marginBottom: spacing[3] }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {item.targetSets.map((set) => {
                    const done = item.completedSets.some((cs) => cs.setNumber === set.setNumber);
                    return (
                      <Button
                        key={set.setNumber}
                        size="sm"
                        variant={done ? 'primary' : 'outline'}
                        onPress={() =>
                          done
                            ? handleUncompleteSet(item.exerciseId, set.setNumber)
                            : handleCompleteSet(item.exerciseId, set.setNumber, set.targetReps, set.targetWeight)
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
        contentContainerStyle={{ paddingBottom: spacing[20] }}
      />

      {/* Finish Button */}
      <View style={{ padding: spacing[2] }}>
        <Button
          variant="primary"
          fullWidth
          onPress={handleFinishWorkout}
        >
          Finish Workout
        </Button>
      </View>
    </View>
  );
}
