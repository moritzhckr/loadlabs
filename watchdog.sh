#!/bin/bash

# Watchdog script to keep LoadLabs services running

LOG_DIR="/tmp"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

start_backend() {
    cd /home/openclaw/.openclaw/workspace/sport-dashboard/backend
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > $BACKEND_LOG 2>&1 &
    echo "[$(date)] Backend started"
}

start_frontend() {
    cd /home/openclaw/.openclaw/workspace/sport-dashboard
    nohup npm run dev -- --host > $FRONTEND_LOG 2>&1 &
    echo "[$(date)] Frontend started"
}

check_backend() {
    if ! pgrep -f "uvicorn.*8000" > /dev/null; then
        echo "[$(date)] Backend not running, starting..."
        start_backend
    fi
}

check_frontend() {
    if ! pgrep -f "vite.*host" > /dev/null; then
        echo "[$(date)] Frontend not running, starting..."
        start_frontend
    fi
}

# Initial start
echo "[$(date)] Starting LoadLabs watchdog..."
start_backend
start_frontend

# Main loop
while true; do
    check_backend
    check_frontend
    sleep 30
done
