"use client";

import VideoTrack from "./video-track";
import AudioTrack from "./audio-track";
import PianoRoll from "./piano-roll";

interface TimelineProps {
  videoUrl: string | null;
  midiUrl: string | null;
  currentTime: number;
  isRecording?: boolean; // Pass this down
}

const TOTAL_SECONDS = 600; // 10 minutes
const PX_PER_SEC = 50; // Match PianoRoll

export default function Timeline({ videoUrl, midiUrl, currentTime, isRecording = false }: TimelineProps) {
  // Use pixel based positioning
  const playheadLeft = currentTime * PX_PER_SEC;
  const totalWidth = TOTAL_SECONDS * PX_PER_SEC;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Timeline header */}
      <div className="flex border-b border-border">
        {/* Track header spacer - Sticky */}
        <div className="w-44 shrink-0 border-r border-border bg-card px-3 py-1.5 flex items-center sticky left-0 z-20">
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
            TRACKS
          </span>
        </div>

        {/* Scrollable Container for Ruler + Tracks */}
        <div className="flex-1 overflow-auto relative">
          <div style={{ width: `${totalWidth}px`, minWidth: "100%" }}>
            {/* Ruler */}
            <div className="h-7 bg-[hsl(var(--track-surface))] border-b border-border sticky top-0 z-10">
              <div className="absolute inset-0 flex items-end pointer-events-none">
                {Array.from({ length: TOTAL_SECONDS }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 flex flex-col items-start"
                    style={{ left: `${i * PX_PER_SEC}px`, width: `${PX_PER_SEC}px` }}
                  >
                    {i % 4 === 0 ? (
                      <>
                        <span className="text-[9px] font-mono text-muted-foreground/60 pl-1 leading-none -mt-3">
                          {Math.floor(i / 4) + 1}
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
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/60 z-20"
                style={{ left: `${playheadLeft}px` }}
              >
                <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-3 h-1.5 bg-primary rounded-t-sm" />
              </div>
            </div>

            {/* Tracks Content */}
            <div className="relative">
              {/* We need to pass the width logic down or wrap these too? 
                Actually Video/Audio tracks might be simple divs.
                PianoRoll has its own internal scroller which is bad if we want synced scrolling.
                We should strip PianoRoll's internal horizontal scroll and let this parent div handle it.
            */}
              <VideoTrack videoUrl={videoUrl} />
              <AudioTrack />

              {/* Piano Roll - Global Scroll handled by parent, internal scroll removed */}
              <div className="relative border-t border-border">
                <PianoRoll midiUrl={midiUrl} currentTime={currentTime} isRecording={isRecording} />
              </div>

              {/* Recording Overlay Global */}
              {isRecording && (
                <div
                  className="absolute top-0 bottom-0 bg-red-500/5 pointer-events-none border-r-2 border-red-500/50 z-50"
                  style={{
                    left: 0,
                    width: `${playheadLeft}px`,
                    transition: 'width 0.1s linear'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
