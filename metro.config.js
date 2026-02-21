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
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@shared/components': path.resolve(__dirname, 'src/shared/components'),
      '@shared/services': path.resolve(__dirname, 'src/shared/services'),
      '@shared/store': path.resolve(__dirname, 'src/shared/store'),
      '@shared/types': path.resolve(__dirname, 'src/shared/types'),
      '@shared/utils': path.resolve(__dirname, 'src/shared/utils'),
      '@shared/hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@theme': path.resolve(__dirname, 'src/theme'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
