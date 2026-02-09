import os
import subprocess
import logging
from scipy.io import wavfile
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import dawdreamer, fallback if not available
try:
    import dawdreamer as daw
    DAW_AVAILABLE = True
except ImportError:
    DAW_AVAILABLE = False
    logger.warning("DawDreamer not available. Offline rendering will be mocked.")

def render_project(session_id: str, vst_path: str, record_dir: str = "recordings"):
    """
    Renders a session's MIDI file through a VST plugin and merges it with the video.
    Returns the path to the final output video.
    """
    midi_path = os.path.join(record_dir, f"{session_id}_midi.mid")
    video_path = os.path.join(record_dir, f"{session_id}_video.mp4")
    temp_audio_path = os.path.join(record_dir, f"{session_id}_export_temp.wav")
    output_video_path = os.path.join(record_dir, f"{session_id}_final_export.mp4")

    # 1. Validation
    if not os.path.exists(midi_path):
        raise FileNotFoundError(f"MIDI file not found: {midi_path}")
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    if not os.path.exists(vst_path):
        raise FileNotFoundError(f"VST plugin not found: {vst_path}")

    logger.info(f"Starting render for Session: {session_id}")
    logger.info(f"VST Path: {vst_path}")

    if not DAW_AVAILABLE:
        # Create silent/dummy audio if dawdreamer is missing
        logger.warning("Rendering with DUMMY audio (DawDreamer missing)")
        duration = 5 # Mock duration
        SAMPLE_RATE = 44100
        # Generate 5 seconds of silence or simple tone
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
        audio = np.sin(2 * np.pi * 440 * t) * 0.1 # A440 tone
        wavfile.write(temp_audio_path, SAMPLE_RATE, audio.astype(np.float32))
    else:
        # 2. Initialize DawDreamer
        SAMPLE_RATE = 44100
        BUFFER_SIZE = 512
        engine = daw.RenderEngine(sample_rate=SAMPLE_RATE, block_size=BUFFER_SIZE)

        # 3. Load VST
        try:
            synth = engine.make_plugin_processor("synth", vst_path)
        except Exception as e:
            logger.error(f"Failed to load VST: {e}")
            raise RuntimeError(f"Could not load VST plugin at {vst_path}. Ensure it is a valid VST3/AU/VST2.")

        # 4. Load MIDI
        try:
            engine.load_midi(midi_path, clear_previous=True, map_to_processor="synth") 
        except Exception as e:
            logger.error(f"Failed to load MIDI: {e}")
            raise

        # 5. Connect to Graph
        engine.load_graph([(synth, [])])

        # 6. Render
        import mido
        mid = mido.MidiFile(midi_path)
        duration = mid.length
        
        logger.info(f"Rendering {duration} seconds...")
        engine.render(duration + 1.0) # Add 1s tail
        audio = engine.get_audio()

        # 7. Save Audio
        wavfile.write(temp_audio_path, SAMPLE_RATE, audio.transpose())
        logger.info(f"Audio rendered to {temp_audio_path}")

    # 8. Merge with Video using FFmpeg
    # ffmpeg -i video.mp4 -i audio.wav -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 output.mp4
    # We replace audio of original video
    cmd = [
        "ffmpeg",
        "-y", # Overwrite
        "-i", video_path,
        "-i", temp_audio_path,
        "-c:v", "copy", # Copy video stream without re-encoding
        "-c:a", "aac",  # Encode audio to AAC
        "-map", "0:v:0", # Use video from first input
        "-map", "1:a:0", # Use audio from second input
        "-shortest",    # End when shortest stream ends
        output_video_path
    ]
    
    logger.info("Merging with FFmpeg...")
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if result.returncode != 0:
        logger.error(f"FFmpeg failed: {result.stderr.decode()}")
        raise RuntimeError("Failed to merge video/audio with FFmpeg")

    # Cleanup temp audio
    if os.path.exists(temp_audio_path):
        os.remove(temp_audio_path)

    logger.info(f"Export Success: {output_video_path}")
    return os.path.basename(output_video_path)
