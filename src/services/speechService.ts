// Speech-to-Text Service for FlightRiskRadar Chatbot
// Uses Web Speech API for voice input

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  error: string;
  message: string;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResult: ((result: SpeechRecognitionResult) => void) | null = null;
  private onError: ((error: SpeechRecognitionError) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check if SpeechRecognition is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        const isFinal = event.results[i].isFinal;

        if (isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }

        if (this.onResult) {
          this.onResult({
            transcript: isFinal ? finalTranscript : interimTranscript,
            confidence,
            isFinal
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (this.onError) {
        this.onError({
          error: event.error,
          message: event.message || 'Speech recognition error'
        });
      }
    };
  }

  // Check if speech recognition is supported
  isSupported(): boolean {
    return this.recognition !== null;
  }

  // Start listening for speech input
  startListening(): boolean {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  // Stop listening for speech input
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Check if currently listening
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Set language for speech recognition
  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Set up result callback
  onResultCallback(callback: (result: SpeechRecognitionResult) => void) {
    this.onResult = callback;
  }

  // Set up error callback
  onErrorCallback(callback: (error: SpeechRecognitionError) => void) {
    this.onError = callback;
  }

  // Set up start callback
  onStartCallback(callback: () => void) {
    this.onStart = callback;
  }

  // Set up end callback
  onEndCallback(callback: () => void) {
    this.onEnd = callback;
  }

  // Remove all callbacks
  removeCallbacks() {
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
  }

  // Get available languages (common ones)
  getAvailableLanguages(): { code: string; name: string }[] {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'it-IT', name: 'Italian' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ja-JP', name: 'Japanese' },
      { code: 'ko-KR', name: 'Korean' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
    ];
  }

  // Clean up resources
  destroy() {
    if (this.recognition) {
      this.recognition.stop();
      this.removeCallbacks();
    }
  }
}

// Create and export the speech service instance
const speechService = new SpeechService();

export default speechService; 