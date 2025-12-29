import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, useTheme } from 'react-native-paper';

interface LinearProgressBarProps {
  visible?: boolean;
  color?: string;
  indeterminate?: boolean;
}

export default function LinearProgressBar({ visible = true, color, indeterminate = true }: LinearProgressBarProps) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ProgressBar indeterminate={indeterminate} color={color || theme.colors.primary} style={styles.progressBar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 4,
    zIndex: 1000,
  },
  progressBar: {
    height: 4,
  },
});
