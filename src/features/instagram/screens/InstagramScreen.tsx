import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@shared/store';
import { checkInstagramHealth } from '@features/instagram/store/instagramSlice';
import { InstagramHeader } from '@features/instagram/components';
import { InstagramPost } from '@features/instagram/types/Instagram';
import { useColors, spacing, textStyles } from '@shared/theme';

// Import tab screens
import PostsTab from '@features/instagram/screens/PostsTab';
import InsightsTab from '@features/instagram/screens/InsightsTab';
import AskAITab from '@features/instagram/screens/AskAITab';
import PostDetailScreen from '@features/instagram/screens/PostDetailScreen';
import ProfilerTab from '@features/instagram/screens/ProfilerTab';
import ProfileDetailScreen from '@features/instagram/screens/ProfileDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export type InstagramTabParamList = {
  Posts: undefined;
  Insights: undefined;
  'Ask AI': undefined;
  Profiler: undefined;
};

const InstagramTabs: React.FC = () => {
  const colors = useColors();
  const dispatch = useDispatch<AppDispatch>();
  const { status: healthStatus } = useSelector((state: RootState) => state.instagram.health);

  // Check service health on mount
  useEffect(() => {
    dispatch(checkInstagramHealth());
  }, [dispatch]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <InstagramHeader
        title="Instagram Business"
        subtitle="Analytics & AI Assistant"
        showHealthStatus={true}
        isHealthy={healthStatus?.overall ?? true}
      />

      <Tab.Navigator
        initialRouteName="Posts"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let iconName = '';

            switch (route.name) {
              case 'Posts':
                iconName = 'grid-outline';
                break;
              case 'Insights':
                iconName = 'bar-chart-outline';
                break;
              case 'Ask AI':
                iconName = 'chatbubble-ellipses-outline';
                break;
              case 'Profiler':
                iconName = 'person-circle-outline';
                break;
              default:
                iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.foregroundMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            ...textStyles.labelSmall,
          },
        })}
      >
        <Tab.Screen
          name="Posts"
          component={PostsTab}
          options={{
            title: 'Posts',
          }}
        />
        <Tab.Screen
          name="Insights"
          component={InsightsTab}
          options={{
            title: 'Insights',
          }}
        />
        <Tab.Screen
          name="Ask AI"
          component={AskAITab}
          options={{
            title: 'Ask AI',
          }}
        />
        <Tab.Screen
          name="Profiler"
          component={ProfilerTab}
          options={{
            title: 'Profiler',
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
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default InstagramScreen;
