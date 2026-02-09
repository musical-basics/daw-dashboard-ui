#!/bin/bash

# Function to handle cleanup on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT)
trap cleanup SIGINT

echo "Starting DAW Dashboard..."

# 1. Start Python Backend
echo "Starting Python Backend (Port 8000)..."
# Check if virtual environment exists, activate if so (standard convention)
if [ -d "venv" ]; then
    source venv/bin/activate
fi
# Run server module
python3 -m backend.server &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# 2. Start Frontend
echo "Starting Next.js Frontend (Port 3000)..."
pnpm dev

# Wait for both
wait
