const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    unstable_allowRequireContext: true,
  },
  resolver: {
    alias: {
      // Feature aliases
      '@features': path.resolve(__dirname, 'src/features'),
      '@features/transactions': path.resolve(__dirname, 'src/features/transactions'),
      '@features/instagram': path.resolve(__dirname, 'src/features/instagram'),
      '@features/wtregistry': path.resolve(__dirname, 'src/features/wtregistry'),
      '@features/calendar': path.resolve(__dirname, 'src/features/calendar'),
      '@features/notes': path.resolve(__dirname, 'src/features/notes'),
      '@features/tasks': path.resolve(__dirname, 'src/features/tasks'),
      '@features/history': path.resolve(__dirname, 'src/features/history'),
      
      // Shared aliases
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@shared/components': path.resolve(__dirname, 'src/shared/components'),
      '@shared/services': path.resolve(__dirname, 'src/shared/services'),
      '@shared/store': path.resolve(__dirname, 'src/shared/store'),
      '@shared/types': path.resolve(__dirname, 'src/shared/types'),
      '@shared/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@shared/hooks': path.resolve(__dirname, 'src/shared/hooks'),
      
      // Legacy aliases (for backward compatibility during migration)
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/shared/components'),
      '@screens': path.resolve(__dirname, 'src/features'),
      '@types': path.resolve(__dirname, 'src/shared/types'),
      '@store': path.resolve(__dirname, 'src/shared/store'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@utils': path.resolve(__dirname, 'src/shared/utils'),
      '@theme': path.resolve(__dirname, 'src/theme'),
      '@App': path.resolve(__dirname, 'App')
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
