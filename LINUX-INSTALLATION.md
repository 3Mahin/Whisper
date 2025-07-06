# 🐧 Linux Installation Guide for Vexa AI Chrome Extension

This guide will help you install and set up the Vexa AI Chrome Extension with Whisper transcription on Linux.

## Prerequisites

### System Requirements
- **Linux Distribution**: Ubuntu 18.04+, Debian 10+, CentOS 7+, or similar
- **Chrome Browser**: Version 90 or higher
- **RAM**: At least 4GB (8GB recommended for better performance)
- **Storage**: At least 2GB free space
- **Internet**: Required for initial setup and model download

### Required Packages
```bash
# Update package list
sudo apt update

# Install essential packages
sudo apt install -y curl wget git unzip
```

## Installation Options

### Option 1: Simple Setup (Recommended for Beginners)

This option uses the CDN version which doesn't require Node.js installation.

#### Step 1: Download the Extension
```bash
# Clone the repository
git clone https://github.com/your-repo/VexaAIChromeExtension.git
cd VexaAIChromeExtension

# Or download and extract if you have a ZIP file
# unzip VexaAIChromeExtension-main.zip
# cd VexaAIChromeExtension-main
```

#### Step 2: Prepare the Extension
```bash
# Rename the simple manifest to be the default
cp manifest-whisper-simple.json manifest.json
```

#### Step 3: Load in Chrome
1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer mode**:
   - Toggle the "Developer mode" switch in the top right corner
3. **Load the extension**:
   - Click "Load unpacked"
   - Select the folder containing your extension files
   - Make sure you're selecting the folder that contains `manifest.json`
4. **Grant permissions**:
   - When prompted, allow microphone access
   - This is required for transcription to work

### Option 2: Full Setup (With Node.js)

This option provides the full version with local Node.js dependencies.

#### Step 1: Install Node.js

**Method A: Using NodeSource Repository (Recommended)**
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Method B: Using Snap (Alternative)**
```bash
# Install Node.js via Snap
sudo snap install node --classic

# Verify installation
node --version
npm --version
```

**Method C: Using NVM (For Multiple Node.js Versions)**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version
npm --version
```

#### Step 2: Install Dependencies
```bash
# Navigate to the extension directory
cd VexaAIChromeExtension

# Install dependencies
npm install
```

#### Step 3: Prepare the Extension
```bash
# Use the full manifest
cp manifest-whisper.json manifest.json
```

#### Step 4: Load in Chrome
Follow the same steps as Option 1, Step 3.

## Testing the Installation

### Step 1: Test the Extension
1. **Go to Google Meet**: Visit https://meet.google.com/
2. **Join or create a meeting**
3. **Click the extension icon** in your Chrome toolbar
4. **Click "Start Recording"** to begin transcription
5. **Speak clearly** to test the transcription
6. **Click "Show Transcript"** to see the live overlay

### Step 2: Verify Functionality
- You should see "Whisper Status: Ready" in the extension popup
- When you speak, transcription should appear in real-time
- The overlay should display the transcribed text

## Troubleshooting

### Common Issues and Solutions

#### 1. Extension Not Loading
```bash
# Check file permissions
chmod -R 755 /path/to/extension

# Verify manifest.json exists
ls -la manifest.json

# Check Chrome console for errors
# Press F12 in Chrome and check the Console tab
```

#### 2. Microphone Permission Issues
```bash
# Check microphone permissions
pavucontrol  # For PulseAudio
# or
alsamixer    # For ALSA

# In Chrome:
# 1. Click the microphone icon in the address bar
# 2. Select "Allow" for microphone access
# 3. Refresh the page and try again
```

#### 3. Node.js Installation Issues
```bash
# If Node.js installation fails, try:
sudo apt update
sudo apt upgrade
sudo apt install -y build-essential

# For NVM issues:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
```

#### 4. Whisper Model Download Issues
```bash
# Check internet connection
ping -c 3 google.com

# Clear browser cache
# In Chrome: Settings > Privacy and security > Clear browsing data

# Check available disk space
df -h
```

#### 5. Performance Issues
```bash
# Check system resources
htop
# or
top

# Close unnecessary applications
# Restart Chrome
```

### Debugging Commands

#### Check System Information
```bash
# Check Linux distribution
cat /etc/os-release

# Check kernel version
uname -r

# Check available memory
free -h

# Check disk space
df -h
```

#### Check Chrome Installation
```bash
# Check Chrome version
google-chrome --version

# Check if Chrome is running
ps aux | grep chrome
```

#### Check Extension Files
```bash
# Verify all required files exist
ls -la manifest.json
ls -la background-whisper.js
ls -la content-whisper.js
ls -la popup-whisper.html
ls -la popup-whisper.js
ls -la overlay.css
ls -la js/transcription/
ls -la images/
```

## Performance Optimization

### System Optimization
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Install performance monitoring tools
sudo apt install -y htop iotop

# Optimize swap (if needed)
sudo swapon --show
```

### Browser Optimization
1. **Close unnecessary tabs** to free up memory
2. **Clear browser cache** regularly
3. **Disable unnecessary Chrome extensions**
4. **Use hardware acceleration** if available

### Extension-Specific Tips
1. **Use the simple setup** (Option 1) for better performance
2. **Ensure good internet connection** for initial model download
3. **Speak clearly** for better transcription accuracy
4. **Close other applications** to free up system resources

## File Structure Verification

After installation, your extension folder should look like this:
```
VexaAIChromeExtension/
├── manifest.json
├── background-whisper.js
├── content-whisper.js
├── popup-whisper.html
├── popup-whisper.js
├── overlay.css
├── package.json (for full setup)
├── package-lock.json (for full setup)
├── js/
│   └── transcription/
│       ├── whisper-service-cdn.js (simple setup)
│       └── whisper-service.js (full setup)
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Support and Help

### Getting Help
1. **Check the browser console** for error messages (F12)
2. **Verify all files are present** in the correct locations
3. **Try the simple setup** (Option 1) first
4. **Ensure good internet connection** for initial model download

### Useful Commands for Debugging
```bash
# Check Chrome processes
ps aux | grep chrome

# Check system logs
journalctl -f

# Monitor system resources
htop

# Check network connectivity
ping -c 3 google.com
```

### Contact Information
- **Extension Issues**: Open an issue in the repository
- **Vexa API Issues**: Contact the Vexa team on their Discord channel
- **Linux-specific Issues**: Check your distribution's documentation

## Notes

- The extension will work completely offline after the initial Whisper model download
- The CDN version (Option 1) is recommended for most users
- The full version (Option 2) provides more features but requires more system resources
- Make sure to grant microphone permissions when prompted
- The extension is designed to work with Google Meet specifically

## Quick Test Checklist

- [ ] Extension loads in Chrome without errors
- [ ] Microphone permissions granted
- [ ] "Whisper Status: Ready" appears in popup
- [ ] Can start recording in Google Meet
- [ ] Transcription appears when speaking
- [ ] Overlay displays transcribed text
- [ ] Can stop recording and view transcript

If all items are checked, your installation is successful! 