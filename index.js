/**
 * @format
 */

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Enable native screens for better memory usage and performance
enableScreens(true);

AppRegistry.registerComponent(appName, () => App);
