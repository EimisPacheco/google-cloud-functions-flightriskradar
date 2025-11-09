import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Plane, Eye, Clock } from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Flight } from '../../context/FlightContext';
import { convertMinutesToHours, calculateTotalLayoverTime, formatLayoverDuration } from '../../utils/timeUtils';
import { capitalizeFirstLetter, formatRiskLevel } from '../../utils/textUtils';
import AirportLocationViewer from './AirportLocationViewer';

interface ConnectionAnalysisProps {
  flight: Flight | null;
}

export const ConnectionAnalysis: React.FC<ConnectionAnalysisProps> = ({ flight }) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedAirport, setSelectedAirport] = useState<{
    code: string;
    name: string;
    city: string;
    complexity: string;
    description: string;
  } | null>(null);

  // Helper function to generate tooltip content for airport codes
  const getAirportTooltipContent = (airportCode: string) => {
    // Try to find connection data for this airport
    const connection = flight?.connections?.find(conn => conn.layoverInfo?.airport === airportCode);
    
    let weatherRisk = 'Unknown';
    let airportComplexity = 'Unknown';
    let weatherDescription = 'Weather data unavailable';
    let complexityDescription = 'Airport complexity data unavailable';

    if (connection?.layoverInfo?.weather_risk) {
      weatherRisk = formatRiskLevel(connection.layoverInfo.weather_risk.level || 'medium');
      weatherDescription = connection.layoverInfo.weather_risk.description || `Weather conditions at ${airportCode}`;
    }
    if (connection?.layoverInfo?.airport_complexity) {
      airportComplexity = formatRiskLevel(connection.layoverInfo.airport_complexity.complexity || 'medium');
      complexityDescription = connection.layoverInfo.airport_complexity.description || `Airport complexity at ${airportCode}`;
    }

    return `
      <div class="p-2 max-w-xs">
        <div class="font-bold text-sm mb-2">${airportCode} Airport Analysis</div>
        <div class="mb-2">
          <div class="text-xs font-semibold text-blue-600">🌤️ Weather Risk: ${weatherRisk}</div>
          <div class="text-xs text-gray-600">${weatherDescription}</div>
        </div>
        <div>
          <div class="text-xs font-semibold text-orange-600">🏢 Airport Complexity: ${airportComplexity}</div>
          <div class="text-xs text-gray-600">${complexityDescription}</div>
        </div>
      </div>
    `;
  };

  // Time formatting functions
  const formatTimeWithAMPM = (timeString: string): string => {
    try {
      // Handle undefined or invalid times
      if (!timeString || timeString.includes('undefined') || timeString === 'undefined') {
        return '12:00 PM';
      }
      
      // Remove seconds if present (e.g., "08:35:00" -> "08:35")
      const timeWithoutSeconds = timeString.split(':').slice(0, 2).join(':');
      const [hours, minutes] = timeWithoutSeconds.split(':');
      
      // Check if hours or minutes are undefined or invalid
      if (!hours || !minutes || hours === 'undefined' || minutes === 'undefined') {
        return '12:00 PM';
      }
      
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return '12:00 PM';
    }
  };

  const ensureDurationHasUnit = (duration: string): string => {
    // If it's just a number, add "m" for minutes
    if (!isNaN(Number(duration))) {
      return `${duration}m`;
    }
    // If it already has "m" or "h", return as is
    if (duration.includes('m') || duration.includes('h')) {
      return duration;
    }
    // Default fallback
    return `${duration}m`;
  };

  if (!flight) return null;

  // DEBUG: Log the entire flight object to see what we're working with
  console.log('🔍 CONNECTIONANALYSIS RECEIVED FLIGHT:', flight);
  console.log('🔍 FLIGHT.CONNECTIONS:', flight.connections);
  console.log('🔍 CONNECTIONS LENGTH:', flight.connections?.length);
  if (flight.connections) {
    flight.connections.forEach((conn, i) => {
      console.log(`🔍 CONNECTION ${i}:`, conn);
      console.log(`🔍 CONNECTION ${i} HAS LAYOVERINFO:`, !!conn.layoverInfo);
      console.log(`🔍 CONNECTION ${i} LAYOVERINFO:`, conn.layoverInfo);
    });
  }

  // No truncation - AI should provide appropriate length descriptions

  const analyzeActualFlight = () => {
    // Check if flight actually has connections based on real data
    const hasConnections = flight.connections && flight.connections.length > 0;
    
    if (!hasConnections) {
      return {
        type: 'Direct Flight',
        riskLevel: 'low',
        icon: CheckCircle,
        description: 'This is a direct flight with no connections required.',
        benefits: [
          'No missed connection risk',
          'Shorter total travel time',
          'Baggage stays on same plane',
          'Less chance of delays'
        ],
        riskFactors: []
      };
    } else {
      // Calculate total connection time from actual layover data
      const totalConnectionTime = calculateTotalLayoverTime(flight.connections!);
      const totalConnectionTimeFormatted = convertMinutesToHours(totalConnectionTime);

      // Count only connections that have layover info (actual layovers)
      const actualLayovers = flight.connections!.filter(connection => connection.layoverInfo);
      const layoverCount = actualLayovers.length;

      // Use AI-generated risk level from backend analysis instead of hardcoded thresholds
      const riskLevel = flight.riskFactors.connectionRisk === 'high' ? 'high' : 
                       flight.riskFactors.connectionRisk === 'medium' ? 'medium' : 'low';

      return {
        type: `${layoverCount} Connection${layoverCount > 1 ? 's' : ''}`,
        riskLevel,
        icon: AlertTriangle,
        description: `This flight has ${layoverCount} connection${layoverCount > 1 ? 's' : ''} with a total layover time of ${totalConnectionTimeFormatted}.`,
        benefits: [],
        riskFactors: [
          'Risk of missed connections',
          'Longer total travel time',
          'Baggage transfer required - risk of loss or delay',
          'Multiple delay points',
          // Use AI-generated connection risk assessment
          flight.riskFactors.connectionRisk === 'high' ? 'High risk connection based on AI analysis' : 
          flight.riskFactors.connectionRisk === 'medium' ? 'Moderate risk connection based on AI analysis' : 
          'Low risk connection based on AI analysis'
        ],
        connectionDetails: actualLayovers.map((connection, index) => ({
          number: index + 1,
          airport: connection?.layoverInfo?.airport || connection?.arrival?.airport?.code || 'Unknown',
          airport_name: connection?.layoverInfo?.airport_name || connection?.arrival?.airport?.name || 'Unknown Airport',
          city: connection?.layoverInfo?.city || connection?.arrival?.airport?.city || 'Unknown City',
          duration: connection?.layoverInfo?.duration || '1h 30m',
          // Use duration directly since it's already formatted
          durationFormatted: formatLayoverDuration(connection?.layoverInfo?.duration || '1h 30m')
        }))
      };
    }
  };

  const analysis = analyzeActualFlight();
  const IconComponent = analysis.icon;

  const getRiskColorClass = (level: string) => {
    if (isDarkMode) {
      switch (level) {
        case 'low': return 'text-green-400 bg-green-900/30 border-green-700';
        case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
        case 'high': return 'text-red-400 bg-red-900/30 border-red-700';
        default: return 'text-gray-400 bg-gray-800 border-gray-600';
      }
    } else {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    }
  };

  return (
    <>
      <div className={`space-y-6 p-6 rounded-2xl border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-slate-900/20' 
          : 'bg-white border-slate-200 shadow-lg'
      }`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getRiskColorClass(analysis.riskLevel)}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
            <h3 className={`text-lg font-semibold text-blue-600`}>
            <TranslatedText text="Connection Analysis" targetLanguage={currentLanguage} />
          </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText text={analysis.type} targetLanguage={currentLanguage} />
          </p>
        </div>
      </div>

      <div className="mb-4">
          <p className={`mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          <TranslatedText text={analysis.description} targetLanguage={currentLanguage} />
        </p>
      </div>

      {/* Show connection details if flight has connections */}
      {analysis.connectionDetails && analysis.connectionDetails.length > 0 && (
        <div className="mb-4">
            <h4 className={`text-sm font-semibold mb-2 flex items-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <Plane className="w-4 h-4 mr-2" />
            <TranslatedText text="Connection Details" targetLanguage={currentLanguage} />
          </h4>
          <div className="space-y-4">
            {analysis.connectionDetails.map((connection, index) => {
              // Find the actual connection that matches this layover
              const actualLayovers = flight?.connections?.filter(conn => conn.layoverInfo) || [];
              const connectionData = actualLayovers[index];
              
              return (
                  <div key={index} className={`border rounded-lg p-4 ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>{connection.number}</span>
                      </div>
                      <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <TranslatedText text={`Connection ${connection.number}`} targetLanguage={currentLanguage} />
                        </div>
                          <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <span 
                              className="cursor-help hover:underline"
                              title={getAirportTooltipContent(connection.airport)}
                            >
                              {connection.airport}
                            </span> ({connection.city})
                            <button
                              className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                isDarkMode 
                                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30' 
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'
                              }`}
                              title={`View user reviews for ${connection.airport}`}
                            >
                              <span>⭐</span>
                              <span>4.2/5</span>
                            </button>
                            <button
                              onClick={() => {
                                const airportComplexity = (connection as any).airportComplexity || {};
                                console.log('🗺️ Location button clicked for layover airport:', connection.airport);
                                setSelectedAirport({
                                  code: connection.airport,
                                  name: connection.airport_name || `${connection.city} Airport`,
                                  city: connection.city,
                                  complexity: (airportComplexity as any).complexity || 'medium',
                                  description: (airportComplexity as any).description || 'Airport operations evaluated'
                                });
                              }}
                              className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                isDarkMode 
                                  ? 'bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
                              }`}
                              title="View airport location"
                            >
                              <Eye className="w-3 h-3" />
                              <span>
                                <TranslatedText text="View Map" targetLanguage={currentLanguage} />
                              </span>
                            </button>
                        </div>
                          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {connection.airport_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'} flex items-center justify-end`}>
                          <Clock className="w-4 h-4 mr-1" />
                          {ensureDurationHasUnit(connection.durationFormatted)}
                    </div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        <TranslatedText text="Layover Time" targetLanguage={currentLanguage} />
                      </div>
                    </div>
                  </div>

                  {/* Add arrival and departure times if available */}
                  {connectionData?.layoverInfo?.arrival_time && connectionData?.layoverInfo?.departure_time && (
                      <div className={`mb-3 p-3 rounded-lg ${isDarkMode ? 'bg-slate-600' : 'bg-slate-100'}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <TranslatedText text="Arrival" targetLanguage={currentLanguage} />
                          </div>
                            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {formatTimeWithAMPM(connectionData.layoverInfo.arrival_time.includes(' ') ? 
                              connectionData.layoverInfo.arrival_time.split(' ')[1] : 
                                connectionData.layoverInfo.arrival_time)}
                          </div>
                            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {connectionData.layoverInfo.arrival_time.includes(' ') ? 
                              connectionData.layoverInfo.arrival_time.split(' ')[0] : 
                              '2025-07-10'}
                          </div>
                        </div>
                        <div className="text-center">
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                            <TranslatedText text="Departure" targetLanguage={currentLanguage} />
                          </div>
                            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {formatTimeWithAMPM(connectionData.layoverInfo.departure_time.includes(' ') ? 
                              connectionData.layoverInfo.departure_time.split(' ')[1] : 
                                connectionData.layoverInfo.departure_time)}
                          </div>
                            <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {connectionData.layoverInfo.departure_time.includes(' ') ? 
                              connectionData.layoverInfo.departure_time.split(' ')[0] : 
                              '2025-07-10'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Incoming flight delay warning */}
                  {connectionData?.often_delayed_by_over_30_min && (
                    <div className={`mb-3 p-4 border rounded-lg ${isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <div className="text-base">
                            <span className={`font-medium ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                              <TranslatedText text="Incoming Flight Often Delayed" targetLanguage={currentLanguage} />
                            </span>
                          </div>
                          <div className={`text-sm mt-1 ${isDarkMode ? 'text-red-100' : 'text-red-700'}`}>
                            <TranslatedText text="This flight is frequently delayed by 30+ minutes, which significantly increases the risk of missing this connection. The AI has factored this into the connection risk assessment." targetLanguage={currentLanguage} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Per-connection Weather Risk - Enhanced with detailed format */}
                    {(() => {
                      const weatherRisk = connectionData?.layoverInfo?.weather_risk || (connectionData as unknown as Record<string, any>)?.weather_risk;
                      
                      if (!weatherRisk) {
                        // Show transparent error message when data is unavailable
                        return (
                          <div className={`mb-3 p-4 border rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                            <div className="flex items-start space-x-3">
                              <span className="text-2xl">⚠️</span>
                              <div className="flex-1">
                                <div className="text-base">
                                  <span className={`font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                    Weather Risk Data Unavailable
                                  </span>
                                  <span className={`ml-1 ${isDarkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
                                    - Cloud Function connection required
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className={`mb-3 p-4 border rounded-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">🌤️</span>
                        <div className="flex-1">
                          <div className="text-base mb-1">
                                <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                                  {formatRiskLevel(weatherRisk.level || 'medium')} Weather Risk:
                            </span>
                                <span className={`ml-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                                  {capitalizeFirstLetter(weatherRisk.description || 'Weather conditions assessed')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                      );
                    })()}
        
                  {/* Per-connection Airport Complexity - Enhanced with detailed format */}
                    {(() => {
                      const airportComplexity = connectionData?.layoverInfo?.airport_complexity || (connectionData as unknown as Record<string, unknown>)?.airport_complexity;
                      
                      if (!airportComplexity) {
                        // Show transparent error message when data is unavailable
                        return (
                          <div className={`mb-3 p-4 border rounded-lg ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-start space-x-3">
                              <span className="text-2xl">⚠️</span>
                              <div className="flex-1">
                                <div className="text-base">
                                  <span className={`font-medium ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                                    Airport Complexity Data Unavailable
                                  </span>
                                  <span className={`ml-1 ${isDarkMode ? 'text-yellow-100' : 'text-yellow-700'}`}>
                                    - Cloud Function connection required
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className={`mb-3 p-4 border rounded-lg ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">🏢</span>
                            <div className="flex-1">
                              <div className="text-base mb-1">
                                <span className={`font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                                  {formatRiskLevel((airportComplexity as any).complexity || 'medium')} Airport Complexity:
                                </span>
                                <span className={`ml-1 ${isDarkMode ? 'text-orange-100' : 'text-orange-700'}`}>
                                  {capitalizeFirstLetter((airportComplexity as any).description || 'Airport operations evaluated')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {analysis.benefits.length > 0 && (
        <div className="mb-4">
            <h4 className={`text-sm font-semibold mb-2 flex items-center ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
            <CheckCircle className="w-4 h-4 mr-2" />
            <TranslatedText text="Benefits of Direct Flight" targetLanguage={currentLanguage} />
          </h4>
          <ul className="space-y-1">
            {analysis.benefits.map((benefit, index) => (
                <li key={index} className={`text-sm flex items-start ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                <TranslatedText text={benefit} targetLanguage={currentLanguage} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.riskFactors.length > 0 && (
        <div className={`border rounded-lg p-4 ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start space-x-3">
            <span className="text-2xl">✈️</span>
            <div className="flex-1">
              <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                <TranslatedText text="Connection Risk Factors" targetLanguage={currentLanguage} />
              </h4>
              <ul className="space-y-1">
                {analysis.riskFactors.map((risk, index) => (
                  <li key={index} className={`text-sm flex items-start ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    <TranslatedText text={risk} targetLanguage={currentLanguage} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>

      {/* Airport Location Viewer Modal */}
      {selectedAirport && (
        <AirportLocationViewer
          isOpen={!!selectedAirport}
          onClose={() => setSelectedAirport(null)}
          airportCode={selectedAirport.code}
          airportName={selectedAirport.name}
          airportCity={selectedAirport.city}
          complexity={selectedAirport.complexity}
          description={selectedAirport.description}
        />
      )}
    </>
  );
}; 