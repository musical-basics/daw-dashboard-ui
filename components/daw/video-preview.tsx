"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import { Video, Camera, MonitorOff } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string | null;
}

const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(({ videoUrl }, ref) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoUrl) return; // Playback mode

    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Safe ref access
        if (ref && typeof ref !== 'function' && ref.current) {
          ref.current.srcObject = stream;
          ref.current.src = "";
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera access denied or unavailable");
      }
    }

    setupCamera();

    return () => {
      // Cleanup if switching modes?
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [videoUrl, ref]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-mono font-medium text-foreground tracking-wider">
            {videoUrl ? "PLAYBACK" : "LIVE PREVIEW"}
          </span>
        </div>
        {!videoUrl && (
          <div className="flex items-center gap-1">
            <button
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              aria-label="Toggle camera"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Video area */}
      <div className="flex-1 flex items-center justify-center bg-black m-2 rounded-md border border-border relative overflow-hidden">
        {/* Aspect ratio container */}
        <div className="w-full h-full relative flex items-center justify-center">

          {error && !videoUrl ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <MonitorOff className="h-10 w-10 opacity-40" />
              <span className="text-xs font-mono tracking-wider opacity-60">
                {error}
              </span>
            </div>
          ) : (
            <video
              ref={ref}
              src={videoUrl || undefined}
              autoPlay={!videoUrl}
              muted={!videoUrl}
              playsInline
              className="w-full h-full object-contain"
            />
          )}

          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.05) 2px, rgba(0,255,255,0.05) 4px)",
            }}
          />

          {/* Corner markers */}
          <div className="absolute top-2 left-2 h-4 w-4 border-l-2 border-t-2 border-primary/30 pointer-events-none" />
          <div className="absolute top-2 right-2 h-4 w-4 border-r-2 border-t-2 border-primary/30 pointer-events-none" />
          <div className="absolute bottom-2 left-2 h-4 w-4 border-l-2 border-b-2 border-primary/30 pointer-events-none" />
          <div className="absolute bottom-2 right-2 h-4 w-4 border-r-2 border-b-2 border-primary/30 pointer-events-none" />

        </div>
      </div>
    </div>
  );
});

VideoPreview.displayName = "VideoPreview";
export default VideoPreview;
