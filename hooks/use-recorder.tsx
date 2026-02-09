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
            // Read settings from localStorage (which should be synced with backend on app start/settings open)
            // Ideally, we could also fetch /config here to be 100% sure, but let's trust localStorage for speed
            // OR fetch config if localStorage is missing?
            // Let's trying fetching config first for robustness
            let audioIndex: number | null = null;
            let midiPort: string | null = null;
            let videoIndex: number = 0;

            try {
                const configRes = await fetch("http://localhost:8000/config");
                const config = await configRes.json();

                if (config.audioDeviceIndex) audioIndex = parseInt(config.audioDeviceIndex);
                if (config.midiPortName) midiPort = config.midiPortName;
                if (config.videoDeviceIndex) videoIndex = parseInt(config.videoDeviceIndex);
            } catch (e) {
                console.warn("Failed to fetch config for recording, falling back to defaults", e);
                // Fallback to localStorage
                const savedAudio = localStorage.getItem("audioDeviceIndex");
                const savedMidi = localStorage.getItem("midiPortName");
                const savedVideo = localStorage.getItem("videoDeviceIndex");

                audioIndex = savedAudio && savedAudio !== "default" ? parseInt(savedAudio) : null;
                midiPort = savedMidi && savedMidi !== "none" ? savedMidi : null;
                videoIndex = savedVideo ? parseInt(savedVideo) : 0;
            }

            const response = await fetch('http://localhost:8000/record/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_device_index: videoIndex,
                    audio_device_index: audioIndex,
                    midi_port_name: midiPort,
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
