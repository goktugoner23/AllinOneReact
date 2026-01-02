import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { startWorkout, deleteWorkout } from '@features/workout/store/workoutSlice';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  IconButton,
  EmptyState,
  Badge,
  ProgressBar,
  SimpleSelect,
  Dialog,
  AlertDialog,
} from '@shared/components/ui';
import { workoutService } from '@features/workout/services/workout';
import { Program } from '@features/workout/types/Workout';
import { useColors, spacing, textStyles } from '@shared/theme';

type Period = 'ALL' | 'DAY_1' | 'DAYS_7' | 'DAYS_30' | 'DAYS_90';

const PERIOD_OPTIONS = [
  { label: 'Last Day', value: 'DAY_1' },
  { label: 'Last 7 Days', value: 'DAYS_7' },
  { label: 'Last 30 Days', value: 'DAYS_30' },
  { label: 'Last 90 Days', value: 'DAYS_90' },
  { label: 'All Time', value: 'ALL' },
];

export default function WorkoutExercise() {
  const colors = useColors();
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.workout.activeSession);
  const history = useAppSelector((s) => s.workout.history);
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [search, setSearch] = React.useState('');
  const [period, setPeriod] = React.useState<Period>('ALL');
  const [selectedWorkout, setSelectedWorkout] = React.useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{ visible: boolean; workoutId: number | null }>({
    visible: false,
    workoutId: null,
  });

  React.useEffect(() => {
    workoutService.getPrograms().then(setPrograms);
    // initial history load
    // lazy import to avoid circular
    import('../../store/workoutSlice').then((m) => dispatch(m.loadHistory()));
  }, []);

  // Filter workouts based on search and period
  const filteredHistory = history
    .filter((w) => (search ? (w.programName || 'Custom').toLowerCase().includes(search.toLowerCase()) : true))
    .filter((w) => {
      if (period === 'ALL') return true;
      const d = new Date(w.endTime).getTime();
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      const map: Record<Period, number> = {
        ALL: Number.NEGATIVE_INFINITY,
        DAY_1: now - day,
        DAYS_7: now - 7 * day,
        DAYS_30: now - 30 * day,
        DAYS_90: now - 90 * day,
      };
      return d >= map[period];
    });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing[3], gap: spacing[3], paddingBottom: spacing[6] }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Control Center Card */}
      <Card>
        <CardHeader>
          <Text style={[textStyles.h4, { color: colors.foreground }]}>Exercise</Text>
          <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Control Center</Text>
        </CardHeader>
        <CardContent>
          {active ? (
            <View style={{ gap: spacing[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Badge variant="info">Active</Badge>
                <Text style={[textStyles.body, { color: colors.foreground }]}>{active.programName || 'Custom'}</Text>
              </View>
              <Button variant="primary" fullWidth onPress={() => setSelectorOpen(true)}>
                Start Workout
              </Button>
            </View>
          ) : (
            <Button variant="primary" fullWidth onPress={() => setSelectorOpen(true)}>
              Start Workout
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Program Selector Dialog */}
      <Dialog visible={selectorOpen} onClose={() => setSelectorOpen(false)} title="Select Program">
        <View style={{ gap: spacing[2], marginBottom: spacing[4] }}>
          {programs.map((p) => (
            <Card
              key={p.id}
              variant="outlined"
              padding="sm"
              onPress={() => {
                setSelectorOpen(false);
                dispatch(startWorkout(p));
                nav.navigate('Stopwatch' as never);
              }}
            >
              <CardContent>
                <Text style={[textStyles.label, { color: colors.foreground }]}>{p.name}</Text>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
                  {p.exercises.length} exercises
                </Text>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            fullWidth
            onPress={() => {
              setSelectorOpen(false);
              dispatch(startWorkout(undefined));
              nav.navigate('Stopwatch' as never);
            }}
          >
            Start Custom Workout
          </Button>
        </View>
      </Dialog>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <Text style={[textStyles.h4, { color: colors.foreground }]}>Filter Workouts</Text>
        </CardHeader>
        <CardContent style={{ gap: spacing[3] }}>
          <TextInput
            mode="outlined"
            placeholder="Search by program name"
            value={search}
            onChangeText={setSearch}
            style={{ backgroundColor: colors.surface }}
          />
          <SimpleSelect
            label="Time Period"
            options={PERIOD_OPTIONS}
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
          />
        </CardContent>
      </Card>

      {/* Workouts List Card */}
      <Card>
        <CardHeader>
          <Text style={[textStyles.h4, { color: colors.foreground }]}>Workouts</Text>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <EmptyState
              icon="barbell-outline"
              title="No workouts yet"
              description="Start a workout to see your history here."
              style={{ paddingVertical: spacing[6] }}
            />
          ) : (
            <View style={{ gap: spacing[2] }}>
              {filteredHistory.map((w) => (
                <Card key={w.id} variant="outlined" padding="sm" onPress={() => setSelectedWorkout(w)}>
                  <CardContent>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[textStyles.label, { color: colors.foreground }]}>
                          {w.programName || 'Custom'}
                        </Text>
                        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
                          {new Date(w.endTime).toLocaleString()} - {Math.round(w.durationMs / 60000)} min
                        </Text>
                      </View>
                      <IconButton
                        icon="trash-outline"
                        size="sm"
                        variant="ghost"
                        onPress={() => setConfirmDelete({ visible: true, workoutId: w.id })}
                      />
                    </View>
                    <View style={{ marginTop: spacing[2] }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Completion</Text>
                        <Text style={[textStyles.bodySmall, { color: colors.foreground }]}>
                          {Math.round(w.completionPercentage)}%
                        </Text>
                      </View>
                      <ProgressBar
                        progress={w.completionPercentage}
                        variant={
                          w.completionPercentage >= 80
                            ? 'success'
                            : w.completionPercentage >= 50
                              ? 'warning'
                              : 'default'
                        }
                        size="sm"
                      />
                      <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
                        Sets: {w.totalSetsCompleted}/{w.totalSetsPlanned}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        visible={confirmDelete.visible}
        title="Delete Workout"
        description="Are you sure you want to delete this workout? This action cannot be undone."
        onClose={() => setConfirmDelete({ visible: false, workoutId: null })}
        onConfirm={async () => {
          if (confirmDelete.workoutId != null) {
            await dispatch(deleteWorkout(confirmDelete.workoutId));
          }
          setConfirmDelete({ visible: false, workoutId: null });
        }}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Workout Details Dialog */}
      <Dialog
        visible={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout?.programName || 'Custom'}
      >
        {selectedWorkout && (
          <View style={{ gap: spacing[3] }}>
            <View>
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Time</Text>
              <Text style={[textStyles.body, { color: colors.foreground }]}>
                {new Date(selectedWorkout.startTime).toLocaleString()} -{' '}
                {new Date(selectedWorkout.endTime).toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[4] }}>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Duration</Text>
                <Text style={[textStyles.body, { color: colors.foreground }]}>
                  {Math.round(selectedWorkout.durationMs / 60000)} min
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Active Time</Text>
                <Text style={[textStyles.body, { color: colors.foreground }]}>
                  {Math.round(selectedWorkout.activeDurationMs / 60000)} min
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[4] }}>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Completed</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Badge
                    variant={
                      selectedWorkout.completionPercentage >= 80
                        ? 'success'
                        : selectedWorkout.completionPercentage >= 50
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {Math.round(selectedWorkout.completionPercentage)}%
                  </Badge>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Total Volume</Text>
                <Text style={[textStyles.body, { color: colors.foreground }]}>
                  {Math.round(selectedWorkout.totalVolume)} kg
                </Text>
              </View>
            </View>
            <View>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Exercises</Text>
              {selectedWorkout.exercises.map((ex: any, idx: number) => (
                <Card key={idx} variant="filled" padding="sm" style={{ marginBottom: spacing[2] }}>
                  <CardContent>
                    <Text style={[textStyles.label, { color: colors.foreground }]}>{ex.exerciseName}</Text>
                    <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
                      Sets: {ex.sets?.length || 0}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        )}
      </Dialog>
    </ScrollView>
  );
}
