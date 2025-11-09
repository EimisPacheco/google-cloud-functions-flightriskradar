import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple supported languages object without external import
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ru': 'Russian'
} as const;

interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  return (
    <TranslationContext.Provider value={{
      currentLanguage,
      setCurrentLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </TranslationContext.Provider>
  );
};