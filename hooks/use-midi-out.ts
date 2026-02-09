import { useState, useEffect, useCallback } from 'react';
import { WebMidi, Output } from 'webmidi';
import { toast } from 'sonner';

export interface MidiOutHook {
    outputs: Output[];
    selectedOutputId: string | null;
    selectOutput: (id: string) => void;
    sendNoteOn: (note: string | number, velocity: number, channel?: number) => void;
    sendNoteOff: (note: string | number, channel?: number) => void;
    isEnabled: boolean;
}

export function useMidiOut(): MidiOutHook {
    const [isEnabled, setIsEnabled] = useState(false);
    const [outputs, setOutputs] = useState<Output[]>([]);
    const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);

    useEffect(() => {
        WebMidi.enable()
            .then(() => {
                setIsEnabled(true);
                setOutputs(WebMidi.outputs);

                // Auto-select first available output if none selected
                if (WebMidi.outputs.length > 0 && !selectedOutputId) {
                    // Prefer "loopMIDI" or "IAC" if available for bridge scenarios
                    const preferred = WebMidi.outputs.find(o =>
                        o.name.includes("loopMIDI") || o.name.includes("IAC")
                    );
                    setSelectedOutputId(preferred ? preferred.id : WebMidi.outputs[0].id);
                }

                // Listen for connection changes
                // WebMidi.addListener("connected", (e) => { ... });
            })
            .catch((err) => {
                console.error("WebMidi could not be enabled.", err);
                // toast.error("MIDI not available in this browser");
            });

        return () => {
            // Cleanup if necessary, though WebMidi is global-ish
        };
    }, []);

    const selectOutput = useCallback((id: string) => {
        setSelectedOutputId(id);
        const output = WebMidi.outputs.find(o => o.id === id);
        if (output) {
            toast.info(`MIDI Output: ${output.name}`);
        }
    }, []);

    const sendNoteOn = useCallback((note: string | number, velocity: number, channel: number = 1) => {
        if (!selectedOutputId) return;
        const output = WebMidi.outputs.find(o => o.id === selectedOutputId);
        if (output) {
            // WebMidi channels are 1-16
            output.channels[channel].playNote(note, { attack: velocity });
        }
    }, [selectedOutputId]);

    const sendNoteOff = useCallback((note: string | number, channel: number = 1) => {
        if (!selectedOutputId) return;
        const output = WebMidi.outputs.find(o => o.id === selectedOutputId);
        if (output) {
            output.channels[channel].stopNote(note);
        }
    }, [selectedOutputId]);

    return {
        outputs,
        selectedOutputId,
        selectOutput,
        sendNoteOn,
        sendNoteOff,
        isEnabled
    };
}
