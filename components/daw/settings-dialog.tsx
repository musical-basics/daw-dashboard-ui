"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Assuming sonner is available, or remove if not

export default function SettingsDialog() {
    const [open, setOpen] = useState(false);
    const [ports, setPorts] = useState<{ audio_devices: any[], midi_ports: string[] }>({ audio_devices: [], midi_ports: [] });
    const [selectedAudio, setSelectedAudio] = useState<string>("");
    const [selectedMidi, setSelectedMidi] = useState<string>("");

    // Load settings when dialog opens
    useEffect(() => {
        if (open) {
            // Fetch ports
            fetch("http://localhost:8000/ports")
                .then(res => res.json())
                .then(data => setPorts(data))
                .catch(err => console.error("Failed to fetch ports", err));

            // Reset to saved values
            // Note: mixing keys "daw_audio_device" vs "audioDeviceIndex" caused confusion earlier.
            // Sticking to "audioDeviceIndex" and "midiPortName" as requested by user.
            const savedAudio = localStorage.getItem("audioDeviceIndex");
            const savedMidi = localStorage.getItem("midiPortName");

            setSelectedAudio(savedAudio || "");
            setSelectedMidi(savedMidi || "");
        }
    }, [open]);

    const handleSave = () => {
        if (selectedAudio) localStorage.setItem("audioDeviceIndex", selectedAudio);
        if (selectedMidi) {
            localStorage.setItem("midiPortName", selectedMidi);
            window.dispatchEvent(new Event("midi-port-changed"));
        }
        setOpen(false);
        // Optional: toast.success("Settings saved");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                            onValueChange={setSelectedAudio}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Microphone" />
                            </SelectTrigger>
                            <SelectContent>
                                {ports.audio_devices.length === 0 && <SelectItem value="none" disabled>No devices found</SelectItem>}
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
                            onValueChange={setSelectedMidi}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select MIDI Device" />
                            </SelectTrigger>
                            <SelectContent>
                                {ports.midi_ports.length === 0 && <SelectItem value="none" disabled>No devices found</SelectItem>}
                                {ports.midi_ports.map((port: string) => (
                                    <SelectItem key={port} value={port}>
                                        {port}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
