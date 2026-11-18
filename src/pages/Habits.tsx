import React, { useState } from 'react';
import { useHabits } from '@/context/HabitsContext';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { SheetHeading } from '@/components/ui/SheetHeading';
import { TaskTick } from '@/components/ui/TaskTick';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Plus, Flame, Trash2, Edit2, Sprout } from 'lucide-react';
import type { Habit } from '@/types';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils';

const UNIT_LABEL: Record<Habit['durationUnit'], string> = {
  mins: 'min',
  hours: 'hr',
  times: 'times',
  pages: 'pages',
};

export const Habits: React.FC = () => {
  const {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitToday,
    isHabitCompletedToday,
  } = useHabits();
  const confirm = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Morning');
  const [targetDays, setTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [durationValue, setDurationValue] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<'mins' | 'hours' | 'times' | 'pages'>('mins');

  const categories = ['All', 'Morning', 'Health', 'Mindfulness', 'Productivity', 'Learning'];

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const openCreateModal = () => {
    setEditingHabit(null);
    setTitle('');
    setCategory('Morning');
    setTargetDays([0, 1, 2, 3, 4, 5, 6]);
    setDurationValue(30);
    setDurationUnit('mins');
    setModalOpen(true);
  };

  const openEditModal = (habit: Habit) => {
    setEditingHabit(habit);
    setTitle(habit.title);
    setCategory(habit.category);
    setTargetDays(habit.targetDays);
    setDurationValue(habit.durationValue);
    setDurationUnit(habit.durationUnit);
    setModalOpen(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        title: title.trim(),
        category,
        targetDays,
        durationValue,
        durationUnit,
      });
    } else {
      addHabit({
        title: title.trim(),
        category,
        targetDays,
        durationValue,
        durationUnit,
      });
    }
    setModalOpen(false);
  };

  const toggleDay = (dayIndex: number) => {
    if (targetDays.includes(dayIndex)) {
      if (targetDays.length > 1) {
        setTargetDays(targetDays.filter((d) => d !== dayIndex));
      }
    } else {
      setTargetDays([...targetDays, dayIndex].sort());
    }
  };

  const filteredHabits = habits.filter((h) =>
    selectedCategory === 'All' ? true : h.category === selectedCategory
  );
  const foldedToday = filteredHabits.filter(isHabitCompletedToday).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-text-primary">
            Habit Tracker
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            Build consistency, check off daily habits, and earn +50 XP per fold.
          </p>
        </div>

        <Button onClick={openCreateModal} className="h-10 px-4 font-bold gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Habit Fold</span>
        </Button>
      </div>

      {/* Category Pills Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-surface border border-border text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredHabits.length > 0 ? (
        <Sheet>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5">
            <SheetHeading id="habits-heading" note={`${foldedToday} of ${filteredHabits.length} folded`}>
              Today
            </SheetHeading>
          </div>
          <ul className="divide-y divide-border">
            {filteredHabits.map((habit) => {
              const completed = isHabitCompletedToday(habit);
              const streak = habit.currentStreak || 0;

              return (
                <li key={habit.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <TaskTick
                    done={completed}
                    onToggle={() => toggleHabitToday(habit.id)}
                    label={`${completed ? 'Undo' : 'Mark'} ${habit.title} for today`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-semibold transition-colors duration-200',
                        completed ? 'text-text-secondary' : 'text-text-primary'
                      )}
                    >
                      {habit.title}
                    </p>
                    <p className="truncate text-xs text-text-secondary">
                      {habit.category} · {habit.durationValue} {UNIT_LABEL[habit.durationUnit]} a day
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden="true">
                    {dayLabels.map((day, idx) => (
                      <span
                        key={`${habit.id}-${idx}`}
                        title={`Targets ${day}`}
                        className={cn(
                          'h-1.5 w-3 rounded-[1px]',
                          Array.isArray(habit.targetDays) && habit.targetDays.includes(idx)
                            ? 'bg-text-tertiary'
                            : 'bg-border'
                        )}
                      />
                    ))}
                  </div>

                  {streak > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-warning-ink tabular-nums">
                      <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                      {streak}d
                    </span>
                  )}

                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => openEditModal(habit)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                      title="Edit habit"
                      aria-label={`Edit ${habit.title}`}
                    >
                      <Edit2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Delete Habit',
                          message: `Are you sure you want to delete "${habit.title}"?`,
                          confirmText: 'Delete Habit',
                          variant: 'danger',
                        });
                        if (ok) {
                          deleteHabit(habit.id);
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer"
                      title="Delete habit"
                      aria-label={`Delete ${habit.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Sheet>
      ) : (
        <Sheet className="px-6 py-14 text-center">
          <Sprout className="mx-auto h-9 w-9 text-text-tertiary" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-bold text-text-primary">
            {habits.length === 0 ? 'No habits folded yet' : 'Nothing in this category'}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-xs text-text-secondary">
            Fold your first habit and it appears here every morning it is due.
          </p>
          <Button onClick={openCreateModal} className="mt-5 h-10 px-4 text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>New Habit Fold</span>
          </Button>
        </Sheet>
      )}

      {/* Habit Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md w-full p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">
              {editingHabit ? 'Edit Habit Fold' : 'Create New Habit Fold'}
            </DialogTitle>
            <DialogDescription className="text-xs text-text-secondary">
              Set clear, repeatable targets to shape your daily routine.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveHabit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Habit Title</label>
              <Input
                required
                placeholder="e.g., Morning Meditation, Read 20 Pages"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {categories.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Target Days Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Active Days of Week</label>
              <div className="grid grid-cols-7 gap-1">
                {dayLabels.map((day, idx) => {
                  const selected = Array.isArray(targetDays) && targetDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={cn(
                        'h-9 rounded-lg text-xs font-bold border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-text-tertiary border-border hover:bg-surface'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Duration & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Target Value</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={durationValue}
                  onChange={(e) => setDurationValue(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary">Unit</label>
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as Habit['durationUnit'])}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="mins">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="times">Times</option>
                  <option value="pages">Pages</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-bold mt-2">
              {editingHabit ? 'Save Habit Changes' : 'Fold New Habit (+50 XP potential)'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
