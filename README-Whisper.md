# Whisper Live Transcription Extension

This is a Chrome extension that provides real-time transcription for Google Meet calls using local Whisper AI instead of external API services.

## Features

- **Local Transcription**: Uses Whisper AI running locally in your browser
- **Real-time**: Live transcription as you speak
- **Privacy-focused**: No data sent to external servers
- **Easy to use**: Simple interface with start/stop recording controls
- **Google Meet Integration**: Works seamlessly with Google Meet calls

## Setup Instructions

### Prerequisites

1. **Node.js and npm**: Make sure you have Node.js installed on your system
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Chrome Browser**: This extension works with Chrome and Chromium-based browsers

### Installation

1. **Clone or download** this repository to your local machine

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Load the extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top right)
   - Click "Load unpacked"
   - Select the folder containing this extension
   - Make sure to use the `manifest-whisper.json` file (rename it to `manifest.json` or update the extension to use it)

### Configuration

1. **Rename manifest file** (if needed):
   ```bash
   # Option 1: Rename the Whisper manifest to be the default
   mv manifest-whisper.json manifest.json
   
   # Option 2: Update the extension to use the Whisper manifest
   # (Edit the extension settings in Chrome)
   ```

2. **Grant microphone permissions**:
   - When you first use the extension, Chrome will ask for microphone access
   - Click "Allow" to enable transcription

## Usage

### Starting Transcription

1. **Join a Google Meet call**
2. **Click the extension icon** in your Chrome toolbar
3. **Click "Start Recording"** to begin transcription
4. **Speak clearly** - the extension will transcribe your speech in real-time
5. **Click "Show Transcript"** to view the live transcription overlay

### Controls

- **Start/Stop Recording**: Toggle transcription on and off
- **Clear Transcript**: Remove all transcribed text
- **Show Transcript**: Display the transcription overlay on the Google Meet page
- **Hide/Show Overlay**: Toggle the transcription display on the meeting page

### Status Indicators

- **Whisper Status**: Shows if the AI model is ready
- **Recording**: Shows if transcription is currently active
- **Segments**: Shows the number of transcribed segments

## Technical Details

### Architecture

- **Background Script** (`background-whisper.js`): Manages the Whisper service and recording
- **Content Script** (`content-whisper.js`): Handles the overlay and UI interactions
- **Whisper Service** (`js/transcription/whisper-service.js`): Local transcription using Transformers.js
- **Popup** (`popup-whisper.html/js`): Extension popup interface

### Dependencies

- `@xenova/transformers`: Provides the Whisper AI model for local transcription
- `node-fetch`: For HTTP requests (if needed for future features)

### Privacy

- **No external API calls**: All transcription happens locally in your browser
- **No data collection**: Your speech is not sent to any external servers
- **Local processing**: Audio is processed entirely on your device

## Troubleshooting

### Common Issues

1. **"Whisper Status: Error"**
   - Refresh the extension: Go to `chrome://extensions/` and click the refresh icon
   - Check your internet connection (needed for initial model download)
   - Try restarting Chrome

2. **"Failed to start recording"**
   - Make sure you're on a Google Meet page
   - Check that microphone permissions are granted
   - Try refreshing the page and trying again

3. **No transcription appearing**
   - Speak clearly and ensure your microphone is working
   - Check that the recording status shows "Recording"
   - Try clearing the transcript and starting over

4. **Extension not loading**
   - Make sure you're using the correct manifest file
   - Check that all files are in the correct locations
   - Verify that dependencies are installed

### Performance Tips

- **Close other tabs**: Free up memory for better performance
- **Use a modern browser**: Chrome 90+ recommended
- **Good internet connection**: Needed for initial model download
- **Clear browser cache**: If experiencing issues

## Development

### File Structure

```
├── manifest-whisper.json          # Extension manifest
├── background-whisper.js          # Background service worker
├── content-whisper.js             # Content script
├── popup-whisper.html             # Extension popup
├── popup-whisper.js               # Popup logic
├── js/
│   └── transcription/
│       └── whisper-service.js     # Whisper transcription service
├── overlay.css                     # Styles for the overlay
└── package.json                   # Dependencies
```

### Making Changes

1. **Edit the appropriate files** based on what you want to change
2. **Reload the extension** in `chrome://extensions/`
3. **Test your changes** in a Google Meet call

### Adding Features

- **New UI elements**: Edit `popup-whisper.html` and `popup-whisper.js`
- **Background logic**: Modify `background-whisper.js`
- **Overlay changes**: Update `content-whisper.js` and `overlay.css`
- **Transcription logic**: Modify `js/transcription/whisper-service.js`

## License

This project is open source. See the LICENSE file for details.

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Look at the browser console for error messages
3. Verify all files are in the correct locations
4. Make sure dependencies are properly installed

## Future Enhancements

- Support for multiple languages
- Speaker identification
- Export transcriptions
- Custom model selection
- Better error handling and user feedback 