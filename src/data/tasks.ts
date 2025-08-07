import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskGroup } from '../types/Task';
import { firebaseIdManager } from './firebaseIdManager';
import { logger } from '../utils/logger';

// Global error handler to suppress Firestore assertion errors
const handleFirestoreError = (error: any, operation: string) => {
  if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
    console.warn(`⚠️ Firestore assertion error in ${operation} - suppressing:`, error.message);
    return true; // Error was handled
  }
  return false; // Error was not handled
};

// Helper function to convert Date to Firestore Timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Helper function to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  } else if (timestamp?.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else {
    return new Date(timestamp);
  }
};

// Convert Firestore document to Task object
const docToTask = (doc: any): Task => {
  const data = doc.data();
  return {
    id: data.id?.toString() || doc.id,
    name: data.name || '',
    description: data.description,
    completed: data.completed || false,
    date: data.date?.toDate?.()?.toISOString() || new Date().toISOString(),
    dueDate: data.dueDate?.toDate?.()?.toISOString(),
    groupId: data.groupId?.toString(),
  };
};

// Convert Task object to Firestore document
const taskToDoc = (task: Task) => ({
  id: parseInt(task.id),
  name: task.name,
  description: task.description,
  completed: task.completed,
  date: task.date ? dateToTimestamp(new Date(task.date)) : dateToTimestamp(new Date()),
  dueDate: task.dueDate ? dateToTimestamp(new Date(task.dueDate)) : null,
  groupId: task.groupId ? parseInt(task.groupId) : null,
});

// Convert Firestore document to TaskGroup object
const docToTaskGroup = (doc: any): TaskGroup => {
  const data = doc.data();
  return {
    id: data.id?.toString() || doc.id,
    title: data.title || '',
    description: data.description,
    color: data.color || '#7C3AED',
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    isCompleted: data.isCompleted || false,
  };
};

// Convert TaskGroup object to Firestore document
const taskGroupToDoc = (taskGroup: TaskGroup) => ({
  id: parseInt(taskGroup.id),
  title: taskGroup.title,
  description: taskGroup.description,
  color: taskGroup.color,
  createdAt: taskGroup.createdAt ? dateToTimestamp(new Date(taskGroup.createdAt)) : dateToTimestamp(new Date()),
  isCompleted: taskGroup.isCompleted,
});

// Task CRUD operations
export const getTasks = async (): Promise<Task[]> => {
  try {
    console.log('Tasks: Fetching all tasks');
    const tasksRef = collection(db, 'tasks');
    const snapshot = await getDocs(tasksRef);
    
    const tasks = snapshot.docs.map(docToTask);
    
    console.log('Tasks: Fetched', tasks.length, 'tasks');
    return tasks;
  } catch (error) {
    if (!handleFirestoreError(error, 'getTasks')) {
      logger.error('Error fetching tasks:', error);
      console.error('Tasks: Error fetching tasks:', error);
    }
    return [];
  }
};

export const saveTask = async (task: Task): Promise<void> => {
  try {
    console.log('Tasks: Saving task:', { id: task.id, name: task.name });
    const taskRef = doc(db, 'tasks', task.id);
    const taskData = taskToDoc(task);
    
    await setDoc(taskRef, taskData);
    console.log('Tasks: Task saved successfully:', task.id);
  } catch (error) {
    if (!handleFirestoreError(error, 'saveTask')) {
      logger.error('Error saving task:', error);
      console.error('Tasks: Error saving task:', error);
      throw error;
    }
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    console.log('Tasks: Deleting task:', taskId);
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    console.log('Tasks: Task deleted successfully:', taskId);
  } catch (error) {
    if (!handleFirestoreError(error, 'deleteTask')) {
      logger.error('Error deleting task:', error);
      console.error('Tasks: Error deleting task:', error);
      throw error;
    }
  }
};

// Task Group CRUD operations
export const getTaskGroups = async (): Promise<TaskGroup[]> => {
  try {
    console.log('Tasks: Fetching all task groups');
    const groupsRef = collection(db, 'taskGroups');
    const snapshot = await getDocs(groupsRef);
    
    const taskGroups = snapshot.docs.map(docToTaskGroup);
    
    console.log('Tasks: Fetched', taskGroups.length, 'task groups');
    return taskGroups;
  } catch (error) {
    if (!handleFirestoreError(error, 'getTaskGroups')) {
      logger.error('Error fetching task groups:', error);
      console.error('Tasks: Error fetching task groups:', error);
    }
    return [];
  }
};

export const saveTaskGroup = async (taskGroup: TaskGroup): Promise<void> => {
  try {
    console.log('Tasks: Saving task group:', { id: taskGroup.id, title: taskGroup.title });
    const groupRef = doc(db, 'taskGroups', taskGroup.id);
    const groupData = taskGroupToDoc(taskGroup);
    
    await setDoc(groupRef, groupData);
    console.log('Tasks: Task group saved successfully:', taskGroup.id);
  } catch (error) {
    if (!handleFirestoreError(error, 'saveTaskGroup')) {
      logger.error('Error saving task group:', error);
      console.error('Tasks: Error saving task group:', error);
      throw error;
    }
  }
};

export const deleteTaskGroup = async (groupId: string): Promise<void> => {
  try {
    console.log('Tasks: Deleting task group:', groupId);
    const groupRef = doc(db, 'taskGroups', groupId);
    await deleteDoc(groupRef);
    console.log('Tasks: Task group deleted successfully:', groupId);
  } catch (error) {
    if (!handleFirestoreError(error, 'deleteTaskGroup')) {
      logger.error('Error deleting task group:', error);
      console.error('Tasks: Error deleting task group:', error);
      throw error;
    }
  }
};

// Real-time listeners
export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  try {
    console.log('Tasks: Setting up real-time listener for tasks');
    const tasksRef = collection(db, 'tasks');
    
    return onSnapshot(tasksRef, (snapshot) => {
      const tasks = snapshot.docs.map(docToTask);
      console.log('Tasks: Real-time update -', tasks.length, 'tasks');
      callback(tasks);
    }, (error) => {
      if (!handleFirestoreError(error, 'subscribeToTasks')) {
        console.error('Tasks: Error in real-time listener:', error);
      }
    });
  } catch (error) {
    console.error('Tasks: Error setting up real-time listener:', error);
    // Return a no-op function to prevent crashes
    return () => {};
  }
};

export const subscribeToTaskGroups = (callback: (taskGroups: TaskGroup[]) => void) => {
  try {
    console.log('Tasks: Setting up real-time listener for task groups');
    const groupsRef = collection(db, 'taskGroups');
    
    return onSnapshot(groupsRef, (snapshot) => {
      const taskGroups = snapshot.docs.map(docToTaskGroup);
      console.log('Tasks: Real-time update -', taskGroups.length, 'task groups');
      callback(taskGroups);
    }, (error) => {
      if (!handleFirestoreError(error, 'subscribeToTaskGroups')) {
        console.error('Tasks: Error in real-time listener:', error);
      }
    });
  } catch (error) {
    console.error('Tasks: Error setting up real-time listener:', error);
    // Return a no-op function to prevent crashes
    return () => {};
  }
};
