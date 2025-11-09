// ElevenLabs Voice Service for FlightRiskRadar Chatbot
// Based on ElevenLabs Conversational AI examples

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: Record<string, string>;
}

class VoiceService {
  private apiKey: string;
  private baseUrl: string = import.meta.env.VITE_ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io/v1';
  private currentVoiceId: string = import.meta.env.VITE_DEFAULT_VOICE_ID || 'HDA9tsk27wYi3uq0fPcK';
  private isPlaying: boolean = false;
  private audioQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private onPlayingStateChange: ((isPlaying: boolean) => void) | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_ELEVENLABS_API_KEY || '';
  }

  // Get available voices from ElevenLabs
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Set the voice to use for speech synthesis
  setVoice(voiceId: string) {
    this.currentVoiceId = voiceId;
  }

  // Get current voice settings
  getVoiceSettings(): VoiceSettings {
    return {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    };
  }

  // Convert text to speech using ElevenLabs
  async textToSpeech(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    try {
      const voice = voiceId || this.currentVoiceId;
      const settings = this.getVoiceSettings();

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: settings,
        }),
      });

      if (!response.ok) {
        throw new Error(`Text-to-speech failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      return null;
    }
  }

  // Play audio from ArrayBuffer
  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        audio.onended = () => {
          URL.revokeObjectURL(url);
          this.isPlaying = false;
          if (this.onPlayingStateChange) {
            this.onPlayingStateChange(false);
          }
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(url);
          this.isPlaying = false;
          if (this.onPlayingStateChange) {
            this.onPlayingStateChange(false);
          }
          reject(error);
        };

        this.isPlaying = true;
        if (this.onPlayingStateChange) {
          this.onPlayingStateChange(true);
        }
        audio.play();
      } catch (error) {
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  // Queue text for speech synthesis
  async queueSpeech(text: string, voiceId?: string): Promise<void> {
    this.audioQueue.push(text);
    
    if (!this.isProcessingQueue) {
      await this.processQueue(voiceId);
    }
  }

  // Process the audio queue
  private async processQueue(voiceId?: string): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.audioQueue.length > 0) {
      const text = this.audioQueue.shift();
      if (!text) continue;

      try {
        const audioBuffer = await this.textToSpeech(text, voiceId);
        if (audioBuffer) {
          await this.playAudio(audioBuffer);
        }
      } catch (error) {
        console.error('Error processing speech queue:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  // Stop current audio playback
  stopAudio(): void {
    this.isPlaying = false;
    this.audioQueue.length = 0;
    this.isProcessingQueue = false;
  }

  // Check if audio is currently playing
  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  // Set callback for playing state changes
  setPlayingStateCallback(callback: (isPlaying: boolean) => void) {
    this.onPlayingStateChange = callback;
  }

  // Remove callback for playing state changes
  removePlayingStateCallback() {
    this.onPlayingStateChange = null;
  }

  // Clean up text for better speech synthesis
  cleanTextForSpeech(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Replace emojis with text descriptions
      .replace(/✈️/g, 'Flight')
      .replace(/🛫/g, 'Departure')
      .replace(/🛬/g, 'Arrival')
      .replace(/⚠️/g, 'Warning')
      .replace(/📊/g, 'Statistics')
      .replace(/⏰/g, 'Time')
      .replace(/❌/g, 'Cancelled')
      .replace(/🌤️/g, 'Weather')
      .replace(/🏢/g, 'Airport')
      .replace(/⏱️/g, 'Duration')
      .replace(/🔍/g, 'Analysis')
      .replace(/💡/g, 'Recommendation')
      .replace(/🛡️/g, 'Insurance')
      .replace(/📅/g, 'Date')
      .replace(/•/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Get voice recommendations for different content types
  getVoiceRecommendations(): { [key: string]: string } {
    return {
      'australian': 'HDA9tsk27wYi3uq0fPcK', // Stuart - Professional & friendly Aussie
      'professional': '21m00Tcm4TlvDq8ikWAM', // Rachel - Professional female
      'friendly': 'AZnzlk1XvdvUeBnXmlld', // Domi - Friendly female
      'authoritative': 'EXAVITQu4vr4xnSDxMaL', // Bella - Authoritative female
      'calm': 'VR6AewLTigWG4xSOukaG', // Arnold - Calm male
      'energetic': 'pNInz6obpgDQGcFmaJgB', // Adam - Energetic male
    };
  }
}

// Create and export the voice service instance
const voiceService = new VoiceService();

export default voiceService; 