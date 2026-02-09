"use client";

import React from "react"

import { useState, useCallback, useEffect } from "react";
import { Piano, Volume2, Headphones, Lock } from "lucide-react";

const NOTE_NAMES = [
  "C5",
  "B4",
  "A#4",
  "A4",
  "G#4",
  "G4",
  "F#4",
  "F4",
  "E4",
  "D#4",
  "D4",
  "C#4",
  "C4",
  "B3",
  "A#3",
  "A3",
  "G#3",
  "G3",
  "F#3",
  "F3",
  "E3",
  "D#3",
  "D3",
  "C#3",
  "C3",
];

const isBlackKey = (note: string) => note.includes("#");

interface MidiNote {
  id: string;
  row: number;
  col: number;
  width: number;
  velocity: number;
  isRecording?: boolean; // New flag for styling
}

const initialNotes: MidiNote[] = [
  { id: "n1", row: 12, col: 2, width: 3, velocity: 0.9 },
  { id: "n2", row: 10, col: 5, width: 2, velocity: 0.7 },
  { id: "n3", row: 8, col: 7, width: 4, velocity: 0.85 },
  { id: "n4", row: 12, col: 12, width: 2, velocity: 0.8 },
  { id: "n5", row: 7, col: 14, width: 3, velocity: 0.75 },
  { id: "n6", row: 5, col: 17, width: 2, velocity: 0.65 },
  { id: "n7", row: 3, col: 19, width: 5, velocity: 0.95 },
  { id: "n8", row: 10, col: 24, width: 3, velocity: 0.8 },
  { id: "n9", row: 15, col: 8, width: 2, velocity: 0.6 },
  { id: "n10", row: 17, col: 10, width: 4, velocity: 0.7 },
  { id: "n11", row: 20, col: 2, width: 2, velocity: 0.55 },
  { id: "n12", row: 22, col: 6, width: 3, velocity: 0.8 },
  { id: "n13", row: 14, col: 20, width: 2, velocity: 0.75 },
  { id: "n14", row: 9, col: 27, width: 4, velocity: 0.85 },
  { id: "n15", row: 6, col: 22, width: 2, velocity: 0.6 },
  { id: "n16", row: 18, col: 15, width: 3, velocity: 0.9 },
  { id: "n17", row: 4, col: 28, width: 3, velocity: 0.7 },
  { id: "n18", row: 11, col: 30, width: 2, velocity: 0.65 },
];

const TOTAL_SECONDS = 600; // 10 minutes
const ROW_HEIGHT = 24;
const PX_PER_SEC = 50; // 1 second = 50px (Visual resolution) 
const SNAP_GRID = 0.25; // Snap to quarter seconds (approx 16th at 120)

import { Midi } from "@tonejs/midi";

interface PianoRollProps {
  midiUrl: string | null;
}

import { useMidiIn } from "@/hooks/use-midi-in";

interface PianoRollProps {
  midiUrl: string | null;
  currentTime: number;
  isRecording: boolean; // Receive this prop
}

export default function PianoRoll({ midiUrl, currentTime, isRecording }: PianoRollProps) {
  const { activeNotes, recordedNotes } = useMidiIn(isRecording);
  const [notes, setNotes] = useState<MidiNote[]>([]);
  // ... (keep existing state)
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    origCol: number;
    origRow: number;
  } | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<number | null>(null);

  useEffect(() => {
    if (!midiUrl) {
      setNotes([]); // Clear notes if no URL
      return;
    }

    async function loadMidi() {
      if (!midiUrl) return;
      try {
        const midi = await Midi.fromUrl(midiUrl);
        const newNotes: MidiNote[] = [];

        midi.tracks.forEach(track => {
          track.notes.forEach((note, index) => {
            const rowIndex = NOTE_NAMES.indexOf(note.name);
            if (rowIndex === -1) return;

            // Use absolute pixel positioning
            const left = note.time * PX_PER_SEC;
            const width = Math.max(2, note.duration * PX_PER_SEC);

            newNotes.push({
              id: `n-${index}-${note.time}`,
              row: rowIndex,
              col: left, // abusing 'col' to store px position for dragging logic, or convert?
              // Let's keep strict types. We should update MidiNote interface or just cast.
              // Actually, let's keep 'col' as 'time' mapping for compatibility or just refactor.
              // To minimize diff, let's say: col = pixels.
              width: width,
              velocity: note.velocity
            });
          });
        });
        setNotes(newNotes);
      } catch (e) {
        console.error("Failed to load MIDI:", e);
      }
    }

    loadMidi();
  }, [midiUrl]);

  const handleNoteMouseDown = useCallback(
    (e: React.MouseEvent, note: MidiNote) => {
      // ... (keep existing handler)
      e.stopPropagation();
      e.preventDefault();
      setSelectedNote(note.id);
      setDragState({
        id: note.id,
        startX: e.clientX,
        startY: e.clientY,
        origCol: note.col,
        origRow: note.row,
      });

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - e.clientX;
        const dy = ev.clientY - e.clientY;
        const noteNewLeft = Math.max(0, note.col + dx); // col stores px
        const rowDelta = Math.round(dy / ROW_HEIGHT);

        setNotes((prev) =>
          prev.map((n) =>
            n.id === note.id
              ? {
                ...n,
                col: noteNewLeft,
                row: Math.max(0, Math.min(NOTE_NAMES.length - 1, note.row + rowDelta)),
              }
              : n
          )
        );
      };

      const handleMouseUp = () => {
        setDragState(null);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    []
  );

  return (
    <div className="flex border-b border-border">
      {/* Track header */}
      <div className="w-44 shrink-0 border-r border-border bg-card flex flex-col sticky left-0 z-20">
        {/* ... (keep header content) */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={`h-5 w-5 rounded transition-colors flex items-center justify-center ${activeNotes.length > 0 ? "bg-[hsl(var(--neon-cyan))]/20 shadow-[0_0_8px_hsl(var(--neon-cyan)/0.6)]" : "bg-[hsl(var(--neon-magenta))]/20"}`}>
              <Piano className={`h-3 w-3 ${activeNotes.length > 0 ? "text-[hsl(var(--neon-cyan))]" : "text-[hsl(var(--neon-magenta))]"}`} />
            </div>
            <span className="text-xs font-mono font-medium text-foreground tracking-wider">
              MIDI 1 ({activeNotes.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* ... (keep icons) */}
            <button
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Mute MIDI"
            >
              <Volume2 className="h-3 w-3" />
            </button>
            <button
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Solo track"
            >
              <Headphones className="h-3 w-3" />
            </button>
            <button
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Lock track"
            >
              <Lock className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Piano keys */}
        <div className="flex-1 flex flex-col">
          {NOTE_NAMES.map((note, i) => {
            const black = isBlackKey(note);
            // Check if this key is being pressed
            const isPressed = activeNotes.some(n => n.name === note);

            return (
              <button
                key={note}
                onMouseEnter={() => setHoveredKey(i)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-end pr-2 border-b transition-colors ${isPressed
                  ? "!bg-[hsl(var(--neon-cyan))]/30 !text-[hsl(var(--neon-cyan))] !border-[hsl(var(--neon-cyan))]/50"
                  : black
                    ? "bg-[hsl(220,20%,10%)] border-[hsl(220,15%,14%)] text-muted-foreground/60"
                    : "bg-[hsl(220,15%,16%)] border-[hsl(220,15%,14%)] text-muted-foreground/80"
                  } ${hoveredKey === i && !isPressed ? "!bg-primary/20 !text-primary" : ""}`}
                style={{ height: ROW_HEIGHT }}
                aria-label={`Play note ${note}`}
              >
                <span className="text-[9px] font-mono leading-none">
                  {note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid area */}
      {/* Grid area - Container should fill parent width */}
      <div
        className="flex-1 relative"
        style={{ height: "400px", overflowY: "auto" }} // Keep vertical scroll for notes? Or let Timeline handle it? 
      // User asked for "scroll down to see range", implying vertical scroll.
      // If we put vertical scroll here, we need strict height.
      >
        <div className="relative" style={{ height: NOTE_NAMES.length * ROW_HEIGHT, width: "100%" }}>
          {/* Row backgrounds */}
          {NOTE_NAMES.map((note, i) => (
            <div
              key={note}
              className={`absolute left-0 right-0 border-b ${isBlackKey(note)
                ? "bg-[hsl(220,18%,7%)] border-[hsl(var(--border)/0.2)]"
                : "bg-[hsl(var(--track-surface))] border-[hsl(var(--border)/0.2)]"
                }`}
              style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}
            />
          ))}

          {/* Column grid lines */}
          {/* Column grid lines (every second) */}
          <div className="absolute inset-0 flex pointer-events-none">
            {Array.from({ length: TOTAL_SECONDS }).map((_, i) => (
              <div
                key={i}
                className="absolute border-r h-full"
                style={{
                  left: `${i * PX_PER_SEC}px`,
                  borderRightColor:
                    i % 4 === 0
                      ? "hsl(var(--border) / 0.4)" // Bar line
                      : "hsl(var(--border) / 0.1)", // Beat line
                }}
              />
            ))}
          </div>

          {/* Recorded MIDI notes from FILE */}
          {notes.map((note) => (
            // note.col is now PX position
            // note.width is now PX width
            <div
              key={note.id}
              // ...
              role="button"
              tabIndex={0}
              onMouseDown={(e) => handleNoteMouseDown(e, note)}
              className={`absolute rounded-[3px] cursor-grab active:cursor-grabbing transition-shadow ${selectedNote === note.id
                ? "ring-1 ring-[hsl(var(--neon-magenta))] shadow-[0_0_8px_hsl(var(--neon-magenta)/0.4)] z-10"
                : "hover:shadow-[0_0_6px_hsl(var(--neon-magenta)/0.3)] z-0"
                } ${dragState?.id === note.id ? "opacity-90" : ""}`}
              style={{
                top: note.row * ROW_HEIGHT + 2,
                left: `${note.col}px`,
                width: `${note.width}px`,
                height: ROW_HEIGHT - 4,
                background: `linear-gradient(135deg, hsl(var(--neon-magenta) / ${note.velocity * 0.6}), hsl(var(--neon-magenta) / ${note.velocity * 0.35}))`,
                borderLeft: `2px solid hsl(var(--neon-magenta) / ${note.velocity})`,
              }}
            >
              {/* ... (keep inner divs) */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-[3px]"
                style={{
                  height: `${note.velocity * 100}%`,
                  background: `hsl(var(--neon-magenta) / 0.15)`,
                }}
              />
              <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 bg-[hsl(var(--neon-magenta)/0.5)] rounded-r-[3px]" />
            </div>
          ))}

          {/* LIVE RECORDING BUFFER NOTES */}
          {recordedNotes.map((n, i) => {
            const rowIndex = NOTE_NAMES.indexOf(n.name);
            if (rowIndex === -1) return null;

            const startPx = n.startTime * PX_PER_SEC;
            // If finished, use duration. If not, grow to currentTime!
            const duration = n.isFinished ? n.duration! : Math.max(0, currentTime - n.startTime);
            const widthPx = Math.max(4, duration * PX_PER_SEC);

            return (
              <div
                key={`rec-${i}`}
                className="absolute rounded-[3px] border-l-2 transition-all bg-red-500/40 border-red-500 z-20"
                style={{
                  top: rowIndex * ROW_HEIGHT + 2,
                  left: `${startPx}px`,
                  width: `${widthPx}px`,
                  height: ROW_HEIGHT - 4,
                }}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-black/20" style={{ height: `${(1 - n.velocity) * 100}%` }} />
              </div>
            )
          })}

          {/* LIVE PLAYING OVERLAY */}
          {activeNotes.map((note, i) => {
            const rowIndex = NOTE_NAMES.indexOf(note.name);
            if (rowIndex === -1) return null;

            // Use currentTime (Transport) for sync
            const elapsed = currentTime - note.startTime;
            const startPx = note.startTime * PX_PER_SEC;
            const widthPx = Math.max(4, elapsed * PX_PER_SEC);

            return (
              <div
                key={`live-${i}`}
                className="absolute rounded-[3px] z-30 pointer-events-none shadow-[0_0_15px_hsl(var(--neon-cyan)/0.6)]"
                style={{
                  top: rowIndex * ROW_HEIGHT + 2,
                  left: `${startPx}px`,
                  width: `${widthPx}px`,
                  height: ROW_HEIGHT - 4,
                  background: `linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-cyan) / 0.7))`,
                  border: `1px solid hsl(var(--neon-cyan))`,
                }}
              />
            );
          })}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-primary/60 z-20 pointer-events-none" style={{ left: `${currentTime * PX_PER_SEC}px` }}>
            <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-primary rotate-45" />
            {/* Guide line for easier visibility */}
            <div className="absolute top-0 bottom-0 w-px bg-primary/20 -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
