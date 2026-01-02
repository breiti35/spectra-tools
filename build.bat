@echo off
TITLE Spectra Tools - BUILDER
echo Baue Frontend fuer Production...
echo.
cd client
call npm run build
echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo  BUILD ERFOLGREICH!
    echo ========================================
    echo Du kannst jetzt start.bat nutzen.
) else (
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    echo  FEHLER BEIM BUILD
    echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
)
pause
