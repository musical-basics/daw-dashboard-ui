"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Clock } from "lucide-react";
import { useProject } from "@/hooks/use-project";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Recording {
    id: string;
    name: string;
    size: string;
    timestamp: number; // unix timestamp
}

interface FileBrowserProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FileBrowser({ open, onOpenChange }: FileBrowserProps) {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(false);
    const { loadLatestTake } = useProject(); // We might need to update useProject to load *specific* take, or we can just use the URLs directly here if we had a setter.
    // Actually, useProject's `loadLatestTake` hits `/recordings/latest`. 
    // We should ideally expose a `loadProject` method in useProject that takes URLs.
    // For now, let's just cheat and assume we can pass the ID to state, OR we assume we can set state directly.
    // Wait, useProject exposes `videoUrl` etc but not a setter.
    // Let's modify useProject next to accept manual override or add a loadSession method.

    // Actually, for Phase 7 scope, let's keep it simple: 
    // We will manually construct the URLs and if possible update the project state. 
    // But wait, `useProject` state is local to `useProject`? No, it's a hook.
    // If we want Global state, we should have a Context.
    // BUT, looking at `app/page.tsx`, it calls `useProject`. 
    // We need to pass a "onLoad" or similar to FileBrowser if we want it to affect the parent.
    // Or we modify `useProject` to be more robust.

    // Let's assuming for now we will add a `loadSession(id)` to `useProject` in the next step.

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetch("http://localhost:8000/recordings/list")
                .then(res => res.json())
                .then(data => setRecordings(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open]);

    const handleLoad = (session: Recording) => {
        // Dispatch a custom event or use a callback? 
        // Since useProject is a hook used in Page, we need a way to communicate.
        // Easiest is to emit an event or use a text input hack? No, that's bad.
        // Better: Update `useProject` to listen to a global event or add `loadSession` that accepts an ID, and we pass that function down?
        // Since `FileBrowser` is likely inside `TransportBar` which is inside `Page`, we can pass a callback.

        // Temporary: We will dispatch a custom event that `useProject` or `Page` listens to.
        // Or simply: toast that we loaded it, but we actually need to update the state.

        // Let's trigger a custom event "load-session" with detail { id }.
        window.dispatchEvent(new CustomEvent("load-session", { detail: { id: session.id } }));
        onOpenChange(false);
        toast.success("Session loaded");
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Recordings</SheetTitle>
                    <SheetDescription>
                        Manage your recorded sessions.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Take</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recordings.map((rec) => (
                                    <TableRow key={rec.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium truncate max-w-[180px]">{rec.name.replace("_video.mp4", "")}</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(rec.timestamp * 1000, { addSuffix: true })}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{rec.size}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleLoad(rec)}>
                                                <PlayCircle className="w-4 h-4 mr-1" />
                                                Load
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
