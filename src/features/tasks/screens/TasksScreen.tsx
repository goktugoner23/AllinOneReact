import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { 
  Appbar, 
  Text, 
  IconButton, 
  ActivityIndicator,
  useTheme
} from 'react-native-paper';
import { PurpleFab } from '@shared/components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { 
  fetchTasks, 
  fetchTaskGroups, 
  addTask, 
  updateTask, 
  removeTask, 
  toggleTaskCompleted,
  addTaskGroup,
  updateTaskGroup,
  removeTaskGroup,
  setTasks,
  setTaskGroups
} from '@features/tasks/store/tasksSlice';
import { subscribeToTasks, subscribeToTaskGroups } from '@features/tasks/services/tasks';
import { Task, TaskGroup } from '@features/tasks/types/Task';
import TaskCard from '@features/tasks/components/TaskCard';
import TaskGroupHeader from '@features/tasks/components/TaskGroupHeader';
import EmptyTasksState from '@features/tasks/components/EmptyTasksState';
import AddTaskDialog from '@features/tasks/components/AddTaskDialog';
import EditTaskDialog from '@features/tasks/components/EditTaskDialog';
import AddTaskGroupDialog from '@features/tasks/components/AddTaskGroupDialog';
import DeleteConfirmationDialog from '@shared/components/ui/DeleteConfirmationDialog';


const TasksScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const { tasks, taskGroups, loading, error, groupedTasks } = useSelector(
    (state: RootState) => state.tasks
  );

  // Debug logging
  useEffect(() => {
    console.log('TasksScreen: State updated -', {
      tasksCount: tasks.length,
      taskGroupsCount: taskGroups.length,
      loading,
      error,
      groupedTasksKeys: Object.keys(groupedTasks)
    });
  }, [tasks, taskGroups, loading, error, groupedTasks]);

  // Local state
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);

  // Initialize data
  useEffect(() => {
    console.log('TasksScreen: Initializing data...');
    dispatch(fetchTasks());
    dispatch(fetchTaskGroups());
  }, [dispatch]);

  // Set up real-time listeners
  useEffect(() => {
    const unsubscribeTasks = subscribeToTasks((tasks) => {
      dispatch(setTasks(tasks));
    });

    const unsubscribeGroups = subscribeToTaskGroups((taskGroups) => {
      dispatch(setTaskGroups(taskGroups));
    });

    return () => {
      unsubscribeTasks();
      unsubscribeGroups();
    };
  }, [dispatch]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchTasks()),
      dispatch(fetchTaskGroups()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Task actions
  const handleToggleTaskComplete = (task: Task) => {
    dispatch(toggleTaskCompleted(task));
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditTaskDialog(true);
  };

  const handleUpdateTask = (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
    if (selectedTask) {
      const updatedTask: Task = {
        ...selectedTask,
        name: taskData.name,
        description: taskData.description,
        dueDate: taskData.dueDate?.toISOString(),
        groupId: taskData.groupId,
      };
      dispatch(updateTask(updatedTask));
    }
    setShowEditTaskDialog(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = () => {
    if (selectedTask) {
      dispatch(removeTask(selectedTask.id));
    }
    setShowDeleteTaskDialog(false);
    setSelectedTask(null);
  };

  const handleAddTask = (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
    dispatch(addTask(taskData));
    setShowAddTaskDialog(false);
  };

  // Group actions
  const handleEditGroup = (group: TaskGroup) => {
    setSelectedGroup(group);
    // For now, we'll just show delete dialog
    setShowDeleteGroupDialog(true);
  };

  const handleDeleteGroup = () => {
    if (selectedGroup) {
      dispatch(removeTaskGroup(selectedGroup.id));
    }
    setShowDeleteGroupDialog(false);
    setSelectedGroup(null);
  };

  const handleAddGroup = (groupData: { title: string; description?: string; color: string }) => {
    dispatch(addTaskGroup(groupData));
    setShowAddGroupDialog(false);
  };

  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return aDate - bDate;
  });

  // Render task item
  const renderTaskItem = useCallback(({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onToggleComplete={handleToggleTaskComplete}
      onEdit={handleEditTask}
    />
  ), [handleToggleTaskComplete, handleEditTask]);

  // Render grouped tasks
  const renderGroupedTasks = () => {
    const items: any[] = [];

    // Add grouped tasks
    Object.entries(groupedTasks).forEach(([groupId, groupTasks]) => {
      if (groupId === 'ungrouped') {
        if (groupTasks.length > 0) {
          items.push({ type: 'header', title: 'Ungrouped Tasks', id: 'ungrouped-header' });
          groupTasks.forEach(task => {
            items.push({ type: 'task', data: task, id: `task-${task.id}` });
          });
        }
      } else {
        const group = taskGroups.find(g => g.id === groupId);
        if (group && groupTasks.length > 0) {
          items.push({ 
            type: 'group-header', 
            data: group, 
            taskCount: groupTasks.length,
            completedCount: groupTasks.filter(t => t.completed).length,
            id: `group-${groupId}` 
          });
          groupTasks.forEach(task => {
            items.push({ type: 'task', data: task, id: `task-${task.id}`, groupId });
          });
        }
      }
    });

    return (
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'task') {
            return (
              <TaskCard
                task={item.data}
                onToggleComplete={handleToggleTaskComplete}
                onEdit={handleEditTask}
                style={item.groupId ? { marginLeft: 32 } : undefined}
              />
            );
          } else if (item.type === 'group-header') {
            return (
              <TaskGroupHeader
                group={item.data}
                taskCount={item.taskCount}
                completedCount={item.completedCount}
                onLongPress={handleEditGroup}
              />
            );
          } else if (item.type === 'header') {
            return (
              <View style={styles.ungroupedHeader}>
                <Text
                  variant="titleMedium"
                  style={[styles.ungroupedTitle, { color: theme.colors.onSurface }]}
                >
                  {item.title}
                </Text>
              </View>
            );
          }
          return null;
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        estimatedItemSize={100}
      />
    );
  };

  // Render simple tasks list
  const renderSimpleTasks = () => (
    <FlashList
      data={sortedTasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTaskItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.listContainer}
      estimatedItemSize={90}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Appbar.Content title="Tasks" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Appbar.Content title="Tasks" />
        <Appbar.Action
          icon={isGroupedView ? 'view-list' : 'view-module'}
          onPress={() => setIsGroupedView(!isGroupedView)}
        />
        {isGroupedView && (
          <Appbar.Action
            icon="folder-plus"
            onPress={() => setShowAddGroupDialog(true)}
          />
        )}
      </Appbar.Header>

      {tasks.length === 0 ? (
        <EmptyTasksState onCreateTask={() => setShowAddTaskDialog(true)} />
      ) : (
        isGroupedView ? renderGroupedTasks() : renderSimpleTasks()
      )}

      <PurpleFab style={styles.fab} onPress={() => setShowAddTaskDialog(true)} />

      {/* Dialogs */}
      <AddTaskDialog
        visible={showAddTaskDialog}
        taskGroups={taskGroups}
        onDismiss={() => setShowAddTaskDialog(false)}
        onConfirm={handleAddTask}
        onCreateGroup={handleAddGroup}
      />

      <EditTaskDialog
        visible={showEditTaskDialog}
        task={selectedTask}
        taskGroups={taskGroups}
        onDismiss={() => {
          setShowEditTaskDialog(false);
          setSelectedTask(null);
        }}
        onConfirm={handleUpdateTask}
        onDelete={() => {
          setShowEditTaskDialog(false);
          setShowDeleteTaskDialog(true);
        }}
        onCreateGroup={handleAddGroup}
      />

      <AddTaskGroupDialog
        visible={showAddGroupDialog}
        onDismiss={() => setShowAddGroupDialog(false)}
        onConfirm={handleAddGroup}
      />

      <DeleteConfirmationDialog
        visible={showDeleteTaskDialog}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.name}"? This action cannot be undone.`}
        onDismiss={() => setShowDeleteTaskDialog(false)}
        onConfirm={handleDeleteTask}
      />

      <DeleteConfirmationDialog
        visible={showDeleteGroupDialog}
        title="Delete Task Group"
        message={`Are you sure you want to delete "${selectedGroup?.title}"? All tasks in this group will become ungrouped.`}
        onDismiss={() => setShowDeleteGroupDialog(false)}
        onConfirm={handleDeleteGroup}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // backgroundColor will be set dynamically
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 8,
  },
  ungroupedHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ungroupedTitle: {
    fontWeight: 'bold',
    // Color will be set dynamically
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    // backgroundColor will be set dynamically
  },
});

export default TasksScreen;
