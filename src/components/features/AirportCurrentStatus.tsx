import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Clock, 
  Plane, 
  AlertTriangle, 
  CheckCircle, 
  Wind,
  Eye,
  Thermometer,
  TrendingUp,
  Users,
  Activity,
  X,
  RefreshCw,
  Loader2,
  Info
} from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { flightRiskAPI, AirportStatusResponse } from '../../services/api';

interface AirportCurrentStatusProps {
  airportCode: string;
  airportName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AirportCurrentStatus: React.FC<AirportCurrentStatusProps> = ({
  airportCode,
  airportName,
  isOpen,
  onClose
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [statusData, setStatusData] = useState<AirportStatusResponse | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadAirportStatus = async () => {
    try {
      setError('');
      const response = await flightRiskAPI.getAirportCurrentStatus(airportCode);
      setStatusData(response);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load airport status');
      console.error('Error loading airport status:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadAirportStatus();
    }
  }, [isOpen, airportCode]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAirportStatus();
  };

  if (!isOpen) return null;

  const getStatusColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'EXCELLENT':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'GOOD':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'FAIR':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'POOR':
        return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'CRITICAL':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getStatusBg = (level: string) => {
    switch (level.toUpperCase()) {
      case 'EXCELLENT':
        return isDarkMode ? 'bg-green-900/50' : 'bg-green-50';
      case 'GOOD':
        return isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50';
      case 'FAIR':
        return isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-50';
      case 'POOR':
        return isDarkMode ? 'bg-orange-900/50' : 'bg-orange-50';
      case 'CRITICAL':
        return isDarkMode ? 'bg-red-900/50' : 'bg-red-50';
      default:
        return isDarkMode ? 'bg-slate-800' : 'bg-slate-50';
    }
  };

  const getImpactColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'HIGH':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'MEDIUM':
        return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'LOW':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDarkMode ? 'text-green-400' : 'text-green-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full md:w-[500px] ${
        isDarkMode ? 'bg-slate-900' : 'bg-white'
      } shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 p-6 border-b ${
          isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {airportCode} - {airportName}
              </h2>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <TranslatedText text="Airport Current Status" targetLanguage={currentLanguage} />
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                disabled={isRefreshing}
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Last update */}
          <div className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <TranslatedText text="Loading airport status..." targetLanguage={currentLanguage} />
              </p>
            </div>
          ) : error ? (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}>
              <p>{error}</p>
            </div>
          ) : statusData?.success && statusData.data ? (
            <div className="space-y-6">
              {/* Airport Details */}
              {statusData.data.airport_details && (
                <div className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <TranslatedText text="Airport Information" targetLanguage={currentLanguage} />
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <TranslatedText text="Official Name:" targetLanguage={currentLanguage} />
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {statusData.data.airport_details.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <TranslatedText text="City:" targetLanguage={currentLanguage} />
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {statusData.data.airport_details.municipality}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <TranslatedText text="Type:" targetLanguage={currentLanguage} />
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {statusData.data.airport_details.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {statusData.data.airport_details.elevation_ft && (
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          <TranslatedText text="Elevation:" targetLanguage={currentLanguage} />
                        </span>
                        <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {statusData.data.airport_details.elevation_ft.toLocaleString()} ft
                        </span>
                      </div>
                    )}
                    {(statusData.data.airport_details.home_link || statusData.data.airport_details.wikipedia_link) && (
                      <div className="flex space-x-2 mt-3">
                        {statusData.data.airport_details.home_link && (
                          <a
                            href={statusData.data.airport_details.home_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              isDarkMode 
                                ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300' 
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Website</span>
                          </a>
                        )}
                        {statusData.data.airport_details.wikipedia_link && (
                          <a
                            href={statusData.data.airport_details.wikipedia_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              isDarkMode 
                                ? 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300' 
                                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                            }`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>Wiki</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Overall Status */}
              <div className={`p-6 rounded-lg ${getStatusBg(statusData.data.overall_status.level)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Overall Status" targetLanguage={currentLanguage} />
                  </h3>
                  <div className={`text-2xl font-bold ${getStatusColor(statusData.data.overall_status.level)}`}>
                    {statusData.data.overall_status.score}/100
                  </div>
                </div>
                <div className={`text-xl font-semibold mb-2 ${getStatusColor(statusData.data.overall_status.level)}`}>
                  {statusData.data.overall_status.level}
                </div>
                <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {statusData.data.overall_status.description}
                </p>
                {statusData.data.overall_status.factors.length > 0 && (
                  <div className="space-y-1">
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Contributing Factors:" targetLanguage={currentLanguage} />
                    </p>
                    {statusData.data.overall_status.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <AlertTriangle size={12} className={isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} />
                        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {factor}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weather Status */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Cloud className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Weather Conditions" targetLanguage={currentLanguage} />
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Conditions:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.weather.conditions}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Temperature:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.weather.temperature}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Visibility:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.weather.visibility} miles
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Wind:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.weather.wind_speed}
                    </p>
                  </div>
                </div>
                {statusData.data.weather.impact.level !== 'NONE' && (
                  <div className={`mt-3 p-2 rounded ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <p className={`text-sm font-medium ${getImpactColor(statusData.data.weather.impact.level)}`}>
                      Weather Impact: {statusData.data.weather.impact.level}
                    </p>
                    {statusData.data.weather.impact.delay_factor > 0 && (
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Expected delay: +{statusData.data.weather.impact.delay_factor} minutes
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Delays */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Clock className={isDarkMode ? 'text-orange-400' : 'text-orange-600'} size={20} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Current Delays" targetLanguage={currentLanguage} />
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Avg Departure Delay:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`text-lg font-bold ${
                      statusData.data.delays.average_departure_delay > 30 
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : statusData.data.delays.average_departure_delay > 15
                        ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {statusData.data.delays.average_departure_delay} min
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Avg Arrival Delay:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`text-lg font-bold ${
                      statusData.data.delays.average_arrival_delay > 30 
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : statusData.data.delays.average_arrival_delay > 15
                        ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {statusData.data.delays.average_arrival_delay} min
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Delayed Flights:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.delays.delayed_departures + statusData.data.delays.delayed_arrivals}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Cancellations:" targetLanguage={currentLanguage} />
                    </p>
                    <p className={`${
                      statusData.data.delays.cancellations > 0
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {statusData.data.delays.cancellations}
                    </p>
                  </div>
                </div>
                {statusData.data.delays.delay_reasons.length > 0 && (
                  <div className="mt-3">
                    <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Delay Reasons" targetLanguage={currentLanguage} />
                    </p>
                    {statusData.data.delays.delay_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {reason.reason}
                        </span>
                        <span className={`text-sm font-medium ${
                          reason.impact === 'HIGH' 
                            ? isDarkMode ? 'text-red-400' : 'text-red-600'
                            : reason.impact === 'MEDIUM'
                            ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                            : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          {reason.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Traffic Status */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Users className={isDarkMode ? 'text-purple-400' : 'text-purple-600'} size={20} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Traffic Status" targetLanguage={currentLanguage} />
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Current Period:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.traffic.current_period}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Traffic Volume:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${
                      statusData.data.traffic.traffic_volume === 'HIGH'
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : statusData.data.traffic.traffic_volume === 'MODERATE'
                        ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {statusData.data.traffic.traffic_volume}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Next Hour Flights:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.traffic.scheduled_departures_next_hour + statusData.data.traffic.scheduled_arrivals_next_hour}
                    </span>
                  </div>
                </div>
              </div>

              {/* Runway Status */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Plane className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} size={20} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Runway Status" targetLanguage={currentLanguage} />
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Active Runways:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.runway_status.active_runways}/{statusData.data.runway_status.total_runways}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Configuration:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {statusData.data.runway_status.configuration}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <TranslatedText text="Efficiency:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`${
                      statusData.data.runway_status.efficiency >= 90
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : statusData.data.runway_status.efficiency >= 75
                        ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {statusData.data.runway_status.efficiency}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Alerts */}
              {statusData.data.alerts.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className={isDarkMode ? 'text-red-400' : 'text-red-600'} size={20} />
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <TranslatedText text="Active Alerts" targetLanguage={currentLanguage} />
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {statusData.data.alerts.map((alert, idx) => (
                      <div key={idx} className={`p-3 rounded ${
                        isDarkMode ? 'bg-slate-800' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${
                            alert.severity === 'HIGH'
                              ? isDarkMode ? 'text-red-400' : 'text-red-600'
                              : alert.severity === 'MEDIUM'
                              ? isDarkMode ? 'text-orange-400' : 'text-orange-600'
                              : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`}>
                            {alert.severity} - {alert.type}
                          </span>
                        </div>
                        <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {alert.title}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {alert.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
            }`}>
              <p>No status data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirportCurrentStatus;