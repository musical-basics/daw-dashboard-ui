"use client";

import { Video, Camera, MonitorOff } from "lucide-react";

export default function VideoPreview() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-mono font-medium text-foreground tracking-wider">
            VIDEO PREVIEW
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
            aria-label="Toggle camera"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center bg-background/50 m-2 rounded-md border border-border relative overflow-hidden">
        {/* Aspect ratio container */}
        <div className="w-full aspect-video max-h-full relative flex items-center justify-center">
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.05) 2px, rgba(0,255,255,0.05) 4px)",
            }}
          />

          {/* Center content */}
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="relative">
              <MonitorOff className="h-10 w-10 opacity-40" />
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive/60 animate-pulse" />
            </div>
            <span className="text-xs font-mono tracking-wider opacity-60">
              NO SIGNAL
            </span>
            <button className="text-[10px] font-mono tracking-wider border border-border rounded px-3 py-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all">
              CONNECT WEBCAM
            </button>
          </div>

          {/* Corner markers */}
          <div className="absolute top-2 left-2 h-4 w-4 border-l-2 border-t-2 border-primary/30" />
          <div className="absolute top-2 right-2 h-4 w-4 border-r-2 border-t-2 border-primary/30" />
          <div className="absolute bottom-2 left-2 h-4 w-4 border-l-2 border-b-2 border-primary/30" />
          <div className="absolute bottom-2 right-2 h-4 w-4 border-r-2 border-b-2 border-primary/30" />

          {/* Recording indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-50">
            <span className="text-[9px] font-mono text-muted-foreground">
              REC
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          </div>

          {/* Timecode overlay */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-muted-foreground/50 tabular-nums">
            00:00:00:00
          </div>
        </div>
      </div>
    </div>
  );
}
