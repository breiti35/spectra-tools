@echo off
TITLE Spectra Tools - DEV MODE
echo Starte Entwicklungsumgebung...
echo.
echo 1. Starte Backend (Port 3000)...
start "Spectra Backend" cmd /k "cd server && node server.js"

echo 2. Starte Frontend (Port 5173)...
cd client
echo Warte kurz auf Backend...
timeout /t 2 >nul
start http://localhost:5173
npm run dev
pause
