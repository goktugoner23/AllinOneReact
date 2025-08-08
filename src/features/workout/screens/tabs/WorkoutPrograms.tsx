import React, { useEffect, useState } from 'react';
import { View, FlatList, ScrollView } from 'react-native';
import { Text, Button, Card, Portal, Modal, TextInput, Dialog, IconButton } from 'react-native-paper';
import { PurpleFab } from '@shared/components';
import { workoutService } from '@features/workout/services/workout';
import { Program, ProgramExerciseSpec } from '@features/workout/types/Workout';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';

export default function WorkoutPrograms() {
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

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={programs}
        keyExtractor={(p) => p.id.toString()}
        renderItem={({ item }) => (
          <Card
            style={{ marginBottom: 10, backgroundColor: '#fff' }}
            onPress={() => setDetailsOpen(item)}
            onLongPress={() => setOptionsOpen(item)}
          >
            <Card.Title title={item.name} titleStyle={{ fontWeight: '700', color: '#000' }} subtitle={`${item.exercises.length} exercises`} />
          </Card>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No programs yet.</Text>}
      />

      {/* Add/Edit Program modal */}
      <Portal>
        <Modal visible={addOpen || !!editOpen} onDismiss={() => { setAddOpen(false); setEditOpen(null); setNewName(''); setNewExercises([]); }} contentContainerStyle={{ backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12, maxHeight: '85%' }}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>{editOpen ? 'Edit Program' : 'Add Program'}</Text>
          <TextInput mode="outlined" label="Program Name" value={newName} onChangeText={setNewName} style={{ backgroundColor: '#fff', marginBottom: 8 }} />
          <ScrollView style={{ maxHeight: 380 }}>
            {newExercises.map((item, index) => (
              <Card key={index} style={{ marginBottom: 8 }}>
                <Card.Content>
                  <TextInput mode="outlined" label="Exercise Name" value={item.exerciseName} onChangeText={(t) => {
                    const arr = [...newExercises]; arr[index] = { ...arr[index], exerciseName: t }; setNewExercises(arr);
                  }} style={{ backgroundColor: '#fff', marginBottom: 8 }} />
                  <TextInput mode="outlined" label="Muscle Group" value={item.muscleGroup || ''} onChangeText={(t) => {
                    const arr = [...newExercises]; arr[index] = { ...arr[index], muscleGroup: t }; setNewExercises(arr);
                  }} style={{ backgroundColor: '#fff', marginBottom: 8 }} />
                  <TextInput mode="outlined" keyboardType="number-pad" label="Sets (optional)" value={item.sets?.toString() || ''} onChangeText={(t) => {
                    const arr = [...newExercises]; arr[index] = { ...arr[index], sets: t ? Number(t) : null }; setNewExercises(arr);
                  }} style={{ backgroundColor: '#fff', marginBottom: 8 }} />
                  <TextInput mode="outlined" keyboardType="number-pad" label="Reps (optional)" value={item.reps?.toString() || ''} onChangeText={(t) => {
                    const arr = [...newExercises]; arr[index] = { ...arr[index], reps: t ? Number(t) : null }; setNewExercises(arr);
                  }} style={{ backgroundColor: '#fff', marginBottom: 8 }} />
                  <TextInput mode="outlined" label="Weight (optional)" value={item.weight || ''} onChangeText={(t) => {
                    const arr = [...newExercises]; arr[index] = { ...arr[index], weight: t || null }; setNewExercises(arr);
                  }} style={{ backgroundColor: '#fff', marginBottom: 8 }} placeholder="e.g., 20 or bodyweight" />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <IconButton icon="delete" onPress={() => setNewExercises(newExercises.filter((_, i) => i !== index))} />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
          <Button onPress={() => setNewExercises([...newExercises, { exerciseId: Date.now(), exerciseName: '', muscleGroup: '', sets: null, reps: null, weight: null }])}>Add Exercise</Button>
          <Button mode="contained" style={{ marginTop: 8 }} onPress={async () => {
            if (!newName.trim()) return;
            let id = editOpen?.id;
            if (!id) id = await firebaseIdManager.getNextId('programs');
            const program: Program = { id, name: newName.trim(), exercises: newExercises };
            await workoutService.saveProgram(program);
            const fresh = await workoutService.getPrograms();
            setPrograms(fresh);
            setAddOpen(false); setEditOpen(null); setNewName(''); setNewExercises([]);
          }}>{editOpen ? 'Save Changes' : 'Save Program'}</Button>
        </Modal>
      </Portal>

      {/* Program details modal */}
      <Portal>
        <Modal visible={!!detailsOpen} onDismiss={() => setDetailsOpen(null)} contentContainerStyle={{ backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 12, maxHeight: '80%' }}>
          {detailsOpen && (
            <View>
              <Text style={{ fontWeight: '700', fontSize: 18, color: '#000' }}>{detailsOpen.name}</Text>
              <ScrollView style={{ marginTop: 8, maxHeight: 380 }}>
                {detailsOpen.exercises.map((ex, idx) => (
                  <Card key={idx} style={{ marginBottom: 8, backgroundColor: '#fff' }}>
                    <Card.Content>
                      <Text style={{ fontWeight: '700', color: '#000' }}>{ex.exerciseName}</Text>
                      <Text style={{ color: '#000' }}>Muscle: {ex.muscleGroup || '-'}</Text>
                      <Text style={{ color: '#000' }}>Sets: {ex.sets ?? '-'}</Text>
                      <Text style={{ color: '#000' }}>Reps: {ex.reps ?? '-'}</Text>
                      <Text style={{ color: '#000' }}>Weight: {ex.weight ?? '-'}</Text>
                    </Card.Content>
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Long-press options dialog */}
      <Portal>
        <Dialog visible={!!optionsOpen} onDismiss={() => setOptionsOpen(null)}>
          <Dialog.Title>Program Options</Dialog.Title>
          <Dialog.Content>
            <Button onPress={() => { if (optionsOpen) { setEditOpen(optionsOpen); setNewName(optionsOpen.name); setNewExercises(optionsOpen.exercises); } setOptionsOpen(null); }}>Edit</Button>
            <Button textColor="#d00" onPress={() => { setConfirmDeleteOpen(optionsOpen); setOptionsOpen(null); }}>Delete</Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOptionsOpen(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete confirmation */}
      <Portal>
        <Dialog visible={!!confirmDeleteOpen} onDismiss={() => setConfirmDeleteOpen(null)}>
          <Dialog.Title>Delete Program</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this program?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteOpen(null)}>Cancel</Button>
            <Button textColor="#d00" onPress={async () => { if (confirmDeleteOpen) { await workoutService.deleteProgram(confirmDeleteOpen.id); setPrograms(programs.filter(p => p.id !== confirmDeleteOpen.id)); } setConfirmDeleteOpen(null); }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <PurpleFab onPress={() => setAddOpen(true)} />
    </View>
  );
}


