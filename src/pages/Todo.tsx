import React, { useState, useMemo } from 'react';
import { useTasks } from '@/context/TasksContext';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { SheetHeading } from '@/components/ui/SheetHeading';
import { TaskTick } from '@/components/ui/TaskTick';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import { ExternalLink, X, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskPriority } from '@/types';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };

const PRIORITY_TONE: Record<TaskPriority, string> = {
  high: 'text-danger-ink',
  medium: 'text-warning-ink',
  low: '',
};

export const Todo: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const confirm = useConfirm();

  const [currentFilter, setCurrentFilter] = useState<'pending' | 'completed'>('pending');
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

  const openCount = tasks.filter((t) => !t.completed).length;
  const doneCount = tasks.length - openCount;

  const processedTasks = useMemo(() => {
    let list = tasks.filter((t) => (currentFilter === 'pending' ? !t.completed : t.completed));

    if (sortCriteria === 'priority-high') {
      list = [...list].sort(
        (a, b) => PRIORITY_WEIGHT[b.priority || 'low'] - PRIORITY_WEIGHT[a.priority || 'low']
      );
    } else if (sortCriteria === 'priority-low') {
      list = [...list].sort(
        (a, b) => PRIORITY_WEIGHT[a.priority || 'low'] - PRIORITY_WEIGHT[b.priority || 'low']
      );
    }

    return list;
  }, [tasks, currentFilter, sortCriteria]);

  // One sheet per due date, soonest first.
  const groupedTasks = useMemo(() => {
    const groups: Record<string, { dateKey: string; date: Date; tasks: Task[] }> = {};

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
        groups[dateKey] = { dateKey, date: dueDate, tasks: [] };
      }
      groups[dateKey].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [processedTasks]);

  const getDateLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareTime = date.getTime();
    if (compareTime === today.getTime()) return 'Today';
    if (compareTime === tomorrow.getTime()) return 'Tomorrow';
    if (compareTime === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  };

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

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateKey) setDragOverDate(dateKey);
  };

  const handleDrop = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) updateTask(taskId, { dueDate: targetDateKey });
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
    <div className="space-y-6">
      <PageHeader
        title="Task Creases"
        note={`${openCount} open · ${doneCount} done. Ticking a task pays +30 XP.`}
        actions={
          <>
            <Link
              to="/standalone/todo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
              title="Open standalone window"
              aria-label="Open standalone window"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Button onClick={() => handleOpenCreateModal()} className="h-11 gap-2 px-4 font-bold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>New task</span>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-border" role="group" aria-label="Filter tasks">
          {(['pending', 'completed'] as const).map((f, i) => (
            <button
              key={f}
              type="button"
              onClick={() => setCurrentFilter(f)}
              aria-pressed={currentFilter === f}
              className={cn(
                'min-h-11 px-4 text-xs font-semibold capitalize transition-colors duration-200',
                i > 0 && 'border-l border-border',
                currentFilter === f
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
          Sort
          <select
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value as typeof sortCriteria)}
            className="h-11 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="default">By date</option>
            <option value="priority-high">Priority, high first</option>
            <option value="priority-low">Priority, low first</option>
          </select>
        </label>
      </div>

      {groupedTasks.length > 0 ? (
        <div className="space-y-4">
          {groupedTasks.map((group) => {
            const isOverdue = group.date < todayZero && group.tasks.some((t) => !t.completed);
            const isDropTarget = dragOverDate === group.dateKey;

            return (
              <Sheet
                key={group.dateKey}
                onDragOver={(e) => handleDragOver(e, group.dateKey)}
                onDrop={(e) => handleDrop(e, group.dateKey)}
                className={cn(isDropTarget && 'ring-2 ring-inset ring-primary')}
              >
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-5">
                  <SheetHeading
                    level="h3"
                    className={cn(isOverdue && '[&_h3]:text-danger-ink')}
                    note={isOverdue ? '· overdue' : undefined}
                  >
                    {getDateLabel(group.date)}
                  </SheetHeading>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary tabular-nums">
                      {group.tasks.length} task{group.tasks.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(group.dateKey)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      title={`Add a task for ${getDateLabel(group.date)}`}
                      aria-label={`Add a task for ${getDateLabel(group.date)}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <ul className="divide-y divide-border">
                  {group.tasks.map((task) => {
                    const isBeingDragged = draggedTaskId === task.id;
                    const priority = task.priority || 'low';

                    return (
                      <li
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-1.5 transition-opacity duration-200 sm:px-5',
                          isBeingDragged && 'opacity-40'
                        )}
                      >
                        <TaskTick
                          done={task.completed}
                          onToggle={() => toggleTask(task.id)}
                          label={
                            task.completed
                              ? `Mark "${task.title}" pending`
                              : `Mark "${task.title}" done, +30 XP`
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'truncate text-sm font-medium',
                              task.completed
                                ? 'text-text-secondary line-through'
                                : 'text-text-primary'
                            )}
                          >
                            {task.title}
                          </p>
                          {priority !== 'low' && (
                            <p className={cn('text-xs font-medium', PRIORITY_TONE[priority])}>
                              {priority === 'high' ? 'High priority' : 'Medium priority'}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(task)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            title="Edit task"
                            aria-label={`Edit "${task.title}"`}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Delete task',
                                message: 'Are you sure you want to delete this task?',
                                confirmText: 'Delete task',
                                variant: 'danger',
                              });
                              if (ok) deleteTask(task.id);
                            }}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-danger-bg hover:text-danger-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            title="Delete task"
                            aria-label={`Delete "${task.title}"`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Sheet>
            );
          })}
        </div>
      ) : (
        <Sheet>
          <div className="p-10 text-center sm:p-14">
            <h2 className="font-display text-base font-bold text-text-primary">
              {currentFilter === 'completed' ? 'No completed tasks yet' : 'A clear list is a good place to start'}
            </h2>
            {currentFilter === 'pending' && (
              <Button
                onClick={() => handleOpenCreateModal()}
                className="mt-4 h-11 gap-2 px-4 font-bold"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New task</span>
              </Button>
            )}
          </div>
        </Sheet>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-full max-w-md rounded-3xl border border-border bg-surface p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              {editingTaskId ? 'Edit task' : 'New task'}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-background hover:text-text-primary"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </DialogHeader>

          <form onSubmit={handleSubmitTask} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="taskNameInput" className="text-xs font-bold text-text-secondary">
                Task name
              </label>
              <Input
                id="taskNameInput"
                required
                maxLength={100}
                placeholder="e.g. Finish the project report"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                autoFocus
                className="h-11 rounded-lg border border-border bg-background text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="taskDueDateInput" className="text-xs font-bold text-text-secondary">
                Due date
              </label>
              <Input
                id="taskDueDateInput"
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="h-11 rounded-lg border border-border bg-background text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-text-secondary">Priority</span>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Priority">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPriority(p)}
                    aria-pressed={taskPriority === p}
                    className={cn(
                      'min-h-11 rounded-lg border text-xs font-semibold capitalize transition-colors duration-200',
                      taskPriority === p
                        ? 'border-primary bg-primary text-primary-contrast'
                        : 'border-border bg-surface text-text-secondary hover:bg-background hover:text-text-primary'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="h-11 px-4 font-bold"
              >
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-5 font-bold">
                {editingTaskId ? 'Save changes' : 'Create task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
