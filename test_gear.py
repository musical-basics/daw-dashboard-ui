import pyaudio
import mido

print("------ AUDIO INPUTS ------")
try:
    p = pyaudio.PyAudio()
    info = p.get_host_api_info_by_index(0)
    numdevices = info.get('deviceCount')
    found = False
    for i in range(0, numdevices):
        if (p.get_device_info_by_host_api_device_index(0, i).get('maxInputChannels')) > 0:
            print(f"ID {i}: {p.get_device_info_by_host_api_device_index(0, i).get('name')}")
            found = True
    if not found:
        print("No microphones found.")
    p.terminate()
except Exception as e:
    print(f"Audio Error: {e}")

print("\n------ MIDI INPUTS ------")
try:
    ports = mido.get_input_names()
    if ports:
        for port in ports:
            print(f"MIDI: {port}")
    else:
        print("No MIDI devices found.")
except Exception as e:
    print(f"MIDI Error: {e}")
