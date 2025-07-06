// Constants
let whisperService = null;
let isRecording = false;
let currentMeetingId = null;

// Initialize Whisper service
async function initializeWhisperService() {
  if (!whisperService) {
    try {
      // For Service Worker, we can't use dynamic imports
      // The Whisper service will be handled by the content script
      // This background script will just manage the state
      whisperService = {
        isReady: () => true,
        startRecording: async () => {
          // Send message to content script to start recording
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.tabs.sendMessage(tab.id, { action: 'startWhisperRecording' });
          }
        },
        stopRecording: async () => {
          // Send message to content script to stop recording
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.tabs.sendMessage(tab.id, { action: 'stopWhisperRecording' });
          }
        },
        getTranscript: () => {
          // This will be handled by content script
          return { segments: [] };
        },
        getTranscriptSince: (since) => {
          // This will be handled by content script
          return { segments: [] };
        },
        clearTranscript: async () => {
          // Send message to content script to clear transcript
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab) {
            await chrome.tabs.sendMessage(tab.id, { action: 'clearWhisperTranscript' });
          }
        },
        transcriptionSegments: []
      };
      console.log('Whisper service initialized (Service Worker mode)');
    } catch (error) {
      console.error('Failed to initialize Whisper service:', error);
    }
  }
  return whisperService;
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "ping":
      // Simple ping to check connection
      sendResponse({ success: true });
      break;

    case "startWhisperRecording":
      startWhisperRecording(message.meetingId)
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => {
          console.error('Error starting Whisper recording:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Required for async response

    case "stopWhisperRecording":
      stopWhisperRecording()
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => {
          console.error('Error stopping Whisper recording:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "getWhisperTranscript":
      getWhisperTranscript(message.since)
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => {
          console.error('Error getting Whisper transcript:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "clearWhisperTranscript":
      clearWhisperTranscript()
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => {
          console.error('Error clearing Whisper transcript:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "getWhisperStatus":
      getWhisperStatus()
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) => {
          console.error('Error getting Whisper status:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "whisperTranscriptUpdate":
      // Handle transcript updates from content script
      if (whisperService) {
        whisperService.transcriptionSegments = message.segments || [];
      }
      break;
  }
});

// Start Whisper recording
async function startWhisperRecording(meetingId) {
  try {
    const service = await initializeWhisperService();
    
    if (!service) {
      throw new Error('Failed to initialize Whisper service');
    }

    if (isRecording) {
      throw new Error('Recording is already in progress');
    }

    currentMeetingId = meetingId;
    await service.startRecording();
    isRecording = true;

    console.log(`Started Whisper recording for meeting: ${meetingId}`);
    return { message: 'Recording started successfully' };
  } catch (error) {
    console.error('Error in startWhisperRecording:', error);
    throw error;
  }
}

// Stop Whisper recording
async function stopWhisperRecording() {
  try {
    if (!whisperService) {
      throw new Error('Whisper service not initialized');
    }

    if (!isRecording) {
      throw new Error('No recording in progress');
    }

    await whisperService.stopRecording();
    isRecording = false;
    currentMeetingId = null;

    console.log('Stopped Whisper recording');
    return { message: 'Recording stopped successfully' };
  } catch (error) {
    console.error('Error in stopWhisperRecording:', error);
    throw error;
  }
}

// Get Whisper transcript
async function getWhisperTranscript(since = null) {
  try {
    const service = await initializeWhisperService();
    
    if (!service) {
      throw new Error('Failed to initialize Whisper service');
    }

    // Request transcript from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getWhisperTranscript',
        since: since 
      });
      return response;
    }

    return { segments: [] };
  } catch (error) {
    console.error('Error in getWhisperTranscript:', error);
    throw error;
  }
}

// Clear Whisper transcript
async function clearWhisperTranscript() {
  try {
    const service = await initializeWhisperService();
    
    if (!service) {
      throw new Error('Failed to initialize Whisper service');
    }

    await service.clearTranscript();
    console.log('Cleared Whisper transcript');
    return { message: 'Transcript cleared successfully' };
  } catch (error) {
    console.error('Error in clearWhisperTranscript:', error);
    throw error;
  }
}

// Get Whisper status
async function getWhisperStatus() {
  try {
    const service = await initializeWhisperService();
    
    if (!service) {
      return {
        initialized: false,
        recording: false,
        meetingId: null,
        segmentsCount: 0
      };
    }

    // Request status from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'getWhisperStatus' 
        });
        return {
          ...response,
          recording: isRecording,
          meetingId: currentMeetingId
        };
      } catch (error) {
        // Content script might not be ready yet
        console.log('Content script not ready, using fallback status');
      }
    }

    return {
      initialized: service.isReady(),
      recording: isRecording,
      meetingId: currentMeetingId,
      segmentsCount: service.transcriptionSegments ? service.transcriptionSegments.length : 0
    };
  } catch (error) {
    console.error('Error in getWhisperStatus:', error);
    throw error;
  }
}

// Extract meeting ID from Google Meet URL
function extractMeetingId(url) {
  const meetRegex = /meet\.google\.com\/([a-z0-9-]+)/i;
  const match = url.match(meetRegex);
  return match ? match[1] : null;
}

// When a tab is updated, check if it's a Google Meet and update the extension icon
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("meet.google.com")
  ) {
    const meetingId = extractMeetingId(tab.url);
    if (meetingId) {
      chrome.tabs.sendMessage(tabId, {
        action: "meetDetected",
        meetingId: meetingId,
      });
    }
  }
});

// Initialize Whisper service when extension loads
initializeWhisperService().catch(error => {
  console.error('Failed to initialize Whisper service on startup:', error);
}); 