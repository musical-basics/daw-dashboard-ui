"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Assuming sonner is available, or remove if not

// Lifted state for controlled component
interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
    const [ports, setPorts] = useState<{ audio_devices: any[], midi_ports: string[], video_devices: any[] }>({ audio_devices: [], midi_ports: [], video_devices: [] });
    // Use string type explicitly
    const [selectedAudio, setSelectedAudio] = useState<string>("");
    const [selectedMidi, setSelectedMidi] = useState<string>("");
    const [selectedVideo, setSelectedVideo] = useState<string>("");

    // Load settings when dialog opens
    useEffect(() => {
        if (open) {
            // Fetch ports
            fetch("http://localhost:8000/ports")
                .then(res => res.json())
                .then(data => setPorts({
                    audio_devices: data.audio_devices || [],
                    midi_ports: data.midi_ports || [],
                    video_devices: data.video_devices || []
                }))
                .catch(err => console.error("Failed to fetch ports", err));

            // Fetch saved config from backend
            fetch("http://localhost:8000/config")
                .then(res => res.json())
                .then(config => {
                    // Fallback to localStorage if backend config is empty? 
                    // Or prioritize backend. Let's prioritize backend.
                    const savedAudio = config.audioDeviceIndex || localStorage.getItem("audioDeviceIndex") || "";
                    const savedMidi = config.midiPortName || localStorage.getItem("midiPortName") || "";
                    const savedVideo = config.videoDeviceIndex || localStorage.getItem("videoDeviceIndex") || "0";

                    setSelectedAudio(savedAudio);
                    setSelectedMidi(savedMidi);
                    setSelectedVideo(savedVideo);
                })
                .catch(err => {
                    console.error("Failed to fetch config", err);
                    // Fallback to localStorage
                    setSelectedAudio(localStorage.getItem("audioDeviceIndex") || "");
                    setSelectedMidi(localStorage.getItem("midiPortName") || "");
                    setSelectedVideo(localStorage.getItem("videoDeviceIndex") || "0");
                });
        }
    }, [open]);

    const handleSave = () => {
        const newConfig: any = {};

        // Update LocalStorage AND Prepare Backend Config
        if (selectedAudio !== "") {
            localStorage.setItem("audioDeviceIndex", selectedAudio);
            newConfig.audio_device_index = selectedAudio;
        }
        if (selectedVideo !== "") {
            localStorage.setItem("videoDeviceIndex", selectedVideo);
            newConfig.video_device_index = selectedVideo;
        }
        if (selectedMidi !== "") {
            localStorage.setItem("midiPortName", selectedMidi);
            newConfig.midi_port_name = selectedMidi;

            // Dispatch event for other components to pick up immediately
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event("midi-port-changed"));
            }
        }

        // Save to Backend
        fetch("http://localhost:8000/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newConfig)
        }).catch(err => console.error("Failed to save config to backend", err));

        onOpenChange(false);
        toast.success("Settings saved");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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

                    {/* Video Input */}
                    <div className="grid gap-2">
                        <Label>Video Input (Camera)</Label>
                        <Select
                            value={selectedVideo}
                            onValueChange={setSelectedVideo}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Camera" />
                            </SelectTrigger>
                            <SelectContent>
                                {ports.video_devices.length === 0 && <SelectItem value="0">Default Camera (0)</SelectItem>}
                                {ports.video_devices.map((device: any) => (
                                    <SelectItem key={device.index} value={device.index.toString()}>
                                        {device.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
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
