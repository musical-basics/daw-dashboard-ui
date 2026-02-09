import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { MidiOutHook } from './use-midi-out';

interface PlaybackHook {
    isPlaying: boolean;
    currentTime: number;
    play: () => void;
    stop: () => void;
    rewind: () => void;
    // We might need to expose duration or other transport info
}

export function usePlayback(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    midiUrl: string | null,
    midiOut: MidiOutHook
): PlaybackHook {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const tonePartRef = useRef<Tone.Part | null>(null);
    const durationRef = useRef(0); // Track duration

    // Initialize Audio Context on user interaction (handled by play button usually)
    const ensureAudioContext = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }
    };

    // Load MIDI into Transport
    // This effect runs when midiUrl changes to schedule notes
    useEffect(() => {
        if (!midiUrl) return;

        const loadAndScheduleRequest = async () => {
            const midi = await Midi.fromUrl(midiUrl);
            durationRef.current = midi.duration;

            // Clear previous part
            if (tonePartRef.current) {
                tonePartRef.current.dispose();
            }

            // We only care about the first track for now, or merge them?
            // Let's assume Track 0 is our main MIDI track
            const track = midi.tracks[0];
            if (!track) return;

            // Create Tone.Part
            // Events are [time, note] objects
            const events = track.notes.map(note => ({
                time: note.time,
                note: note.name,
                duration: note.duration,
                velocity: note.velocity
            }));

            tonePartRef.current = new Tone.Part((time, event) => {
                // Trigger MIDI Out
                // Tone.Draw.schedule ensures visual/main thread sync if needed, 
                // but for MIDI hardware we want precise timing.
                // WebMidi actions are immediate.
                // We use Tone.Transport.schedule for timing.

                // Note On
                midiOut.sendNoteOn(event.note, event.velocity);

                // Note Off scheduling
                // We can rely on Tone.Part to trigger the callback at start time.
                // We need to schedule the release ourselves or use duration logic.
                // Simplified: Just use setTimeout-ish logic via Transport?
                // Better: Schedule a separate event for NoteOff?
                // Or simplest: WebMidi playNote supports duration!
                // BUT: playNote duration uses setTimeout which might drift from Transport if stopped?
                // Let's manually trigger NoteOff via Transport to be safe and stoppable.

                Tone.Transport.schedule((stopTime) => {
                    midiOut.sendNoteOff(event.note);
                }, time + event.duration);

            }, events).start(0);

        };

        loadAndScheduleRequest();

        return () => {
            if (tonePartRef.current) {
                tonePartRef.current.dispose();
            }
        };
    }, [midiUrl]); // Re-schedule if URL changes (re-recording)

    // Sync Loop
    useEffect(() => {
        let animationFrame: number;

        const loop = () => {
            // Update React State for Playhead
            // Tone.Transport.seconds is the master clock
            setCurrentTime(Tone.Transport.seconds);

            // Drift Correction for Video
            if (videoRef.current && !videoRef.current.paused) {
                const videoTime = videoRef.current.currentTime;
                const transportTime = Tone.Transport.seconds;
                const diff = Math.abs(videoTime - transportTime);

                if (diff > 0.1) {
                    // Nudge video
                    // console.log(`Drift detected: ${diff}. Syncing video.`);
                    videoRef.current.currentTime = transportTime;
                }
            }

            if (Tone.Transport.state === 'started') {
                animationFrame = requestAnimationFrame(loop);
            }
        };

        if (isPlaying) {
            loop();
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, videoRef]);


    const play = useCallback(async () => {
        await ensureAudioContext();

        Tone.Transport.start();
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
        setIsPlaying(true);
    }, [videoRef]);

    const stop = useCallback(() => {
        Tone.Transport.stop();
        if (videoRef.current) {
            videoRef.current.pause();
        }

        // Panic: All notes off
        // We can't easily track all active notes without a registry, 
        // but we can send AllNotesOff CC (123) if the device supports it,
        // or just rely on MIDI out hook's state if we tracked it.
        // For now, let's just reset state.

        setIsPlaying(false);
    }, [videoRef]);

    const rewind = useCallback(() => {
        // If playing, stop first? Or just jump?
        // Standard DAW behavior: Jump to 0.
        Tone.Transport.seconds = 0;
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
        setCurrentTime(0);
    }, [videoRef]);

    return {
        isPlaying,
        currentTime,
        play,
        stop,
        rewind
    };
}
