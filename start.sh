#!/bin/bash
echo "Spectra Tools - Server"
echo "Opening http://localhost:3000..."

xdg-open http://localhost:3000 2>/dev/null || echo "Please open http://localhost:3000" &

cd server
node server.js
