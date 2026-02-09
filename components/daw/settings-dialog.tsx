"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsDialog() {
    const [ports, setPorts] = useState<{ audio_devices: any[], midi_ports: string[] }>({ audio_devices: [], midi_ports: [] });
    const [selectedAudio, setSelectedAudio] = useState<string>("");
    const [selectedMidi, setSelectedMidi] = useState<string>("");

    useEffect(() => {
        fetch("http://localhost:8000/ports")
            .then(res => res.json())
            .then(data => setPorts(data))
            .catch(err => console.error("Failed to fetch ports", err));

        // Load saved settings
        const savedAudio = localStorage.getItem("daw_audio_device"); // user prompt used "audioDeviceIndex", but I used "daw_audio_device" in recorder hook. I should stick to one. User's prompt code uses "audioDeviceIndex". Use what user provided to be safe/consistent with their new code? 
        // Wait, the user provided code uses "audioDeviceIndex". My recorder hook used "daw_audio_device". 
        // I should update the recorder hook to match or update this code to match.
        // User said "Execute Phase 7... Update the Recorder to use the selected devices."
        // User's provided code for `SettingsDialog` uses `audioDeviceIndex`.
        // I will use `audioDeviceIndex` and `midiPortName` as per user code, and I will need to update `use-recorder.tsx` to match.
        // Actually, let's just stick to what the user provided in the prompt for this file.

        // User code:
        // const savedAudio = localStorage.getItem("audioDeviceIndex");
        // const savedMidi = localStorage.getItem("midiPortName");

        if (localStorage.getItem("audioDeviceIndex")) setSelectedAudio(localStorage.getItem("audioDeviceIndex")!);
        if (localStorage.getItem("midiPortName")) setSelectedMidi(localStorage.getItem("midiPortName")!);
    }, []);

    const handleSave = (key: string, value: string) => {
        localStorage.setItem(key, value);
        // You could also trigger a toast notification here
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" title="Settings">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Hardware Settings</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">

                    {/* Audio Input */}
                    <div className="grid gap-2">
                        <Label>Audio Input (Microphone)</Label>
                        <Select
                            value={selectedAudio}
                            onValueChange={(val) => { setSelectedAudio(val); handleSave("audioDeviceIndex", val); }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Microphone" />
                            </SelectTrigger>
                            <SelectContent>
                                {ports.audio_devices.map((device: any) => (
                                    <SelectItem key={device.index} value={device.index.toString()}>
                                        {device.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* MIDI Input */}
                    <div className="grid gap-2">
                        <Label>MIDI Input (Keyboard)</Label>
                        <Select
                            value={selectedMidi}
                            onValueChange={(val) => { setSelectedMidi(val); handleSave("midiPortName", val); }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select MIDI Device" />
                            </SelectTrigger>
                            <SelectContent>
                                {ports.midi_ports.map((port: string) => (
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
