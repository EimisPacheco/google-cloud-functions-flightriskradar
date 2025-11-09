import React from 'react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';



export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentLanguage } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const location = useLocation();

  return (
    <header className={`${isDarkMode ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-slate-200'} backdrop-blur-sm border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-16 h-16">
              <img 
                src="/FlightRiskRadarApp.png" 
                alt="FlightRiskRadar" 
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <TranslatedText text="FlightRiskRadar" targetLanguage={currentLanguage} />
              </h1>
              <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} hidden sm:block`}>
                <TranslatedText text="Skip the stress. Scan your flight risk." targetLanguage={currentLanguage} />
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors`}>
                <TranslatedText text="Flight Search" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/risk-analysis" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/risk-analysis' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Risk Factors" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/airline-analytics" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/airline-analytics' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Airline Performance" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/airport-analytics" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/airport-analytics' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Airport Performance" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/travel-community" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/travel-community' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Travel Community" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/insurance-guide" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/insurance-guide' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Insurance Guide" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/about" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/about' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="About" targetLanguage={currentLanguage} />
              </Link>
              <a 
                href="https://chrome.google.com/webstore/detail/flightriskradar" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-sm">
                  <TranslatedText text="Chrome Extension" targetLanguage={currentLanguage} />
                </span>
              </a>
            </nav>

            <LanguageSelector />
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-slate-100 text-slate-700'}`}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className={`md:hidden py-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <nav className="flex flex-col space-y-3">
              <Link to="/" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors`}>
                <TranslatedText text="Flight Search" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/risk-analysis" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/risk-analysis' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Risk Factors" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/airline-analytics" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/airline-analytics' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Airline Performance" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/airport-analytics" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/airport-analytics' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Airport Performance" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/travel-community" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/travel-community' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Travel Community" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/insurance-guide" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/insurance-guide' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="Insurance Guide" targetLanguage={currentLanguage} />
              </Link>
              <Link to="/about" className={`${isDarkMode ? 'text-slate-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} font-medium transition-colors ${location.pathname === '/about' ? 'text-blue-500' : ''}`}>
                <TranslatedText text="About" targetLanguage={currentLanguage} />
              </Link>
              <a 
                href="https://chrome.google.com/webstore/detail/flightriskradar" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>
                  <TranslatedText text="Chrome Extension" targetLanguage={currentLanguage} />
                </span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};