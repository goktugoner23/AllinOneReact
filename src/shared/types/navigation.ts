/**
 * Shared navigation types used across the application
 */

import { NavigationProp, RouteProp } from '@react-navigation/native';

// Root Stack Parameter List
export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  Onboarding: undefined;
};

// Main Drawer Parameter List
export type MainDrawerParamList = {
  Transactions: undefined;
  'WT Registry': undefined;
  Calendar: undefined;
  History: undefined;
  Notes: undefined;
  Tasks: undefined;
  Instagram: undefined;
};

// Transactions Tab Parameter List
export type TransactionsTabParamList = {
  Home: undefined;
  Investments: undefined;
  Reports: undefined;
};

// Notes Stack Parameter List
export type NotesStackParamList = {
  NotesList: undefined;
  EditNote: { noteId?: string };
};

// Instagram Tab Parameter List
export type InstagramTabParamList = {
  Posts: undefined;
  Insights: undefined;
  'Ask AI': undefined;
};

// Generic navigation prop type
export type NavigationProps<T extends Record<string, object | undefined>> = NavigationProp<T>;

// Generic route prop type
export type RouteProps<T extends Record<string, object | undefined>, K extends keyof T> = RouteProp<T, K>;

// Screen component props
export interface ScreenProps<T extends Record<string, object | undefined>, K extends keyof T> {
  navigation: NavigationProp<T>;
  route: RouteProp<T, K>;
}

// Navigation state
export interface NavigationState {
  index: number;
  routes: Array<{
    key: string;
    name: string;
    params?: object;
  }>;
}

// Tab bar icon props
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

// Drawer item props
export interface DrawerItemProps {
  label: string;
  icon: string;
  focused: boolean;
  onPress: () => void;
}

// Navigation options
export interface NavigationOptions {
  title?: string;
  headerShown?: boolean;
  headerTitle?: string;
  headerBackTitle?: string;
  headerTintColor?: string;
  headerStyle?: object;
  tabBarLabel?: string;
  tabBarIcon?: (props: TabBarIconProps) => React.ReactNode;
  tabBarBadge?: string | number;
  drawerIcon?: (props: { color: string; size: number }) => React.ReactNode;
  drawerLabel?: string;
}

// Deep linking configuration
export interface LinkingConfig {
  prefixes: string[];
  config: {
    screens: Record<string, string | object>;
  };
}

// Navigation theme
export interface NavigationTheme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
  fonts: {
    regular: {
      fontFamily: string;
      fontWeight: string;
    };
    medium: {
      fontFamily: string;
      fontWeight: string;
    };
    bold: {
      fontFamily: string;
      fontWeight: string;
    };
    heavy: {
      fontFamily: string;
      fontWeight: string;
    };
  };
}
