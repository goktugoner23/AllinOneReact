import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomNavigation, useTheme } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loadStudents, loadRegistrations, loadLessons, loadSeminars } from '../store/wtRegistrySlice';
import { StudentsTab } from './wtregistry/StudentsTab';
import { RegisterTab } from './wtregistry/RegisterTab';
import { LessonsTab } from './wtregistry/LessonsTab';
import { SeminarsTab } from './wtregistry/SeminarsTab';

export function WTRegistryScreen() {
  const [index, setIndex] = React.useState(0);
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();

  const [routes] = React.useState([
    { key: 'students', title: 'Students', focusedIcon: 'account-group', unfocusedIcon: 'account-group-outline' },
    { key: 'register', title: 'Register', focusedIcon: 'cash-register', unfocusedIcon: 'cash-register' },
    { key: 'lessons', title: 'Lessons', focusedIcon: 'school', unfocusedIcon: 'school-outline' },
    { key: 'seminars', title: 'Seminars', focusedIcon: 'presentation', unfocusedIcon: 'presentation-play' },
  ]);

  useEffect(() => {
    // Load all data when screen mounts
    dispatch(loadStudents());
    dispatch(loadRegistrations());
    dispatch(loadLessons());
    dispatch(loadSeminars());
  }, [dispatch]);

  const renderScene = BottomNavigation.SceneMap({
    students: StudentsTab,
    register: RegisterTab,
    lessons: LessonsTab,
    seminars: SeminarsTab,
  });

  return (
    <View style={styles.container}>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        renderScene={renderScene}
        barStyle={[styles.bottomBar, { backgroundColor: theme.colors.surface }]}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
  },
}); 