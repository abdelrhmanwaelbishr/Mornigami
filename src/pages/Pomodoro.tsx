import React, { useState } from 'react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Link } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Settings as SettingsIcon,
  Flame,
  Clock,
  Trophy,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const MODE_META = {
  work: { stroke: 'stroke-primary', dot: 'bg-primary', label: 'Deep Work Session' },
  shortBreak: { stroke: 'stroke-secondary', dot: 'bg-secondary', label: 'Short Break' },
  longBreak: { stroke: 'stroke-success', dot: 'bg-success', label: 'Long Break' },
} as const;

export const Pomodoro: React.FC = () => {
  const {
    settings,
    stats,
    mode,
    timeLeft,
    totalTime,
    isRunning,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
    activeAudioTrack,
    setAudioTrack,
    toggleAudio,
    isAudioPlaying,
  } = usePomodoro();

  const [zenMode, setZenMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workMins, setWorkMins] = useState(settings?.workDuration || 25);
  const [shortMins, setShortMins] = useState(settings?.shortBreakDuration || 5);
  const [longMins, setLongMins] = useState(settings?.longBreakDuration || 15);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
  const modeMeta = MODE_META[mode];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workDuration: workMins,
      shortBreakDuration: shortMins,
      longBreakDuration: longMins,
    });
    setSettingsOpen(false);
  };

  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 animate-in fade-in-50 duration-300 sm:p-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setZenMode(false)}
          className={cn(
            'absolute right-6 top-6 h-11 cursor-pointer gap-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98]',
            FOCUS_RING
          )}
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
          <span>Exit Zen Mode</span>
        </Button>

        <div className="relative my-6 flex flex-col items-center justify-center">
          <div
            className="pointer-events-none absolute h-64 w-64 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <svg className="h-80 w-80 -rotate-90 transform sm:h-96 sm:w-96">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-border"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={cn('transition-all duration-500 ease-out', modeMeta.stroke)}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-display text-6xl font-black tabular-nums tracking-tight text-text-primary sm:text-7xl">
              {formatTime(timeLeft)}
            </span>
            <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <span className={cn('h-1.5 w-1.5 rounded-full', modeMeta.dot)} aria-hidden="true" />
              {mode === 'work' ? 'Zen Focus' : modeMeta.label}
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button
            size="lg"
            onClick={isRunning ? pause : start}
            className={cn(
              'h-16 cursor-pointer gap-2 rounded-2xl px-10 text-lg font-bold shadow-lg transition-all duration-150 hover:shadow-xl active:scale-[0.98]',
              FOCUS_RING
            )}
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                <span>Start</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className={cn(
              'h-16 w-16 cursor-pointer rounded-2xl border-border transition-all active:scale-[0.98]',
              FOCUS_RING
            )}
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h1 className="font-display text-3xl font-black text-primary">Pomogami Focus Timer</h1>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            Shape distraction-free sessions. Earn +150 XP for every completed block.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
          <Link
            to="/standalone/pomodoro"
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-all duration-150 hover:bg-background hover:text-text-primary active:scale-[0.98]',
              FOCUS_RING
            )}
            title="Open Standalone Window"
            aria-label="Open standalone window"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setZenMode(true)}
            className={cn(
              'h-11 w-11 cursor-pointer rounded-xl transition-all active:scale-[0.98]',
              FOCUS_RING
            )}
            title="Enter Zen Mode (Full Screen)"
            aria-label="Enter Zen Mode"
          >
            <Maximize2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setWorkMins(settings.workDuration);
              setShortMins(settings.shortBreakDuration);
              setLongMins(settings.longBreakDuration);
              setSettingsOpen(true);
            }}
            className={cn(
              'h-11 w-11 cursor-pointer rounded-xl transition-all active:scale-[0.98]',
              FOCUS_RING
            )}
            title="Timer Settings"
            aria-label="Timer settings"
          >
            <SettingsIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div
          className="grid w-full max-w-md grid-cols-3 gap-1.5 rounded-2xl border border-border bg-surface p-1.5 shadow-sm"
          role="group"
          aria-label="Timer mode"
        >
          <button
            onClick={() => switchMode('work')}
            aria-pressed={mode === 'work'}
            className={cn(
              'min-h-11 cursor-pointer rounded-xl px-2 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.98] sm:px-5',
              FOCUS_RING,
              mode === 'work'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            Work ({settings.workDuration}m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            aria-pressed={mode === 'shortBreak'}
            className={cn(
              'min-h-11 cursor-pointer rounded-xl px-2 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.98] sm:px-5',
              FOCUS_RING,
              mode === 'shortBreak'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            Short Break ({settings.shortBreakDuration}m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            aria-pressed={mode === 'longBreak'}
            className={cn(
              'min-h-11 cursor-pointer rounded-xl px-2 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.98] sm:px-5',
              FOCUS_RING,
              mode === 'longBreak'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-text-secondary hover:bg-background hover:text-text-primary'
            )}
          >
            Long Break ({settings.longBreakDuration}m)
          </button>
        </div>
      </div>

      {/* Main Circular Timer Display */}
      <div className="relative my-6 flex flex-col items-center justify-center">
        <div
          className={cn(
            'pointer-events-none absolute h-56 w-56 rounded-full blur-3xl transition-colors duration-500 sm:h-64 sm:w-64',
            isRunning ? 'bg-primary/10' : 'bg-primary/5',
            isRunning && 'motion-safe:animate-pulse'
          )}
          aria-hidden="true"
        />
        <svg className="h-72 w-72 -rotate-90 transform sm:h-80 sm:w-80" aria-hidden="true">
          {/* Background circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className="stroke-border"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            className={cn('transition-all duration-500 ease-out', modeMeta.stroke)}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Countdown Label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span
            className="font-display text-5xl font-black tabular-nums tracking-tight text-text-primary sm:text-6xl"
            role="timer"
            aria-label={`${modeMeta.label}, ${formatTime(timeLeft)} remaining`}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
            <span className={cn('h-1.5 w-1.5 rounded-full', modeMeta.dot)} aria-hidden="true" />
            {modeMeta.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="lg"
          onClick={isRunning ? pause : start}
          className={cn(
            'h-14 cursor-pointer gap-2 rounded-2xl px-8 text-base font-bold shadow-md transition-all duration-150 hover:shadow-lg active:scale-[0.98]',
            FOCUS_RING
          )}
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5 fill-current" aria-hidden="true" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
              <span>Start Session</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className={cn(
            'h-14 w-14 cursor-pointer rounded-2xl border-border transition-all active:scale-[0.98]',
            FOCUS_RING
          )}
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        </Button>
      </div>

      {/* Session Statistics Cards */}
      <div className="grid grid-cols-3 gap-3 pt-4 sm:gap-4">
        <Card className="rounded-2xl p-4 text-center shadow-sm">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Trophy className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="font-display text-2xl font-black text-text-primary">
            {stats.sessionsToday}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-text-secondary">Sessions Today</div>
        </Card>

        <Card className="rounded-2xl p-4 text-center shadow-sm">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="font-display text-2xl font-black text-text-primary">
            {stats.totalFocusTime}m
          </div>
          <div className="mt-0.5 text-xs font-semibold text-text-secondary">Focus Minutes</div>
        </Card>

        <Card className="rounded-2xl p-4 text-center shadow-sm">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
          </div>
          <div className="font-display text-2xl font-black text-text-primary">
            {stats.currentStreak}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-text-secondary">Current Streak</div>
        </Card>
      </div>

      {/* Ambient Soundscape Presets Bar */}
      <Card className="rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Focus Ambience</h2>
            <p className="text-xs text-text-secondary">Loop calming sounds during focus sessions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ambience track">
            {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => {
              const isActive = activeAudioTrack === id && isAudioPlaying;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setAudioTrack(id);
                    if (!isAudioPlaying) toggleAudio();
                  }}
                  aria-pressed={isActive}
                  className={cn(
                    'min-h-10 cursor-pointer rounded-xl border px-3 text-xs font-bold transition-all duration-150 ease-out active:scale-[0.98]',
                    FOCUS_RING,
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                >
                  {AUDIO_TRACKS[id].name}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-full max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Timer Durations</DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Configure intervals to match your personal focus cadence.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="pomodoro-work-duration"
                className="block text-sm font-semibold text-text-primary"
              >
                Work Duration (minutes)
              </label>
              <Input
                id="pomodoro-work-duration"
                type="number"
                min="1"
                max="120"
                value={workMins}
                onChange={(e) => setWorkMins(parseInt(e.target.value, 10) || 1)}
                className="focus-visible:ring-offset-background"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pomodoro-short-break"
                className="block text-sm font-semibold text-text-primary"
              >
                Short Break (minutes)
              </label>
              <Input
                id="pomodoro-short-break"
                type="number"
                min="1"
                max="60"
                value={shortMins}
                onChange={(e) => setShortMins(parseInt(e.target.value, 10) || 1)}
                className="focus-visible:ring-offset-background"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pomodoro-long-break"
                className="block text-sm font-semibold text-text-primary"
              >
                Long Break (minutes)
              </label>
              <Input
                id="pomodoro-long-break"
                type="number"
                min="1"
                max="60"
                value={longMins}
                onChange={(e) => setLongMins(parseInt(e.target.value, 10) || 1)}
                className="focus-visible:ring-offset-background"
              />
            </div>

            <Button
              type="submit"
              className={cn(
                'mt-2 h-11 w-full cursor-pointer font-bold transition-all active:scale-[0.98]',
                FOCUS_RING
              )}
            >
              Apply Timer Settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
