#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT

# --- CONFIGURATION ---
# We force Port 3005 to avoid conflict with your other apps
export PORT=3005
export ELECTRON_START_URL="http://localhost:$PORT"

echo "Starting DAW Dashboard on Port $PORT..."

# 1. Start Python Backend
echo "Starting Python Backend (Port 8000)..."
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 -m backend.server &
BACKEND_PID=$!

sleep 2

# 2. Start Frontend (Force Port)
echo "Starting Next.js Frontend..."
# We use 'next dev' directly to pass the -p flag easily, 
# or we pass the PORT env var which Next.js respects.
PORT=$PORT pnpm dev &
FRONTEND_PID=$!

# Wait for the CORRECT port to be ready
echo "Waiting for frontend on port $PORT..."
while ! nc -z localhost $PORT; do   
  sleep 1
done
echo "Frontend is ready on port $PORT!"

# 3. Start Electron (It will read ELECTRON_START_URL)
echo "Starting Electron..."
pnpm electron

# When Electron exits, kill everything
cleanup
