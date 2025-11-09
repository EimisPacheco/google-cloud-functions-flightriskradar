import React from 'react';
import { Twitter, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

export const Footer: React.FC = () => {
  const { currentLanguage } = useTranslation();

  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-15 h-15 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                <img 
                  src="/FlightRiskRadarApp.png" 
                  alt="FlightRiskRadar" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  <TranslatedText text="FlightRiskRadar" targetLanguage={currentLanguage} />
                </h3>
                <p className="text-slate-400 text-sm">
                  <TranslatedText text="Skip the stress. Scan your flight risk." targetLanguage={currentLanguage} />
                </p>
              </div>
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              <TranslatedText 
                text="AI-powered flight risk analysis helping travelers make informed decisions about flight insurance and route selection." 
                targetLanguage={currentLanguage} 
              />
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              <TranslatedText text="Product" targetLanguage={currentLanguage} />
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  <TranslatedText text="Flight Search" targetLanguage={currentLanguage} />
                </Link>
              </li>
              <li>
                <Link to="/risk-analysis" className="hover:text-white transition-colors">
                  <TranslatedText text="Risk Analysis" targetLanguage={currentLanguage} />
                </Link>
              </li>
              <li>
                <Link to="/insurance-guide" className="hover:text-white transition-colors">
                  <TranslatedText text="Insurance Guide" targetLanguage={currentLanguage} />
                </Link>
              </li>
              <li>
                <Link to="/airline-analytics" className="hover:text-white transition-colors">
                  <TranslatedText text="Airline Analytics" targetLanguage={currentLanguage} />
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">
              <TranslatedText text="Company" targetLanguage={currentLanguage} />
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  <TranslatedText text="About Us" targetLanguage={currentLanguage} />
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  <TranslatedText text="Privacy Policy" targetLanguage={currentLanguage} />
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  <TranslatedText text="Terms of Service" targetLanguage={currentLanguage} />
                </a>
              </li>
              <li>
                <a href="mailto:contact@flightriskradar.com" className="hover:text-white transition-colors">
                  <TranslatedText text="Contact" targetLanguage={currentLanguage} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>
            <TranslatedText text="© 2025 FlightRiskRadar. All rights reserved." targetLanguage={currentLanguage} />
          </p>
        </div>
      </div>
    </footer>
  );
};