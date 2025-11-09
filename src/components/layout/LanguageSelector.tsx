import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setCurrentLanguage, supportedLanguages } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    setIsOpen(false);
  };

  const getFlagEmoji = (languageCode: string): string => {
    const flags: { [key: string]: string } = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ar': '🇸🇦',
      'ru': '🇷🇺',
      'hi': '🇮🇳',
      'th': '🇹🇭',
      'vi': '🇻🇳',
      'tr': '🇹🇷',
      'pl': '🇵🇱',
      'nl': '🇳🇱',
      'sv': '🇸🇪',
      'da': '🇩🇰',
      'no': '🇳🇴'
    };
    return flags[languageCode] || '🌐';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 transition-colors rounded-lg ${
          isDarkMode 
            ? 'text-white hover:text-blue-400 hover:bg-slate-700' 
            : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium flex items-center space-x-1">
          <span>{getFlagEmoji(currentLanguage)}</span>
          <span>{supportedLanguages[currentLanguage as keyof typeof supportedLanguages]}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border py-2 z-20 max-h-64 overflow-y-auto ${
            isDarkMode 
              ? 'bg-slate-700 border-slate-600' 
              : 'bg-white border-slate-200'
          }`}>
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                className={`w-full px-4 py-2 text-left transition-colors flex items-center space-x-3 ${
                  currentLanguage === code 
                    ? isDarkMode 
                      ? 'bg-blue-900/50 text-blue-400' 
                      : 'bg-blue-50 text-blue-600'
                    : isDarkMode 
                      ? 'text-white hover:bg-slate-600' 
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{getFlagEmoji(code)}</span>
                <span className="text-sm">{name}</span>
                {currentLanguage === code && (
                  <span className={`ml-auto ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;