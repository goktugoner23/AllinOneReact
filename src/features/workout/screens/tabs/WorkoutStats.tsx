import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { Card, CardHeader, CardContent, Button, EmptyState, Dialog, FAB, Badge } from '@shared/components/ui';
import { workoutService } from '@features/workout/services/workout';
import { StatsSnapshot } from '@features/workout/types/Workout';

export default function WorkoutStats() {
  const theme = useTheme();
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

  const resetForm = () => {
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
  };

  const handleSave = async () => {
    const snapshot: StatsSnapshot = {
      heightCm: latest?.heightCm ? undefined : Number(height) || undefined,
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
    resetForm();
    setVisible(false);
  };

  const formatMeasurementKey = (key: string): string => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 80 }}>
      {/* Latest Stats Card */}
      <Card>
        <CardHeader>
          <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
            My Latest Stats
          </Text>
        </CardHeader>
        <CardContent>
          {latest ? (
            <View style={{ gap: 12 }}>
              {/* Bodyweight */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Bodyweight</Text>
                <Badge size="lg">{latest.bodyWeightKg} kg</Badge>
              </View>

              {/* Height if available */}
              {latest.heightCm && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Height</Text>
                  <Badge size="lg">{latest.heightCm} cm</Badge>
                </View>
              )}

              {/* Measurements */}
              {latest.measurements && Object.keys(latest.measurements).length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text
                    variant="titleSmall"
                    style={{ fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 }}
                  >
                    Measurements
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(latest.measurements).map(([k, v]) => (
                      <Card key={k} variant="filled" padding="sm" style={{ minWidth: '45%' }}>
                        <CardContent>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {formatMeasurementKey(k)}
                          </Text>
                          <Text style={{ fontWeight: '600', color: theme.colors.onSurface }}>{v} cm</Text>
                        </CardContent>
                      </Card>
                    ))}
                  </View>
                </View>
              )}

              {/* Updated date */}
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                Updated: {new Date(latest.createdAt || '').toLocaleString()}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="stats-chart-outline"
              title="No stats yet"
              description="Track your body measurements and progress over time."
              actionLabel="Add Stats"
              onAction={() => setVisible(true)}
              style={{ paddingVertical: 24 }}
            />
          )}
        </CardContent>
      </Card>

      {/* Update Stats Dialog */}
      <Dialog
        visible={visible}
        onClose={() => {
          setVisible(false);
          resetForm();
        }}
        title="Update Stats"
      >
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {!latest?.heightCm && (
              <TextInput
                mode="outlined"
                label="Height (cm)"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                style={{ backgroundColor: theme.colors.surface }}
              />
            )}
            <TextInput
              mode="outlined"
              label="Bodyweight (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
              style={{ backgroundColor: theme.colors.surface }}
            />

            {/* Upper Body */}
            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface, marginTop: 8 }}>
              Upper Body
            </Text>
            <TextInput
              mode="outlined"
              label="Shoulder (cm)"
              keyboardType="numeric"
              value={shoulder}
              onChangeText={setShoulder}
              style={{ backgroundColor: theme.colors.surface }}
            />
            <TextInput
              mode="outlined"
              label="Chest (cm)"
              keyboardType="numeric"
              value={chest}
              onChangeText={setChest}
              style={{ backgroundColor: theme.colors.surface }}
            />

            {/* Arms */}
            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface, marginTop: 8 }}>
              Arms
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Biceps L"
                keyboardType="numeric"
                value={bicepsL}
                onChangeText={setBicepsL}
              />
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Biceps R"
                keyboardType="numeric"
                value={bicepsR}
                onChangeText={setBicepsR}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Forearm L"
                keyboardType="numeric"
                value={forearmL}
                onChangeText={setForearmL}
              />
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Forearm R"
                keyboardType="numeric"
                value={forearmR}
                onChangeText={setForearmR}
              />
            </View>

            {/* Core */}
            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface, marginTop: 8 }}>
              Core
            </Text>
            <TextInput
              mode="outlined"
              label="Waist (cm)"
              keyboardType="numeric"
              value={waist}
              onChangeText={setWaist}
              style={{ backgroundColor: theme.colors.surface }}
            />
            <TextInput
              mode="outlined"
              label="Hip (cm)"
              keyboardType="numeric"
              value={hip}
              onChangeText={setHip}
              style={{ backgroundColor: theme.colors.surface }}
            />

            {/* Legs */}
            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface, marginTop: 8 }}>
              Legs
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Upper Leg L"
                keyboardType="numeric"
                value={upperLegL}
                onChangeText={setUpperLegL}
              />
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Upper Leg R"
                keyboardType="numeric"
                value={upperLegR}
                onChangeText={setUpperLegR}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Calf L"
                keyboardType="numeric"
                value={calfL}
                onChangeText={setCalfL}
              />
              <TextInput
                mode="outlined"
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                label="Calf R"
                keyboardType="numeric"
                value={calfR}
                onChangeText={setCalfR}
              />
            </View>

            {/* Note */}
            <TextInput
              mode="outlined"
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              style={{ backgroundColor: theme.colors.surface, marginTop: 8 }}
              multiline
            />

            <Button variant="primary" fullWidth onPress={handleSave} style={{ marginTop: 8 }}>
              Save Stats
            </Button>
          </View>
        </ScrollView>
      </Dialog>

      <FAB icon="add" onPress={() => setVisible(true)} />
    </ScrollView>
  );
}
