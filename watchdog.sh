#!/bin/bash
# Watchdog for LoadLabs servers

BACKEND_PID=$(pgrep -f "uvicorn app.main" | head -1)
FRONTEND_PID=$(pgrep -f "vite" | head -1)

LOG_FILE="/tmp/loadlabs-watchdog.log"
echo "$(date): Backend=$BACKEND_PID Frontend=$FRONTEND_PID" >> $LOG_FILE

if [ -z "$BACKEND_PID" ]; then
    echo "$(date): Backend down, restarting..." >> $LOG_FILE
    cd /home/openclaw/.openclaw/workspace/sport-dashboard/backend && source venv/bin/activate && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 >> /tmp/loadlabs-backend.log 2>&1 &
fi

if [ -z "$FRONTEND_PID" ]; then
    echo "$(date): Frontend down, restarting..." >> $LOG_FILE
    cd /home/openclaw/.openclaw/workspace/sport-dashboard && nohup npm run dev >> /tmp/loadlabs-frontend.log 2>&1 &
fi
