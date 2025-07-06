// Global variables
let meetingId = null;
let overlayContainer = null;
let isOverlayVisible = false;
let transcriptElements = {};
let pollingInterval = null;
let lastFetchTime = 0;
let isExtensionAlive = true;
let lastTranscriptData = null;
let lastSegmentCount = 0;
let lastFetchTimestamp = null;
let overlayOpacity = 0.9; // Default opacity value
let isRecording = false;
let whisperService = null;

// Initialize Whisper service
async function initializeWhisperService() {
  if (!whisperService) {
    try {
      // Check if WhisperTranscriptionService is available (from whisper-service-cdn.js)
      if (typeof window.WhisperTranscriptionService !== 'undefined') {
        whisperService = new window.WhisperTranscriptionService();
        await whisperService.initialize();
        console.log('Whisper service initialized in content script');
      } else {
        console.error('WhisperTranscriptionService not available');
        throw new Error('Whisper service not available');
      }
    } catch (error) {
      console.error('Failed to initialize Whisper service:', error);
      throw error;
    }
  }
  return whisperService;
}

// Helper function to check if extension is still alive
function checkRuntimeConnection() {
  try {
    // Try to send a simple message to the background script
    chrome.runtime.sendMessage({ action: "ping" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log("Extension context invalidated, stopping polling");
        isExtensionAlive = false;
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        return false;
      }
      return true;
    });
  } catch (e) {
    console.log("Extension context error:", e);
    isExtensionAlive = false;
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    return false;
  }
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "meetDetected":
      // Meeting detected, store the meeting ID
      const isNewMeeting = meetingId !== message.meetingId;
      meetingId = message.meetingId;

      // If this is a new meeting, clear any existing transcript data
      if (isNewMeeting) {
        lastTranscriptData = null;
        lastSegmentCount = 0;
        lastFetchTimestamp = null;
        transcriptElements = {};

        // If overlay is already visible, update it for the new meeting
        if (overlayContainer && isOverlayVisible) {
          const transcriptContainer = document.getElementById(
            "vexa-transcript-container"
          );
          if (transcriptContainer) {
            transcriptContainer.innerHTML = "";
          }

          // Show loading indicator again
          const loadingIndicator = document.getElementById(
            "vexa-loading-indicator"
          );
          if (loadingIndicator) {
            loadingIndicator.style.display = "block";
          }
        }
      }

      sendResponse({ success: true });
      break;

    case "injectOverlay":
      // Inject the translation overlay into the current page
      const isNewBot = meetingId !== message.meetingId;
      meetingId = message.meetingId;

      // Always clear transcript data when explicitly injecting a new overlay
      lastTranscriptData = null;
      lastSegmentCount = 0;
      lastFetchTimestamp = null;
      transcriptElements = {};

      injectOverlay();
      startWhisperRecording();
      startTranscriptPolling();
      sendResponse({ success: true });
      break;

    case "startWhisperRecording":
      // Handle start recording request from background script
      startWhisperRecording()
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "stopWhisperRecording":
      // Handle stop recording request from background script
      stopWhisperRecording()
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "getWhisperTranscript":
      // Handle get transcript request from background script
      getWhisperTranscript(message.since)
        .then((transcript) => sendResponse(transcript))
        .catch((error) => sendResponse({ segments: [], error: error.message }));
      return true;

    case "clearWhisperTranscript":
      // Handle clear transcript request from background script
      clearWhisperTranscript()
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case "getWhisperStatus":
      // Handle get status request from background script
      getWhisperStatus()
        .then((status) => sendResponse(status))
        .catch((error) => sendResponse({ 
          initialized: false, 
          recording: false, 
          segmentsCount: 0,
          error: error.message 
        }));
      return true;

    case "ping":
      // Simple ping to check if content script is alive
      sendResponse({ success: true });
      break;
  }
});

// Start Whisper recording
async function startWhisperRecording() {
  try {
    const service = await initializeWhisperService();
    if (!service) {
      throw new Error('Failed to initialize Whisper service');
    }

    await service.startRecording();
    isRecording = true;
    console.log('Started Whisper recording');
    
    // Update button state
    const button = document.getElementById("vexa-toggle-recording");
    if (button) {
      button.textContent = "Stop Recording";
      button.classList.remove("vexa-btn-primary");
      button.classList.add("vexa-btn-danger");
    }

    // Hide loading indicator
    const loadingIndicator = document.getElementById("vexa-loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }

    return { success: true };
  } catch (error) {
    console.error('Error starting Whisper recording:', error);
    throw error;
  }
}

// Stop Whisper recording
async function stopWhisperRecording() {
  try {
    if (!whisperService) {
      throw new Error('Whisper service not initialized');
    }

    whisperService.stopRecording();
    isRecording = false;
    console.log('Stopped Whisper recording');

    // Update button state
    const button = document.getElementById("vexa-toggle-recording");
    if (button) {
      button.textContent = "Start Recording";
      button.classList.remove("vexa-btn-danger");
      button.classList.add("vexa-btn-primary");
    }

    return { success: true };
  } catch (error) {
    console.error('Error stopping Whisper recording:', error);
    throw error;
  }
}

// Get Whisper transcript
async function getWhisperTranscript(since = null) {
  try {
    const service = await initializeWhisperService();
    if (!service) {
      return { segments: [] };
    }

    const transcript = since ? service.getTranscriptSince(since) : service.getTranscript();
    return transcript;
  } catch (error) {
    console.error('Error getting Whisper transcript:', error);
    return { segments: [] };
  }
}

// Clear Whisper transcript
async function clearWhisperTranscript() {
  try {
    const service = await initializeWhisperService();
    if (!service) {
      throw new Error('Whisper service not initialized');
    }

    service.clearTranscript();
    console.log('Cleared Whisper transcript');

    // Clear display
    const transcriptContainer = document.getElementById("vexa-transcript-container");
    if (transcriptContainer) {
      transcriptContainer.innerHTML = '<div class="vexa-transcript-placeholder">Transcription will appear here...</div>';
    }

    return { success: true };
  } catch (error) {
    console.error('Error clearing Whisper transcript:', error);
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
        segmentsCount: 0
      };
    }

    return {
      initialized: service.isReady(),
      recording: isRecording,
      segmentsCount: service.transcriptionSegments ? service.transcriptionSegments.length : 0
    };
  } catch (error) {
    console.error('Error getting Whisper status:', error);
    return {
      initialized: false,
      recording: false,
      segmentsCount: 0
    };
  }
}

// Inject the overlay into the page
function injectOverlay() {
  if (overlayContainer) {
    return; // Already injected
  }

  // Create overlay container
  overlayContainer = document.createElement("div");
  overlayContainer.id = "vexa-overlay";
  overlayContainer.innerHTML = `
    <div class="vexa-overlay-header">
      <div class="vexa-overlay-title">
        <span class="vexa-icon">🎤</span>
        Whisper Transcription
      </div>
      <div class="vexa-overlay-controls">
        <button id="vexa-toggle-recording" class="vexa-btn vexa-btn-primary">
          Start Recording
        </button>
        <button id="vexa-clear-transcript" class="vexa-btn vexa-btn-secondary">
          Clear
        </button>
        <button id="vexa-toggle-overlay" class="vexa-btn vexa-btn-secondary">
          Hide
        </button>
      </div>
    </div>
    <div class="vexa-overlay-content">
      <div id="vexa-loading-indicator" class="vexa-loading">
        <div class="vexa-spinner"></div>
        <span>Initializing Whisper...</span>
      </div>
      <div id="vexa-transcript-container" class="vexa-transcript-container">
        <div class="vexa-transcript-placeholder">
          Transcription will appear here...
        </div>
      </div>
    </div>
  `;

  // Add overlay to page
  document.body.appendChild(overlayContainer);
  isOverlayVisible = true;

  // Add event listeners
  setupOverlayEventListeners();
}

// Setup event listeners for overlay controls
function setupOverlayEventListeners() {
  // Toggle recording button
  const toggleRecordingBtn = document.getElementById("vexa-toggle-recording");
  if (toggleRecordingBtn) {
    toggleRecordingBtn.addEventListener("click", toggleRecording);
  }

  // Clear transcript button
  const clearTranscriptBtn = document.getElementById("vexa-clear-transcript");
  if (clearTranscriptBtn) {
    clearTranscriptBtn.addEventListener("click", clearTranscript);
  }

  // Toggle overlay button
  const toggleOverlayBtn = document.getElementById("vexa-toggle-overlay");
  if (toggleOverlayBtn) {
    toggleOverlayBtn.addEventListener("click", toggleOverlay);
  }
}

// Toggle recording
function toggleRecording() {
  const button = document.getElementById("vexa-toggle-recording");
  if (!button) return;

  if (isRecording) {
    // Stop recording
    stopWhisperRecording()
      .then(() => {
        console.log('Recording stopped');
      })
      .catch((error) => {
        console.error('Failed to stop recording:', error);
      });
  } else {
    // Start recording
    startWhisperRecording()
      .then(() => {
        console.log('Recording started');
      })
      .catch((error) => {
        console.error('Failed to start recording:', error);
      });
  }
}

// Clear transcript function
function clearTranscript() {
  clearWhisperTranscript()
    .then(() => {
      console.log('Transcript cleared');
    })
    .catch((error) => {
      console.error('Failed to clear transcript:', error);
    });
}

// Toggle overlay visibility
function toggleOverlay() {
  const overlay = document.getElementById("vexa-overlay");
  const button = document.getElementById("vexa-toggle-overlay");
  
  if (overlay && button) {
    if (isOverlayVisible) {
      overlay.style.display = "none";
      button.textContent = "Show";
      isOverlayVisible = false;
    } else {
      overlay.style.display = "block";
      button.textContent = "Hide";
      isOverlayVisible = true;
    }
  }
}

// Poll for transcript updates
function startTranscriptPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  // Reset extension status
  isExtensionAlive = true;

  // Immediately fetch the transcript
  fetchTranscript();

  // Then set up interval to fetch every 2 seconds
  pollingInterval = setInterval(async () => {
    // First check if extension is still alive
    if (!isExtensionAlive) {
      clearInterval(pollingInterval);
      pollingInterval = null;
      return;
    }

    // Throttle fetches to prevent excessive calls
    const now = Date.now();
    if (now - lastFetchTime >= 2000) {
      // 2 second minimum between calls
      await fetchTranscript();
    }
  }, 2000); // Poll every 2 seconds
}

// Fetch the transcript from Whisper service
async function fetchTranscript() {
  if (!meetingId || !isExtensionAlive) return;

  lastFetchTime = Date.now();

  try {
    // Get transcript directly from local Whisper service
    const transcriptData = await getWhisperTranscript(lastFetchTimestamp);
    
    if (transcriptData && transcriptData.segments && transcriptData.segments.length > 0) {
      // Find the most recent timestamp in the response
      const latestSegment = [...transcriptData.segments].sort((a, b) => {
        if (a.absolute_start_time && b.absolute_start_time) {
          return (
            new Date(b.absolute_start_time) -
            new Date(a.absolute_start_time)
          );
        }
        return b.start - a.start;
      })[0];

      // Use the absolute timestamp if available
      if (latestSegment.absolute_start_time) {
        lastFetchTimestamp = new Date(
          latestSegment.absolute_start_time
        ).toISOString();
      }

      // If this is our first fetch or we have more segments than before, update the UI
      const newSegmentCount = transcriptData.segments.length;
      if (
        newSegmentCount > lastSegmentCount ||
        lastTranscriptData === null
      ) {
        // If we're using the 'since' parameter, we need to merge with previous data
        if (lastFetchTimestamp && lastTranscriptData) {
          // Create a merged segments array, removing duplicates
          const existingSegmentIds = new Set(
            lastTranscriptData.segments.map(
              (s) =>
                s.id ||
                `${s.start}-${s.end}-${s.text?.substring(0, 20)}`.replace(
                  /\s+/g,
                  "-"
                )
            )
          );

          const newSegments = transcriptData.segments.filter((segment) => {
            const segmentId =
              segment.id ||
              `${segment.start}-${segment.end}-${segment.text?.substring(
                0,
                20
              )}`.replace(/\s+/g, "-");
            return !existingSegmentIds.has(segmentId);
          });

          // Create a merged data object
          const mergedData = {
            ...transcriptData,
            segments: [...lastTranscriptData.segments, ...newSegments],
          };

          lastTranscriptData = mergedData;
          lastSegmentCount = mergedData.segments.length;
          updateTranscriptDisplay(mergedData);
        } else {
          // First fetch or not using 'since' parameter
          lastTranscriptData = transcriptData;
          lastSegmentCount = newSegmentCount;
          updateTranscriptDisplay(transcriptData);
        }
      }
    } else {
      // Handle the case where the service returns an empty or different format
      console.log("Whisper service returned data but no segments:", transcriptData);
      if (!lastTranscriptData) {
        // If we don't have any previous data, use this as our baseline
        lastTranscriptData = transcriptData;
        updateTranscriptDisplay(transcriptData);
      }
    }
  } catch (e) {
    console.error("Error in fetchTranscript:", e);
    isExtensionAlive = false;
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}

// Update the transcript display with new data
function updateTranscriptDisplay(transcriptData) {
  if (
    !transcriptData ||
    !transcriptData.segments ||
    transcriptData.segments.length === 0
  ) {
    return;
  }

  const loadingIndicator = document.getElementById("vexa-loading-indicator");
  const transcriptContainer = document.getElementById(
    "vexa-transcript-container"
  );

  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }

  if (!transcriptContainer) return;

  // Keep track if we added new content (for autoscroll)
  let addedNewContent = false;

  // Create a map of existing segments to avoid reprocessing them
  const processedSegmentIds = new Set(Object.keys(transcriptElements));

  // Sort segments by start time to ensure chronological order
  const sortedSegments = [...transcriptData.segments].sort((a, b) => {
    // First try to sort by absolute start time if available
    if (a.absolute_start_time && b.absolute_start_time) {
      return new Date(a.absolute_start_time) - new Date(b.absolute_start_time);
    }
    // Fall back to relative start time
    return a.start - b.start;
  });

  // Process and display each segment that hasn't been displayed yet
  sortedSegments.forEach((segment) => {
    // Generate a stable ID for this segment
    const segmentId =
      segment.id ||
      `${segment.start}-${segment.end}-${segment.text?.substring(
        0,
        20
      )}`.replace(/\s+/g, "-");

    // Skip if we've already displayed this segment
    if (processedSegmentIds.has(segmentId)) return;

    // For segments without an ID, check if we have a similar segment already
    // This helps prevent duplicates when segments are slightly modified
    if (!segment.id) {
      // Check for segments with same text and similar timestamps
      const similarSegmentExists = Object.values(transcriptElements).some(
        (el) => {
          const text = el.querySelector(".vexa-transcript-text")?.textContent;
          return text === segment.text;
        }
      );

      if (similarSegmentExists) return;
    }

    // Create a new transcript item
    const transcriptItem = document.createElement("div");
    transcriptItem.className = "vexa-transcript-item";
    transcriptItem.dataset.segmentId = segmentId;

    // Format the timestamp (convert seconds to readable time)
    const timestamp = formatTimestamp(segment.start_time || segment.start);

    // Determine speaker name (use a default if not provided)
    const speakerName = segment.speaker_name || segment.speaker || "Speaker";

    // Create the transcript header with speaker and time
    const transcriptHeader = document.createElement("div");
    transcriptHeader.className = "vexa-transcript-header";
    transcriptHeader.innerHTML = `
      <span class="vexa-transcript-speaker">${speakerName}</span>
      <span class="vexa-transcript-time">${timestamp}</span>
    `;

    // Create the transcript text
    const transcriptText = document.createElement("div");
    transcriptText.className = "vexa-transcript-text";
    transcriptText.textContent = segment.text || "";

    // Assemble the transcript item
    transcriptItem.appendChild(transcriptHeader);
    transcriptItem.appendChild(transcriptText);

    // Add to the container (oldest first for better scrolling)
    transcriptContainer.appendChild(transcriptItem);

    // Store reference to avoid duplication
    transcriptElements[segmentId] = transcriptItem;
    addedNewContent = true;

    // Limit the number of displayed segments (keep the 100 most recent)
    // This prevents the DOM from growing too large
    const maxSegments = 100;
    if (Object.keys(transcriptElements).length > maxSegments) {
      // Find the oldest segment and remove it
      const oldestSegmentId = Object.keys(transcriptElements)[0];
      const oldestSegment = transcriptElements[oldestSegmentId];
      if (oldestSegment && oldestSegment.parentNode) {
        oldestSegment.parentNode.removeChild(oldestSegment);
        delete transcriptElements[oldestSegmentId];
      }
    }
  });

  // Auto-scroll to the bottom if new content was added
  if (addedNewContent) {
    // Smooth scroll with a small delay to ensure content is rendered
    setTimeout(() => {
      transcriptContainer.scrollTop = transcriptContainer.scrollHeight;
    }, 100);
  }
}

// Format timestamp in HH:MM:SS format
function formatTimestamp(seconds) {
  if (typeof seconds === 'string') {
    return seconds; // Already formatted
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
} 