"use client";

import VideoTrack from "./video-track";
import AudioTrack from "./audio-track";
import PianoRoll from "./piano-roll";

interface TimelineProps {
  videoUrl: string | null;
  midiUrl: string | null;
  currentTime: number;
}

export default function Timeline({ videoUrl, midiUrl, currentTime }: TimelineProps) {
  // Simple mapping: 32 columns = 16 seconds (assuming 0.5s per column/beat)
  // This is just a visualization heuristic.
  const playheadLeft = `${Math.min(100, (currentTime / 16) * 100)}%`;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Timeline header */}
      <div className="flex border-b border-border">
        {/* Track header spacer */}
        <div className="w-44 shrink-0 border-r border-border bg-card px-3 py-1.5 flex items-center">
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
            TRACKS
          </span>
        </div>

        {/* Time ruler */}
        <div className="flex-1 relative h-7 bg-[hsl(var(--track-surface))]">
          <div className="absolute inset-0 flex items-end">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-start"
              >
                {i % 4 === 0 ? (
                  <>
                    <span className="text-[9px] font-mono text-muted-foreground/60 pl-0.5 leading-none">
                      {i / 4 + 1}
                    </span>
                    <div className="w-px h-2 bg-border mt-auto" />
                  </>
                ) : (
                  <div className="w-px h-1 bg-border/40 mt-auto" />
                )}
              </div>
            ))}
          </div>

          {/* Playhead on ruler */}
          <div className="absolute top-0 bottom-0 w-px bg-primary/60 z-10 transition-all duration-75 ease-linear" style={{ left: playheadLeft }}>
            <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3 h-1.5 bg-primary rounded-t-sm" />
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <VideoTrack videoUrl={videoUrl} />
        <AudioTrack />
        <PianoRoll midiUrl={midiUrl} />
      </div>
    </div>
  );
}
