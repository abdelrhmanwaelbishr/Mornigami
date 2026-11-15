import React, { useState } from 'react';
import { useHabits } from '@/context/HabitsContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Plus, Check, Flame, Trash2, Edit2, Calendar, Sprout } from 'lucide-react';
import type { Habit } from '@/types';
import { useConfirm } from '@/context/ConfirmContext';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">
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

      {/* Habits Grid */}
      {filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHabits.map((habit) => {
            const completed = isHabitCompletedToday(habit);

            return (
              <Card
                key={habit.id}
                className={cn(
                  'flex flex-col justify-between transition-all duration-200 border-2',
                  completed
                    ? 'border-success/40 bg-success/5 shadow-xs'
                    : 'border-border bg-surface hover:border-primary/40'
                )}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-background border border-border text-text-secondary">
                        {habit.category}
                      </span>
                      <CardTitle className="text-base font-bold text-text-primary mt-1">
                        {habit.title}
                      </CardTitle>
                    </div>

                    {/* Streak Badge */}
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/15 text-warning font-black text-xs shrink-0"
                      title={`${habit.currentStreak || 0} days streak`}
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{habit.currentStreak || 0}d</span>
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    <span>Goal: {habit.durationValue} {habit.durationUnit} / day</span>
                  </p>
                </CardHeader>

                <CardContent className="p-5 pt-0 space-y-4">
                  {/* Days of week active indicators */}
                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/50">
                    {dayLabels.map((day, idx) => {
                      const isActiveDay = Array.isArray(habit.targetDays) && habit.targetDays.includes(idx);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold',
                            isActiveDay
                              ? 'bg-primary/10 text-primary font-black'
                              : 'text-text-tertiary opacity-40'
                          )}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions & Complete Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => toggleHabitToday(habit.id)}
                      className={cn(
                        'flex-1 h-10 font-bold gap-2 text-xs transition-all',
                        completed
                          ? 'bg-success text-white hover:bg-success/90'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      <Check className="w-4 h-4" />
                      <span>{completed ? 'Completed Today! (+50 XP)' : 'Mark Completed'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(habit)}
                      className="w-10 h-10 rounded-xl"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-4 h-4 text-text-secondary" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
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
                      className="w-10 h-10 rounded-xl text-danger hover:bg-danger-bg hover:text-danger"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="mb-3 flex justify-center text-success"><Sprout className="h-9 w-9" aria-hidden="true" /></div>
          <h3 className="font-display text-lg font-bold text-text-primary">
            No habits in this category yet
          </h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mt-1 mb-5">
            Fold your very first habit to start stacking daily consistency streaks and leveling up!
          </p>
          <Button onClick={openCreateModal} className="font-bold text-xs">
            Create Habit Fold
          </Button>
        </Card>
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
                  onChange={(e) => setDurationUnit(e.target.value as any)}
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

