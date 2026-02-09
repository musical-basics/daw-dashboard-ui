from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import glob
import uvicorn
import json
from .recorder import MultiTrackRecorder

CONFIG_FILE = "config.json"

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4) // turbo-all

app = FastAPI()

# Enable CORS for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount recordings directory
if not os.path.exists("recordings"):
    os.makedirs("recordings")
app.mount("/files", StaticFiles(directory="recordings"), name="recordings")

recorder = MultiTrackRecorder()

class StartRecordRequest(BaseModel):
    video_device_index: Optional[int] = None
    audio_device_index: Optional[int] = None
    midi_port_name: Optional[str] = None

class ConfigRequest(BaseModel):
    video_device_index: Optional[str] = None # Using str to match frontend state, or int? Frontend sends strings for Select. Let's use str and cast.
    audio_device_index: Optional[str] = None
    midi_port_name: Optional[str] = None

@app.get("/recordings/latest")
def get_latest_recording():
    try:
        files = glob.glob("recordings/*")
        if not files:
            return {"video": None, "audio": None, "midi": None}
            
        latest_file = max(files, key=os.path.getctime)
        basename = os.path.basename(latest_file)
        parts = basename.split('_')
        if len(parts) >= 3:
            session_id = f"{parts[0]}_{parts[1]}_{parts[2]}"
        else:
            return {"video": None, "audio": None, "midi": None}

        midi_path = f"recordings/{session_id}_midi.mid"
        midi_url = f"http://localhost:8000/files/{session_id}_midi.mid" if os.path.exists(midi_path) else None

        return {
            "video": f"http://localhost:8000/files/{session_id}_video.mp4",
            "audio": f"http://localhost:8000/files/{session_id}_audio.wav",
            "midi": midi_url
        }
    except Exception as e:
        print(f"Error getting latest: {e}")
        return {"video": None, "audio": None, "midi": None}

@app.get("/recordings/list")
def list_recordings():
    try:
        # List sessions (using video files as the anchor)
        files = glob.glob("recordings/*_video.mp4")
        recordings = []
        for f in files:
            stat = os.stat(f)
            # Extract session ID from filename: session_YYYYMMDD_HHMMSS_video.mp4
            basename = os.path.basename(f)
            session_id = basename.replace("_video.mp4", "")
            
            recordings.append({
                "id": session_id,
                "name": basename,
                "size": f"{stat.st_size / (1024*1024):.1f} MB",
                "timestamp": stat.st_mtime
            })
        
        # Sort by timestamp descending (newest first)
        recordings.sort(key=lambda x: x["timestamp"], reverse=True)
        return recordings
    except Exception as e:
        print(f"Error listing recordings: {e}")
        return []
@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/record/start")
def start_recording(req: StartRecordRequest, background_tasks: BackgroundTasks):
    if recorder.is_recording:
        return {"status": "error", "message": "Already recording"}
    
    # Start recording in background (though the recorder spawns threads anyway)
    recorder.start_recording(
        video_device_index=req.video_device_index,
        audio_device_index=req.audio_device_index,
        midi_port_name=req.midi_port_name
    )
    return {"status": "started"}

@app.post("/record/stop")
def stop_recording():
    if not recorder.is_recording:
        return {"status": "error", "message": "Not recording"}
    
    session_id = recorder.stop_recording()
    return {"status": "stopped", "session_id": session_id}

    return {
        "audio_devices": recorder.get_audio_devices(),
        "midi_ports": recorder.get_midi_ports(),
        "video_devices": recorder.get_video_devices()
    }

@app.get("/config")
def get_config():
    return load_config()

@app.post("/config")
def update_config(cfg: ConfigRequest):
    current = load_config()
    # Update only provided fields
    if cfg.video_device_index is not None:
        current["videoDeviceIndex"] = cfg.video_device_index
    if cfg.audio_device_index is not None:
        current["audioDeviceIndex"] = cfg.audio_device_index
    if cfg.midi_port_name is not None:
        current["midiPortName"] = cfg.midi_port_name
    
    save_config(current)
    return {"status": "saved", "config": current}

from .renderer import render_project

class ExportRequest(BaseModel):
    session_id: str
    vst_path: str

@app.post("/export")
def export_session(req: ExportRequest, background_tasks: BackgroundTasks):
    # Verify session exists (simple check)
    if not os.path.exists(f"recordings/{req.session_id}_midi.mid"):
        return {"status": "error", "message": "Session MIDI not found"}
        
    # Run export (blocking for now for simplicity, or background?)
    # Prompt suggestion: "Processing..." status or block.
    # Let's block for now as it's easier to handle "success" in frontend without polling.
    # But rendering takes 5-10s.
    
    try:
        output_filename = render_project(req.session_id, req.vst_path)
        output_url = f"http://localhost:8000/files/{output_filename}"
        return {"status": "done", "url": output_url}
    except Exception as e:
        print(f"Export failed: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
