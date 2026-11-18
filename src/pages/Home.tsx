import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBounties } from '@/context/BountiesContext';
import { useFinance } from '@/context/FinanceContext';
import { useHabits } from '@/context/HabitsContext';
import { usePomodoro } from '@/context/PomodoroContext';
import { useTasks } from '@/context/TasksContext';
import { Button } from '@/components/ui/Button';
import { Creases } from '@/components/ui/Creases';
import { Sheet } from '@/components/ui/Sheet';
import { SheetHeading } from '@/components/ui/SheetHeading';
import { Stat } from '@/components/ui/Stat';
import { TaskTick } from '@/components/ui/TaskTick';
import { ArrowRight, Check, Clock, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/types';

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Local calendar day, matching how habits and tasks store their dates. */
const dayStamp = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const greetingFor = (hour: number) => {
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const dueLabel = (task: Task, today: string) => {
  if (!task.dueDate) return null;
  if (task.dueDate === today) return 'Today';
  if (task.dueDate < today) return 'Overdue';
  const [, month, day] = task.dueDate.split('-');
  return `${Number(day)} ${new Date(2000, Number(month) - 1, 1).toLocaleDateString('en-GB', { month: 'short' })}`;
};

export const Home: React.FC = () => {
  const { userDoc } = useAuth();
  const { habits, isHabitCompletedToday } = useHabits();
  const { tasks, toggleTask } = useTasks();
  const { settings, stats } = usePomodoro();
  const { financeData, cycleDetails } = useFinance();
  const { bounties, bountyStats, countdown, claimBounty } = useBounties();

  const now = new Date();
  const today = dayStamp(now);
  const weekday = now.getDay();

  const scheduled = habits.filter((habit) => habit.targetDays.includes(weekday));
  const foldedToday = scheduled.filter((habit) => isHabitCompletedToday(habit)).length;
  const bestStreak = habits.reduce((best, habit) => Math.max(best, habit.currentStreak), 0);

  const openTasks = tasks.filter((task) => !task.completed);
  const dueToday = openTasks.filter((task) => task.dueDate === today).length;
  const nextUp = [...openTasks]
    .sort((a, b) => {
      const dueA = a.dueDate || '9999-99-99';
      const dueB = b.dueDate || '9999-99-99';
      if (dueA !== dueB) return dueA < dueB ? -1 : 1;
      return PRIORITY_RANK[a.priority || 'medium'] - PRIORITY_RANK[b.priority || 'medium'];
    })
    .slice(0, 4);

  const focusedMinutes = stats.sessionsToday * settings.workDuration;
  const unclaimedXp = bounties.reduce((sum, bounty) => (bounty.completed ? sum : sum + bounty.xp), 0);

  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      stamp: dayStamp(date),
      letter: date.toLocaleDateString('en-GB', { weekday: 'narrow' }),
      name: date.toLocaleDateString('en-GB', { weekday: 'long' }),
      count: habits.filter((habit) => habit.completedDates.includes(dayStamp(date))).length,
      isToday: dayStamp(date) === today,
    };
  });
  const weekPeak = Math.max(1, ...week.map((day) => day.count));

  const firstName = (userDoc?.displayName || '').trim().split(' ')[0];

  const measures: { value: string; label: string; note: string; prefix?: string }[] = [
    {
      value: `${foldedToday}/${scheduled.length}`,
      label: 'habits folded',
      note: bestStreak > 0 ? `${bestStreak}-day best streak` : 'No streak yet',
    },
    {
      value: String(openTasks.length),
      label: openTasks.length === 1 ? 'task left' : 'tasks left',
      note: dueToday > 0 ? `${dueToday} due today` : 'Nothing due today',
    },
    {
      value: `${focusedMinutes}m`,
      label: 'focused today',
      note: `${stats.sessionsToday} ${stats.sessionsToday === 1 ? 'session' : 'sessions'} of ${settings.workDuration} min`,
    },
    {
      prefix: financeData.currency,
      value: Math.round(financeData.dailyBudget).toLocaleString(),
      label: 'daily budget',
      note: `${cycleDetails.remainingDays} days left in cycle`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-balance font-display text-3xl font-black tracking-tight text-primary sm:text-4xl">
          {greetingFor(now.getHours())}
          {firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="text-sm text-text-secondary">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
          {foldedToday} of {scheduled.length} habits folded, {openTasks.length}{' '}
          {openTasks.length === 1 ? 'task' : 'tasks'} left.
        </p>
      </header>

      {/* Today and Bounties share the fold; the week strip closes the page. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Today: four measures, hairline seams instead of separate cards. */}
        <Sheet aria-labelledby="today-heading" className="lg:col-start-1 lg:row-start-1">
        <h2 id="today-heading" className="sr-only">
          Today
        </h2>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {measures.map((measure) => (
            <Stat key={measure.label} {...measure} />
          ))}
        </div>

        <div className="border-t border-border p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-base font-bold text-text-primary">Next up</h3>
            <Link
              to="/todo"
              className="inline-flex items-center gap-1 rounded text-xs font-semibold text-text-secondary transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              To-do list
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {nextUp.length === 0 ? (
            <p className="mt-3 text-sm text-text-secondary">
              Nothing left on the list. {tasks.length === 0 ? 'Add your first task' : 'Everything is done'} —{' '}
              <Link to="/todo" className="font-semibold text-primary underline-offset-4 hover:underline">
                open the to-do list
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {nextUp.map((task) => {
                const due = dueLabel(task, today);
                return (
                  <li key={task.id} className="flex items-center gap-3 py-2 first:pt-1 last:pb-1">
                    <TaskTick onToggle={() => toggleTask(task.id)} label={`Mark "${task.title}" done`} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{task.title}</span>
                    {due && (
                      <span
                        className={cn(
                          'shrink-0 text-xs font-semibold',
                          due === 'Overdue' ? 'text-danger-ink' : due === 'Today' ? 'text-warning-ink' : 'text-text-secondary'
                        )}
                      >
                        {due}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Sheet>

      {/* Bounties: the day's offers, as a ledger. */}
      <Sheet
        aria-labelledby="bounties-heading"
        className="lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:self-start"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5">
          <SheetHeading id="bounties-heading" icon={<Flame className="h-4 w-4 text-warning-ink" aria-hidden="true" />} note="· resets at midnight">
            Bounties
          </SheetHeading>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary tabular-nums">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Time left today:</span>
            {countdown || '00:00:00'}
          </div>
        </div>

        <ul className="divide-y divide-border">
          {bounties.map((bounty) => {
            const current =
              bounty.type === 'pomodoro'
                ? bountyStats?.pomodorosCompletedToday || 0
                : bounty.type === 'habit'
                  ? bountyStats?.habitsCompletedToday || 0
                  : bountyStats?.tasksCompletedToday || 0;
            const target = bounty.targetCount || 1;
            const canClaim = !bounty.completed && current >= target;

            return (
              <li key={bounty.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-text-primary">{bounty.title}</p>
                  <span className="shrink-0 text-xs font-bold text-warning-ink tabular-nums">+{bounty.xp} XP</span>
                </div>
                <p className="mt-0.5 text-xs text-text-secondary">{bounty.desc}</p>

                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Creases done={Math.min(current, target)} total={target} />
                    <span className="text-xs font-semibold text-text-secondary tabular-nums">
                      {current}/{target}
                    </span>
                  </div>
                  {canClaim ? (
                    <Button
                      size="sm"
                      onClick={() => claimBounty(bounty.id)}
                      className="h-10 bg-warning px-4 text-xs font-bold text-slate-900 hover:bg-warning-light sm:h-9"
                    >
                      Claim
                    </Button>
                  ) : bounty.completed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-ink">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Claimed
                    </span>
                  ) : (
                    <span className="text-xs text-text-secondary">{target - current} to go</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {bounties.length > 0 && (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border p-4 sm:px-5">
            <span className="text-xs text-text-secondary">XP still unclaimed today</span>
            <span className="text-xs font-bold text-warning-ink tabular-nums">{unclaimedXp} XP</span>
          </div>
        )}
      </Sheet>

        {/* The week, as creases. */}
        <Sheet
          aria-labelledby="week-heading"
          className="p-4 sm:p-5 lg:col-start-1 lg:row-start-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <SheetHeading id="week-heading" level="h2">
              Last seven days
            </SheetHeading>
            <p className="text-xs text-text-secondary">
              {bestStreak > 0 ? `Best streak ${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}` : 'No streak yet'}
            </p>
          </div>

          <ol className="mt-4 grid grid-cols-7 gap-2">
            {week.map((day) => (
              <li key={day.stamp} aria-current={day.isToday ? 'date' : undefined} className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-semibold text-text-secondary tabular-nums">{day.count}</span>
                <div className="flex h-16 w-full items-end justify-center" aria-hidden="true">
                  <div
                    className={cn(
                      'w-6 rounded-[2px] transition-colors duration-200 sm:w-8',
                      day.count === 0 ? 'bg-border' : day.isToday ? 'bg-primary' : 'bg-text-tertiary'
                    )}
                    style={{ height: `${day.count === 0 ? 2 : Math.max(8, Math.round((day.count / weekPeak) * 64))}px` }}
                  />
                </div>
                <span
                  className={cn('text-xs font-semibold', day.isToday ? 'text-primary' : 'text-text-secondary')}
                  aria-hidden="true"
                >
                  {day.letter}
                </span>
                <span className="sr-only">
                  {day.name}: {day.count} {day.count === 1 ? 'habit' : 'habits'} folded
                </span>
              </li>
            ))}
          </ol>
        </Sheet>
      </div>
    </div>
  );
};
