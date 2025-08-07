import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskGroup } from '@features/tasks/types/Task';
import { 
  getTasks, 
  saveTask, 
  deleteTask, 
  getTaskGroups, 
  saveTaskGroup, 
  deleteTaskGroup,
  subscribeToTasks,
  subscribeToTaskGroups
} from '@features/tasks/services/tasks';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async () => {
    return await getTasks();
  }
);

export const addTask = createAsyncThunk(
  'tasks/addTask',
  async (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => {
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
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (task: Task) => {
    await saveTask(task);
    return task;
  }
);

export const removeTask = createAsyncThunk(
  'tasks/removeTask',
  async (taskId: string) => {
    await deleteTask(taskId);
    return taskId;
  }
);

export const toggleTaskCompleted = createAsyncThunk(
  'tasks/toggleTaskCompleted',
  async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    await saveTask(updatedTask);
    return updatedTask;
  }
);

export const fetchTaskGroups = createAsyncThunk(
  'tasks/fetchTaskGroups',
  async () => {
    return await getTaskGroups();
  }
);

export const addTaskGroup = createAsyncThunk(
  'tasks/addTaskGroup',
  async (groupData: { title: string; description?: string; color: string }) => {
    const id = await firebaseIdManager.getNextId('taskGroups');
    const taskGroup: TaskGroup = {
      id: id.toString(),
      title: groupData.title,
      description: groupData.description,
      color: groupData.color,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    await saveTaskGroup(taskGroup);
    return taskGroup;
  }
);

export const updateTaskGroup = createAsyncThunk(
  'tasks/updateTaskGroup',
  async (taskGroup: TaskGroup) => {
    await saveTaskGroup(taskGroup);
    return taskGroup;
  }
);

export const removeTaskGroup = createAsyncThunk(
  'tasks/removeTaskGroup',
  async (groupId: string) => {
    await deleteTaskGroup(groupId);
    return groupId;
  }
);

// State interface
interface TasksState {
  tasks: Task[];
  taskGroups: TaskGroup[];
  loading: boolean;
  error: string | null;
  groupedTasks: Record<string | 'ungrouped', Task[]>;
}

const initialState: TasksState = {
  tasks: [],
  taskGroups: [],
  loading: false,
  error: null,
  groupedTasks: {},
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      // Update grouped tasks
      const grouped = action.payload.reduce((acc, task) => {
        const groupKey = task.groupId || 'ungrouped';
        if (!acc[groupKey]) {
          acc[groupKey] = [];
        }
        acc[groupKey].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
      state.groupedTasks = grouped;
    },
    setTaskGroups: (state, action: PayloadAction<TaskGroup[]>) => {
      state.taskGroups = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch tasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.loading = false;
        // Update grouped tasks
        const grouped = action.payload.reduce((acc, task) => {
          const groupKey = task.groupId || 'ungrouped';
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
        state.groupedTasks = grouped;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      });

    // Add task
    builder
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
        // Update grouped tasks
        const groupKey = action.payload.groupId || 'ungrouped';
        if (!state.groupedTasks[groupKey]) {
          state.groupedTasks[groupKey] = [];
        }
        state.groupedTasks[groupKey].push(action.payload);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add task';
      });

    // Update task
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          // Update grouped tasks
          const grouped = state.tasks.reduce((acc, task) => {
            const groupKey = task.groupId || 'ungrouped';
            if (!acc[groupKey]) {
              acc[groupKey] = [];
            }
            acc[groupKey].push(task);
            return acc;
          }, {} as Record<string, Task[]>);
          state.groupedTasks = grouped;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update task';
      });

    // Remove task
    builder
      .addCase(removeTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
        // Update grouped tasks
        const grouped = state.tasks.reduce((acc, task) => {
          const groupKey = task.groupId || 'ungrouped';
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
        state.groupedTasks = grouped;
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to remove task';
      });

    // Toggle task completed
    builder
      .addCase(toggleTaskCompleted.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
          // Update grouped tasks
          const grouped = state.tasks.reduce((acc, task) => {
            const groupKey = task.groupId || 'ungrouped';
            if (!acc[groupKey]) {
              acc[groupKey] = [];
            }
            acc[groupKey].push(task);
            return acc;
          }, {} as Record<string, Task[]>);
          state.groupedTasks = grouped;
        }
      })
      .addCase(toggleTaskCompleted.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to toggle task';
      });

    // Fetch task groups
    builder
      .addCase(fetchTaskGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskGroups.fulfilled, (state, action) => {
        state.taskGroups = action.payload;
        state.loading = false;
      })
      .addCase(fetchTaskGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch task groups';
      });

    // Add task group
    builder
      .addCase(addTaskGroup.fulfilled, (state, action) => {
        state.taskGroups.push(action.payload);
      })
      .addCase(addTaskGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add task group';
      });

    // Update task group
    builder
      .addCase(updateTaskGroup.fulfilled, (state, action) => {
        const index = state.taskGroups.findIndex(group => group.id === action.payload.id);
        if (index !== -1) {
          state.taskGroups[index] = action.payload;
        }
      })
      .addCase(updateTaskGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update task group';
      });

    // Remove task group
    builder
      .addCase(removeTaskGroup.fulfilled, (state, action) => {
        state.taskGroups = state.taskGroups.filter(group => group.id !== action.payload);
        // Remove tasks from this group (set groupId to null)
        state.tasks = state.tasks.map(task => 
          task.groupId === action.payload ? { ...task, groupId: undefined } : task
        );
        // Update grouped tasks
        const grouped = state.tasks.reduce((acc, task) => {
          const groupKey = task.groupId || 'ungrouped';
          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
        state.groupedTasks = grouped;
      })
      .addCase(removeTaskGroup.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to remove task group';
      });
  },
});

export const { setTasks, setTaskGroups, clearError, setLoading } = tasksSlice.actions;
export default tasksSlice.reducer;
