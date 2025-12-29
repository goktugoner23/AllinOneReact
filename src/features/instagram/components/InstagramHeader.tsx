import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.titleContainer}>
        <Ionicons name="logo-instagram" size={24} color={theme.colors.primary} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>{subtitle}</Text>}
        </View>
      </View>

      {showHealthStatus && (
        <Chip
          mode="outlined"
          compact
          icon={isHealthy ? 'check-circle' : 'alert-circle'}
          style={[styles.healthChip, { borderColor: isHealthy ? '#4CAF50' : '#F44336' }]}
          textStyle={[styles.healthText, { color: isHealthy ? '#4CAF50' : '#F44336' }]}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.7,
  },
  healthChip: {
    height: 28,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InstagramHeader;
