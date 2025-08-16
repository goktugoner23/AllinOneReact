import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Card, TextInput, Portal, Modal } from 'react-native-paper';
import { AddFab } from '@shared/components';
import { workoutService } from '@features/workout/services/workout';
import { StatsSnapshot } from '@features/workout/types/Workout';

export default function WorkoutStats() {
  const [stats, setStats] = useState<StatsSnapshot[]>([]);
  const [visible, setVisible] = useState(false);
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [shoulder, setShoulder] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [bicepsL, setBicepsL] = useState<string>('');
  const [bicepsR, setBicepsR] = useState<string>('');
  const [forearmL, setForearmL] = useState<string>('');
  const [forearmR, setForearmR] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hip, setHip] = useState<string>('');
  const [upperLegL, setUpperLegL] = useState<string>('');
  const [upperLegR, setUpperLegR] = useState<string>('');
  const [calfL, setCalfL] = useState<string>('');
  const [calfR, setCalfR] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    workoutService.getStatsSnapshots().then(setStats);
  }, []);

  const latest = useMemo(() => stats[0], [stats]);

  const handleSave = async () => {
    const snapshot: StatsSnapshot = {
      heightCm: latest?.heightCm ? undefined : (Number(height) || undefined),
      bodyWeightKg: Number(weight) || 0,
      measurements: {
        ...(shoulder ? { shoulder: Number(shoulder) } : {}),
        ...(chest ? { chest: Number(chest) } : {}),
        ...(bicepsL ? { biceps_left: Number(bicepsL) } : {}),
        ...(bicepsR ? { biceps_right: Number(bicepsR) } : {}),
        ...(forearmL ? { forearm_left: Number(forearmL) } : {}),
        ...(forearmR ? { forearm_right: Number(forearmR) } : {}),
        ...(waist ? { waist: Number(waist) } : {}),
        ...(hip ? { hip: Number(hip) } : {}),
        ...(upperLegL ? { upper_leg_left: Number(upperLegL) } : {}),
        ...(upperLegR ? { upper_leg_right: Number(upperLegR) } : {}),
        ...(calfL ? { calf_left: Number(calfL) } : {}),
        ...(calfR ? { calf_right: Number(calfR) } : {}),
      },
      note: note || null,
    };
    await workoutService.saveStatsSnapshot(snapshot);
    setStats(await workoutService.getStatsSnapshots());
    setHeight('');
    setWeight('');
    setShoulder('');
    setChest('');
    setBicepsL('');
    setBicepsR('');
    setForearmL('');
    setForearmR('');
    setWaist('');
    setHip('');
    setUpperLegL('');
    setUpperLegR('');
    setCalfL('');
    setCalfR('');
    setNote('');
    setVisible(false);
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

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={{
            backgroundColor: '#fff',
            margin: 16,
            borderRadius: 12,
            padding: 12,
            maxHeight: '75%',
          }}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            <Text style={{ marginBottom: 8 }} variant="titleMedium">Update Stats</Text>
            {!latest?.heightCm && (
              <TextInput mode="outlined" label="Height (cm)" keyboardType="numeric" value={height} onChangeText={setHeight} style={{ marginBottom: 8, backgroundColor: '#fff' }} />
            )}
            <TextInput mode="outlined" label="Bodyweight (kg)" keyboardType="numeric" value={weight} onChangeText={setWeight} style={{ marginBottom: 8, backgroundColor: '#fff' }} />
            <TextInput mode="outlined" label="Shoulder (cm)" keyboardType="numeric" value={shoulder} onChangeText={setShoulder} style={{ marginBottom: 8, backgroundColor: '#fff' }} />
            <TextInput mode="outlined" label="Chest (cm)" keyboardType="numeric" value={chest} onChangeText={setChest} style={{ marginBottom: 8, backgroundColor: '#fff' }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Biceps L (cm)" keyboardType="numeric" value={bicepsL} onChangeText={setBicepsL} />
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Biceps R (cm)" keyboardType="numeric" value={bicepsR} onChangeText={setBicepsR} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Forearm L (cm)" keyboardType="numeric" value={forearmL} onChangeText={setForearmL} />
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Forearm R (cm)" keyboardType="numeric" value={forearmR} onChangeText={setForearmR} />
            </View>
            <TextInput mode="outlined" style={{ marginTop: 8, backgroundColor: '#fff' }} label="Waist (cm)" keyboardType="numeric" value={waist} onChangeText={setWaist} />
            <TextInput mode="outlined" style={{ marginTop: 8, backgroundColor: '#fff' }} label="Hip (cm)" keyboardType="numeric" value={hip} onChangeText={setHip} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Upper Leg L (cm)" keyboardType="numeric" value={upperLegL} onChangeText={setUpperLegL} />
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Upper Leg R (cm)" keyboardType="numeric" value={upperLegR} onChangeText={setUpperLegR} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Calf L (cm)" keyboardType="numeric" value={calfL} onChangeText={setCalfL} />
              <TextInput mode="outlined" style={{ flex: 1, backgroundColor: '#fff' }} label="Calf R (cm)" keyboardType="numeric" value={calfR} onChangeText={setCalfR} />
            </View>
            <TextInput mode="outlined" style={{ marginTop: 8, backgroundColor: '#fff' }} label="Note" value={note} onChangeText={setNote} />
            <Button style={{ marginTop: 12 }} mode="contained" onPress={handleSave}>Save</Button>
          </ScrollView>
        </Modal>
      </Portal>

              <AddFab onPress={() => setVisible(true)} />
    </ScrollView>
  );
}


