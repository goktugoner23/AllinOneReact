import React, { useEffect, useState } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  IconButton,
  EmptyState,
  Dialog,
  AlertDialog,
  FAB,
  Badge,
} from '@shared/components/ui';
import { workoutService } from '@features/workout/services/workout';
import { Program, ProgramExerciseSpec } from '@features/workout/types/Workout';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';

export default function WorkoutPrograms() {
  const theme = useTheme();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<Program | null>(null);
  const [newName, setNewName] = useState('');
  const [newExercises, setNewExercises] = useState<ProgramExerciseSpec[]>([]);
  const [detailsOpen, setDetailsOpen] = useState<Program | null>(null);
  const [optionsOpen, setOptionsOpen] = useState<Program | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<Program | null>(null);

  useEffect(() => {
    workoutService.getPrograms().then(setPrograms);
  }, []);

  const handleCloseForm = () => {
    setAddOpen(false);
    setEditOpen(null);
    setNewName('');
    setNewExercises([]);
  };

  const handleSaveProgram = async () => {
    if (!newName.trim()) return;
    let id = editOpen?.id;
    if (!id) id = await firebaseIdManager.getNextId('programs');
    const program: Program = { id, name: newName.trim(), exercises: newExercises };
    await workoutService.saveProgram(program);
    const fresh = await workoutService.getPrograms();
    setPrograms(fresh);
    handleCloseForm();
  };

  const handleDeleteProgram = async () => {
    if (confirmDeleteOpen) {
      await workoutService.deleteProgram(confirmDeleteOpen.id);
      setPrograms(programs.filter((p) => p.id !== confirmDeleteOpen.id));
    }
    setConfirmDeleteOpen(null);
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={programs}
        keyExtractor={(p) => p.id.toString()}
        renderItem={({ item }) => (
          <Card
            style={{ marginBottom: 10 }}
            onPress={() => setDetailsOpen(item)}
            onLongPress={() => setOptionsOpen(item)}
          >
            <CardContent>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>{item.name}</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {item.exercises.length} exercises
                  </Text>
                </View>
                <Badge>{item.exercises.length}</Badge>
              </View>
            </CardContent>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="list-outline"
            title="No programs yet"
            description="Create your first workout program to get started."
            actionLabel="Create Program"
            onAction={() => setAddOpen(true)}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Add/Edit Program Dialog */}
      <Dialog
        visible={addOpen || !!editOpen}
        onClose={handleCloseForm}
        title={editOpen ? 'Edit Program' : 'Add Program'}
      >
        <View style={{ gap: 12 }}>
          <TextInput
            mode="outlined"
            label="Program Name"
            value={newName}
            onChangeText={setNewName}
            style={{ backgroundColor: theme.colors.surface }}
          />
          <ScrollView style={{ maxHeight: 320 }}>
            {newExercises.map((item, index) => (
              <Card key={index} variant="outlined" padding="sm" style={{ marginBottom: 8 }}>
                <CardContent style={{ gap: 8 }}>
                  <TextInput
                    mode="outlined"
                    label="Exercise Name"
                    value={item.exerciseName}
                    onChangeText={(t) => {
                      const arr = [...newExercises];
                      arr[index] = { ...arr[index], exerciseName: t };
                      setNewExercises(arr);
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <TextInput
                    mode="outlined"
                    label="Muscle Group"
                    value={item.muscleGroup || ''}
                    onChangeText={(t) => {
                      const arr = [...newExercises];
                      arr[index] = { ...arr[index], muscleGroup: t };
                      setNewExercises(arr);
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      mode="outlined"
                      keyboardType="number-pad"
                      label="Sets"
                      value={item.sets?.toString() || ''}
                      onChangeText={(t) => {
                        const arr = [...newExercises];
                        arr[index] = { ...arr[index], sets: t ? Number(t) : null };
                        setNewExercises(arr);
                      }}
                      style={{ flex: 1, backgroundColor: theme.colors.surface }}
                    />
                    <TextInput
                      mode="outlined"
                      keyboardType="number-pad"
                      label="Reps"
                      value={item.reps?.toString() || ''}
                      onChangeText={(t) => {
                        const arr = [...newExercises];
                        arr[index] = { ...arr[index], reps: t ? Number(t) : null };
                        setNewExercises(arr);
                      }}
                      style={{ flex: 1, backgroundColor: theme.colors.surface }}
                    />
                  </View>
                  <TextInput
                    mode="outlined"
                    label="Weight (optional)"
                    value={item.weight || ''}
                    onChangeText={(t) => {
                      const arr = [...newExercises];
                      arr[index] = { ...arr[index], weight: t || null };
                      setNewExercises(arr);
                    }}
                    style={{ backgroundColor: theme.colors.surface }}
                    placeholder="e.g., 20 or bodyweight"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <IconButton
                      icon="trash-outline"
                      size="sm"
                      variant="ghost"
                      color={theme.colors.error}
                      onPress={() => setNewExercises(newExercises.filter((_, i) => i !== index))}
                    />
                  </View>
                </CardContent>
              </Card>
            ))}
          </ScrollView>
          <Button
            variant="outline"
            onPress={() =>
              setNewExercises([
                ...newExercises,
                { exerciseId: Date.now(), exerciseName: '', muscleGroup: '', sets: null, reps: null, weight: null },
              ])
            }
          >
            Add Exercise
          </Button>
          <Button variant="primary" fullWidth onPress={handleSaveProgram}>
            {editOpen ? 'Save Changes' : 'Save Program'}
          </Button>
        </View>
      </Dialog>

      {/* Program Details Dialog */}
      <Dialog
        visible={!!detailsOpen}
        onClose={() => setDetailsOpen(null)}
        title={detailsOpen?.name || 'Program Details'}
      >
        {detailsOpen && (
          <ScrollView style={{ maxHeight: 400 }}>
            <View style={{ gap: 8 }}>
              {detailsOpen.exercises.map((ex, idx) => (
                <Card key={idx} variant="filled" padding="sm">
                  <CardContent>
                    <Text style={{ fontWeight: '700', color: theme.colors.onSurface }}>{ex.exerciseName}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {ex.muscleGroup && <Badge variant="info">{ex.muscleGroup}</Badge>}
                      {ex.sets && <Badge>{ex.sets} sets</Badge>}
                      {ex.reps && <Badge>{ex.reps} reps</Badge>}
                      {ex.weight && <Badge variant="default">{ex.weight}</Badge>}
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>
          </ScrollView>
        )}
      </Dialog>

      {/* Long-press Options Dialog */}
      <Dialog visible={!!optionsOpen} onClose={() => setOptionsOpen(null)} title="Program Options">
        <View style={{ gap: 8 }}>
          <Button
            variant="secondary"
            fullWidth
            onPress={() => {
              if (optionsOpen) {
                setEditOpen(optionsOpen);
                setNewName(optionsOpen.name);
                setNewExercises(optionsOpen.exercises);
              }
              setOptionsOpen(null);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            fullWidth
            onPress={() => {
              setConfirmDeleteOpen(optionsOpen);
              setOptionsOpen(null);
            }}
          >
            Delete
          </Button>
          <Button variant="ghost" fullWidth onPress={() => setOptionsOpen(null)}>
            Close
          </Button>
        </View>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        visible={!!confirmDeleteOpen}
        title="Delete Program"
        description="Are you sure you want to delete this program? This action cannot be undone."
        onClose={() => setConfirmDeleteOpen(null)}
        onConfirm={handleDeleteProgram}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <FAB icon="add" onPress={() => setAddOpen(true)} />
    </View>
  );
}
