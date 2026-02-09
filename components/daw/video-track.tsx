"use client";

import { Video, Volume2, Eye, Lock } from "lucide-react";

const videoClips = [
  { start: 2, width: 18, label: "Intro.mp4" },
  { start: 24, width: 30, label: "MainShot_01.mp4" },
  { start: 58, width: 14, label: "Cutaway_B.mp4" },
  { start: 76, width: 20, label: "Interview.mp4" },
];

interface VideoTrackProps {
  videoUrl: string | null;
}

export default function VideoTrack({ videoUrl }: VideoTrackProps) {
  return (
    <div className="flex border-b border-border group">
      {/* Track header */}
      <div className="w-44 shrink-0 border-r border-border bg-card px-3 py-2 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-5 w-5 rounded bg-[hsl(210,100%,55%)]/20 flex items-center justify-center">
            <Video className="h-3 w-3 text-[hsl(210,100%,55%)]" />
          </div>
          <span className="text-xs font-mono font-medium text-foreground tracking-wider">
            VIDEO 1
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mute track"
          >
            <Volume2 className="h-3 w-3" />
          </button>
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle visibility"
          >
            <Eye className="h-3 w-3" />
          </button>
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Lock track"
          >
            <Lock className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Track content */}
      <div className="flex-1 relative h-16 bg-[hsl(var(--track-surface))] overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-border/30"
              style={{
                borderRightColor:
                  i % 4 === 3
                    ? "hsl(var(--border))"
                    : "hsl(var(--border) / 0.15)",
              }}
            />
          ))}
        </div>

        {/* Video clips */}
        {videoUrl ? (
          <div
            className="absolute top-1.5 bottom-1.5 rounded-sm border border-[hsl(210,100%,55%)]/40 bg-[hsl(210,100%,55%)]/15 cursor-pointer hover:bg-[hsl(210,100%,55%)]/25 hover:border-[hsl(210,100%,55%)]/60 transition-all group/clip"
            style={{
              left: `0%`,
              width: `100%`, // Spanning full width for now as "one take"
            }}
          >
            {/* Thumbnail lines */}
            <div className="absolute inset-0 overflow-hidden rounded-sm">
              {Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={j}
                  className="absolute top-0 bottom-0 w-px bg-[hsl(210,100%,55%)]/10"
                  style={{ left: `${(j + 1) * 12}%` }}
                />
              ))}
            </div>
            <div className="absolute top-1 left-1.5 text-[9px] font-mono text-[hsl(210,100%,70%)] truncate max-w-[calc(100%-12px)]">
              {videoUrl.split('/').pop()}
            </div>
            {/* Resize handles */}
            <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 bg-[hsl(210,100%,55%)]/40 rounded-l-sm transition-opacity" />
            <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 bg-[hsl(210,100%,55%)]/40 rounded-r-sm transition-opacity" />
          </div>
        ) : (
          // Placeholder or empty state if needed, or keeping dummy clips optionally?
          // For this task, "replace dummy clips" implies removing them or only showing if url exists.
          // Showing nothing if no URL for clarity.
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/30 font-mono">
            NO CLIP
          </div>
        )}
      </div>
    </div>
  );
}
