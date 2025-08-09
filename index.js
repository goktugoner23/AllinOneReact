/**
 * @format
 */

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Enable native screens for better memory usage and performance
enableScreens(true);

// Temporary suppression for noisy React 19 ref deprecation coming from dependencies
LogBox.ignoreLogs([
  'Accessing element.ref was removed in React 19',
]);

AppRegistry.registerComponent(appName, () => App);
