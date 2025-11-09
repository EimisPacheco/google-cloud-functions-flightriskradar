import React, { useState } from 'react';
import { Search, Calendar, Users, ArrowRightLeft } from 'lucide-react';
import { useFlightContext } from '../../context/FlightContext';
import { useNavigate } from 'react-router-dom';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Autocomplete } from '../ui/Autocomplete';
import { searchAirports, formatAirportDisplay } from '../../utils/airportsData';

export const FlightSearch: React.FC = () => {
  const { searchFlights } = useFlightContext();
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'oneWay' as 'oneWay' | 'roundTrip'
  });

  const [originOptions, setOriginOptions] = useState<Array<{value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}>>([]);
  const [destinationOptions, setDestinationOptions] = useState<Array<{value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}>>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.origin || !formData.destination || !formData.departureDate) {
      return;
    }

    await searchFlights({
      origin: formData.origin,
      destination: formData.destination,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      passengers: formData.passengers,
      tripType: formData.tripType
    });

    navigate('/results');
  };

  const swapAirports = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  const handleOriginSearch = (query: string) => {
    const airports = searchAirports(query);
    setOriginOptions(airports.map(airport => ({
      value: airport.code,
      label: formatAirportDisplay(airport),
      data: { 
        subtitle: `${airport.state}, ${airport.country}`,
        airport
      }
    })));
  };

  const handleDestinationSearch = (query: string) => {
    const airports = searchAirports(query);
    setDestinationOptions(airports.map(airport => ({
      value: airport.code,
      label: formatAirportDisplay(airport),
      data: { 
        subtitle: `${airport.state}, ${airport.country}`,
        airport
      }
    })));
  };

  const handleOriginSelect = (option: {value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}) => {
    setFormData(prev => ({ ...prev, origin: option.value }));
  };

  const handleDestinationSelect = (option: {value: string, label: string, data?: {subtitle?: string; [key: string]: unknown}}) => {
    setFormData(prev => ({ ...prev, destination: option.value }));
  };

  return (
    <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl shadow-xl p-8 border`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
          <Search className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h3 className={`text-xl font-semibold text-blue-600`}>
            <TranslatedText text="Search by Route" targetLanguage={currentLanguage} />
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText text="Find flights and analyze risks for your journey" targetLanguage={currentLanguage} />
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        {/* Trip Type Toggle */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'oneWay' }))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.tripType === 'oneWay'
                ? 'bg-blue-600 text-white'
                : isDarkMode 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TranslatedText text="One Way" targetLanguage={currentLanguage} />
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tripType: 'roundTrip' }))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              formData.tripType === 'roundTrip'
                ? 'bg-blue-600 text-white'
                : isDarkMode 
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TranslatedText text="Round Trip" targetLanguage={currentLanguage} />
          </button>
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <TranslatedText text="From" targetLanguage={currentLanguage} />
            </label>
            <Autocomplete
              placeholder="Type city name (e.g., Austin, New York)"
              options={originOptions}
              onSearch={handleOriginSearch}
              onSelect={handleOriginSelect}
              value={formData.origin}
              className={`${isDarkMode ? 'border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
          </div>
          
          <button
            type="button"
            onClick={swapAirports}
            className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 md:translate-y-2 w-10 h-10 border-2 rounded-full flex items-center justify-center transition-colors z-10 ${
              isDarkMode 
                ? 'bg-slate-700 border-slate-600 hover:border-blue-500 text-slate-300' 
                : 'bg-white border-slate-300 hover:border-blue-500 text-slate-600'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <TranslatedText text="To" targetLanguage={currentLanguage} />
            </label>
            <Autocomplete
              placeholder="Type city name (e.g., Miami, Los Angeles)"
              options={destinationOptions}
              onSearch={handleDestinationSearch}
              onSelect={handleDestinationSelect}
              value={formData.destination}
              className={`${isDarkMode ? 'border-slate-600 focus:ring-blue-500 focus:border-blue-500 bg-slate-700 text-white placeholder-slate-400' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              <TranslatedText text="Departure" targetLanguage={currentLanguage} />
            </label>
            <div className="relative">
              <Calendar className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="date"
                value={formData.departureDate}
                onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'border-slate-600 bg-slate-700 text-white' 
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
                required
              />
            </div>
          </div>

          {formData.tripType === 'roundTrip' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <TranslatedText text="Return" targetLanguage={currentLanguage} />
              </label>
              <div className="relative">
                <Calendar className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'border-slate-600 bg-slate-700 text-white' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Passengers */}
        <div className="w-full md:w-1/3">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            <TranslatedText text="Passengers" targetLanguage={currentLanguage} />
          </label>
          <div className="relative">
            <Users className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
            <select
              value={formData.passengers}
              onChange={(e) => setFormData(prev => ({ ...prev, passengers: parseInt(e.target.value) }))}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'border-slate-600 bg-slate-700 text-white' 
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Search className="w-5 h-5" />
          <span>
            <TranslatedText text="Scan Flight Risks" targetLanguage={currentLanguage} />
          </span>
        </button>
      </form>
    </div>
  );
};