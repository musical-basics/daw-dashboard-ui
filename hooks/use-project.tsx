import { useState, useCallback } from 'react';
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

            // Add cache busting or ensure backend returns fresh URLs if needed
            // For now, assuming direct URLs

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
            toast.error("Failed to load latest take");
            setProjectState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    return {
        ...projectState,
        loadLatestTake
    };
}
