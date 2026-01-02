@echo off
TITLE Spectra Tools - Server
echo Starte Spectra Tools...
echo.
echo Öffne http://localhost:3000 im Browser...
start http://localhost:3000

cd server
node server.js
pause