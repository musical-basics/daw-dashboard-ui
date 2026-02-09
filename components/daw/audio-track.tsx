"use client";

import { Music, Volume2, Headphones, Lock } from "lucide-react";
import { useState, useEffect } from "react";

function generateWaveform(width: number, seed: number) {
  const points: string[] = [];
  const midY = 24;
  for (let x = 0; x <= width; x++) {
    const noise =
      Math.sin(x * 0.15 + seed) * 8 +
      Math.sin(x * 0.05 + seed * 2) * 12 +
      Math.sin(x * 0.3 + seed * 0.5) * 4 +
      Math.cos(x * 0.08 + seed) * 6;
    const envelope = Math.sin((x / width) * Math.PI) * 0.7 + 0.3;
    const y = Math.round((midY - noise * envelope) * 100) / 100;
    points.push(`${x},${y}`);
  }
  const mirrorPoints: string[] = [];
  for (let x = width; x >= 0; x--) {
    const noise =
      Math.sin(x * 0.15 + seed) * 8 +
      Math.sin(x * 0.05 + seed * 2) * 12 +
      Math.sin(x * 0.3 + seed * 0.5) * 4 +
      Math.cos(x * 0.08 + seed) * 6;
    const envelope = Math.sin((x / width) * Math.PI) * 0.7 + 0.3;
    const y = Math.round((midY + noise * envelope) * 100) / 100;
    mirrorPoints.push(`${x},${y}`);
  }
  return [...points, ...mirrorPoints].join(" ");
}

const waveformSegments = [
  { start: 0, width: 40, seed: 1 },
  { start: 45, width: 55, seed: 7 },
];

export default function AudioTrack() {
  const [waveforms, setWaveforms] = useState<Record<number, string>>({});

  useEffect(() => {
    const generated: Record<number, string> = {};
    for (const seg of waveformSegments) {
      generated[seg.seed] = generateWaveform(200, seg.seed);
    }
    setWaveforms(generated);
  }, []);

  return (
    <div className="flex border-b border-border group">
      {/* Track header */}
      <div className="w-44 shrink-0 border-r border-border bg-card px-3 py-2 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-5 w-5 rounded bg-[hsl(var(--accent))]/20 flex items-center justify-center">
            <Music className="h-3 w-3 text-accent" />
          </div>
          <span className="text-xs font-mono font-medium text-foreground tracking-wider">
            AUDIO 1
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mute audio"
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
          {/* Volume slider */}
          <div className="ml-1 flex-1 max-w-16">
            <div className="h-1 rounded-full bg-border relative">
              <div
                className="absolute h-full rounded-full bg-accent/60"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track content */}
      <div className="flex-1 relative h-16 bg-[hsl(var(--track-surface))]">
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r"
              style={{
                borderRightColor:
                  i % 4 === 3
                    ? "hsl(var(--border))"
                    : "hsl(var(--border) / 0.15)",
              }}
            />
          ))}
        </div>

        {/* Center line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-accent/10" />

        {/* Waveform segments */}
        {waveformSegments.map((seg, i) => (
          <div
            key={i}
            className="absolute top-1 bottom-1 cursor-pointer group/wave"
            style={{
              left: `${seg.start}%`,
              width: `${seg.width}%`,
            }}
          >
            <svg
              viewBox="0 0 200 48"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {waveforms[seg.seed] && (
                <polygon
                  points={waveforms[seg.seed]}
                  fill="hsl(var(--accent) / 0.25)"
                  stroke="hsl(var(--accent) / 0.6)"
                  strokeWidth="0.5"
                  className="group-hover/wave:fill-[hsl(var(--accent)/0.35)] transition-all"
                />
              )}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
