#!/bin/bash
trap "kill 0" EXIT

echo "Spectra Tools - DEV MODE"
echo "1. Starting Backend (Port 3000)..."
(cd server && node server.js) &

sleep 2

echo "2. Starting Frontend (Port 5173)..."
(cd client && npm run dev) &

sleep 3
xdg-open http://localhost:5173 2>/dev/null || echo "Please open http://localhost:5173"

wait
