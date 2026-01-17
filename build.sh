#!/bin/bash
echo "Building Frontend for Production..."
cd client
npm run build

if [ $? -eq 0 ]; then
    echo "========================================"
    echo " BUILD SUCCESSFUL!"
    echo "========================================"
    echo "You can now use ./start.sh"
else
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo " BUILD FAILED"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
fi
