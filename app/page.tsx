"use client";

import { useRef, useEffect } from "react";
import TransportBar from "@/components/daw/transport-bar";
import VideoPreview from "@/components/daw/video-preview";
import Timeline from "@/components/daw/timeline";

import { useProject } from "@/hooks/use-project";
import { useMidiOut } from "@/hooks/use-midi-out";
import { usePlayback } from "@/hooks/use-playback";
import { useRecorder } from "@/hooks/use-recorder";

export default function Page() {
  const { videoUrl, midiUrl, loadLatestTake } = useProject();
  const midiOut = useMidiOut();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isPlaying, currentTime, play, stop, rewind } = usePlayback(videoRef, midiUrl, midiOut);
  const { isRecording } = useRecorder();

  // Auto-load latest take when recording stops
  useEffect(() => {
    if (!isRecording) {
      loadLatestTake();
    }
  }, [isRecording, loadLatestTake]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Transport Bar */}
      <TransportBar
        isPlaying={isPlaying}
        onPlay={play}
        onStop={stop}
        onRewind={rewind}
        currentTime={currentTime}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Video Preview (left/top) */}
        <div className="lg:w-[420px] xl:w-[480px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card h-[240px] sm:h-[280px] lg:h-auto">
          <VideoPreview ref={videoRef} videoUrl={videoUrl} />
        </div>

        {/* Timeline (right/bottom) */}
        <div className="flex-1 min-w-0 min-h-0">
          <Timeline videoUrl={videoUrl} midiUrl={midiUrl} currentTime={currentTime} />
        </div>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${midiOut.isEnabled ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
            <span className="text-[10px] font-mono text-muted-foreground">
              {midiOut.isEnabled ? "MIDI READY" : "NO MIDI"}
            </span>
          </div>
          {midiOut.selectedOutputId && (
            <span className="text-[10px] font-mono text-muted-foreground/50">
              OUT: {midiOut.outputs.find(o => o.id === midiOut.selectedOutputId)?.name.substring(0, 15)}...
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground/50">
            48kHz / 24bit
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground/50">
            CPU 12%
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/50">
            RAM 340MB
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-1 rounded-sm ${i < 3
                    ? "bg-accent"
                    : i < 4
                      ? "bg-[hsl(45,100%,50%)]"
                      : "bg-border"
                  }`}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
