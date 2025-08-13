import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, Menu, Portal as PaperPortal, Modal as PaperModal, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@shared/store/hooks';
import { startWorkout, deleteWorkout } from '@features/workout/store/workoutSlice';
import { DeleteConfirmationDialog } from '@shared/components/ui';
import { Portal, Modal, Card as PCard } from 'react-native-paper';
import { workoutService } from '@features/workout/services/workout';
import { Program } from '@features/workout/types/Workout';

export default function WorkoutExercise() {
  const nav = useNavigation<any>();
  const dispatch = useAppDispatch();
  const active = useAppSelector((s) => s.workout.activeSession);
  const history = useAppSelector((s) => s.workout.history);
  const [selectorOpen, setSelectorOpen] = React.useState(false);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [search, setSearch] = React.useState('');
  type Period = 'ALL' | 'DAY_1' | 'DAYS_7' | 'DAYS_30' | 'DAYS_90';
  const [period, setPeriod] = React.useState<Period>('ALL');
  const [periodMenuVisible, setPeriodMenuVisible] = React.useState(false);
  const [selectedWorkout, setSelectedWorkout] = React.useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{ visible: boolean; workoutId: number | null }>({ visible: false, workoutId: null });

  React.useEffect(() => {
    workoutService.getPrograms().then(setPrograms);
    // initial history load
    // lazy import to avoid circular
    import('../../store/workoutSlice').then(m => dispatch(m.loadHistory()));
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Card.Title title="Exercise" subtitle="Control Center" />
        <Card.Content>
          {active ? (
            <>
              <Text>Active session: {active.programName || 'Custom'}</Text>
              <Button style={{ marginTop: 8 }} mode="contained" onPress={() => setSelectorOpen(true)}>Start Workout</Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => setSelectorOpen(true)}>Start Workout</Button>
          )}
        </Card.Content>
      </Card>
      <Portal>
        <Modal visible={selectorOpen} onDismiss={() => setSelectorOpen(false)} contentContainerStyle={{ backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12, maxHeight: '70%' }}>
          <Text style={{ marginBottom: 8 }} variant="titleMedium">Select Program</Text>
          <View style={{ maxHeight: 320 }}>
            {programs.map((p) => (
              <PCard key={p.id} style={{ marginBottom: 8 }} onPress={() => { setSelectorOpen(false); dispatch(startWorkout(p)); nav.navigate('Stopwatch' as never); }}>
                <PCard.Title title={p.name} subtitle={`${p.exercises.length} exercises`} />
              </PCard>
            ))}
            <Button onPress={() => { setSelectorOpen(false); dispatch(startWorkout(undefined)); nav.navigate('Stopwatch' as never); }}>
              Start Custom Workout
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Filters */}
      <Card style={{ backgroundColor: '#fff' }}>
        <Card.Title title="Filter Workouts" titleStyle={{ fontWeight: '700', color: '#000' }} />
        <Card.Content>
          <TextInput
            mode="outlined"
            placeholder="Search by program name"
            value={search}
            onChangeText={setSearch}
            style={{ backgroundColor: '#fff', marginBottom: 8 }}
          />
          <View style={{ alignItems: 'flex-start' }}>
            <Menu
              visible={periodMenuVisible}
              onDismiss={() => setPeriodMenuVisible(false)}
              anchor={
                <Button mode="outlined" onPress={() => setPeriodMenuVisible(true)}>
                  {period === 'ALL' ? 'All Time' : period === 'DAY_1' ? 'Last Day' : period === 'DAYS_7' ? 'Last 7 Days' : period === 'DAYS_30' ? 'Last 30 Days' : 'Last 90 Days'}
                </Button>
              }
            >
              <Menu.Item onPress={() => { setPeriod('DAY_1'); setPeriodMenuVisible(false); }} title="Last Day" />
              <Menu.Item onPress={() => { setPeriod('DAYS_7'); setPeriodMenuVisible(false); }} title="Last 7 Days" />
              <Menu.Item onPress={() => { setPeriod('DAYS_30'); setPeriodMenuVisible(false); }} title="Last 30 Days" />
              <Menu.Item onPress={() => { setPeriod('DAYS_90'); setPeriodMenuVisible(false); }} title="Last 90 Days" />
              <Menu.Item onPress={() => { setPeriod('ALL'); setPeriodMenuVisible(false); }} title="All Time" />
            </Menu>
          </View>
        </Card.Content>
      </Card>

      {/* Workouts list */}
      <Card style={{ backgroundColor: '#fff' }}>
        <Card.Title title="Workouts" titleStyle={{ fontWeight: '700', color: '#000' }} />
        <Card.Content>
          {history
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
            })
            .map((w) => (
              <Card key={w.id} style={{ marginBottom: 8, backgroundColor: '#fff' }} onPress={() => setSelectedWorkout(w)}>
                <Card.Title
                  title={w.programName || 'Custom'}
                  subtitle={`${new Date(w.endTime).toLocaleString()} • ${Math.round(w.durationMs / 60000)} min`}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="delete"
                      size={20}
                      onPress={() => setConfirmDelete({ visible: true, workoutId: w.id })}
                    />
                  )}
                />
                <Card.Content>
                  <Text style={{ color: '#000' }}>Completed: {Math.round(w.completionPercentage)}% • Sets: {w.totalSetsCompleted}/{w.totalSetsPlanned}</Text>
                </Card.Content>
              </Card>
            ))}
          {history.length === 0 && <Text>No workouts yet.</Text>}
        </Card.Content>
      </Card>

      <DeleteConfirmationDialog
        visible={confirmDelete.visible}
        title="Delete Workout"
        message="Are you sure you want to delete this workout? This action cannot be undone."
        onDismiss={() => setConfirmDelete({ visible: false, workoutId: null })}
        onConfirm={async () => {
          if (confirmDelete.workoutId != null) {
            await dispatch(deleteWorkout(confirmDelete.workoutId));
          }
          setConfirmDelete({ visible: false, workoutId: null });
        }}
      />

      {/* Details modal */}
      <PaperPortal>
        <PaperModal visible={!!selectedWorkout} onDismiss={() => setSelectedWorkout(null)} contentContainerStyle={{ backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12, maxHeight: '80%' }}>
          {selectedWorkout && (
            <View>
              <Text style={{ fontWeight: '700', fontSize: 18, color: '#000' }}>{selectedWorkout.programName || 'Custom'}</Text>
              <Text style={{ marginTop: 4, color: '#000' }}>{new Date(selectedWorkout.startTime).toLocaleString()} → {new Date(selectedWorkout.endTime).toLocaleString()}</Text>
              <Text style={{ color: '#000' }}>Duration: {Math.round(selectedWorkout.durationMs / 60000)} min • Active: {Math.round(selectedWorkout.activeDurationMs / 60000)} min</Text>
              <Text style={{ color: '#000' }}>Completed: {Math.round(selectedWorkout.completionPercentage)}% • Volume: {Math.round(selectedWorkout.totalVolume)}</Text>
              <Text style={{ marginTop: 8, fontWeight: '700', color: '#000' }}>Exercises</Text>
              {selectedWorkout.exercises.map((ex: any, idx: number) => (
                <View key={idx} style={{ marginTop: 6 }}>
                  <Text style={{ fontWeight: '600', color: '#000' }}>{ex.exerciseName}</Text>
                  <Text style={{ color: '#000' }}>Sets: {ex.sets?.length || 0}</Text>
                </View>
              ))}
            </View>
          )}
        </PaperModal>
      </PaperPortal>
    </ScrollView>
  );
}


