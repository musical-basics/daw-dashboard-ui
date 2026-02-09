import TransportBar from "@/components/daw/transport-bar";
import VideoPreview from "@/components/daw/video-preview";
import Timeline from "@/components/daw/timeline";

export default function Page() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Transport Bar */}
      <TransportBar />

      {/* Main area */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Video Preview (left/top) */}
        <div className="lg:w-[420px] xl:w-[480px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card h-[240px] sm:h-[280px] lg:h-auto">
          <VideoPreview />
        </div>

        {/* Timeline (right/bottom) */}
        <div className="flex-1 min-w-0 min-h-0">
          <Timeline />
        </div>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-border bg-card px-4 py-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground">
              READY
            </span>
          </div>
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
                className={`h-2 w-1 rounded-sm ${
                  i < 3
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
