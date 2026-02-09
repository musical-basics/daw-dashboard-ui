from fastapi import FastAPI, BackgroundTasks
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
