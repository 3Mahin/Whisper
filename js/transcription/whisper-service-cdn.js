/**
 * Whisper Transcription Service (CDN Version)
 * Provides local transcription using Whisper model via CDN
 */

class WhisperTranscriptionService {
  constructor() {
    this.pipeline = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.transcriptionSegments = [];
    this.currentSegmentId = 0;
    this.lastTranscriptionTime = 0;
    this.recordingStartTime = 0;
  }

  /**
   * Initialize the Whisper model via CDN
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    
    try {
      // Load transformers.js from CDN
      if (typeof window.pipeline === 'undefined') {
        // Load the script if not already loaded
        await this.loadTransformersScript();
      }
      
      // Initialize the pipeline
      this.pipeline = await window.pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
      
      this.isInitialized = true;
      console.log('Whisper transcription service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Whisper service:', error);
      this.isInitializing = false;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Load transformers.js from CDN
   */
  async loadTransformersScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.pipeline) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.15.0/dist/transformers.min.js';
      script.onload = () => {
        console.log('Transformers.js loaded from CDN');
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load transformers.js from CDN'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Start recording audio from the current tab
   */
  async startRecording() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create audio context
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      // Set up event listeners
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processAudioChunks();
      };

      // Start recording
      this.mediaRecorder.start(5000); // Record in 5-second chunks
      
      console.log('Started recording audio for transcription');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Process recorded audio chunks and transcribe them
   */
  async processAudioChunks() {
    if (this.audioChunks.length === 0) return;

    try {
      // Combine audio chunks into a single blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert blob to array buffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Transcribe the audio
      const result = await this.pipeline(new Uint8Array(arrayBuffer));
      
      if (result && result.text && result.text.trim()) {
        // Create a new transcription segment
        const segment = {
          id: `whisper_${this.currentSegmentId++}`,
          text: result.text.trim(),
          start: this.lastTranscriptionTime,
          end: this.lastTranscriptionTime + (Date.now() - this.recordingStartTime) / 1000,
          start_time: this.formatTimestamp(this.lastTranscriptionTime),
          end_time: this.formatTimestamp(this.lastTranscriptionTime + (Date.now() - this.recordingStartTime) / 1000),
          speaker: 'Speaker',
          speaker_name: 'Speaker',
          created_at: new Date().toISOString(),
          absolute_start_time: new Date(this.recordingStartTime).toISOString()
        };

        this.transcriptionSegments.push(segment);
        this.lastTranscriptionTime = segment.end;
        
        console.log('Transcribed segment:', segment);
      }

      // Clear processed chunks
      this.audioChunks = [];
    } catch (error) {
      console.error('Failed to process audio chunks:', error);
    }
  }

  /**
   * Get all transcription segments
   */
  getTranscript() {
    return {
      segments: this.transcriptionSegments,
      meeting_id: 'local_whisper_meeting',
      language: 'en'
    };
  }

  /**
   * Get transcription segments since a specific timestamp
   */
  getTranscriptSince(since) {
    if (!since) {
      return this.getTranscript();
    }

    const sinceTime = new Date(since).getTime();
    const filteredSegments = this.transcriptionSegments.filter(segment => {
      const segmentTime = new Date(segment.absolute_start_time).getTime();
      return segmentTime > sinceTime;
    });

    return {
      segments: filteredSegments,
      meeting_id: 'local_whisper_meeting',
      language: 'en'
    };
  }

  /**
   * Format timestamp in HH:MM:SS format
   */
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clear all transcription data
   */
  clearTranscript() {
    this.transcriptionSegments = [];
    this.currentSegmentId = 0;
    this.lastTranscriptionTime = 0;
  }

  /**
   * Check if the service is ready
   */
  isReady() {
    return this.isInitialized && !this.isInitializing;
  }
}

// Export the service
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhisperTranscriptionService;
} else {
  // Browser environment
  window.WhisperTranscriptionService = WhisperTranscriptionService;
} 