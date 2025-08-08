import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import { workoutService } from '@features/workout/services/workout';
import { StatsSnapshot } from '@features/workout/types/Workout';

export default function WorkoutStats() {
  const [stats, setStats] = useState<StatsSnapshot[]>([]);
  const [weight, setWeight] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    workoutService.getStatsSnapshots().then(setStats);
  }, []);

  const latest = useMemo(() => stats[0], [stats]);

  const handleSave = async () => {
    const snapshot: StatsSnapshot = {
      bodyWeightKg: Number(weight) || 0,
      measurements: {
        ...(chest ? { chest: Number(chest) } : {}),
        ...(waist ? { waist: Number(waist) } : {}),
      },
      note: note || null,
    };
    await workoutService.saveStatsSnapshot(snapshot);
    setStats(await workoutService.getStatsSnapshots());
    setWeight('');
    setChest('');
    setWaist('');
    setNote('');
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Card>
        <Card.Title title="My Latest Stats" />
        <Card.Content>
          {latest ? (
            <>
              <Text>Bodyweight: {latest.bodyWeightKg} kg</Text>
              {latest.measurements && Object.entries(latest.measurements).map(([k, v]) => (
                <Text key={k}>{k}: {v} cm</Text>
              ))}
              <Text>Updated: {new Date(latest.createdAt || '').toLocaleString()}</Text>
            </>
          ) : (
            <Text>No stats yet.</Text>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Update Stats" />
        <Card.Content>
          <TextInput label="Bodyweight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} style={{ marginBottom: 8 }} />
          <TextInput label="Chest (cm)" keyboardType="numeric" value={chest} onChangeText={setChest} style={{ marginBottom: 8 }} />
          <TextInput label="Waist (cm)" keyboardType="numeric" value={waist} onChangeText={setWaist} style={{ marginBottom: 8 }} />
          <TextInput label="Note" value={note} onChangeText={setNote} style={{ marginBottom: 8 }} />
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}


