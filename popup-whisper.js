// Global variables
let isRecording = false;
let whisperStatus = 'loading';
let segmentsCount = 0;

// DOM elements
const whisperStatusEl = document.getElementById('whisper-status');
const recordingStatusEl = document.getElementById('recording-status');
const segmentsCountEl = document.getElementById('segments-count');
const toggleRecordingBtn = document.getElementById('toggle-recording');
const clearTranscriptBtn = document.getElementById('clear-transcript');
const showTranscriptBtn = document.getElementById('show-transcript');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('Whisper popup initialized');
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial status
  loadStatus();
  
  // Start status polling
  startStatusPolling();
});

// Set up event listeners
function setupEventListeners() {
  // Toggle recording button
  toggleRecordingBtn.addEventListener('click', toggleRecording);
  
  // Clear transcript button
  clearTranscriptBtn.addEventListener('click', clearTranscript);
  
  // Show transcript button
  showTranscriptBtn.addEventListener('click', showTranscript);
}

// Load current status from background script
function loadStatus() {
  chrome.runtime.sendMessage({ action: 'getWhisperStatus' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      updateStatus('error', 'Stopped', 0);
      return;
    }

    if (response && response.success) {
      const status = response.data;
      updateStatus(
        status.initialized ? 'ready' : 'not-ready',
        status.recording ? 'Recording' : 'Stopped',
        status.segmentsCount || 0
      );
      
      isRecording = status.recording;
      updateButtonStates();
    } else {
      console.error('Failed to get status:', response?.error);
      updateStatus('error', 'Error', 0);
    }
  });
}

// Start status polling
function startStatusPolling() {
  // Poll every 2 seconds
  setInterval(() => {
    loadStatus();
  }, 2000);
}

// Update status display
function updateStatus(whisperStatus, recordingStatus, segments) {
  // Update Whisper status
  whisperStatusEl.textContent = getStatusText(whisperStatus);
  whisperStatusEl.className = `status-value ${whisperStatus}`;
  
  // Update recording status
  recordingStatusEl.textContent = recordingStatus;
  recordingStatusEl.className = `status-value ${recordingStatus === 'Recording' ? 'recording' : ''}`;
  
  // Update segments count
  segmentsCountEl.textContent = segments;
  
  // Store global state
  whisperStatus = whisperStatus;
  segmentsCount = segments;
}

// Get status text
function getStatusText(status) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'not-ready':
      return 'Initializing...';
    case 'error':
      return 'Error';
    default:
      return 'Loading...';
  }
}

// Update button states based on current status
function updateButtonStates() {
  const isReady = whisperStatus === 'ready';
  
  // Toggle recording button
  toggleRecordingBtn.disabled = !isReady;
  
  if (isReady) {
    if (isRecording) {
      toggleRecordingBtn.textContent = 'Stop Recording';
      toggleRecordingBtn.className = 'btn btn-danger';
    } else {
      toggleRecordingBtn.textContent = 'Start Recording';
      toggleRecordingBtn.className = 'btn btn-primary';
    }
  } else {
    toggleRecordingBtn.innerHTML = `
      <span class="loading">
        <div class="spinner"></div>
        Initializing...
      </span>
    `;
    toggleRecordingBtn.className = 'btn btn-primary';
  }
  
  // Other buttons
  clearTranscriptBtn.disabled = !isReady || segmentsCount === 0;
  showTranscriptBtn.disabled = !isReady || segmentsCount === 0;
}

// Toggle recording
function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

// Start recording
function startRecording() {
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('No active tab found');
      return;
    }

    const tab = tabs[0];
    const meetingId = extractMeetingId(tab.url);
    
    if (!meetingId) {
      alert('Please navigate to a Google Meet call first.');
      return;
    }

    // Start recording via background script
    chrome.runtime.sendMessage(
      { action: 'startWhisperRecording', meetingId: meetingId },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          alert('Failed to start recording. Please try again.');
          return;
        }

        if (response && response.success) {
          isRecording = true;
          updateButtonStates();
          console.log('Recording started successfully');
        } else {
          console.error('Failed to start recording:', response?.error);
          alert('Failed to start recording: ' + (response?.error || 'Unknown error'));
        }
      }
    );
  });
}

// Stop recording
function stopRecording() {
  chrome.runtime.sendMessage({ action: 'stopWhisperRecording' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      alert('Failed to stop recording. Please try again.');
      return;
    }

    if (response && response.success) {
      isRecording = false;
      updateButtonStates();
      console.log('Recording stopped successfully');
    } else {
      console.error('Failed to stop recording:', response?.error);
      alert('Failed to stop recording: ' + (response?.error || 'Unknown error'));
    }
  });
}

// Clear transcript
function clearTranscript() {
  chrome.runtime.sendMessage({ action: 'clearWhisperTranscript' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      alert('Failed to clear transcript. Please try again.');
      return;
    }

    if (response && response.success) {
      segmentsCount = 0;
      updateStatus(whisperStatus, isRecording ? 'Recording' : 'Stopped', 0);
      updateButtonStates();
      console.log('Transcript cleared successfully');
    } else {
      console.error('Failed to clear transcript:', response?.error);
      alert('Failed to clear transcript: ' + (response?.error || 'Unknown error'));
    }
  });
}

// Show transcript
function showTranscript() {
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error('No active tab found');
      return;
    }

    const tab = tabs[0];
    const meetingId = extractMeetingId(tab.url);
    
    if (!meetingId) {
      alert('Please navigate to a Google Meet call first.');
      return;
    }

    // Send message to content script to show transcript
    chrome.tabs.sendMessage(tab.id, { action: 'injectOverlay', meetingId: meetingId }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        alert('Failed to show transcript. Please refresh the page and try again.');
        return;
      }

      if (response && response.success) {
        console.log('Transcript overlay injected successfully');
        // Close popup
        window.close();
      } else {
        console.error('Failed to show transcript:', response?.error);
        alert('Failed to show transcript. Please try again.');
      }
    });
  });
}

// Extract meeting ID from Google Meet URL
function extractMeetingId(url) {
  const meetRegex = /meet\.google\.com\/([a-z0-9-]+)/i;
  const match = url.match(meetRegex);
  return match ? match[1] : null;
} 