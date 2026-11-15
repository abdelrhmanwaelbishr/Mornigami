import React, { useState, useMemo } from 'react';
import { useTasks } from '@/context/TasksContext';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { ExternalLink, X } from 'lucide-react';
import type { Task, TaskPriority } from '@/types';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils';

export const Todo: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const confirm = useConfirm();

  // View state: 'list' (default full width blocks) or 'grid'
  const [taskView, setTaskView] = useState<'list' | 'grid'>('list');

  // Filter state: 'pending' (default) or 'completed'
  const [currentFilter, setCurrentFilter] = useState<'pending' | 'completed'>('pending');

  // Sort state: 'default' | 'priority-high' | 'priority-low'
  const [sortCriteria, setSortCriteria] = useState<'default' | 'priority-high' | 'priority-low'>('default');

  // Drag & drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string>(() => {
    return new Date().toISOString().substring(0, 10);
  });
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('low');

  // Stats calculation
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;

  // Filter and Sort Tasks
  const processedTasks = useMemo(() => {
    let list = tasks.filter((t) => {
      if (currentFilter === 'pending') return !t.completed;
      if (currentFilter === 'completed') return t.completed;
      return true;
    });

    if (sortCriteria === 'priority-high') {
      const priorityMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      list = [...list].sort((a, b) => {
        const pA = priorityMap[a.priority || 'low'];
        const pB = priorityMap[b.priority || 'low'];
        return pB - pA;
      });
    } else if (sortCriteria === 'priority-low') {
      const priorityMap: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
      list = [...list].sort((a, b) => {
        const pA = priorityMap[a.priority || 'low'];
        const pB = priorityMap[b.priority || 'low'];
        return pA - pB;
      });
    }

    return list;
  }, [tasks, currentFilter, sortCriteria]);

  // Group tasks by dueDate (exact replica of legacy groupTasksByDate)
  const groupedTasks = useMemo(() => {
    const groups: Record<
      string,
      {
        dateKey: string;
        date: Date;
        tasks: Task[];
      }
    > = {};

    processedTasks.forEach((task) => {
      let dateKey = task.dueDate;
      if (dateKey && dateKey.includes('T')) {
        dateKey = dateKey.split('T')[0];
      }
      if (!dateKey) {
        dateKey = new Date().toISOString().split('T')[0];
      }

      const [year, month, day] = dateKey.split('-').map(Number);
      const dueDate = new Date(year, month - 1, day);

      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          date: dueDate,
          tasks: [],
        };
      }
      groups[dateKey].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [processedTasks]);

  // Date label formatting matching legacy getDateLabel
  const getDateLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareTime = date.getTime();
    if (compareTime === today.getTime()) {
      return 'Today';
    } else if (compareTime === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (compareTime === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  // Format date for task items (e.g., "Sep 6")
  const formatTaskDate = (dateStr: string) => {
    if (!dateStr) return '';
    let clean = dateStr;
    if (clean.includes('T')) clean = clean.split('T')[0];
    const [year, month, day] = clean.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Modal open handlers
  const handleOpenCreateModal = (defaultDate?: string) => {
    setEditingTaskId(null);
    setTaskName('');
    setTaskDueDate(defaultDate || new Date().toISOString().substring(0, 10));
    setTaskPriority('low');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskName(task.title);
    setTaskDueDate(task.dueDate || new Date().toISOString().substring(0, 10));
    setTaskPriority(task.priority || 'low');
    setModalOpen(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    if (editingTaskId) {
      updateTask(editingTaskId, {
        title: taskName.trim(),
        dueDate: taskDueDate,
        priority: taskPriority,
      });
    } else {
      addTask(taskName.trim(), 'General', taskDueDate, taskPriority);
    }
    setModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateKey) {
      setDragOverDate(dateKey);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      updateTask(taskId, { dueDate: targetDateKey });
    }
    setDraggedTaskId(null);
    setDragOverDate(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverDate(null);
  };

  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 w-full">
      {/* 1. Header (Brand Title & Subtitle + Actions) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
            Task Creases
          </h1>
          <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1">
            Shape your mornings with structured tasks, crease by crease.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/standalone/todo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-border bg-surface hover:bg-background text-text-secondary hover:text-text-primary transition-colors shadow-xs"
            title="Open Standalone Window"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>

          <Button
            onClick={() => handleOpenCreateModal()}
            className="h-10 px-4 font-bold text-xs gap-2 rounded-xl shadow-xs"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>New Task</span>
          </Button>
        </div>
      </header>

      {/* 2. Stats Section (3 Stat Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="bg-surface border border-border-light rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-secondary/10 text-secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 11L12 14L22 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-secondary mb-0.5">Total Tasks</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-text-primary leading-none">
              {totalCount}
            </p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-surface border border-border-light rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/30 text-emerald-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M22 4L12 14.01L9 11.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-secondary mb-0.5">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-text-primary leading-none">
              {completedCount}
            </p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-surface border border-border-light rounded-2xl p-5 flex items-center gap-4 shadow-xs hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-warning/10 text-warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 6V12L16 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-secondary mb-0.5">Pending</p>
            <p className="text-2xl sm:text-3xl font-bold font-display text-text-primary leading-none">
              {pendingCount}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Tasks Section Header & Controls */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <h2 className="font-display text-2xl font-bold text-text-primary tracking-tight">
            Your Tasks
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switch Controls */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setTaskView('list')}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer',
                  taskView === 'list'
                    ? 'text-primary bg-background shadow-xs font-bold'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-background/50'
                )}
                title="List view"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="3" rx="1.5" fill="currentColor" />
                  <rect x="2" y="8" width="14" height="3" rx="1.5" fill="currentColor" />
                  <rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setTaskView('grid')}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg transition-all cursor-pointer',
                  taskView === 'grid'
                    ? 'text-primary bg-background shadow-xs font-bold'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-background/50'
                )}
                title="Grid view"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                  <rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                  <rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                  <rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Sort Select */}
            <select
              value={sortCriteria}
              onChange={(e) => setSortCriteria(e.target.value as any)}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-border bg-surface text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer shadow-xs"
            >
              <option value="default">Sort by...</option>
              <option value="priority-high">Priority (High to Low)</option>
              <option value="priority-low">Priority (Low to High)</option>
            </select>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setCurrentFilter('pending')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  currentFilter === 'pending'
                    ? 'text-primary bg-background shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setCurrentFilter('completed')}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  currentFilter === 'completed'
                    ? 'text-primary bg-background shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* 4. Tasks List (Date-based Blocks) */}
        {groupedTasks.length > 0 ? (
          <div
            className={cn(
              taskView === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'flex flex-col gap-6 w-full'
            )}
          >
            {groupedTasks.map((group) => {
              const isToday = group.date.getTime() === todayZero.getTime();
              const isOverdue =
                group.date < todayZero && group.tasks.some((t) => !t.completed);
              const isDropTarget = dragOverDate === group.dateKey;

              return (
                <div
                  key={group.dateKey}
                  className={cn(
                    'bg-surface rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 border',
                    isOverdue
                      ? 'border-2 border-danger'
                      : isToday
                      ? 'border-2 border-secondary'
                      : 'border-border-light'
                  )}
                  onDragOver={(e) => handleDragOver(e, group.dateKey)}
                  onDrop={(e) => handleDrop(e, group.dateKey)}
                >
                  {/* Date Card Header */}
                  <div
                    className={cn(
                      'px-5 py-4 border-b border-border flex items-center justify-between',
                      isOverdue
                        ? 'bg-danger/10'
                        : isToday
                        ? 'bg-secondary/10'
                        : 'bg-background'
                    )}
                  >
                    <div className="flex flex-col">
                      <h3
                        className={cn(
                          'font-display text-base sm:text-lg font-bold leading-tight',
                          isOverdue
                            ? 'text-danger'
                            : isToday
                            ? 'text-secondary'
                            : 'text-text-primary'
                        )}
                      >
                        {getDateLabel(group.date)}
                      </h3>
                      <span className="text-xs font-semibold text-text-tertiary">
                        {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(group.dateKey)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-contrast shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                      title="Add task"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M10 4V16M4 10H16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Tasks Container */}
                  <div
                    className={cn(
                      'p-2 divide-y divide-border-light min-h-[60px] transition-colors',
                      isDropTarget && 'bg-primary/5 ring-2 ring-inset ring-primary/30'
                    )}
                  >
                    {group.tasks.map((task) => {
                      const isTaskOverdue =
                        group.date < todayZero && !task.completed;
                      const isTaskToday =
                        group.date.getTime() === todayZero.getTime() && !task.completed;
                      const isBeingDragged = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={cn(
                            'group flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-grab active:cursor-grabbing',
                            isBeingDragged && 'opacity-40 border border-dashed border-primary bg-background',
                            task.completed
                              ? 'opacity-60'
                              : isTaskOverdue
                              ? 'bg-rose-500/5 hover:bg-danger/10'
                              : isTaskToday
                              ? 'bg-warning/5 hover:bg-warning/10'
                              : 'hover:bg-background/60'
                          )}
                        >
                          {/* Circular Checkbox */}
                          <div
                            onClick={() => toggleTask(task.id)}
                            className={cn(
                              'w-[22px] h-[22px] min-w-[22px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0',
                              task.completed
                                ? 'bg-primary border-primary text-primary-contrast'
                                : 'border-border hover:border-primary/80 bg-transparent hover:scale-110'
                            )}
                            title={task.completed ? 'Mark pending' : 'Mark completed (+30 XP)'}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="none"
                              className={cn(
                                'transition-all duration-200 stroke-primary-contrast',
                                task.completed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                              )}
                            >
                              <path
                                d="M3 8L6 11L13 4"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>

                          {/* Task Name & Time */}
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                'text-xs sm:text-sm font-medium break-words',
                                task.completed
                                  ? 'line-through text-text-tertiary'
                                  : 'text-text-primary'
                              )}
                            >
                              {task.title}
                            </span>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Priority Dot */}
                              {task.priority && (
                                <span
                                  className={cn(
                                    'w-2 h-2 rounded-full shrink-0',
                                    task.priority === 'high' && 'bg-danger',
                                    task.priority === 'medium' && 'bg-warning',
                                    task.priority === 'low' && 'bg-success'
                                  )}
                                  title={`Priority: ${task.priority}`}
                                />
                              )}
                              <span className="text-[11px] font-semibold text-text-tertiary">
                                {formatTaskDate(task.dueDate)}
                              </span>
                            </div>
                          </div>

                          {/* Hover Actions */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(task);
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-secondary hover:bg-secondary/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              title="Edit task"
                            >
                              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                                <path
                                  d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                                <path
                                  d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25C15.4142 1.83579 16.0858 1.83579 16.5 2.25Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>

                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await confirm({
                                  title: 'Delete Task',
                                  message: 'Are you sure you want to delete this task?',
                                  confirmText: 'Delete Task',
                                  variant: 'danger',
                                });
                                if (ok) {
                                  deleteTask(task.id);
                                }
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-danger hover:bg-danger/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                              title="Delete task"
                            >
                              <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                                <path
                                  d="M3 5H15M7 8V13M11 8V13M13 5V14C13 14.5 12.5 15 12 15H6C5.5 15 5 14.5 5 14V5M7 5V3C7 2.5 7.5 2 8 2H10C10.5 2 11 2.5 11 3V5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty States Matching Legacy */
          <div>
            {currentFilter === 'completed' ? (
              <div className="text-center py-14 px-6 bg-surface border border-border rounded-2xl shadow-sm">
                <h3 className="font-display text-xl font-bold text-text-primary">
                  No completed tasks yet
                </h3>
              </div>
            ) : (
              <div className="text-center py-14 px-6 bg-surface border border-border rounded-2xl shadow-sm">
                <div
                  onClick={() => handleOpenCreateModal()}
                  className="inline-block mx-auto mb-4 text-text-tertiary hover:text-primary hover:scale-110 transition-all cursor-pointer group"
                  title="Create your first task"
                >
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <rect
                      x="15"
                      y="15"
                      width="50"
                      height="50"
                      rx="8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="8 8"
                      className="opacity-30 group-hover:opacity-60 transition-opacity"
                    />
                    <path
                      d="M40 30V50M30 40H50"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="opacity-40 group-hover:opacity-100 transition-opacity"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-text-primary">
                  A clear list is a good place to start
                </h3>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 5. Task Create / Edit Modal (Matching Legacy taskModal) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full p-6 bg-surface border border-border rounded-2xl shadow-xl">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <DialogTitle className="text-xl font-display font-bold text-text-primary" id="taskModalTitle">
              {editingTaskId ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <button
              onClick={() => setModalOpen(false)}
              className="text-text-tertiary hover:text-text-primary p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmitTask} className="space-y-4 pt-2">
            {/* Task Name */}
            <div className="space-y-1.5">
              <label htmlFor="taskNameInput" className="text-xs font-bold text-text-secondary">
                Task Name
              </label>
              <Input
                id="taskNameInput"
                required
                maxLength={100}
                placeholder="e.g., Finish project report, Buy groceries"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                autoFocus
                className="h-10 text-xs rounded-xl border border-border bg-background text-text-primary"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label htmlFor="taskDueDateInput" className="text-xs font-bold text-text-secondary">
                Due Date
              </label>
              <Input
                id="taskDueDateInput"
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="h-10 text-xs rounded-xl border border-border bg-background text-text-primary"
              />
            </div>

            {/* Priority Selection Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const isSelected = taskPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTaskPriority(p)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-surface hover:border-text-secondary/40'
                      )}
                    >
                      <div
                        className={cn(
                          'w-2.5 h-2.5 rounded-full',
                          p === 'low' && 'bg-success',
                          p === 'medium' && 'bg-warning',
                          p === 'high' && 'bg-danger'
                        )}
                      />
                      <span className="text-xs font-bold capitalize text-text-primary">
                        {p}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
                className="h-10 px-4 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 px-5 text-xs font-bold rounded-xl"
              >
                {editingTaskId ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

