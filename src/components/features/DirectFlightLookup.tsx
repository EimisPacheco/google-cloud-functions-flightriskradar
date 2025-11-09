import React, { useState } from 'react';
import { Search, Plane, Calendar, AlertCircle } from 'lucide-react';
import { useFlightContext } from '../../context/FlightContext';
import { useNavigate } from 'react-router-dom';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Autocomplete } from '../ui/Autocomplete';
import { searchAirlines, formatAirlineDisplay, getAirlineCode, US_AIRLINES } from '../../utils/airlinesData';

export const DirectFlightLookup: React.FC = () => {
  const { searchDirectFlight } = useFlightContext();
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    date: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [airlineOptions, setAirlineOptions] = useState<Array<{value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}>>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.airline || !formData.flightNumber || !formData.date) {
      return;
    }

    setIsLoading(true);
    
    try {
      await searchDirectFlight({
        airline: getAirlineCode(formData.airline).toUpperCase(),
        flightNumber: formData.flightNumber.toUpperCase(),
        date: formData.date
      });
      navigate('/results');
    } catch (error) {
      console.error('Flight lookup failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFlightNumber = (value: string) => {
    // Remove any non-alphanumeric characters and convert to uppercase
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleFlightNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFlightNumber(e.target.value);
    setFormData(prev => ({ ...prev, flightNumber: formatted }));
  };

  const handleAirlineSearch = (query: string) => {
    // If user types a code, show the full name in the input
    const codeMatch = US_AIRLINES.find(a => a.code.toLowerCase() === query.trim().toLowerCase());
    if (codeMatch) {
      setFormData(prev => ({ ...prev, airline: codeMatch.name }));
    } else {
      setFormData(prev => ({ ...prev, airline: query }));
    }
    const airlines = searchAirlines(query);
    setAirlineOptions(airlines.map(airline => ({
      value: airline.code,
      label: formatAirlineDisplay(airline),
      data: { 
        subtitle: airline.country,
        airline
      }
    })));
  };

  const handleAirlineSelect = (option: {value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}) => {
    // Always show the full name in the input
    const airline = US_AIRLINES.find(a => a.code === option.value);
    setFormData(prev => ({ ...prev, airline: airline ? airline.name : option.value }));
  };

  return (
    <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl shadow-xl p-8 border`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
          <Plane className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className={`text-xl font-semibold text-blue-600`}>
            <TranslatedText text="Direct Flight Lookup" targetLanguage={currentLanguage} />
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText text="Already have your flight details? Get instant risk analysis" targetLanguage={currentLanguage} />
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        {/* Airline and Flight Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <TranslatedText text="Airline" targetLanguage={currentLanguage} />
              <span className={`text-xs ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>(e.g., American Airlines, Delta)</span>
            </label>
            <Autocomplete
              placeholder="Type airline name (e.g., American, Delta)"
              options={airlineOptions}
              onSearch={handleAirlineSearch}
              onSelect={handleAirlineSelect}
              value={formData.airline}
              className={`${isDarkMode ? 'border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <TranslatedText text="Flight Number" targetLanguage={currentLanguage} />
              <span className={`text-xs ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>(e.g., 2387, 1234)</span>
            </label>
            <input
              type="text"
              value={formData.flightNumber}
              onChange={handleFlightNumberChange}
              placeholder="2387"
              maxLength={6}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' 
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
              }`}
              required
            />
          </div>
        </div>

        {/* Flight Date */}
        <div className="w-full md:w-1/2">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <TranslatedText text="Flight Date" targetLanguage={currentLanguage} />
          </label>
          <div className="relative">
            <Calendar className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-700 text-white' 
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
              required
            />
          </div>
        </div>

        {/* Example */}
        <div className={`border rounded-lg p-4 ${
          isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h4 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                <TranslatedText text="Example" targetLanguage={currentLanguage} />
              </h4>
              <p className={`text-sm ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                <TranslatedText 
                  text='For flight "American Airlines 2387" → Enter American Airlines and 2387' 
                  targetLanguage={currentLanguage} 
                />
              </p>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.airline || !formData.flightNumber || !formData.date}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>
                <TranslatedText text="Analyzing Flight..." targetLanguage={currentLanguage} />
              </span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>
                <TranslatedText text="Analyze Flight Risk" targetLanguage={currentLanguage} />
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};