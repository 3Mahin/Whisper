# 🎤 Whisper Transcription Extension - Quick Setup

## Option 1: Simple Setup (No Node.js Required)

### Step 1: Prepare the Extension

1. **Rename the manifest file**:
   ```bash
   # Rename the simple manifest to be the default
   copy manifest-whisper-simple.json manifest.json
   ```

2. **Or manually rename**:
   - Rename `manifest-whisper-simple.json` to `manifest.json`
   - This will replace the original Vexa manifest

### Step 2: Load in Chrome

1. **Open Chrome** and go to `chrome://extensions/`

2. **Enable Developer mode**:
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing your extension files
   - Make sure you're selecting the folder that contains `manifest.json`

4. **Grant permissions**:
   - When prompted, allow microphone access
   - This is required for transcription to work

### Step 3: Test the Extension

1. **Go to Google Meet**:
   - Visit https://meet.google.com/
   - Join or create a meeting

2. **Use the extension**:
   - Click the extension icon in your Chrome toolbar
   - Click "Start Recording" to begin transcription
   - Speak clearly to test the transcription
   - Click "Show Transcript" to see the live overlay

## Option 2: Full Setup (With Node.js)

If you want to install Node.js for the full version:

### Step 1: Install Node.js

1. **Download Node.js** from https://nodejs.org/
2. **Install it** following the installer instructions
3. **Restart your terminal/PowerShell**

### Step 2: Install Dependencies

1. **Open terminal/PowerShell** in the extension folder
2. **Run the setup script**:
   ```bash
   setup-whisper.bat
   ```
   
   Or manually:
   ```bash
   npm install
   ```

### Step 3: Load the Extension

1. **Use the full manifest**:
   - Rename `manifest-whisper.json` to `manifest.json`
   - Or keep the original name and load it manually

2. **Load in Chrome** (same as Option 1, Step 2)

## Troubleshooting

### Common Issues

1. **"Extension not loading"**
   - Make sure you're using the correct manifest file
   - Check that all files are in the right locations
   - Try refreshing the extension in `chrome://extensions/`

2. **"Microphone permission denied"**
   - Click the microphone icon in Chrome's address bar
   - Select "Allow" for microphone access
   - Refresh the page and try again

3. **"Whisper Status: Error"**
   - Check your internet connection (needed for initial model download)
   - Try refreshing the extension
   - Restart Chrome and try again

4. **"No transcription appearing"**
   - Make sure you're speaking clearly
   - Check that the recording status shows "Recording"
   - Try clearing the transcript and starting over

### File Structure Check

Make sure you have these files in your extension folder:

```
├── manifest.json (or manifest-whisper-simple.json)
├── background-whisper.js
├── content-whisper.js
├── popup-whisper.html
├── popup-whisper.js
├── overlay.css
├── js/
│   └── transcription/
│       └── whisper-service-cdn.js (for simple setup)
│       └── whisper-service.js (for full setup)
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Performance Tips

- **Close other tabs** to free up memory
- **Use a modern browser** (Chrome 90+)
- **Good internet connection** for initial model download
- **Clear browser cache** if experiencing issues

## Quick Test

1. **Load the extension** in Chrome
2. **Go to Google Meet** and join a meeting
3. **Click the extension icon**
4. **Click "Start Recording"**
5. **Speak clearly** - you should see transcription appear
6. **Click "Show Transcript"** to see the overlay

If everything works, you'll see real-time transcription of your speech!

## Need Help?

If you're still having issues:

1. **Check the browser console** for error messages
2. **Verify all files are present** in the correct locations
3. **Try the simple setup** (Option 1) first
4. **Make sure you have a good internet connection** for the initial model download

The extension will work completely offline after the initial Whisper model download! 