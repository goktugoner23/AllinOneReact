import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@shared/store';
import { checkInstagramHealth } from '@features/instagram/store/instagramSlice';
import { InstagramHeader } from '@features/instagram/components';
import { InstagramPost } from '@features/instagram/types/Instagram';

// Import tab screens
import PostsTab from '@features/instagram/screens/PostsTab';
import InsightsTab from '@features/instagram/screens/InsightsTab';
import AskAITab from '@features/instagram/screens/AskAITab';
import PostDetailScreen from '@features/instagram/screens/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export type InstagramTabParamList = {
  Posts: undefined;
  Insights: undefined;
  'Ask AI': undefined;
};

const InstagramTabs: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { status: healthStatus } = useSelector((state: RootState) => state.instagram.health);

  // Check service health on mount
  useEffect(() => {
    dispatch(checkInstagramHealth());
  }, [dispatch]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            default:
              iconName = 'help-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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