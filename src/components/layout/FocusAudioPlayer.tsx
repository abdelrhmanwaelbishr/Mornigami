import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, CloudRain, Coffee, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div className="fixed bottom-20 right-3 md:bottom-4 md:right-4 z-40 max-w-[calc(100vw-24px)]">
      <div
        className={cn(
          'flex flex-col bg-surface border border-border rounded-2xl shadow-lg transition-all duration-300 p-2.5 backdrop-blur-md',
          expanded ? 'w-72 max-w-[calc(100vw-24px)]' : 'w-auto'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={toggleAudio}
            className={cn(
              'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold cursor-pointer transition-all duration-200 ease-out active:scale-95 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0',
              isAudioPlaying ? 'bg-primary' : 'bg-primary/80 hover:bg-primary'
            )}
            title={isAudioPlaying ? 'Pause Ambience' : 'Play Ambient Sound'}
            aria-label={isAudioPlaying ? 'Pause ambient sound' : 'Play ambient sound'}
          >
            {isAudioPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Current track indicator */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse audio controls' : 'Expand audio controls'}
            className="flex items-center gap-1.5 cursor-pointer px-2 py-1.5 rounded-xl text-xs font-bold text-text-primary hover:text-primary hover:bg-background/80 transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="text-secondary shrink-0">{trackIcons[activeAudioTrack]}</span>
            <span className="truncate max-w-[120px] font-sans">
              {AUDIO_TRACKS[activeAudioTrack].name}
            </span>
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-text-secondary shrink-0" />
            )}
          </button>
        </div>

        {/* Expanded Controls */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2.5 motion-safe:animate-in motion-safe:fade-in-50 motion-safe:duration-200 motion-reduce:transition-none">
            {/* Track Selector Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(AUDIO_TRACKS) as AudioTrackId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAudioTrack(id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold border cursor-pointer transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                    activeAudioTrack === id
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border bg-background text-text-secondary hover:bg-surface hover:text-text-primary'
                  )}
                  aria-pressed={activeAudioTrack === id}
                >
                  {trackIcons[id]}
                  <span className="capitalize">{id}</span>
                </button>
              ))}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 px-1">
              <button
                type="button"
                onClick={() => setAudioVolume(audioVolume === 0 ? 0.5 : 0)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-background/80 cursor-pointer transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface shrink-0"
                title={audioVolume === 0 ? 'Unmute' : 'Mute'}
                aria-label={audioVolume === 0 ? 'Unmute ambience' : 'Mute ambience'}
              >
                {audioVolume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label="Ambient audio volume"
              />
              <span className="text-[10px] font-semibold text-text-secondary w-6 text-right shrink-0">
                {Math.round(audioVolume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
