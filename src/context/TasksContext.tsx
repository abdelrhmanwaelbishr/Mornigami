import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { loadLocalData, saveLocalData } from '@/lib/storage';
import type { Task, TaskPriority } from '@/types';

interface TasksContextType {
  tasks: Task[];
  addTask: (title: string, category: string, dueDate: string, priority?: TaskPriority) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  reorderTasks: (newTasks: Task[]) => void;
  filter: 'all' | 'pending' | 'completed';
  setFilter: (f: 'all' | 'pending' | 'completed') => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userDoc } = useAuth();
  const { gainXP } = useGamification();

  const [tasks, setTasks] = useState<Task[]>(() => {
    const raw = loadLocalData<Task[]>('tasks', []);
    return Array.isArray(raw) ? raw : [];
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    if (userDoc?.tasks && Array.isArray(userDoc.tasks)) {
      setTasks(userDoc.tasks);
      localStorage.setItem('tasks', JSON.stringify(userDoc.tasks));
    }
  }, [userDoc]);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveLocalData('tasks', newTasks, user?.uid);
  };

  const addTask = (title: string, category: string, dueDate: string, priority: TaskPriority = 'medium') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      category,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    const filtered = tasks.filter((t) => t.id !== id);
    saveTasks(filtered);
  };

  const toggleTask = (id: string) => {
    let becameCompleted = false;
    const now = new Date().toISOString();
    const updated = tasks.map((t) => {
      if (t.id === id) {
        becameCompleted = !t.completed;
        return {
          ...t,
          completed: !t.completed,
          // Bounties ask "how many tasks today", which needs a timestamp, not a flag.
          completedAt: becameCompleted ? now : undefined,
        };
      }
      return t;
    });

    saveTasks(updated);

    if (becameCompleted) {
      gainXP(30, 'Task completed');
    }
  };

  const reorderTasks = (newTasks: Task[]) => {
    saveTasks(newTasks);
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTask,
        reorderTasks,
        filter,
        setFilter,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
