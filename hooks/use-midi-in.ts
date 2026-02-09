import { useState, useEffect, useRef } from 'react';
import { WebMidi } from 'webmidi';

export interface ActiveNote {
    note: number;
    name: string;
    velocity: number;
    startTime: number;
}

export function useMidiIn() {
    const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
    const [isActivityDetected, setIsActivityDetected] = useState(false);
    const lastActivityTime = useRef<number>(0);

    useEffect(() => {
        const enableMidi = async () => {
            try {
                await WebMidi.enable();
                const inputName = localStorage.getItem("midiPortName");
                if (!inputName) return;

                const input = WebMidi.getInputByName(inputName);
                if (!input) return;

                // Note On
                input.addListener("noteon", e => {
                    const note = {
                        note: e.note.number,
                        name: e.note.name + e.note.octave,
                        velocity: (e as any).velocity || 0.5,
                        startTime: Date.now() / 1000 // seconds
                    };

                    setActiveNotes(prev => [...prev, note]);

                    // Activity Light
                    setIsActivityDetected(true);
                    lastActivityTime.current = Date.now();
                });

                // Note Off
                input.addListener("noteoff", e => {
                    setActiveNotes(prev => prev.filter(n => n.note !== e.note.number));

                    setIsActivityDetected(true);
                    lastActivityTime.current = Date.now();
                });

            } catch (err) {
                console.error("WebMidi enable error:", err);
            }
        };

        enableMidi();

        // Cleanup activity light
        const interval = setInterval(() => {
            if (Date.now() - lastActivityTime.current > 150) {
                setIsActivityDetected(false);
            }
        }, 50);

        return () => {
            WebMidi.disable();
            clearInterval(interval);
        };
    }, []);

    return { activeNotes, isActivityDetected };
}
