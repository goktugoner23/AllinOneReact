import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, spacing, textStyles } from '@shared/theme';
import { Chip } from '@shared/components/ui';

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
          variant="outlined"
          size="sm"
          color={isHealthy ? 'success' : 'error'}
          leftIcon={<Ionicons name={isHealthy ? 'checkmark-circle' : 'alert-circle'} size={14} color={isHealthy ? colors.success : colors.destructive} />}
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
});

export default InstagramHeader;
