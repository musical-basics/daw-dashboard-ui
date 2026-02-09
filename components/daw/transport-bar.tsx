"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  SkipBack,
  Play,
  Square,
  Circle,
  Pause,
  ChevronDown,
} from "lucide-react";

import { useRecorder } from "@/hooks/use-recorder";

export default function TransportBar() {
  const [isPlaying, setIsPlaying] = useState(false);
  // Remove local isRecording state
  // const [isRecording, setIsRecording] = useState(false);
  const { isRecording: isRecordingState, isConnecting, startRecording, stopRecording } = useRecorder();

  const [time, setTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [bpmEditing, setBpmEditing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopTimer();
    } else {
      setIsPlaying(true);
      startTimer();
    }
  };

  const handleStop = async () => {
    setIsPlaying(false);
    if (isRecordingState) {
      await stopRecording();
    }
    stopTimer();
  };

  const handleRecord = async () => {
    if (isRecordingState) {
      await stopRecording();
      setIsPlaying(false);
      stopTimer();
    } else {
      await startRecording();
      // Only start playing/timer if recording successfully started
      // But since startRecording is async, we might want to check isRecordingState
      // For now, let's assume if it doesn't throw, it started.
      setIsPlaying(true);
      startTimer();
    }
  };

  const handleRewind = () => {
    setTime(0);
    if (!isPlaying) stopTimer();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <header className="flex items-center justify-between bg-card border-b border-border px-4 py-2">
      {/* Left: App name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-primary" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-primary">
            SYNTHWAVE
          </span>
        </div>
        <div className="h-5 w-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono">v1.0</span>
      </div>

      {/* Center: Transport Controls */}
      <div className="flex items-center gap-2">
        {/* Rewind */}
        <button
          onClick={handleRewind}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition-all hover:bg-border hover:text-foreground"
          aria-label="Rewind"
        >
          <SkipBack className="h-4 w-4" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={handlePlay}
          className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${isPlaying && !isRecordingState
            ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
            : "border-border bg-secondary text-secondary-foreground hover:bg-border hover:text-foreground"
            }`}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition-all hover:bg-border hover:text-foreground"
          aria-label="Stop"
        >
          <Square className="h-4 w-4" />
        </button>

        {/* Record */}
        <button
          onClick={handleRecord}
          disabled={isConnecting}
          className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${isRecordingState
            ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.4)] animate-pulse"
            : "border-border bg-secondary text-destructive/70 hover:bg-border hover:text-destructive"
            } ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={isRecordingState ? "Stop recording" : "Record"}
        >
          <Circle className={`h-4 w-4 fill-current ${isConnecting ? "animate-spin" : ""}`} />
        </button>

        {/* Time display */}
        <div className="ml-3 rounded-md border border-border bg-background px-4 py-1.5 font-mono text-lg tracking-widest text-primary tabular-nums shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
          {formatTime(time)}
        </div>
      </div>

      {/* Right: BPM + extras */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-mono">BPM</span>
          {bpmEditing ? (
            <input
              type="number"
              value={bpm}
              onChange={(e) =>
                setBpm(
                  Math.max(20, Math.min(300, parseInt(e.target.value) || 120))
                )
              }
              onBlur={() => setBpmEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setBpmEditing(false)}
              className="w-12 bg-transparent text-sm font-mono text-accent tabular-nums outline-none text-center"
              autoFocus
              aria-label="BPM value"
            />
          ) : (
            <button
              onClick={() => setBpmEditing(true)}
              className="text-sm font-mono text-accent tabular-nums hover:text-foreground transition-colors"
              aria-label={`BPM: ${bpm}. Click to edit`}
            >
              {bpm}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-mono">4/4</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
