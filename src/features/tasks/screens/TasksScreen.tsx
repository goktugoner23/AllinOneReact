import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Appbar, AppbarAction } from '@shared/components/ui';
import { AddFab } from '@shared/components';
import {
  useTasks,
  useTaskGroups,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTaskCompleted,
  useAddTaskGroup,
  useDeleteTaskGroup,
  useGroupedTasks,
} from '@shared/hooks';
import { Task, TaskGroup } from '@features/tasks/types/Task';
import TaskCard from '@features/tasks/components/TaskCard';
import TaskGroupHeader from '@features/tasks/components/TaskGroupHeader';
import EmptyTasksState from '@features/tasks/components/EmptyTasksState';
import AddTaskDialog from '@features/tasks/components/AddTaskDialog';
import EditTaskDialog from '@features/tasks/components/EditTaskDialog';
import AddTaskGroupDialog from '@features/tasks/components/AddTaskGroupDialog';
import DeleteConfirmationDialog from '@shared/components/ui/DeleteConfirmationDialog';
import { useColors, spacing, textStyles } from '@shared/theme';

const TasksScreen: React.FC = () => {
  const colors = useColors();

  // TanStack Query hooks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { data: taskGroups = [], isLoading: groupsLoading, refetch: refetchGroups } = useTaskGroups();
  const groupedTasks = useGroupedTasks();

  // Mutation hooks
  const addTaskMutation = useAddTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const toggleTaskMutation = useToggleTaskCompleted();
  const addTaskGroupMutation = useAddTaskGroup();
  const deleteTaskGroupMutation = useDeleteTaskGroup();

  // Combined loading state
  const loading = tasksLoading || groupsLoading;

  // Local state
  const [isGroupedView, setIsGroupedView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  type DialogType = 'none' | 'addTask' | 'addGroup' | 'editTask' | 'deleteTask' | 'deleteGroup';
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTasks(), refetchGroups()]);
    setRefreshing(false);
  }, [refetchTasks, refetchGroups]);

  // Task actions
  const handleToggleTaskComplete = useCallback(
    (task: Task) => {
      toggleTaskMutation.mutate(task);
    },
    [toggleTaskMutation],
  );

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setActiveDialog('editTask');
  }, []);

  const handleUpdateTask = useCallback(
    (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
      if (selectedTask) {
        const updatedTask: Task = {
          ...selectedTask,
          name: taskData.name,
          description: taskData.description,
          dueDate: taskData.dueDate?.toISOString(),
          groupId: taskData.groupId,
        };
        updateTaskMutation.mutate(updatedTask);
      }
      setActiveDialog('none');
      setSelectedTask(null);
    },
    [selectedTask, updateTaskMutation],
  );

  const handleDeleteTask = useCallback(() => {
    if (selectedTask) {
      deleteTaskMutation.mutate(selectedTask.id);
    }
    setActiveDialog('none');
    setSelectedTask(null);
  }, [selectedTask, deleteTaskMutation]);

  const handleAddTask = useCallback(
    (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
      addTaskMutation.mutate(taskData);
      setActiveDialog('none');
    },
    [addTaskMutation],
  );

  // Group actions
  const handleEditGroup = useCallback((group: TaskGroup) => {
    setSelectedGroup(group);
    setActiveDialog('deleteGroup');
  }, []);

  const handleDeleteGroup = useCallback(() => {
    if (selectedGroup) {
      deleteTaskGroupMutation.mutate(selectedGroup.id);
    }
    setActiveDialog('none');
    setSelectedGroup(null);
  }, [selectedGroup, deleteTaskGroupMutation]);

  const handleAddGroup = useCallback(
    (groupData: { title: string; description?: string; color: string }) => {
      addTaskGroupMutation.mutate(groupData);
      setActiveDialog('none');
    },
    [addTaskGroupMutation],
  );

  // Sort tasks by due date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  }, [tasks]);

  // Render task item
  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard task={item} onToggleComplete={handleToggleTaskComplete} onEdit={handleEditTask} />
    ),
    [handleToggleTaskComplete, handleEditTask],
  );

  // Render grouped tasks
  const renderGroupedTasks = () => {
    const items: any[] = [];

    // Add grouped tasks
    Object.entries(groupedTasks).forEach(([groupId, groupTasks]) => {
      if (groupId === 'ungrouped') {
        if (groupTasks.length > 0) {
          items.push({ type: 'header', title: 'Ungrouped Tasks', id: 'ungrouped-header' });
          groupTasks.forEach((task) => {
            items.push({ type: 'task', data: task, id: `task-${task.id}` });
          });
        }
      } else {
        const group = taskGroups.find((g) => g.id === groupId);
        if (group && groupTasks.length > 0) {
          items.push({
            type: 'group-header',
            data: group,
            taskCount: groupTasks.length,
            completedCount: groupTasks.filter((t) => t.completed).length,
            id: `group-${groupId}`,
          });
          groupTasks.forEach((task) => {
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
                <Text style={[textStyles.label, { color: colors.foregroundMuted }]}>{item.title}</Text>
              </View>
            );
          }
          return null;
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContainer}
      estimatedItemSize={90}
    />
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Appbar title="Tasks" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar
        title="Tasks"
        trailing={
          <>
            <AppbarAction
              icon={isGroupedView ? 'list-outline' : 'grid-outline'}
              onPress={() => setIsGroupedView(!isGroupedView)}
              color={colors.foregroundMuted}
            />
            {isGroupedView && (
              <AppbarAction
                icon="folder-open-outline"
                onPress={() => setActiveDialog('addGroup')}
                color={colors.foregroundMuted}
              />
            )}
          </>
        }
      />

      {tasks.length === 0 ? (
        <EmptyTasksState onCreateTask={() => setActiveDialog('addTask')} />
      ) : isGroupedView ? (
        renderGroupedTasks()
      ) : (
        renderSimpleTasks()
      )}

      <AddFab style={styles.fab} onPress={() => setActiveDialog('addTask')} />

      {/* Dialogs */}
      <AddTaskDialog
        visible={activeDialog === 'addTask'}
        taskGroups={taskGroups}
        onDismiss={() => setActiveDialog('none')}
        onConfirm={handleAddTask}
        onCreateGroup={handleAddGroup}
      />

      <EditTaskDialog
        visible={activeDialog === 'editTask'}
        task={selectedTask}
        taskGroups={taskGroups}
        onDismiss={() => { setActiveDialog('none'); setSelectedTask(null); }}
        onConfirm={handleUpdateTask}
        onDelete={() => setActiveDialog('deleteTask')}
        onCreateGroup={handleAddGroup}
      />

      <AddTaskGroupDialog
        visible={activeDialog === 'addGroup'}
        onDismiss={() => setActiveDialog('none')}
        onConfirm={handleAddGroup}
      />

      <DeleteConfirmationDialog
        visible={activeDialog === 'deleteTask'}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.name}"? This action cannot be undone.`}
        onDismiss={() => setActiveDialog('none')}
        onConfirm={handleDeleteTask}
      />

      <DeleteConfirmationDialog
        visible={activeDialog === 'deleteGroup'}
        title="Delete Task Group"
        message={`Are you sure you want to delete "${selectedGroup?.title}"? All tasks in this group will become ungrouped.`}
        onDismiss={() => setActiveDialog('none')}
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
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: spacing[2],
  },
  ungroupedHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  fab: {
    position: 'absolute',
    margin: spacing[4],
    right: 0,
    bottom: 0,
  },
});

export default TasksScreen;
