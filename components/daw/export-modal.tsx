"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Video } from "lucide-react";
import { useProject } from "@/hooks/use-project";
import { toast } from "sonner";

interface ExportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
    const { videoUrl } = useProject(); // We can parse session ID from this
    const [vstPath, setVstPath] = useState("");
    const [isRendering, setIsRendering] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);

    // Extract session ID from video URL
    // URL format: http://localhost:8000/files/session_DATE_TIME_video.mp4
    const getSessionId = () => {
        if (!videoUrl) return null;
        const parts = videoUrl.split('/');
        const filename = parts[parts.length - 1];
        // filename: session_20250209_120000_video.mp4
        const match = filename.match(/(session_\d{8}_\d{6})/);
        return match ? match[1] : null;
    };

    const handleExport = async () => {
        const sessionId = getSessionId();
        if (!sessionId) {
            toast.error("No active recording session found.");
            return;
        }
        if (!vstPath) {
            toast.error("Please enter a VST3 plugin path.");
            return;
        }

        setIsRendering(true);
        setResultUrl(null);

        try {
            const response = await fetch("http://localhost:8000/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    vst_path: vstPath,
                }),
            });

            const data = await response.json();

            if (data.status === "done") {
                setResultUrl(data.url);
                toast.success("Export complete!");
            } else {
                throw new Error(data.message || "Export failed");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(`Export failed: ${err.message}`);
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Project</DialogTitle>
                    <DialogDescription>
                        Render your MIDI through a VST3 plugin and merge it with your video.
                    </DialogDescription>
                </DialogHeader>

                {!resultUrl ? (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="vstPath">VST3 Plugin Path</Label>
                            <Input
                                id="vstPath"
                                placeholder="/Library/Audio/Plug-Ins/VST3/Synth.vst3"
                                value={vstPath}
                                onChange={(e) => setVstPath(e.target.value)}
                                disabled={isRendering}
                                className="font-mono text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Paste the absolute path to a .vst3 file on your system.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-4">
                        <div className="rounded-md border border-border bg-black aspect-video flex items-center justify-center relative overflow-hidden">
                            <video src={resultUrl} controls className="w-full h-full object-contain" />
                        </div>
                        <p className="text-center text-sm text-green-500 font-medium">
                            Render Successful!
                        </p>
                    </div>
                )}

                <DialogFooter className="sm:justify-end">
                    {resultUrl ? (
                        <Button asChild variant="secondary">
                            <a href={resultUrl} download className="flex items-center gap-2">
                                <Download className="h-4 w-4" />
                                Download Video
                            </a>
                        </Button>
                    ) : (
                        <Button type="button" onClick={handleExport} disabled={isRendering || !vstPath}>
                            {isRendering ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Rendering...
                                </>
                            ) : (
                                <>
                                    <Video className="mr-2 h-4 w-4" />
                                    Render Video
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
