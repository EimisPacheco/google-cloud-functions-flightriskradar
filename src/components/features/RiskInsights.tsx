import React, { useState } from 'react';
import { TrendingUp, CloudRain, Clock, AlertCircle, Building2, Calendar, Eye, CheckCircle, AlertTriangle, Star } from 'lucide-react';
import { Flight } from '../../context/FlightContext';
import { ConnectionAnalysis } from './ConnectionAnalysis';
import AirportLocationViewer from './AirportLocationViewer';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { convertMinutesToHours, parseDurationToMinutes, calculateTotalLayoverTime } from '../../utils/timeUtils';
import { capitalizeFirstLetter, getRiskColor, formatRiskLevel, calculateHighestWeatherRisk, calculateHighestAirportComplexity } from '../../utils/textUtils';
import { getAirlineRating } from '../../utils/airlinesData';

interface RiskInsightsProps {
  flight: Flight | null;
}

export const RiskInsights: React.FC<RiskInsightsProps> = ({ flight }) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedAirport, setSelectedAirport] = useState<{
    code: string;
    name: string;
    city: string;
    complexity: string;
    description: string;
  } | null>(null);
  
  const getAirportImage = (airportCode: string): string => {
    // Map airport codes to specific airport images
    const airportImages: Record<string, string> = {
      'LAX': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=200&fit=crop&crop=entropy&auto=format', // LAX Terminal
      'JFK': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=200&fit=crop&crop=entropy&auto=format', // JFK Terminal
      'LAS': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=entropy&auto=format', // LAS McCarran
      'ATL': 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=200&fit=crop&crop=entropy&auto=format', // ATL Hartsfield
      'ORD': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop&crop=entropy&auto=format', // ORD O'Hare
      'DFW': 'https://images.unsplash.com/photo-1578051637918-76c66064de3e?w=400&h=200&fit=crop&crop=entropy&auto=format', // DFW Dallas
      'DEN': 'https://images.unsplash.com/photo-1626251938234-f5af2c85d7d7?w=400&h=200&fit=crop&crop=entropy&auto=format', // DEN Denver
      'MIA': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=200&fit=crop&crop=entropy&auto=format', // MIA Miami
      'SFO': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&crop=entropy&auto=format', // SFO San Francisco
      'SEA': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=200&fit=crop&crop=entropy&auto=format', // SEA Seattle
      'PHX': 'https://images.unsplash.com/photo-1581337204873-ef36aa186caa?w=400&h=200&fit=crop&crop=entropy&auto=format', // PHX Phoenix
      'IAH': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=200&fit=crop&crop=entropy&auto=format'  // IAH Houston
    };
    
    // Return specific image for known airports, fallback to generic airport image
    return airportImages[airportCode] || 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=400&h=200&fit=crop&crop=entropy&auto=format';
  };

  if (!flight) {
    return (
      <div className={`rounded-xl border p-8 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
        <p className={`text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
          <TranslatedText text="No flight data available for risk analysis." targetLanguage={currentLanguage} />
        </p>
      </div>
    );
  }

  const insights = [
    {
      icon: TrendingUp,
      label: 'Overall Risk',
      value: formatRiskLevel(flight.riskFactors.overallRisk),
      color: getRiskColor(flight.riskFactors.overallRisk),
      description: flight.riskFactors.overallRisk === 'low'
        ? 'Low probability of significant disruptions'
        : flight.riskFactors.overallRisk === 'medium'
        ? 'Moderate chance of delays or minor issues'
        : 'Higher likelihood of delays or complications'
    },
    {
      icon: CloudRain,
      label: 'Weather Risk',
      value: formatRiskLevel(calculateHighestWeatherRisk(flight)),
      color: getRiskColor(calculateHighestWeatherRisk(flight)),
      description: calculateHighestWeatherRisk(flight) === 'low'
        ? 'Clear conditions expected'
        : calculateHighestWeatherRisk(flight) === 'medium'
        ? 'Some weather concerns possible'
        : 'Significant weather risks present'
    },
    {
      icon: Clock,
      label: 'Delay Probability',
      value: flight.riskFactors.delayProbability !== undefined ? `${flight.riskFactors.delayProbability}%` : 'Analysis failed',
      color: flight.riskFactors.delayProbability !== undefined ? 
        (flight.riskFactors.delayProbability <= 15 ? 'text-green-600' :
         flight.riskFactors.delayProbability <= 30 ? 'text-amber-600' : 'text-red-600') : 'text-gray-500',
      description: flight.riskFactors.delayProbability !== undefined ? 
        'AI-generated probability of flight delays based on comprehensive risk analysis' :
        'Delay analysis unavailable - system error encountered'
    },
    {
      icon: Clock,
      label: 'Historical Delays',
      value: convertMinutesToHours(flight.riskFactors.historicalDelays),
      color: flight.riskFactors.historicalDelays <= 30 ? 'text-green-600' :
             flight.riskFactors.historicalDelays <= 60 ? 'text-amber-600' : 'text-red-600',
      description: 'AI-analyzed average delay time based on comprehensive risk factors',
      hasOftenDelayed: flight.often_delayed_by_over_30_min
    },
    {
      icon: AlertCircle,
      label: 'Cancellation Rate',
      value: flight.riskFactors.cancellationRate !== undefined ? `${flight.riskFactors.cancellationRate}%` : 'Analysis failed',
      color: flight.riskFactors.cancellationRate !== undefined ? 
        (flight.riskFactors.cancellationRate <= 3 ? 'text-green-600' :
         flight.riskFactors.cancellationRate <= 8 ? 'text-amber-600' : 'text-red-600') : 'text-gray-500',
      description: flight.riskFactors.cancellationRate !== undefined ? 
        'AI-analyzed cancellation probability based on comprehensive risk factors' :
        'Cancellation analysis unavailable - system error encountered'
    },
    {
      icon: Building2,
      label: 'Airport Complexity',
      value: formatRiskLevel(calculateHighestAirportComplexity(flight)),
      color: getRiskColor(calculateHighestAirportComplexity(flight)),
      description: calculateHighestAirportComplexity(flight) === 'low'
        ? 'Simple airport operations'
        : calculateHighestAirportComplexity(flight) === 'medium'
        ? 'Moderately complex operations'
        : 'High complexity operations'
    },
    {
      icon: Star,
      label: 'Customer Satisfaction',
      value: (() => {
        const rating = getAirlineRating(flight.airline);
        return rating !== null ? `${rating}/5` : 'Not available';
      })(),
      color: (() => {
        const rating = getAirlineRating(flight.airline);
        if (rating === null) return 'text-gray-500';
        if (rating >= 4.0) return 'text-green-600';
        if (rating >= 3.5) return 'text-amber-600';
        return 'text-red-600';
      })(),
      description: (() => {
        const rating = getAirlineRating(flight.airline);
        if (rating === null) return 'Customer satisfaction data unavailable';
        if (rating >= 4.0) return 'Excellent customer satisfaction based on passenger reviews';
        if (rating >= 3.5) return 'Good customer satisfaction with room for improvement';
        return 'Below average customer satisfaction - consider alternatives';
      })()
    }
  ];

  // Add connection risk for flights with layovers
  if (flight.connections && flight.connections.length > 0) {
    // DEBUG: Log the connections structure
    console.log('🔍 CONNECTION RISK DEBUG:', {
      connectionsLength: flight.connections.length,
      connections: flight.connections,
      firstConnection: flight.connections[0],
      hasLayoverInfo: flight.connections[0]?.layoverInfo,
      layoverInfo: flight.connections[0]?.layoverInfo,
      layoverDuration: flight.connections[0]?.layoverInfo?.duration,
      connectionAnalysis: flight.connection_analysis,
      connectionDetails: flight.connection_analysis?.connection_details,
      // Log the entire flight object to see all available data
      flightKeys: Object.keys(flight),
      riskFactors: flight.riskFactors,
      // Log all layover durations
      allLayoverDurations: flight.connections?.map(conn => ({
        airport: conn.layoverInfo?.airport,
        duration: conn.layoverInfo?.duration,
        parsedMinutes: conn.layoverInfo?.duration ? parseDurationToMinutes(conn.layoverInfo.duration) : 0
      })),
      // Additional debugging for each connection
      detailedConnectionInfo: flight.connections?.map((conn, index) => ({
        index,
        id: conn.id,
        hasLayoverInfo: !!conn.layoverInfo,
        layoverInfoKeys: conn.layoverInfo ? Object.keys(conn.layoverInfo) : [],
        layoverDuration: conn.layoverInfo?.duration,
        layoverDurationType: typeof conn.layoverInfo?.duration,
        parsedDuration: conn.layoverInfo?.duration ? parseDurationToMinutes(conn.layoverInfo.duration) : 0
      }))
    });
    
    // Calculate total layover time from multiple possible sources
    let totalLayoverMinutes = 0;
    
    // Method 1: Check connection_analysis.connection_details
    if (flight.connection_analysis?.connection_details) {
      totalLayoverMinutes = flight.connection_analysis.connection_details.reduce((total: number, connection: { duration?: string }) => {
        const duration = connection.duration || '0m';
        console.log('🔍 Connection detail duration:', duration);
        return total + parseDurationToMinutes(duration);
      }, 0);
      console.log('🔍 Method 1 (connection_details) total:', totalLayoverMinutes);
    }
    
    // Method 3: Try to extract from connections array
    if (totalLayoverMinutes === 0) {
      totalLayoverMinutes = calculateTotalLayoverTime(flight.connections);
      console.log('🔍 Method 3 (connections) total:', totalLayoverMinutes);
    }
    
    // Method 4: Sum ALL layover durations from all connections
    if (totalLayoverMinutes === 0 && flight.connections && flight.connections.length > 0) {
      // Sum layover durations from ALL connections, not just the first one
      totalLayoverMinutes = flight.connections.reduce((total, connection) => {
        if (connection.layoverInfo?.duration) {
          const layoverMinutes = parseDurationToMinutes(connection.layoverInfo.duration);
          console.log(`🔍 Connection layover: ${connection.layoverInfo.duration} = ${layoverMinutes} minutes`);
          return total + layoverMinutes;
        }
        return total;
      }, 0);
      console.log('🔍 Method 4 (sum of all layovers) total:', totalLayoverMinutes, 'minutes');
    }
    
    console.log('🔍 FINAL TOTAL LAYOVER MINUTES:', totalLayoverMinutes);
    
    const layoverRisk = totalLayoverMinutes < 60 ? 'high' :
                       totalLayoverMinutes < 120 ? 'medium' : 'low';
    
    insights.splice(2, 0, {
      icon: Clock,
      label: 'Connection Risk',
      value: formatRiskLevel(layoverRisk),
      color: getRiskColor(layoverRisk),
      description: `${convertMinutesToHours(totalLayoverMinutes)} total layover time`
    });
  }

  // Determine if insurance should be shown - ONLY show for medium/high risk flights
  // More restrictive: Only show if flight risk level is medium/high OR if multiple risk factors are elevated
  const cancellationRate = flight.riskFactors.cancellationRate || 0;
  const shouldShowInsurance = (
    flight.riskLevel === 'medium' || 
    flight.riskLevel === 'high' ||
    (flight.riskFactors.overallRisk === 'medium' && (cancellationRate > 5 || flight.riskFactors.cancellationRate === undefined)) ||
    (flight.riskFactors.overallRisk === 'high') ||
    (flight.riskFactors.weatherRisk === 'high' && (cancellationRate > 3 || flight.riskFactors.cancellationRate === undefined)) ||
    (cancellationRate > 8) || // Only show for very high cancellation rates
    flight.riskFactors.cancellationRate === undefined // Show if analysis failed
  );

  // DEBUG: Log risk values to understand why insurance is showing
  console.log('🔍 INSURANCE DEBUG:', {
    flightRiskLevel: flight.riskLevel,
    overallRisk: flight.riskFactors.overallRisk,
    weatherRisk: flight.riskFactors.weatherRisk,
    cancellationRate: flight.riskFactors.cancellationRate,
    shouldShowInsurance: shouldShowInsurance
  });


  // Function to parse seasonal factors and make labels bold
  const parseSeasonalFactor = (factor: string) => {
    const colonIndex = factor.indexOf(':');
    if (colonIndex === -1) {
      // No colon found, return as is with translation
      return (
        <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>
          <TranslatedText text={factor} targetLanguage={currentLanguage} />
        </span>
      );
    }

    const label = factor.substring(0, colonIndex + 1); // Include the colon
    const description = factor.substring(colonIndex + 1).trim();

    return {
      icon: <Calendar className="w-4 h-4 text-blue-600" />,
      text: (
        <span>
          <span className="font-bold">
            <TranslatedText text={label} targetLanguage={currentLanguage} />
          </span>
          {description && (
            <span>
              {' '}
              <TranslatedText text={description} targetLanguage={currentLanguage} />
            </span>
          )}
        </span>
      )
    };
  };

  return (
    <div className={`space-y-4 p-6 rounded-2xl border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-slate-900/20' 
        : 'bg-white border-slate-200 shadow-lg'
    }`}>
      {/* Risk Analysis */}
      <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <TranslatedText text="Risk Analysis" targetLanguage={currentLanguage} />
        </h3>
        
        <div className="space-y-4 mb-6">
          {insights.map((insight, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-600' : 'bg-white'} ${insight.color.replace('text-', 'text-')} bg-opacity-10`}>
                  <insight.icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <div>
                  <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text={insight.label} targetLanguage={currentLanguage} />
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text={insight.description} targetLanguage={currentLanguage} />
                    {(insight as any).hasOftenDelayed && (
                      <span className={`ml-1 font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        <TranslatedText text="(Often 30+ min)" targetLanguage={currentLanguage} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`text-lg font-semibold ${insight.color}`}>
                {insight.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Analysis and Airport Analysis - Side by side for flights with connections */}
      {flight.connections && flight.connections.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <ConnectionAnalysis flight={flight} />
          </div>
          
          <div>
            {/* Airport Analysis for flights with connections */}
            <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 text-blue-600`}>
                  <TranslatedText text="Airport Analysis" targetLanguage={currentLanguage} />
                </h3>
                
                <div className="space-y-4">
                  {/* Origin Airport */}
                <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                      {/* Airport Image */}
                      <div className="relative h-24 bg-gradient-to-r from-blue-400 to-blue-600">
                        <img 
                      src={getAirportImage(flight.departure.airport.code)}
                          alt={`${flight.departure.airport.city} Airport`}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        <div className="absolute bottom-2 left-3 text-white">
                          <div className="text-base font-bold text-shadow-lg drop-shadow-lg">
                            <TranslatedText text={`Origin: ${flight.departure.airport.city} (${flight.departure.airport.code})`} targetLanguage={currentLanguage} />
                            <button
                              className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-white/20 hover:bg-white/30 border border-white/30`}
                              title={`View user reviews for ${flight.departure.airport.code}`}
                            >
                              <span>⭐</span>
                              <span>4.2/5</span>
                            </button>
                            <button
                              onClick={() => {
                                console.log('🗺️ Location button clicked for origin airport:', flight.departure.airport.code);
                                setSelectedAirport({
                                  code: flight.departure.airport.code,
                                  name: flight.departure.airport.name,
                                  city: flight.departure.airport.city,
                                  complexity: flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity,
                                  description: flight.originAnalysis?.airport_complexity?.description || `${flight.departure.airport.code} is a major international hub with high traffic volume. Even minor weather events can propagate delays quickly due to tightly scheduled operations and numerous connecting flights.`
                                });
                              }}
                              className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30`}
                              title="View airport location"
                            >
                              <Eye className="w-3 h-3" />
                              <span>
                                <TranslatedText text="View Map" targetLanguage={currentLanguage} />
                              </span>
                            </button>
                          </div>
                          <div className="text-sm text-white/90 text-shadow-lg drop-shadow-lg">
                            <TranslatedText text={flight.departure.airport.name} targetLanguage={currentLanguage} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                                               {/* Weather Risk */}
                    <div className={`mb-2 p-3 rounded border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                         <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                          🌤️ {formatRiskLevel(flight.originAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk)} Weather Risk:
                           </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.originAnalysis?.weather_risk?.description || `Summer at ${flight.departure.airport.code} brings moderate weather risks. Heat, humidity, thunderstorms, and occasional sea breezes can affect flight operations. Visibility and convective activity are primary concerns.`)} 
                            targetLanguage={currentLanguage} 
                          />
                           </span>
                         </div>
                       </div>
                       
                       {/* Airport Complexity */}
                    <div className={`p-3 rounded border ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                          🏢 {formatRiskLevel(flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity)} Airport Complexity:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-orange-100' : 'text-orange-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.originAnalysis?.airport_complexity?.description || `${flight.departure.airport.code} is a major international hub with high traffic volume. Even minor weather events can propagate delays quickly due to tightly scheduled operations and numerous connecting flights.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                  
                  {/* Destination Airport */}
                <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                      {/* Airport Image */}
                      <div className="relative h-24 bg-gradient-to-r from-green-400 to-green-600">
                        <img 
                      src={getAirportImage(flight.arrival.airport.code)}
                          alt={`${flight.arrival.airport.city} Airport`}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                        <div className="absolute bottom-2 left-3 text-white">
                          <div className="text-base font-bold text-shadow-lg drop-shadow-lg">
                            <TranslatedText text={`Destination: ${flight.arrival.airport.city} (${flight.arrival.airport.code})`} targetLanguage={currentLanguage} />
                        <button
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-white/20 hover:bg-white/30 border border-white/30`}
                          title={`View user reviews for ${flight.arrival.airport.code}`}
                        >
                          <span>⭐</span>
                          <span>4.2/5</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('🗺️ Location button clicked for destination airport:', flight.arrival.airport.code);
                            setSelectedAirport({
                              code: flight.arrival.airport.code,
                              name: flight.arrival.airport.name,
                              city: flight.arrival.airport.city,
                              complexity: flight.destinationAnalysis?.airport_complexity?.complexity || 'Medium',
                              description: flight.destinationAnalysis?.airport_complexity?.description || `${flight.arrival.airport.code} operates with moderate complexity. Regional hub with good infrastructure and manageable traffic patterns.`
                            });
                          }}
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30`}
                          title="View airport location"
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            <TranslatedText text="View Map" targetLanguage={currentLanguage} />
                          </span>
                        </button>
                          </div>
                          <div className="text-sm text-white/90 text-shadow-lg drop-shadow-lg">
                            <TranslatedText text={flight.arrival.airport.name} targetLanguage={currentLanguage} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                    {/* Weather Risk */}
                    <div className={`mb-2 p-3 rounded border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                          🌤️ {formatRiskLevel(flight.destinationAnalysis?.weather_risk?.level || 'Low')} Weather Risk:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.destinationAnalysis?.weather_risk?.description || `Partly cloudy skies at ${flight.arrival.airport.code}. Minimal impact on flight operations expected. Good visibility should prevail, allowing for standard procedures.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>

                    {/* Airport Complexity */}
                    <div className={`p-3 rounded border ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                          🏢 {formatRiskLevel(flight.destinationAnalysis?.airport_complexity?.complexity || 'Medium')} Airport Complexity:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-orange-100' : 'text-orange-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.destinationAnalysis?.airport_complexity?.description || `${flight.arrival.airport.code} operates with moderate complexity. Regional hub with good infrastructure and manageable traffic patterns.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seasonal Factors - Now at the end of Airport Analysis card */}
                {flight.riskFactors.seasonalFactors && flight.riskFactors.seasonalFactors.length > 0 && (
                  <div className="mt-6">
                    <h4 className={`text-md font-semibold mb-3 text-blue-600`}>
                      <TranslatedText text="Seasonal Factors" targetLanguage={currentLanguage} />
                    </h4>
                    <div className="space-y-2">
                      {flight.riskFactors.seasonalFactors.map((factor: string, index: number) => {
                        const parsedFactor = parseSeasonalFactor(factor);
                        return (
                          <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                            {typeof parsedFactor === 'object' && 'icon' in parsedFactor ? (
                              <>
                                <span className="text-xl">{parsedFactor.icon}</span>
                                <div className="flex-1">
                                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {parsedFactor.text}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="flex-1">
                                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                  {parsedFactor}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Optimized layout for direct flights - 2 columns with Seasonal Factors below Connection Analysis
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <ConnectionAnalysis flight={flight} />
            
            {/* Seasonal Factors moved below Connection Analysis for direct flights */}
            {flight.riskFactors.seasonalFactors && flight.riskFactors.seasonalFactors.length > 0 && (
              <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-lg font-semibold mb-4 text-blue-600`}>
                  <TranslatedText text="Seasonal Factors" targetLanguage={currentLanguage} />
                </h3>
                <div className="space-y-2">
                  {flight.riskFactors.seasonalFactors.map((factor: string, index: number) => {
                    const parsedFactor = parseSeasonalFactor(factor);
                    return (
                      <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                        {typeof parsedFactor === 'object' && 'icon' in parsedFactor ? (
                          <>
                            <span className="text-xl">{parsedFactor.icon}</span>
                            <div className="flex-1">
                              <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                {parsedFactor.text}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {parsedFactor}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div>
            {/* Airport Analysis for direct flights */}
            <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
              <h3 className={`text-lg font-semibold mb-4 text-blue-600`}>
                <TranslatedText text="Airport Analysis" targetLanguage={currentLanguage} />
              </h3>

              <div className="space-y-4">
                {/* Origin Airport */}
                <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                  {/* Airport Image */}
                  <div className="relative h-24 bg-gradient-to-r from-blue-400 to-blue-600">
                    <img
                      src={getAirportImage(flight.departure.airport.code)}
                      alt={`${flight.departure.airport.city} Airport`}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="absolute bottom-2 left-3 text-white">
                      <div className="text-base font-bold text-shadow-lg drop-shadow-lg">
                        <TranslatedText text={`Origin: ${flight.departure.airport.city} (${flight.departure.airport.code})`} targetLanguage={currentLanguage} />
                        <button
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-white/20 hover:bg-white/30 border border-white/30`}
                          title={`View user reviews for ${flight.departure.airport.code}`}
                        >
                          <span>⭐</span>
                          <span>4.2/5</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('🗺️ Location button clicked for origin airport:', flight.departure.airport.code);
                            setSelectedAirport({
                              code: flight.departure.airport.code,
                              name: flight.departure.airport.name,
                              city: flight.departure.airport.city,
                              complexity: flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity,
                              description: flight.originAnalysis?.airport_complexity?.description || `${flight.departure.airport.code} is a major international hub with high traffic volume. Even minor weather events can propagate delays quickly due to tightly scheduled operations and numerous connecting flights.`
                            });
                          }}
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30`}
                          title="View airport location"
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            <TranslatedText text="View Map" targetLanguage={currentLanguage} />
                          </span>
                        </button>
                      </div>
                      <div className="text-sm text-white/90 text-shadow-lg drop-shadow-lg">
                        <TranslatedText text={flight.departure.airport.name} targetLanguage={currentLanguage} />
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    {/* Weather Risk */}
                    <div className={`mb-2 p-3 rounded border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                          🌤️ {formatRiskLevel(flight.originAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk)} Weather Risk:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.originAnalysis?.weather_risk?.description || `Partly cloudy conditions at ${flight.departure.airport.code}. Potential for minor delays due to reduced visibility during peak arrival/departure times. Expect slight air traffic adjustments.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>
                    
                    {/* Airport Complexity */}
                    <div className={`p-3 rounded border ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                          🏢 {formatRiskLevel(flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity)} Airport Complexity:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-orange-100' : 'text-orange-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.originAnalysis?.airport_complexity?.description || `${flight.departure.airport.code} is a major international hub with high traffic volume. Even minor weather events can propagate delays quickly due to tightly scheduled operations and numerous connecting flights.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Destination Airport */}
                <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-slate-50'}`}>
                  {/* Airport Image */}
                  <div className="relative h-24 bg-gradient-to-r from-green-400 to-green-600">
                    <img
                      src={getAirportImage(flight.arrival.airport.code)}
                      alt={`${flight.arrival.airport.city} Airport`}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                    <div className="absolute bottom-2 left-3 text-white">
                      <div className="text-base font-bold text-shadow-lg drop-shadow-lg">
                        <TranslatedText text={`Destination: ${flight.arrival.airport.city} (${flight.arrival.airport.code})`} targetLanguage={currentLanguage} />
                        <button
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-white/20 hover:bg-white/30 border border-white/30`}
                          title={`View user reviews for ${flight.arrival.airport.code}`}
                        >
                          <span>⭐</span>
                          <span>4.2/5</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('🗺️ Location button clicked for destination airport:', flight.arrival.airport.code);
                            setSelectedAirport({
                              code: flight.arrival.airport.code,
                              name: flight.arrival.airport.name,
                              city: flight.arrival.airport.city,
                              complexity: flight.destinationAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity,
                              description: flight.destinationAnalysis?.airport_complexity?.description || `${flight.arrival.airport.code} operates with moderate complexity. Regional hub with good infrastructure and manageable traffic patterns.`
                            });
                          }}
                          className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30`}
                          title="View airport location"
                        >
                          <Eye className="w-3 h-3" />
                          <span>
                            <TranslatedText text="View Map" targetLanguage={currentLanguage} />
                          </span>
                        </button>
                      </div>
                      <div className="text-sm text-white/90 text-shadow-lg drop-shadow-lg">
                        <TranslatedText text={flight.arrival.airport.name} targetLanguage={currentLanguage} />
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                                               {/* Weather Risk */}
                    <div className={`mb-2 p-3 rounded border ${isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                         <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                          🌤️ {formatRiskLevel(flight.destinationAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk)} Weather Risk:
                           </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.destinationAnalysis?.weather_risk?.description || `Partly cloudy conditions at ${flight.arrival.airport.code}. Potential for minor delays due to reduced visibility during peak arrival/departure times. Expect slight air traffic adjustments.`)} 
                            targetLanguage={currentLanguage} 
                          />
                           </span>
                         </div>
                       </div>
                       
                       {/* Airport Complexity */}
                    <div className={`p-3 rounded border ${isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'}`}>
                      <div className="text-base">
                        <span className={`font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                          🏢 {formatRiskLevel(flight.destinationAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity)} Airport Complexity:
                        </span>
                        <span className={`ml-1 ${isDarkMode ? 'text-orange-100' : 'text-orange-700'}`}>
                          <TranslatedText 
                            text={capitalizeFirstLetter(flight.destinationAnalysis?.airport_complexity?.description || `${flight.arrival.airport.code} operates with moderate complexity. Regional hub with good infrastructure and manageable traffic patterns.`)} 
                            targetLanguage={currentLanguage} 
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI-Powered Insurance Recommendation */}
      <div className={`rounded-xl border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-lg font-semibold mb-4 text-blue-600`}>
          <TranslatedText 
            text={
              flight.insurance_recommendation?.recommendation_type === 'skip_insurance' 
                ? "Why We Do NOT Recommend Insurance for This Flight"
                : "Why We Recommend Insurance for This Flight"
            } 
            targetLanguage={currentLanguage} 
          />
        </h3>
        
        {/* Use AI-generated insurance recommendation */}
        {flight.insurance_recommendation ? (
          (() => {
            const recommendation = flight.insurance_recommendation;
            const recommendationType = recommendation.recommendation_type || 'neutral';
            
            // Determine styling based on recommendation type
            let bgColor, borderColor, iconColor, icon;
            if (recommendationType === 'skip_insurance') {
              bgColor = isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
              borderColor = isDarkMode ? 'border-blue-700' : 'border-blue-200';
              iconColor = isDarkMode ? 'text-blue-400' : 'text-blue-600';
              icon = CheckCircle;
            } else if (recommendationType === 'strongly_recommend') {
              bgColor = isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
              borderColor = isDarkMode ? 'border-red-700' : 'border-red-200';
              iconColor = isDarkMode ? 'text-red-400' : 'text-red-600';
              icon = AlertTriangle;
            } else { // consider_insurance or neutral
              bgColor = isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
              borderColor = isDarkMode ? 'border-yellow-700' : 'border-yellow-200';
              iconColor = isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
              icon = AlertTriangle;
            }
            
            const IconComponent = icon;
            
            return (
              <div className={`p-4 rounded-lg border ${bgColor} ${borderColor}`}>
                <div className="flex items-start space-x-3">
                  <IconComponent className={`w-6 h-6 mt-0.5 flex-shrink-0 ${iconColor}`} />
                  <div className="flex-1">
                    <p className={`font-medium mb-2 ${
                      recommendationType === 'skip_insurance' 
                        ? (isDarkMode ? 'text-blue-200' : 'text-blue-800')
                        : recommendationType === 'strongly_recommend'
                          ? (isDarkMode ? 'text-red-200' : 'text-red-800')
                          : (isDarkMode ? 'text-yellow-200' : 'text-yellow-800')
                    }`}>
                      <TranslatedText 
                        text={
                          recommendationType === 'skip_insurance' 
                            ? 'Skip Insurance - Save Your Money'
                            : recommendationType === 'strongly_recommend'
                              ? 'Insurance Strongly Recommended'
                              : 'Consider Insurance for Peace of Mind'
                        } 
                        targetLanguage={currentLanguage} 
                      />
                    </p>
                    
                    {/* AI-generated recommendation text */}
                    <div className={`text-sm leading-relaxed ${
                      recommendationType === 'skip_insurance' 
                        ? (isDarkMode ? 'text-blue-100' : 'text-blue-700')
                        : recommendationType === 'strongly_recommend'
                          ? (isDarkMode ? 'text-red-100' : 'text-red-700')
                          : (isDarkMode ? 'text-yellow-100' : 'text-yellow-700')
                    }`}>
                      {recommendation.recommendation ? (
                        <div className="space-y-2">
                          {recommendation.recommendation.split('\n\n').map((paragraph, index) => (
                            <p key={index}>
                              <TranslatedText text={paragraph.trim()} targetLanguage={currentLanguage} />
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>
                          <TranslatedText 
                            text="AI-powered insurance analysis based on comprehensive flight risk assessment." 
                            targetLanguage={currentLanguage} 
                          />
                        </p>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* Fallback to basic risk-based recommendation if no AI recommendation */
          <div className={`p-4 rounded-lg ${
            flight.riskLevel === 'low' 
              ? (isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200')
              : flight.riskLevel === 'high'
                ? (isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200')
                : (isDarkMode ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200')
          }`}>
            <div className="flex items-center space-x-3">
              {flight.riskLevel === 'low' ? (
                <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              ) : (
                <AlertTriangle className={`w-6 h-6 ${
                  flight.riskLevel === 'high'
                    ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                    : (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                }`} />
              )}
              <div>
                <p className={`font-medium ${
                  flight.riskLevel === 'low' 
                    ? (isDarkMode ? 'text-blue-200' : 'text-blue-800')
                    : flight.riskLevel === 'high'
                      ? (isDarkMode ? 'text-red-200' : 'text-red-800')
                      : (isDarkMode ? 'text-yellow-200' : 'text-yellow-800')
                }`}>
                  <TranslatedText 
                    text={
                      flight.riskLevel === 'low' 
                        ? 'No Insurance Recommended'
                        : flight.riskLevel === 'high'
                          ? 'Insurance Recommended'
                          : 'Consider Insurance'
                    } 
                    targetLanguage={currentLanguage} 
                  />
                </p>
                <p className={`text-sm ${
                  flight.riskLevel === 'low' 
                    ? (isDarkMode ? 'text-blue-100' : 'text-blue-700')
                    : flight.riskLevel === 'high'
                      ? (isDarkMode ? 'text-red-100' : 'text-red-700')
                      : (isDarkMode ? 'text-yellow-100' : 'text-yellow-700')
                }`}>
                  <TranslatedText 
                    text={
                      flight.riskLevel === 'low' 
                        ? 'Based on the low risk assessment, travel insurance is not necessary for this journey. Save your money!'
                        : flight.riskLevel === 'high'
                          ? 'Based on the high risk assessment, we recommend purchasing travel insurance for this journey.'
                          : 'Based on the medium risk assessment, consider purchasing travel insurance for peace of mind.'
                    } 
                    targetLanguage={currentLanguage} 
                  />
                </p>
                <div className="mt-2">
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <TranslatedText text="Basic Analysis • AI recommendation temporarily unavailable" targetLanguage={currentLanguage} />
                  </p>
                </div>
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
    </div>
  );
};