import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RecorderState {
    isRecording: boolean;
    isConnecting: boolean;
    error: string | null;
}

interface RecorderActions {
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
}

export function useRecorder(): RecorderState & RecorderActions {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startRecording = useCallback(async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/record/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_device_index: 0,
                    // Add other configurable parameters here if needed
                }),
            });

            const data = await response.json();

            if (data.status === 'started') {
                setIsRecording(true);
                toast.success("Recording started");
            } else {
                throw new Error(data.message || 'Failed to start recording');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            toast.error(`Recording Error: ${message}`);
            console.error('Start recording error:', err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        setIsConnecting(true);
        try {
            const response = await fetch('http://localhost:8000/record/stop', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.status === 'stopped') {
                setIsRecording(false);
                toast.success("Recording saved", {
                    description: `Session ID: ${data.session_id}`
                });
            } else {
                throw new Error(data.message || 'Failed to stop recording');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message);
            toast.error(`Stop Error: ${message}`);
            console.error('Stop recording error:', err);
        } finally {
            setIsConnecting(false);
        }
    }, []);

    return {
        isRecording,
        isConnecting,
        error,
        startRecording,
        stopRecording,
    };
}
