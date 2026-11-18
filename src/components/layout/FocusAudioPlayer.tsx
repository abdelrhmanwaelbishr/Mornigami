import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, CloudRain, Coffee, ChevronDown } from 'lucide-react';
import { usePomodoro, AUDIO_TRACKS, type AudioTrackId } from '@/context/PomodoroContext';
import { cn } from '@/lib/utils';

export const FocusAudioPlayer: React.FC = () => {
  const {
    activeAudioTrack,
    isAudioPlaying,
    toggleAudio,
    setAudioTrack,
    audioVolume,
    setAudioVolume,
  } = usePomodoro();

  const [expanded, setExpanded] = useState(false);

  const trackIcons: Record<AudioTrackId, React.ReactNode> = {
    lofi: <Music className="w-3.5 h-3.5" />,
    rain: <CloudRain className="w-3.5 h-3.5" />,
    cafe: <Coffee className="w-3.5 h-3.5" />,
  };

  return (
    <div className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40">
      {expanded ? (
        <div className="w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-surface p-2.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAudio}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-accent-foreground shadow-xs transition-colors duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                isAudioPlaying ? 'bg-accent' : 'bg-accent/80 hover:bg-accent'
              )}
              aria-label={isAudioPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
            >
              {isAudioPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
            </button>

            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-bold text-text-primary">
              <span className="shrink-0 text-secondary">{trackIcons[activeAudioTrack]}</span>
              <span className="truncate font-sans">{AUDIO_TRACKS[activeAudioTrack].name}</span>
            </span>

            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-expanded={true}
              aria-label="Close ambient sound controls"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors duration-200 ease-out hover:bg-background hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3 motion-safe:animate-in motion-safe:fade-in-50 motion-safe:duration-200 motion-reduce:transition-none">
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAudioTrack(id)}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-colors duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    activeAudioTrack === id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                  aria-pressed={activeAudioTrack === id}
                >
                  {trackIcons[id]}
                  <span className="capitalize">{id}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setAudioVolume(audioVolume === 0 ? 0.5 : 0)}
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-secondary transition-colors duration-200 ease-out hover:bg-background hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                title={audioVolume === 0 ? 'Unmute' : 'Mute'}
                aria-label={audioVolume === 0 ? 'Unmute ambience' : 'Mute ambience'}
              >
                {audioVolume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Ambient audio volume"
              />
              <span className="w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums text-text-secondary">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        // A single puck: the old pill was 220 px wide and sat on top of task rows and chips.
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label="Ambient sound"
          className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-lg backdrop-blur-md transition-colors duration-200 ease-out hover:text-text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {trackIcons[activeAudioTrack]}
          {isAudioPlaying && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />
          )}
        </button>
      )}
    </div>
  );
};
