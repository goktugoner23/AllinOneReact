module.exports = function (api) {
  const isProd = api.env('production');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      'react-native-worklets/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@features': './src/features',
            '@shared': './src/shared',
            '@features/transactions/config': './src/features/transactions/config',
            '@theme': './src/theme',
            '@App': './App',
          },
        },
      ],
      isProd && ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ].filter(Boolean),
  };
};
