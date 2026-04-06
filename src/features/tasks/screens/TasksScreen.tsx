import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Appbar, AppbarAction } from '@shared/components/ui';
import { AddFab } from '@shared/components';
import { Task, TaskGroup } from '@features/tasks/types/Task';
import { getTasks, saveTask, deleteTask as deleteTaskApi, getTaskGroups, saveTaskGroup, deleteTaskGroup as deleteGroupApi } from '@features/tasks/services/tasks';
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isGroupedView, setIsGroupedView] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  type DialogType = 'none' | 'addTask' | 'addGroup' | 'editTask' | 'deleteTask' | 'deleteGroup';
  const [activeDialog, setActiveDialog] = useState<DialogType>('none');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);

  const fetchAll = useCallback(async () => {
    const [t, g] = await Promise.all([getTasks(), getTaskGroups()]);
    setTasks(t);
    setTaskGroups(g);
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Group tasks by groupId
  const groupedTasks = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      const key = task.groupId ?? 'ungrouped';
      (map[key] ??= []).push(task);
    }
    return map;
  }, [tasks]);

  // Task actions
  const handleToggleTaskComplete = useCallback(async (task: Task) => {
    const updated: Task = { ...task, completed: !task.completed };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    try {
      await saveTask(updated);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setActiveDialog('editTask');
  }, []);

  const handleUpdateTask = useCallback(
    async (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
      if (!selectedTask) return;
      const updated: Task = {
        ...selectedTask,
        name: taskData.name,
        description: taskData.description,
        dueDate: taskData.dueDate?.toISOString(),
        groupId: taskData.groupId,
      };
      setActiveDialog('none');
      setSelectedTask(null);
      const saved = await saveTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? saved : t)));
    },
    [selectedTask],
  );

  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask) return;
    const id = selectedTask.id;
    setActiveDialog('none');
    setSelectedTask(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskApi(id);
  }, [selectedTask]);

  const handleAddTask = useCallback(
    async (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
      setActiveDialog('none');
      const newTask: Task = {
        id: `temp-${Date.now()}`,
        name: taskData.name,
        description: taskData.description,
        completed: false,
        date: new Date().toISOString(),
        dueDate: taskData.dueDate?.toISOString(),
        groupId: taskData.groupId,
      };
      const saved = await saveTask(newTask);
      setTasks((prev) => [...prev, saved]);
    },
    [],
  );

  // Group actions
  const handleEditGroup = useCallback((group: TaskGroup) => {
    setSelectedGroup(group);
    setActiveDialog('deleteGroup');
  }, []);

  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroup) return;
    const id = selectedGroup.id;
    setActiveDialog('none');
    setSelectedGroup(null);
    setTaskGroups((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.map((t) => (t.groupId === id ? { ...t, groupId: undefined } : t)));
    await deleteGroupApi(id);
  }, [selectedGroup]);

  const handleAddGroup = useCallback(
    async (groupData: { title: string; description?: string; color: string }) => {
      setActiveDialog('none');
      const newGroup: TaskGroup = {
        id: `temp-${Date.now()}`,
        title: groupData.title,
        description: groupData.description,
        color: groupData.color,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      };
      const saved = await saveTaskGroup(newGroup);
      setTaskGroups((prev) => [...prev, saved]);
    },
    [],
  );

  // Sort tasks by due date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  }, [tasks]);

  const renderTaskItem = useCallback(
    ({ item }: { item: Task }) => (
      <TaskCard task={item} onToggleComplete={handleToggleTaskComplete} onEdit={handleEditTask} />
    ),
    [handleToggleTaskComplete, handleEditTask],
  );

  const toggleCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const renderGroupedTasks = () => {
    const items: any[] = [];

    Object.entries(groupedTasks).forEach(([groupId, groupTasks]) => {
      if (groupId === 'ungrouped') {
        if (groupTasks.length > 0) {
          items.push({ type: 'header', title: 'Ungrouped Tasks', id: 'ungrouped-header', groupId: 'ungrouped' });
          if (!collapsedGroups.has('ungrouped')) {
            groupTasks.forEach((task) => {
              items.push({ type: 'task', data: task, id: `task-${task.id}` });
            });
          }
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
            collapsed: collapsedGroups.has(groupId),
          });
          if (!collapsedGroups.has(groupId)) {
            groupTasks.forEach((task) => {
              items.push({ type: 'task', data: task, id: `task-${task.id}`, groupId });
            });
          }
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
                collapsed={item.collapsed}
                onPress={() => toggleCollapse(item.data.id)}
                onLongPress={handleEditGroup}
              />
            );
          } else if (item.type === 'header') {
            return (
              <TouchableOpacity style={styles.ungroupedHeader} onPress={() => toggleCollapse('ungrouped')}>
                <Text style={[textStyles.label, { color: colors.foregroundMuted }]}>
                  {collapsedGroups.has('ungrouped') ? '▸ ' : '▾ '}{item.title}
                </Text>
              </TouchableOpacity>
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {tasks.length === 0 ? (
        <EmptyTasksState onCreateTask={() => setActiveDialog('addTask')} />
      ) : isGroupedView ? (
        renderGroupedTasks()
      ) : (
        renderSimpleTasks()
      )}

      <AddFab style={styles.fab} onPress={() => setActiveDialog('addTask')} />

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
