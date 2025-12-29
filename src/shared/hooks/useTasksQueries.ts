import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/lib';
import {
  getTasks,
  getTaskGroups,
  saveTask,
  deleteTask as deleteTaskService,
  saveTaskGroup,
  deleteTaskGroup as deleteTaskGroupService,
} from '@features/tasks/services/tasks';
import { Task, TaskGroup } from '@features/tasks/types/Task';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';

// Hook for fetching tasks
export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.list(),
    queryFn: getTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for fetching task groups
export function useTaskGroups() {
  return useQuery({
    queryKey: queryKeys.tasks.groups(),
    queryFn: getTaskGroups,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutation for adding a task
export function useAddTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
      const id = await firebaseIdManager.getNextId('tasks');
      const task: Task = {
        id: id.toString(),
        name: taskData.name,
        description: taskData.description,
        completed: false,
        date: new Date().toISOString(),
        dueDate: taskData.dueDate?.toISOString(),
        groupId: taskData.groupId,
      };
      await saveTask(task);
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
    },
  });
}

// Mutation for updating a task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => saveTask(task),
    onMutate: async (updatedTask) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list() });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.list());

      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.list(),
        (old) => old?.map((task) => (task.id === updatedTask.id ? updatedTask : task)) ?? [],
      );

      return { previousTasks };
    },
    onError: (_err, _updatedTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
    },
  });
}

// Mutation for deleting a task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTaskService(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list() });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.list());

      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.list(),
        (old) => old?.filter((task) => task.id !== taskId) ?? [],
      );

      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
    },
  });
}

// Mutation for toggling task completion
export function useToggleTaskCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: Task) => saveTask({ ...task, completed: !task.completed }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.list() });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks.list());

      queryClient.setQueryData<Task[]>(
        queryKeys.tasks.list(),
        (old) => old?.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)) ?? [],
      );

      return { previousTasks };
    },
    onError: (_err, _task, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.list(), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
    },
  });
}

// Mutation for adding a task group
export function useAddTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupData: { title: string; description?: string; color: string }) => {
      const id = await firebaseIdManager.getNextId('taskGroups');
      const group: TaskGroup = {
        id: id.toString(),
        title: groupData.title,
        description: groupData.description,
        color: groupData.color,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      };
      await saveTaskGroup(group);
      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.groups() });
    },
  });
}

// Mutation for updating a task group
export function useUpdateTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (group: TaskGroup) => saveTaskGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.groups() });
    },
  });
}

// Mutation for deleting a task group
export function useDeleteTaskGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => deleteTaskGroupService(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.groups() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.list() });
    },
  });
}

// Helper hook to get grouped tasks
export function useGroupedTasks() {
  const { data: tasks = [] } = useTasks();
  const { data: taskGroups = [] } = useTaskGroups();

  const groupedTasks: Record<string, Task[]> = {};

  // Initialize groups
  taskGroups.forEach((group) => {
    groupedTasks[group.id] = [];
  });
  groupedTasks['ungrouped'] = [];

  // Group tasks
  tasks.forEach((task) => {
    if (task.groupId && groupedTasks[task.groupId]) {
      groupedTasks[task.groupId].push(task);
    } else {
      groupedTasks['ungrouped'].push(task);
    }
  });

  // Sort each group by due date
  Object.keys(groupedTasks).forEach((key) => {
    groupedTasks[key].sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });
  });

  return groupedTasks;
}
