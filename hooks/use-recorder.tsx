import { useState, useCallback, useEffect, useRef } from 'react';
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
    // True while a start/stop request is in flight, so the status sync doesn't race it
    const busyRef = useRef(false);

    // The backend is the source of truth: pick up a recording that's already running
    // (e.g. after a reload) and notice when it ends on its own (time limit, backend restart)
    useEffect(() => {
        let cancelled = false;

        const sync = async () => {
            if (busyRef.current) return;
            try {
                const res = await fetch('http://localhost:8000/record/status');
                const data = await res.json();
                if (cancelled || busyRef.current) return;

                if (isRecording && !data.is_recording) {
                    toast.info("Recording stopped", {
                        description: `Recordings stop automatically after ${Math.round(data.max_seconds / 60)} minutes`
                    });
                }
                setIsRecording(data.is_recording);
            } catch {
                // Backend not reachable; keep the current state
            }
        };

        sync();
        if (!isRecording) return () => { cancelled = true; };

        const interval = setInterval(sync, 2000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [isRecording]);

    const startRecording = useCallback(async () => {
        busyRef.current = true;
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
            busyRef.current = false;
            setIsConnecting(false);
        }
    }, []);

    const stopRecording = useCallback(async () => {
        busyRef.current = true;
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
            busyRef.current = false;
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
