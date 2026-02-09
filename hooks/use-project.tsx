import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface ProjectState {
    videoUrl: string | null;
    audioUrl: string | null;
    midiUrl: string | null;
    isLoading: boolean;
}

export function useProject() {
    const [projectState, setProjectState] = useState<ProjectState>({
        videoUrl: null,
        audioUrl: null,
        midiUrl: null,
        isLoading: false,
    });

    const loadLatestTake = useCallback(async () => {
        setProjectState(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch('http://localhost:8000/recordings/latest');
            if (!response.ok) {
                throw new Error('Failed to fetch latest recording');
            }
            const data = await response.json();

            setProjectState({
                videoUrl: data.video,
                audioUrl: data.audio,
                midiUrl: data.midi,
                isLoading: false,
            });

            if (data.video || data.midi) {
                toast.success("Timeline updated with latest take");
            }
        } catch (error) {
            console.error("Error loading latest take:", error);
            // toast.error("Failed to load latest take"); // Optional: suppress if just empty
            setProjectState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    useEffect(() => {
        loadLatestTake();

        const handleLoadSession = (e: any) => {
            const sessionId = e.detail?.id;
            if (sessionId) {
                setProjectState({
                    videoUrl: `http://localhost:8000/files/${sessionId}_video.mp4`,
                    audioUrl: `http://localhost:8000/files/${sessionId}_audio.wav`,
                    midiUrl: `http://localhost:8000/files/${sessionId}_midi.mid`,
                    isLoading: false,
                });
                toast.success(`Loaded session: ${sessionId}`);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener("load-session", handleLoadSession);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener("load-session", handleLoadSession);
            }
        };
    }, [loadLatestTake]);

    return {
        ...projectState,
        loadLatestTake
    };
}
