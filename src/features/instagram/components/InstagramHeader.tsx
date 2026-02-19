import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAppTheme, textStyles, spacing, radius } from '@shared/theme';

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
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.titleBlock}>
        <Text style={[textStyles.h3, { color: colors.foreground }]}>{title}</Text>
        {subtitle && (
          <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: 2 }]}>{subtitle}</Text>
        )}
      </View>

      {showHealthStatus && (
        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: isHealthy ? colors.successMuted : colors.destructiveMuted,
              borderRadius: radius.full,
            },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: isHealthy ? colors.success : colors.destructive }]}
          />
          <Text
            style={[
              textStyles.caption,
              { color: isHealthy ? colors.success : colors.destructive, fontWeight: '500' },
            ]}
          >
            {isHealthy ? 'Online' : 'Offline'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBlock: {
    flex: 1,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    gap: spacing[1.5],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default InstagramHeader;
