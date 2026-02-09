import cv2
import pyaudio
import wave
import mido
import threading
import time
import os
import subprocess
import re
from datetime import datetime

class MultiTrackRecorder:
    def __init__(self, recordings_dir="recordings"):
        self.recordings_dir = recordings_dir
        if not os.path.exists(self.recordings_dir):
            os.makedirs(self.recordings_dir)
            
        self.is_recording = False
        self.start_time = None
        
        # Audio config
        self.chunk = 1024
        self.format = pyaudio.paInt16
        self.channels = 2 # Will be updated based on device cap
        self.rate = 44100
        self.audio_frames = []
        
        # Video config
        self.video_cap = None
        self.video_writer = None
        
        # MIDI config
        self.midi_input = None
        self.midi_messages = []
        
        self.threads = []

    def start_recording(self, video_device_index=0, audio_device_index=None, midi_port_name=None):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_id = f"session_{timestamp}"
        
        self.is_recording = True
        self.start_time = time.time()
        self.audio_frames = []
        self.midi_messages = []
        
        # Start Audio Thread
        self.audio_thread = threading.Thread(target=self._record_audio, args=(audio_device_index,))
        self.audio_thread.start()
        
        # Start Video Thread
        self.video_thread = threading.Thread(target=self._record_video, args=(video_device_index,))
        self.video_thread.start()
        
        # Start MIDI Thread (if port provided)
        if midi_port_name:
            self.midi_thread = threading.Thread(target=self._record_midi, args=(midi_port_name,))
            self.midi_thread.start()
            
        print(f"Recording started: {self.session_id}")

    def stop_recording(self):
        self.is_recording = False
        
        if hasattr(self, 'audio_thread'):
            self.audio_thread.join()
        if hasattr(self, 'video_thread'):
            self.video_thread.join()
        if hasattr(self, 'midi_thread'):
            self.midi_thread.join()
            
        self._save_midi()
        print(f"Recording stopped: {self.session_id}")
        return self.session_id

    def _record_audio(self, device_index):
        p = pyaudio.PyAudio()
        
        # Determine channels for this device
        try:
            dev_info = p.get_device_info_by_host_api_device_index(0, device_index)
            max_channels = int(dev_info.get('maxInputChannels'))
            # Use 2 if available, otherwise mono
            channels = min(2, max_channels)
            if channels < 1: channels = 1 # Fallback
        except Exception as e:
            print(f"Error getting device info: {e}")
            channels = 1
            
        self.channels = channels # Update class var for saving later
        
        try:
            # Try preferred channels first
            try:
                stream = p.open(format=self.format,
                                channels=self.channels,
                                rate=self.rate,
                                input=True,
                                input_device_index=device_index,
                                frames_per_buffer=self.chunk)
            except OSError:
                # Fallback to mono if stereo fails (or vice versa)
                print("Fallback to mono recording")
                self.channels = 1
                stream = p.open(format=self.format,
                                channels=self.channels,
                                rate=self.rate,
                                input=True,
                                input_device_index=device_index,
                                frames_per_buffer=self.chunk)
        except Exception as e:
            print(f"Error opening audio stream: {e}")
            p.terminate()
            return
        
        
        while self.is_recording:
            data = stream.read(self.chunk)
            self.audio_frames.append(data)
            
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        # Save Audio
        filename = os.path.join(self.recordings_dir, f"{self.session_id}_audio.wav")
        wf = wave.open(filename, 'wb')
        wf.setnchannels(self.channels)
        wf.setsampwidth(p.get_sample_size(self.format))
        wf.setframerate(self.rate)
        wf.writeframes(b''.join(self.audio_frames))
        wf.close()

    def _record_video(self, device_index):
        cap = cv2.VideoCapture(device_index)
        
        # Check if camera opened successfully
        if not cap.isOpened():
            print("Error: Could not open video device.")
            return

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        filename = os.path.join(self.recordings_dir, f"{self.session_id}_video.mp4")
        
        # Default resolution - might need adjustment based on camera
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = 30.0 # Standard FPS
        
        out = cv2.VideoWriter(filename, fourcc, fps, (width, height))
        
        while self.is_recording:
            ret, frame = cap.read()
            if ret:
                out.write(frame)
            else:
                break
                
        cap.release()
        out.release()

    def _record_midi(self, port_name):
        try:
            with mido.open_input(port_name) as inport:
                while self.is_recording:
                    for msg in inport.iter_pending():
                        # Calculate delta time relative to start
                        current_time = time.time()
                        delta = current_time - self.start_time
                        self.midi_messages.append((delta, msg))
                    time.sleep(0.001) # Small sleep to prevent busy loop
        except Exception as e:
            print(f"MIDI Error: {e}")

    def _save_midi(self):
        if not self.midi_messages:
            return
            
        filename = os.path.join(self.recordings_dir, f"{self.session_id}_midi.mid")
        mid = mido.MidiFile()
        track = mido.MidiTrack()
        mid.tracks.append(track)
        
        last_time = 0
        ticks_per_second = 480 # Standard resolution
        
        for delta_time, msg in self.midi_messages:
            # Convert time headers to ticks
            # This is a simplified conversion
            ticks = int((delta_time - last_time) * ticks_per_second)
            last_time = delta_time
            
            msg.time = ticks
            track.append(msg)
            
        mid.save(filename)

    def get_audio_devices(self):
        p = pyaudio.PyAudio()
        info = p.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        devices = []
        for i in range(0, numdevices):
            if (p.get_device_info_by_host_api_device_index(0, i).get('maxInputChannels')) > 0:
                devices.append({
                    "index": i,
                    "name": p.get_device_info_by_host_api_device_index(0, i).get('name')
                })
        p.terminate()
        return devices

    def get_midi_ports(self):
        return mido.get_input_names()

    def get_video_devices(self):
        devices = []
        try:
            # Run ffmpeg command to list devices
            # ffmpeg writes to stderr
            cmd = ['ffmpeg', '-f', 'avfoundation', '-list_devices', 'true', '-i', '']
            result = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
            output = result.stderr
            
            lines = output.split('\n')
            parsing_video = False
            
            for line in lines:
                if "AVFoundation video devices:" in line:
                    parsing_video = True
                    continue
                if "AVFoundation audio devices:" in line:
                    parsing_video = False
                    break
                    
                if parsing_video:
                    # Match pattern like: [AVFoundation indev @ 0x...] [0] FaceTime HD Camera
                    # or just: [0] FaceTime HD Camera depending on version/output
                    # Regex to find [N] Some Name
                    match = re.search(r'\[(\d+)\] (.*)', line)
                    if match:
                        index = int(match.group(1))
                        name = match.group(2).strip()
                        # Verify this index works with cv2? 
                        # Usually AVFoundation index maps to cv2 index on mac if using avfoundation backend
                        devices.append({"index": index, "name": name})
                        
        except Exception as e:
            print(f"Error listing video devices: {e}")
            # Fallback
            for i in range(3):
                cap = cv2.VideoCapture(i)
                if cap.isOpened():
                    devices.append({"index": i, "name": f"Camera {i}"})
                    cap.release()
                    
        return devices
