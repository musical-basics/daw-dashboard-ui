"use client";
import { useState } from "react";
import { SkipBack, Play, Square, Circle, Pause, ChevronDown } from "lucide-react";
import { useRecorder } from "@/hooks/use-recorder";
import { ExportModal } from "./export-modal";
import SettingsDialog from "./settings-dialog";
import FileBrowser from "./file-browser";

interface TransportBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onRewind: () => void;
  currentTime: number;
}

export default function TransportBar({ isPlaying, onPlay, onStop, onRewind, currentTime }: TransportBarProps) {
  const { isRecording: isRecordingState, isConnecting, startRecording, stopRecording } = useRecorder();
  const [bpm, setBpm] = useState(120);
  const [bpmEditing, setBpmEditing] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const handlePlay = () => isPlaying ? onStop() : onPlay();

  const handleStop = async () => {
    if (isRecordingState) await stopRecording();
    onStop();
  };

  const handleRecord = async () => {
    if (isRecordingState) {
      await stopRecording();
    } else {
      await startRecording();
      onPlay();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <header className="flex items-center justify-between bg-card border-b border-border px-4 py-2">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
            <div className="h-3 w-3 rounded-sm bg-primary" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-primary">SYNTHWAVE</span>
        </div>
        {/* ADD FILE BROWSER HERE */}
        <div className="h-5 w-px bg-border mx-2" />
        <FileBrowser />
      </div>

      {/* Center: Transport Controls (Keep existing) */}
      <div className="flex items-center gap-2">
        <button onClick={onRewind} className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition-all hover:bg-border hover:text-foreground" aria-label="Rewind">
          <SkipBack className="h-4 w-4" />
        </button>

        <button onClick={handlePlay} className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${isPlaying && !isRecordingState ? "border-primary bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]" : "border-border bg-secondary text-secondary-foreground hover:bg-border hover:text-foreground"}`} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button onClick={handleStop} className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition-all hover:bg-border hover:text-foreground" aria-label="Stop">
          <Square className="h-4 w-4" />
        </button>

        <button onClick={handleRecord} disabled={isConnecting} className={`flex h-9 w-9 items-center justify-center rounded-md border transition-all ${isRecordingState ? "border-destructive bg-destructive/20 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.4)] animate-pulse" : "border-border bg-secondary text-destructive/70 hover:bg-border hover:text-destructive"} ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`} aria-label={isRecordingState ? "Stop recording" : "Record"}>
          <Circle className={`h-4 w-4 fill-current ${isConnecting ? "animate-spin" : ""}`} />
        </button>

        <div className="ml-3 rounded-md border border-border bg-background px-4 py-1.5 font-mono text-lg tracking-widest text-primary tabular-nums shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Right: Settings & Export */}
      <div className="flex items-center gap-3">
        {/* ADD SETTINGS HERE */}
        <SettingsDialog />

        <div className="h-5 w-px bg-border" />

        {/* BPM (Keep existing) */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-mono">BPM</span>
          {bpmEditing ? (
            <input type="number" value={bpm} onChange={(e) => setBpm(Math.max(20, Math.min(300, parseInt(e.target.value) || 120)))} onBlur={() => setBpmEditing(false)} onKeyDown={(e) => e.key === "Enter" && setBpmEditing(false)} className="w-12 bg-transparent text-sm font-mono text-accent tabular-nums outline-none text-center" autoFocus aria-label="BPM value" />
          ) : (
            <button onClick={() => setBpmEditing(true)} className="text-sm font-mono text-accent tabular-nums hover:text-foreground transition-colors" aria-label={`BPM: ${bpm}. Click to edit`}>
              {bpm}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-mono">4/4</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Export Button */}
        <button
          onClick={() => setExportOpen(true)}
          className="ml-2 flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          EXPORT
        </button>

        <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      </div>
    </header>
  );
}
