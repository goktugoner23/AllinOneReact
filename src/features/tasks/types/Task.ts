export interface Task {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  date: string; // ISO string for creation date
  dueDate?: string; // ISO string for due date
  groupId?: string; // Optional group ID for task grouping
}

export interface TaskGroup {
  id: string;
  title: string;
  description?: string;
  color: string; // Hex color string
  createdAt: string; // ISO string
  isCompleted: boolean; // True when all tasks in group are completed
}

// Form data interfaces for dialogs
export interface TaskFormData {
  name: string;
  description?: string;
  dueDate?: Date;
  groupId?: string;
}

export interface TaskGroupFormData {
  title: string;
  description?: string;
  color: string;
}

// Available colors for task groups (matching the theme)
export const TASK_GROUP_COLORS = [
  { value: '#7C3AED', label: 'Purple' }, // Primary theme color
  { value: '#4CAF50', label: 'Green' },  // Income color
  { value: '#F44336', label: 'Red' },    // Expense color
  { value: '#FF9800', label: 'Orange' }, // Investment color
  { value: '#2196F3', label: 'Blue' },   // Registration color
  { value: '#9C27B0', label: 'Deep Purple' },
  { value: '#607D8B', label: 'Blue Grey' },
  { value: '#795548', label: 'Brown' },
] as const;

export type TaskGroupColor = typeof TASK_GROUP_COLORS[number]['value'];
