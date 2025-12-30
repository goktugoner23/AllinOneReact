import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, spacing, textStyles } from '@shared/theme';

interface InstagramHeaderProps {
  title: string;
  subtitle?: string;
  showHealthStatus?: boolean;
  isHealthy?: boolean;
}

const InstagramHeader: React.FC<InstagramHeaderProps> = ({
  title,
  subtitle,
  showHealthStatus = false,
  isHealthy = true,
}) => {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.titleContainer}>
        <Ionicons name="logo-instagram" size={24} color={colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: colors.foregroundMuted }]}>{subtitle}</Text>}
        </View>
      </View>

      {showHealthStatus && (
        <Chip
          mode="outlined"
          compact
          icon={isHealthy ? 'check-circle' : 'alert-circle'}
          style={[styles.healthChip, { borderColor: isHealthy ? colors.success : colors.destructive }]}
          textStyle={[styles.healthText, { color: isHealthy ? colors.success : colors.destructive }]}
        >
          {isHealthy ? 'Online' : 'Offline'}
        </Chip>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.h4,
  },
  subtitle: {
    ...textStyles.bodySmall,
    marginTop: spacing[0.5],
  },
  healthChip: {
    height: 28,
  },
  healthText: {
    ...textStyles.labelSmall,
  },
});

export default InstagramHeader;
