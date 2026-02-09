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

const TOTAL_COLS = 32;
const ROW_HEIGHT = 18;

import { Midi } from "@tonejs/midi";

interface PianoRollProps {
  midiUrl: string | null;
}

export default function PianoRoll({ midiUrl }: PianoRollProps) {
  const [notes, setNotes] = useState<MidiNote[]>([]);
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
      try {
        const midi = await Midi.fromUrl(midiUrl);
        const newNotes: MidiNote[] = [];

        midi.tracks.forEach(track => {
          track.notes.forEach((note, index) => {
            // Map MIDI note to grid
            // Note: This is a simplified mapping. Real mapping needs BPM and PPQ info.
            // Assuming 120 BPM for now, 0.5s = 1 beat
            // note.name like "C4"
            // note.time (seconds)
            // note.duration (seconds)

            // Find row index from NOTE_NAMES
            const rowIndex = NOTE_NAMES.indexOf(note.name);
            if (rowIndex === -1) return; // Note out of range

            // Approximate column/width mapping (assuming 0.5s per column/beat for demo)
            // A better approach uses ticks if available or recalculates based on project BPM
            const col = Math.floor(note.time * 2);
            const width = Math.max(1, Math.floor(note.duration * 2));

            newNotes.push({
              id: `n-${index}-${note.time}`,
              row: rowIndex,
              col: col,
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
        const colDelta = Math.round(dx / 28);
        const rowDelta = Math.round(dy / ROW_HEIGHT);

        setNotes((prev) =>
          prev.map((n) =>
            n.id === note.id
              ? {
                ...n,
                col: Math.max(0, Math.min(TOTAL_COLS - n.width, note.col + colDelta)),
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
      <div className="w-44 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 rounded bg-[hsl(var(--neon-magenta))]/20 flex items-center justify-center">
              <Piano className="h-3 w-3 text-[hsl(var(--neon-magenta))]" />
            </div>
            <span className="text-xs font-mono font-medium text-foreground tracking-wider">
              MIDI 1
            </span>
          </div>
          <div className="flex items-center gap-1">
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
            return (
              <button
                key={note}
                onMouseEnter={() => setHoveredKey(i)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`flex items-center justify-end pr-2 border-b transition-colors ${black
                  ? "bg-[hsl(220,20%,10%)] border-[hsl(220,15%,14%)] text-muted-foreground/60"
                  : "bg-[hsl(220,15%,16%)] border-[hsl(220,15%,14%)] text-muted-foreground/80"
                  } ${hoveredKey === i ? "!bg-primary/20 !text-primary" : ""}`}
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
      <div
        className="flex-1 relative overflow-hidden"
        style={{ height: NOTE_NAMES.length * ROW_HEIGHT }}
      >
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
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: TOTAL_COLS }).map((_, i) => (
            <div
              key={i}
              className="border-r"
              style={{
                width: `${100 / TOTAL_COLS}%`,
                borderRightColor:
                  i % 4 === 3
                    ? "hsl(var(--border) / 0.4)"
                    : "hsl(var(--border) / 0.1)",
              }}
            />
          ))}
        </div>

        {/* MIDI notes */}
        {notes.map((note) => (
          <div
            key={note.id}
            role="button"
            tabIndex={0}
            aria-label={`MIDI note ${NOTE_NAMES[note.row]} at beat ${note.col + 1}, duration ${note.width} beats. Drag to move.`}
            onMouseDown={(e) => handleNoteMouseDown(e, note)}
            className={`absolute rounded-[3px] cursor-grab active:cursor-grabbing transition-shadow ${selectedNote === note.id
              ? "ring-1 ring-[hsl(var(--neon-magenta))] shadow-[0_0_8px_hsl(var(--neon-magenta)/0.4)] z-10"
              : "hover:shadow-[0_0_6px_hsl(var(--neon-magenta)/0.3)] z-0"
              } ${dragState?.id === note.id ? "opacity-90" : ""}`}
            style={{
              top: note.row * ROW_HEIGHT + 2,
              left: `${(note.col / TOTAL_COLS) * 100}%`,
              width: `${(note.width / TOTAL_COLS) * 100}%`,
              height: ROW_HEIGHT - 4,
              background: `linear-gradient(135deg, hsl(var(--neon-magenta) / ${note.velocity * 0.6}), hsl(var(--neon-magenta) / ${note.velocity * 0.35}))`,
              borderLeft: `2px solid hsl(var(--neon-magenta) / ${note.velocity})`,
            }}
          >
            {/* Velocity indicator */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-b-[3px]"
              style={{
                height: `${note.velocity * 100}%`,
                background: `hsl(var(--neon-magenta) / 0.15)`,
              }}
            />
            {/* Right resize handle */}
            <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize opacity-0 hover:opacity-100 bg-[hsl(var(--neon-magenta)/0.5)] rounded-r-[3px]" />
          </div>
        ))}

        {/* Playhead */}
        <div className="absolute top-0 bottom-0 w-px bg-primary/60 z-20 pointer-events-none" style={{ left: "15%" }}>
          <div className="absolute -top-0.5 -left-1 w-2 h-2 bg-primary rotate-45" />
        </div>
      </div>
    </div>
  );
}
