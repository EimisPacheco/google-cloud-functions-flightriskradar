import React, { useState } from 'react';
import {
  X,
  Link2,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MessageCircle,
  Check,
  Share2
} from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  postUrl: string;
  postType: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  postTitle,
  postUrl,
  postType
}) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareText = `Check out this ${postType}: ${postTitle}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(postUrl);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: shareText,
          url: postUrl
        });
        onClose();
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: 'gray',
      action: handleCopyLink,
      label: copied ? 'Copied!' : 'Copy Link'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'blue',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      label: 'Share on Facebook'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'sky',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      label: 'Share on Twitter'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'blue',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      label: 'Share on LinkedIn'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'green',
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      label: 'Share on WhatsApp'
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'red',
      url: `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodedText}%20${encodedUrl}`,
      label: 'Share via Email'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-xl font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            <TranslatedText text="Share Post" targetLanguage={currentLanguage} />
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-400' 
                : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Native Share Button (if supported) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className={`w-full mb-4 p-4 rounded-lg flex items-center justify-center gap-3 transition-colors ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">
                <TranslatedText text="Share via..." targetLanguage={currentLanguage} />
              </span>
            </button>
          )}

          {/* Share Options Grid */}
          <div className="grid grid-cols-3 gap-3">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              const isExternal = option.url;
              
              return (
                <button
                  key={option.name}
                  onClick={() => {
                    if (option.action) {
                      option.action();
                    } else if (option.url) {
                      window.open(option.url, '_blank', 'width=600,height=400');
                    }
                  }}
                  className={`p-4 rounded-lg flex flex-col items-center gap-2 transition-all hover:scale-105 ${
                    isDarkMode
                      ? 'bg-slate-700 hover:bg-slate-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={option.label}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    option.color === 'blue' ? 'bg-blue-500' :
                    option.color === 'sky' ? 'bg-sky-500' :
                    option.color === 'green' ? 'bg-green-500' :
                    option.color === 'red' ? 'bg-red-500' :
                    option.color === 'gray' ? isDarkMode ? 'bg-slate-600' : 'bg-gray-400' :
                    'bg-gray-500'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-600'
                  }`}>
                    {option.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* URL Preview */}
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
          }`}>
            <Link2 className={`w-4 h-4 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-500'
            }`} />
            <span className={`text-sm truncate ${
              isDarkMode ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {postUrl}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;