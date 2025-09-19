#!/bin/bash

# Port management for deterministic development server
# Usage: ./scripts/start-dev.sh [PORT]
# Default port: 3000

# Set default port from env or fallback to 3000
DEFAULT_PORT=${DEV_PORT:-3000}
TARGET_PORT=${1:-$DEFAULT_PORT}

echo "🚀 Starting development server on port $TARGET_PORT"

# Kill any existing process on target port
echo "🔍 Checking for existing processes on port $TARGET_PORT..."
PID=$(lsof -ti:$TARGET_PORT)
if [ ! -z "$PID" ]; then
    echo "💀 Killing existing process $PID on port $TARGET_PORT"
    kill -9 $PID 2>/dev/null || true
    sleep 1
fi

# Verify port is free
if lsof -ti:$TARGET_PORT >/dev/null 2>&1; then
    echo "❌ Port $TARGET_PORT is still in use. Trying to force kill..."
    lsof -ti:$TARGET_PORT | xargs -r kill -9 2>/dev/null || true
    sleep 2
fi

# Start the development server
echo "✅ Starting Next.js development server on port $TARGET_PORT"
PORT=$TARGET_PORT npm run dev