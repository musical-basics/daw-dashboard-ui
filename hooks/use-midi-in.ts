import { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';
import * as Tone from 'tone';

export interface ActiveNote {
    note: number;
    name: string;
    velocity: number;
    startTime: number;
    duration?: number; // Added duration
    isFinished?: boolean; // To track if noteOff has happened
}

// Accept isRecording state
export function useMidiIn(isRecording: boolean = false) {
    const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
    const [recordedNotes, setRecordedNotes] = useState<ActiveNote[]>([]); // New local buffer
    const [isActivityDetected, setIsActivityDetected] = useState(false);
    const lastActivityTime = useRef<number>(0);
    const isRecordingRef = useRef(isRecording);

    // Keep ref in sync
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    // Reset local notes when recording starts/stops
    useEffect(() => {
        if (isRecording) {
            setRecordedNotes([]);
        }
    }, [isRecording]);

    useEffect(() => {
        let midiInput: any = null;

        const enableMidi = async () => {
            try {
                await WebMidi.enable();
                const inputName = localStorage.getItem("midiPortName");

                // Cleanup previous input listeners if any
                if (midiInput) {
                    try {
                        midiInput.removeListener("noteon");
                        midiInput.removeListener("noteoff");
                    } catch (e) {
                        console.warn("Cleanup error", e);
                    }
                    midiInput = null;
                }

                if (!inputName) return;

                const input = WebMidi.getInputByName(inputName);
                if (!input) {
                    console.warn(`MIDI input ${inputName} not found`);
                    return;
                }

                midiInput = input;
                console.log(`Listening to MIDI input: ${inputName}`);

                // Note On
                input.addListener("noteon", e => {
                    const now = Tone.Transport.seconds; // Sync with Timeline

                    const note: ActiveNote = {
                        note: e.note.number,
                        name: e.note.name + e.note.octave,
                        velocity: (e as any).velocity || 0.5,
                        startTime: now
                    };

                    setActiveNotes(prev => [...prev, note]);

                    // RECORDING LOGIC
                    if (isRecordingRef.current) {
                        setRecordedNotes(prev => [...prev, { ...note, isFinished: false }]);
                    }

                    setIsActivityDetected(true);
                    lastActivityTime.current = Date.now();
                });

                // Note Off
                input.addListener("noteoff", e => {
                    const now = Tone.Transport.seconds;

                    setActiveNotes(prev => prev.filter(n => n.note !== e.note.number));

                    // RECORDING LOGIC
                    if (isRecordingRef.current) {
                        setRecordedNotes(prev => prev.map(n => {
                            // Find the matching note that hasn't finished yet
                            if (n.note === e.note.number && !n.isFinished) {
                                return { ...n, duration: now - n.startTime, isFinished: true };
                            }
                            return n;
                        }));
                    }

                    setIsActivityDetected(true);
                    lastActivityTime.current = Date.now();
                });

            } catch (err) {
                console.error("WebMidi enable error:", err);
            }
        };

        enableMidi();

        // Listen for port changes
        const handlePortChange = () => {
            console.log("MIDI port changed, refreshing connection...");
            enableMidi();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener("midi-port-changed", handlePortChange);
        }

        // Cleanup activity light
        const interval = setInterval(() => {
            if (Date.now() - lastActivityTime.current > 150) {
                setIsActivityDetected(false);
            }
        }, 50);

        return () => {
            WebMidi.disable();
            clearInterval(interval);
            if (typeof window !== 'undefined') {
                window.removeEventListener("midi-port-changed", handlePortChange);
            }
        }
    }, []); // Run once on mount 

    return { activeNotes, recordedNotes, isActivityDetected };
}
