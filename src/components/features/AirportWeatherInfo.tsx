import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Eye, Thermometer, AlertTriangle, Loader2 } from 'lucide-react';
import { weatherService, WeatherData, WeatherError } from '../../services/weatherService';
import { useDarkMode } from '../../context/DarkModeContext';

interface AirportWeatherInfoProps {
  airportCode: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
}

const AirportWeatherInfo: React.FC<AirportWeatherInfoProps> = ({ 
  airportCode, 
  latitude, 
  longitude,
  compact = false 
}) => {
  const { isDarkMode } = useDarkMode();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude || !longitude) {
        setError('No coordinates available');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await weatherService.getCurrentWeather(latitude, longitude);
        
        if ('error' in result) {
          setError(result.message);
        } else {
          setWeather(result);
        }
      } catch (err) {
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude, airportCode]);

  if (loading) {
    return (
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <div className="flex items-center space-x-2 mb-2">
          <Cloud className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Weather Information
          </span>
        </div>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {error || 'Weather data unavailable'}
        </p>
      </div>
    );
  }

  const impact = weatherService.assessWeatherImpact(weather);
  
  const getImpactColor = (level: string) => {
    switch (level) {
      case 'SEVERE':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'HIGH':
        return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'MODERATE':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDarkMode ? 'text-green-400' : 'text-green-600';
    }
  };

  if (compact) {
    return (
      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{weatherService.getWeatherEmoji(weather.condition)}</span>
            <div>
              <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {weather.temperature}°F
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {weather.description}
              </div>
            </div>
          </div>
          <div className={`text-sm font-medium ${getImpactColor(impact.level)}`}>
            {impact.level}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Cloud className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Current Weather
        </span>
      </div>
      
      <div className="space-y-3">
        {/* Main weather info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src={weatherService.getWeatherIcon(weather.icon)} 
              alt={weather.condition}
              className="w-12 h-12"
            />
            <div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {weather.temperature}°F
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Feels like {weather.feelsLike}°F
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              {weather.condition}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {weather.description}
            </div>
          </div>
        </div>

        {/* Weather details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Wind className="w-4 h-4 text-blue-500" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
              {weather.windSpeed} mph {weatherService.formatWindDirection(weather.windDirection)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
              {weather.visibility.toFixed(1)} mi visibility
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
              {weather.humidity}% humidity
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-blue-500" />
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
              {weather.cloudiness}% clouds
            </span>
          </div>
        </div>

        {/* Flight impact assessment */}
        <div className={`pt-3 border-t ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Flight Impact Assessment
            </span>
            <span className={`text-sm font-bold ${getImpactColor(impact.level)}`}>
              {impact.level}
            </span>
          </div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            {impact.message}
          </p>
          {impact.factors.length > 0 && (
            <div className="mt-2 space-y-1">
              {impact.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <AlertTriangle className={`w-3 h-3 ${getImpactColor(impact.level)}`} />
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {factor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirportWeatherInfo;