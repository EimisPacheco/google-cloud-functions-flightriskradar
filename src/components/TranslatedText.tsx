import React from 'react';

interface TranslatedTextProps {
  text: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  className?: string;
  fallback?: string;
  children?: React.ReactNode;
}

/**
 * Simplified component that just renders text without translation
 * Translation functionality disabled to resolve build issues
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  className = '',
  children
}) => {
  return (
    <span className={className}>
      {text}
      {children}
    </span>
  );
};

export default TranslatedText; 