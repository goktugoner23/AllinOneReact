import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@shared/store';
import { checkInstagramHealth } from '@features/instagram/store/instagramSlice';
import { InstagramHeader } from '@features/instagram/components';
import { useAppTheme, spacing } from '@shared/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import PostsTab from '@features/instagram/screens/PostsTab';
import InsightsTab from '@features/instagram/screens/InsightsTab';
import PostDetailScreen from '@features/instagram/screens/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export type InstagramTabParamList = {
  Posts: undefined;
  Insights: undefined;
};

const InstagramTabs: React.FC = () => {
  const { colors } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { status: healthStatus } = useSelector((state: RootState) => state.instagram.health);

  useEffect(() => {
    dispatch(checkInstagramHealth());
  }, [dispatch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <InstagramHeader
        title="Instagram"
        subtitle="Analytics & AI"
        showHealthStatus={true}
        isHealthy={healthStatus?.overall ?? true}
      />

      <Tab.Navigator
        initialRouteName="Posts"
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            height: 56,
            paddingBottom: spacing[1],
            paddingTop: spacing[1],
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.foregroundMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tab.Screen
          name="Posts"
          component={PostsTab}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsTab}
          options={{
            tabBarIcon: ({ color, size }) => <Icon name="chart-line" size={size} color={color} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const InstagramScreen: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InstagramTabs" component={InstagramTabs} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default InstagramScreen;
