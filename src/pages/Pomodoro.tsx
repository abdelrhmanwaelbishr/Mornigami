import React, { useState } from 'react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { SheetHeading } from '@/components/ui/SheetHeading';
import { Stat } from '@/components/ui/Stat';
import { PageHeader } from '@/components/ui/PageHeader';
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
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MODE_LABEL = {
  work: 'Deep work',
  shortBreak: 'Short break',
  longBreak: 'Long break',
} as const;

const MODES = [
  { id: 'work', label: 'Work', key: 'workDuration' },
  { id: 'shortBreak', label: 'Short', key: 'shortBreakDuration' },
  { id: 'longBreak', label: 'Long', key: 'longBreakDuration' },
] as const;

/** The session's progress, drawn as a filled hairline instead of a ring. */
const CreaseBar: React.FC<{ percent: number; className?: string }> = ({ percent, className }) => (
  <div
    className={cn('h-0.5 w-full overflow-hidden rounded-[1px] bg-border', className)}
    role="progressbar"
    aria-label="Session progress"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(percent)}
  >
    <div
      className="h-full bg-primary transition-[width] duration-200 ease-out"
      style={{ width: `${percent}%` }}
    />
  </div>
);

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
  // A set is four sessions; the crease row shows where this one sits in it.
  const setFilled = stats.sessionsToday === 0 ? 0 : ((stats.sessionsToday - 1) % 4) + 1;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      workDuration: workMins,
      shortBreakDuration: shortMins,
      longBreakDuration: longMins,
    });
    setSettingsOpen(false);
  };

  /** One crease bar: the session's progress, drawn as a filled hairline. */  if (zenMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6 sm:p-12">
        <Button
          variant="ghost"
          onClick={() => setZenMode(false)}
          className="absolute right-4 top-4 h-11 gap-1.5 px-3 text-xs font-bold"
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
          <span>Exit</span>
        </Button>

        <p
          className="font-display text-6xl font-black tabular-nums tracking-tight text-text-primary sm:text-7xl"
          role="timer"
          aria-label={`${MODE_LABEL[mode]}, ${formatTime(timeLeft)} remaining`}
        >
          {formatTime(timeLeft)}
        </p>
        <p className="mt-3 text-sm font-medium text-text-secondary">{MODE_LABEL[mode]}</p>

        <CreaseBar percent={progressPercent} className="mt-8 max-w-md" />

        <div className="mt-10 flex items-center gap-3">
          <Button onClick={isRunning ? pause : start} className="h-12 gap-2 px-8 font-bold">
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
            className="h-12 w-12"
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Pomogami Focus Timer"
        note="One block, one crease. Every finished session pays +150 XP."
        actions={
          <>
            <Link
              to="/standalone/pomodoro"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
              title="Open standalone window"
              aria-label="Open standalone window"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZenMode(true)}
              className="h-11 w-11"
              title="Enter Zen mode"
              aria-label="Enter Zen mode"
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
              className="h-11 w-11"
              title="Timer durations"
              aria-label="Timer durations"
            >
              <SettingsIcon className="h-4 w-4 text-text-secondary" aria-hidden="true" />
            </Button>
          </>
        }
      />

      <Sheet>
        <div role="group" aria-label="Timer mode" className="grid grid-cols-3 border-b border-border">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
              className={cn(
                'min-h-11 px-2 py-3 text-xs font-semibold transition-colors duration-200',
                i > 0 && 'border-l border-border',
                mode === m.id
                  ? 'bg-background text-text-primary shadow-[inset_0_-2px_0_0_rgb(var(--color-primary))]'
                  : 'text-text-secondary hover:bg-background hover:text-text-primary'
              )}
            >
              {m.label} · {settings[m.key]}m
            </button>
          ))}
        </div>

        <div className="px-4 py-10 text-center sm:py-12">
          <p
            className="font-display text-3xl font-black tabular-nums tracking-tight text-text-primary sm:text-4xl"
            role="timer"
            aria-label={`${MODE_LABEL[mode]}, ${formatTime(timeLeft)} remaining`}
          >
            {formatTime(timeLeft)}
          </p>
          <p className="mt-2 text-xs font-medium text-text-secondary">{MODE_LABEL[mode]}</p>

          <CreaseBar percent={progressPercent} className="mx-auto mt-6 max-w-sm" />

          <div className="mt-4 flex items-center justify-center gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-5 rounded-[1px] transition-colors duration-200',
                  i < setFilled ? 'bg-primary' : 'bg-border'
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            {setFilled === 0 ? 'Set of four not started' : `${setFilled} of 4 in this set`}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-border p-4">
          <Button
            onClick={isRunning ? pause : start}
            className="h-11 min-w-[10rem] gap-2 px-6 font-bold"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                <span>Start focus</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
            className="h-11 w-11"
            title="Reset timer"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-4 w-4 text-text-secondary" aria-hidden="true" />
          </Button>
        </div>
      </Sheet>

      <Sheet>
        <div className="grid grid-cols-3 gap-px bg-border">
          <Stat value={String(stats.sessionsToday)} label="Sessions today" />
          <Stat value={String(stats.totalFocusTime)} label="Focus minutes" />
          <Stat value={String(stats.currentStreak)} label="Sessions total" />
        </div>
      </Sheet>

      <Sheet>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5">
          <SheetHeading id="ambience-heading" note="· loops while you focus">
            Ambience
          </SheetHeading>
        </div>
        <div role="group" aria-label="Ambience track" className="flex flex-wrap gap-2 p-4">
          {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => {
            const isActive = activeAudioTrack === id && isAudioPlaying;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAudioTrack(id);
                  if (!isAudioPlaying) toggleAudio();
                }}
                aria-pressed={isActive}
                className={cn(
                  'min-h-11 rounded-lg border px-3 text-xs font-semibold transition-colors duration-200',
                  isActive
                    ? 'border-primary bg-primary text-primary-contrast'
                    : 'border-border bg-surface text-text-secondary hover:bg-background hover:text-text-primary'
                )}
              >
                {AUDIO_TRACKS[id].name}
              </button>
            );
          })}
        </div>
      </Sheet>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-full max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-text-primary">
              Timer durations
            </DialogTitle>
            <DialogDescription className="text-sm text-text-secondary">
              Match the intervals to how you actually focus.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="pomodoro-work-duration" className="block text-sm font-semibold text-text-primary">
                Work duration (minutes)
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
              <label htmlFor="pomodoro-short-break" className="block text-sm font-semibold text-text-primary">
                Short break (minutes)
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
              <label htmlFor="pomodoro-long-break" className="block text-sm font-semibold text-text-primary">
                Long break (minutes)
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

            <Button type="submit" className="mt-2 h-11 w-full font-bold">
              Apply timer settings
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
