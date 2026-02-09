from fastapi.staticfiles import StaticFiles
import os
import glob

# ... (existing imports)

# Mount recordings directory
if not os.path.exists("recordings"):
    os.makedirs("recordings")
app.mount("/files", StaticFiles(directory="recordings"), name="recordings")

# ... (existing code)

@app.get("/recordings/latest")
def get_latest_recording():
    # Find the most recent session ID based on file modification times
    # Or just parse filenames if they are timestamped consistently
    try:
        # Get all files in recordings dir
        files = glob.glob("recordings/*")
        if not files:
            return {"video": None, "audio": None, "midi": None}
            
        # Group by session ID (naive approach: split by underscore)
        # files like session_2023..._video.mp4
        
        # Sort by modification time
        latest_file = max(files, key=os.path.getctime)
        # Extract session ID from filename (e.g. "session_20231027_120000")
        basename = os.path.basename(latest_file)
        # Assuming format: session_TIMESTAMP_TYPE.ext
        parts = basename.split('_')
        if len(parts) >= 3:
            session_id = f"{parts[0]}_{parts[1]}_{parts[2]}"
        else:
            return {"video": None, "audio": None, "midi": None}

        return {
            "video": f"http://localhost:8000/files/{session_id}_video.mp4",
            "audio": f"http://localhost:8000/files/{session_id}_audio.wav",
            "midi": f"http://localhost:8000/files/{session_id}_midi.mid"
        }
    except Exception as e:
        print(f"Error getting latest: {e}")
        return {"video": None, "audio": None, "midi": None}

# ... (rest of the file)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from .recorder import MultiTrackRecorder
import uvicorn

app = FastAPI()

# Enable CORS for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

recorder = MultiTrackRecorder()

class StartRecordRequest(BaseModel):
    video_device_index: int = 0
    audio_device_index: Optional[int] = None
    midi_port_name: Optional[str] = None

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

@app.get("/ports")
def get_ports():
    return {
        "audio_devices": recorder.get_audio_devices(),
        "midi_ports": recorder.get_midi_ports()
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
