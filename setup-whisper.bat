@echo off
echo ========================================
echo Whisper Transcription Extension Setup
echo ========================================
echo.

echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found. Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js is properly installed
    echo.
    pause
    exit /b 1
)

echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode" (toggle in top right)
echo 3. Click "Load unpacked"
echo 4. Select this folder
echo 5. Make sure to use manifest-whisper.json as the manifest
echo.
echo Note: You may need to rename manifest-whisper.json to manifest.json
echo or update the extension settings to use the Whisper manifest.
echo.
pause 