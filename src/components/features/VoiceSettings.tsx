import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import voiceService, { ElevenLabsVoice } from '../../services/voiceService';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onVoiceChange: (voiceId: string) => void;
  currentVoiceId: string;
  isVoiceEnabled: boolean;
  onVoiceToggle: (enabled: boolean) => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  isOpen,
  onClose,
  onVoiceChange,
  currentVoiceId,
  isVoiceEnabled,
  onVoiceToggle
}) => {
  const { isDarkMode } = useDarkMode();
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(currentVoiceId);

  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const availableVoices = await voiceService.getVoices();
      setVoices(availableVoices);
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onVoiceChange(voiceId);
  };

  const testVoice = async (voiceId: string) => {
    const testText = "Hello! I'm your flight risk advisor. I can help you analyze flight risks and provide recommendations.";
    await voiceService.queueSpeech(testText, voiceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Settings className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Voice Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${
              isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'
            }`}
          >
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Voice Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isVoiceEnabled ? (
                <Volume2 className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <VolumeX className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Voice Assistant
              </span>
            </div>
            <button
              onClick={() => onVoiceToggle(!isVoiceEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isVoiceEnabled 
                  ? 'bg-green-600' 
                  : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Voice Selection */}
          {isVoiceEnabled && (
            <div className="space-y-3">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Select Voice
              </h3>
              
              {loading ? (
                <div className={`text-center py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Loading voices...
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {voices.map((voice) => (
                    <div
                      key={voice.voice_id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVoice === voice.voice_id
                          ? isDarkMode 
                            ? 'bg-blue-600 border-blue-500' 
                            : 'bg-blue-50 border-blue-300'
                          : isDarkMode
                            ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      onClick={() => handleVoiceChange(voice.voice_id)}
                    >
                      <div className="flex-1">
                        <div className={`font-medium ${
                          selectedVoice === voice.voice_id
                            ? 'text-white'
                            : isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {voice.name}
                        </div>
                        {voice.description && (
                          <div className={`text-sm ${
                            selectedVoice === voice.voice_id
                              ? 'text-blue-100'
                              : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {voice.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          testVoice(voice.voice_id);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isDarkMode 
                            ? 'hover:bg-slate-600 text-slate-400 hover:text-white' 
                            : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                        title="Test voice"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Voice Recommendations */}
          {isVoiceEnabled && (
            <div className="space-y-3">
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Recommended Voices
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(voiceService.getVoiceRecommendations()).map(([type, voiceId]) => {
                  return (
                    <button
                      key={type}
                      onClick={() => handleVoiceChange(voiceId)}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedVoice === voiceId
                          ? isDarkMode 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-100 text-blue-800'
                          : isDarkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 