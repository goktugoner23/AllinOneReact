module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: false,
        },
      ],
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@features': './src/features',
            '@shared': './src/shared',
            '@features/transactions/config': './src/features/transactions/config',
            '@theme': './src/theme',
            '@lib': './src/shared/lib',
            '@components': './src/shared/components',
            '@App': './App',
          },
        },
      ],
    ],
  };
};
