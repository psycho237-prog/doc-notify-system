#!/bin/bash

# DocNotify - Universal Start Script
# This script starts both the backend and frontend concurrently.

echo "🚀 Starting DocNotify System..."

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "Stopping DocNotify..."
    kill $(jobs -p)
    exit
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo "📡 Starting Backend API..."
cd backend && node index.js &

# Wait a moment for backend to initialize
sleep 2

# Start Frontend
echo "💻 Starting Frontend Dev Server..."
cd ../frontend && npm run dev &

# Keep script running
wait
