"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

interface Device {
    id: number | string;
    name: string;
}

interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [audioDevices, setAudioDevices] = useState<Device[]>([]);
    const [midiPorts, setMidiPorts] = useState<string[]>([]);

    const [selectedAudio, setSelectedAudio] = useState<string>("");
    const [selectedMidi, setSelectedMidi] = useState<string>("");

    useEffect(() => {
        // Load saved settings
        const savedAudio = localStorage.getItem("daw_audio_device") || "";
        const savedMidi = localStorage.getItem("daw_midi_device") || "";
        setSelectedAudio(savedAudio);
        setSelectedMidi(savedMidi);

        // Fetch devices
        fetch("http://localhost:8000/ports")
            .then(res => res.json())
            .then(data => {
                // Backend returns: { audio_devices: [{index, name, ...}], midi_ports: ["name", ...] }
                const audio = data.audio_devices.map((d: any) => ({ id: d.index, name: d.name }));
                setAudioDevices(audio);
                setMidiPorts(data.midi_ports);
            })
            .catch(err => console.error("Failed to fetch ports:", err));
    }, [open]);

    const handleAudioChange = (val: string) => {
        setSelectedAudio(val);
        localStorage.setItem("daw_audio_device", val);
    };

    const handleMidiChange = (val: string) => {
        setSelectedMidi(val);
        localStorage.setItem("daw_midi_device", val);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Device Settings
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Audio Input</Label>
                        <Select value={selectedAudio} onValueChange={handleAudioChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Microphone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default Input</SelectItem>
                                {audioDevices.map((d) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>MIDI Input</Label>
                        <Select value={selectedMidi} onValueChange={handleMidiChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select MIDI Device" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {midiPorts.map((port) => (
                                    <SelectItem key={port} value={port}>
                                        {port}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
