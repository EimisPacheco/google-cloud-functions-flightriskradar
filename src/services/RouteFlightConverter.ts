// Converter specifically for Route Search (SerpAPI data)
import { RouteFlightData, Flight } from '../types/FlightTypes';
import { extractCityFromAirportCode } from '../utils/airportsData';

// Remove frontend calculation - use backend assessment only

// Helper function to parse duration strings like "8h 24m" to minutes
const parseDurationToMinutes = (duration: string | number): number => {
  if (typeof duration === 'number') {
    return duration;
  }
  
  const durationStr = String(duration);
  if (durationStr.includes('h') || durationStr.includes('m')) {
    // Parse "8h 24m" format
    const hours = durationStr.match(/(\d+)h/);
    const minutes = durationStr.match(/(\d+)m/);
    return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
  } else {
    // Assume it's minutes as a number
    return Number(durationStr) || 0;
  }
};

// Helper function to detect if a time string is in SerpAPI format (YYYY-MM-DD HH:MM)
const isSerpAPITimeFormat = (timeString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(timeString);
};

const formatSerpAPITime = (timeString: string): string => {
  try {
    // SerpAPI returns time in format "2025-07-08 06:00" or just "06:00"
    let time: string;
    if (timeString.includes(' ')) {
      [, time] = timeString.split(' ');
    } else {
      time = timeString;
    }
    
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes || minutes === 'undefined' || hours === 'undefined') {
      console.error('❌ Invalid time format or undefined values:', timeString);
      return '12:00 AM'; // Return default time instead of invalid format
    }
    
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('❌ Error formatting SerpAPI time:', error);
    return timeString;
  }
};

const isAlreadyFormatted = (timeString: string): boolean => {
  // Check if time is already formatted (contains AM/PM)
  return timeString.includes('AM') || timeString.includes('PM');
};

// Helper function to extract airline code from airline name
const extractAirlineCode = (airlineName: string): string => {
  // Simple mapping for common airlines
  const airlineMap: Record<string, string> = {
    'American Airlines': 'AA',
    'Delta Air Lines': 'DL',
    'United Airlines': 'UA',
    'Southwest Airlines': 'WN',
    'JetBlue Airways': 'B6',
    'Alaska Airlines': 'AS',
    'Spirit Airlines': 'NK',
    'Frontier Airlines': 'F9'
  };
  return airlineMap[airlineName] || airlineName.substring(0, 2).toUpperCase();
};

export const convertRouteFlightData = (
  flight: Record<string, unknown>, 
  index: number, 
  adkStatus?: Flight['adkStatus'], 
  weatherAnalysis?: Record<string, unknown>,
  seasonalFactors?: string[], 
  keyRiskFactors?: string[]
): RouteFlightData | null => {
  try {
    console.log(`🔍 ROUTE FLIGHT CONVERTER - Processing flight ${index}`);
    console.log(`🔍 Flight data keys:`, Object.keys(flight));
    console.log(`✈️ AIRCRAFT DEBUG - flight.airplane:`, flight.airplane);
    console.log(`✈️ AIRCRAFT DEBUG - flight.airplane_model:`, flight.airplane_model);
    console.log(`✈️ AIRCRAFT DEBUG - flight.aircraft_type:`, flight.aircraft_type);
    console.log(`✈️ AIRCRAFT DEBUG - flight.flights (segments):`, flight.flights);
    console.log(`⚠️ OFTEN DELAYED DEBUG - flight.often_delayed_by_over_30_min:`, flight.often_delayed_by_over_30_min);
    console.log(`🌞 SEASONAL FACTORS DEBUG - flight.risk_analysis:`, flight.risk_analysis);
    console.log(`🌞 SEASONAL FACTORS DEBUG - seasonalFactors param:`, seasonalFactors);
    
    // Extract basic flight information from SerpAPI structure
    const airline = String(flight.airline || 'Unknown');
    const flightNumber = String(flight.flight_number || 'Unknown');
    const airlineName = String(flight.airline_name || airline);
    const airlineCode = String(flight.airline_code || extractAirlineCode(airline));
    
    // Extract origin and destination from SerpAPI - handle undefined properly
    const originTime = flight.departure_time && flight.departure_time !== 'undefined' ? 
      String(flight.departure_time) : '00:00';
    const destinationTime = flight.arrival_time && flight.arrival_time !== 'undefined' ? 
      String(flight.arrival_time) : '00:00';
    const originCode = String(flight.origin_airport_code || 'Unknown');
    const destinationCode = String(flight.destination_airport_code || 'Unknown');
    const originCity = String(flight.origin_city || extractCityFromAirportCode(originCode));
    const destinationCity = String(flight.destination_city || extractCityFromAirportCode(destinationCode));
    
    // Extract risk analysis from SerpAPI route search
    const riskAssessment = flight.risk_analysis as Record<string, unknown>;
    const delayProbability = riskAssessment?.delay_probability ? 
      parseFloat(String(riskAssessment.delay_probability).split('%')[0]) : undefined;
    const cancellationRate = riskAssessment?.cancellation_probability ? 
      parseFloat(String(riskAssessment.cancellation_probability).split('%')[0]) : undefined;
    
    // Extract seasonal factors and key risk factors from risk assessment
    const extractedSeasonalFactors = Array.isArray(riskAssessment?.seasonal_factors) ? 
      riskAssessment.seasonal_factors : (seasonalFactors || []);
    const extractedKeyRiskFactors = Array.isArray(riskAssessment?.key_risk_factors) ? 
      riskAssessment.key_risk_factors : (keyRiskFactors || []);
    
    console.log(`🌞 SEASONAL FACTORS DEBUG - extractedSeasonalFactors:`, extractedSeasonalFactors);
    console.log(`🔑 KEY RISK FACTORS DEBUG - extractedKeyRiskFactors:`, extractedKeyRiskFactors);
    
    // Extract SerpAPI-specific data
    const flights = flight.flights as Array<Record<string, unknown>>;
    const layovers = flight.layovers as Array<Record<string, unknown>>;
    const cloudConnections = flight.connections as Array<Record<string, unknown>>;
    const hasConnections = (layovers && layovers.length > 0) || (flights && flights.length > 1);
    
    // Build connections array for SerpAPI flights
    let connections: Flight[] | undefined = undefined;
    let finalSegmentTravelTime: string | undefined = undefined;
    
    if (hasConnections && flights && Array.isArray(flights)) {
      // For route search flights with connections, create connection objects
      connections = flights.map((segment, segmentIndex) => {
        const segmentData = segment as Record<string, unknown>;
        const arrivalAirport = segmentData.arrival_airport as Record<string, unknown>;
        const departureAirport = segmentData.departure_airport as Record<string, unknown>;
        
        const segmentAirport = String(arrivalAirport.id || 'Unknown');
        const segmentCity = String(arrivalAirport.city || extractCityFromAirportCode(segmentAirport));
        const segmentAirportName = String(arrivalAirport.name || `${segmentCity} Airport`);
        
        // Get the correct segment duration for this specific segment
        const segmentDuration = Number(segmentData.duration || 0);
        const segmentDurationFormatted = `${Math.floor(segmentDuration / 60)}h ${segmentDuration % 60}m`;
        
        // Find corresponding layover for this segment
        const correspondingLayover = layovers && layovers.length > 0 ? 
          layovers.find(layover => 
            String(layover.airport_code || layover.airport || layover.id) === segmentAirport
          ) : null;
        
        // Use the first connection's layoverInfo (most route searches have one layover)
        const correspondingConnection = cloudConnections && cloudConnections.length > 0 ? cloudConnections[0] : null;
        
        // Handle layover duration
        let layoverDurationMinutes = 0;
        if (correspondingLayover && correspondingLayover.layover_duration_minutes) {
          layoverDurationMinutes = Number(correspondingLayover.layover_duration_minutes);
        } else if (correspondingLayover && correspondingLayover.duration) {
          layoverDurationMinutes = parseDurationToMinutes(correspondingLayover.duration);
        }
        
        // Get connection risk from backend layover analysis
        const connectionRiskLevel = (() => {
          if (correspondingConnection?.layover_analysis?.feasibility_risk) {
            return String(correspondingConnection.layover_analysis.feasibility_risk) as 'low' | 'medium' | 'high';
          }
          return layoverDurationMinutes > 0 ? 'unknown' : 'low'; // Return 'unknown' if backend analysis failed
        })();
        const layoverDurationFormatted = layoverDurationMinutes > 0 ? 
          `${Math.floor(layoverDurationMinutes / 60)}h ${layoverDurationMinutes % 60}m` : undefined;
        
        return {
          id: `route-connection-${index}-${segmentIndex}`,
          airline: String(segmentData.airline || airlineName),
          flightNumber: String(segmentData.flight_number || `${String(segmentData.airline || 'XX')}${segmentIndex + 1}`),
          aircraft: (() => {
            const aircraft = String(segmentData.airplane || flight.airplane || flight.airplane_model || flight.aircraft_type || 'Unknown');
            console.log(`✈️ SEGMENT AIRCRAFT DEBUG - segmentData.airplane:`, segmentData.airplane);
            console.log(`✈️ SEGMENT AIRCRAFT DEBUG - final value:`, aircraft);
            return aircraft;
          })(),
          departure: {
            airport: {
              code: String(departureAirport.id || 'Unknown'),
              name: String(departureAirport.name || `${String(departureAirport.city || extractCityFromAirportCode(String(departureAirport.id || 'Unknown')))} Airport`),
              city: String(departureAirport.city || extractCityFromAirportCode(String(departureAirport.id || 'Unknown'))),
              country: 'United States'
            },
            time: (() => {
              const timeValue = departureAirport.time && departureAirport.time !== 'undefined' ? 
                String(departureAirport.time) : '00:00';
              return isSerpAPITimeFormat(timeValue) && !isAlreadyFormatted(timeValue) ? 
                formatSerpAPITime(timeValue) : timeValue;
            })()
          },
          arrival: {
            airport: {
              code: segmentAirport,
              name: segmentAirportName,
              city: segmentCity,
              country: 'United States'
            },
            time: (() => {
              const timeValue = arrivalAirport.time && arrivalAirport.time !== 'undefined' ? 
                String(arrivalAirport.time) : '00:00';
              return isSerpAPITimeFormat(timeValue) && !isAlreadyFormatted(timeValue) ? 
                formatSerpAPITime(timeValue) : timeValue;
            })()
          },
          duration: segmentDurationFormatted,
          price: Number(flight.price || 0),
          riskScore: Number(riskAssessment?.overall_risk_score || 50),
          riskLevel: String(riskAssessment?.risk_level || 'medium') as 'low' | 'medium' | 'high',
          often_delayed_by_over_30_min: Boolean(segmentData.often_delayed_by_over_30_min),
          riskFactors: {
            overallRisk: String(riskAssessment?.risk_level || riskAssessment?.overall_risk),
            delayProbability: delayProbability,
            cancellationRate: cancellationRate,
            weatherRisk: (() => {
              // Try to get weather risk from the layover analysis for this specific airport
              const layoverAirport = String(correspondingLayover?.airport_code || correspondingLayover?.airport || '');
              const layoverWeatherAnalysis = weatherAnalysis?.layover_weather_analysis as Record<string, unknown>;
              const layoverWeatherData = layoverWeatherAnalysis?.[layoverAirport] as Record<string, unknown>;
              
              if (layoverWeatherData?.weather_risk) {
                return String((layoverWeatherData.weather_risk as Record<string, unknown>).level || 'medium');
              }
              
              return 'medium'; // Fallback for route search
            })(),
            airportComplexity: (() => {
              // Try to get airport complexity from the layover analysis for this specific airport
              const layoverAirport = String(correspondingLayover?.airport_code || correspondingLayover?.airport || '');
              const layoverWeatherAnalysis = weatherAnalysis?.layover_weather_analysis as Record<string, unknown>;
              const layoverWeatherData = layoverWeatherAnalysis?.[layoverAirport] as Record<string, unknown>;
              
              if (layoverWeatherData?.airport_complexity) {
                return String((layoverWeatherData.airport_complexity as Record<string, unknown>).complexity || 'medium');
              }
              
              return 'medium'; // Fallback for route search
            })(),
            connectionTime: layoverDurationMinutes,
            connectionType: 'connecting',
            connectionRisk: connectionRiskLevel,
            historicalDelays: parseFloat(String(riskAssessment?.historical_performance?.average_delay || '0 minutes').replace(' minutes', '')) || 0,
            seasonalFactors: extractedSeasonalFactors,
            keyRiskFactors: extractedKeyRiskFactors
          },
          layoverInfo: layoverDurationMinutes > 0 ? {
            airport: String(correspondingLayover?.airport_code || correspondingLayover?.airport || ''),
            airport_name: String(correspondingLayover?.airport_name || `${String(correspondingLayover?.city || 'Unknown')} Airport`),
            city: String(correspondingLayover?.city || 'Unknown'),
            duration: layoverDurationFormatted || '0m',
                         arrival_time: (() => {
               const connectionTime = (correspondingConnection?.layoverInfo as Record<string, unknown>)?.arrival_time;
               const layoverTime = correspondingLayover?.arrival_time;
               const timeValue = String(connectionTime || layoverTime || '');
               
               // Convert "9:36 AM" to "2025-07-30 09:36" format expected by ConnectionAnalysis
               if (timeValue && timeValue.includes(' ') && (timeValue.includes('AM') || timeValue.includes('PM'))) {
                 const [time, ampm] = timeValue.split(' ');
                 const [hours, minutes] = time.split(':');
                 let hour = parseInt(hours);
                 if (ampm === 'PM' && hour !== 12) hour += 12;
                 if (ampm === 'AM' && hour === 12) hour = 0;
                 const hour24 = hour.toString().padStart(2, '0');
                 return `2025-07-30 ${hour24}:${minutes}`;
               }
               return timeValue || '2025-07-30 12:00';
             })(),
             departure_time: (() => {
               const connectionTime = (correspondingConnection?.layoverInfo as Record<string, unknown>)?.departure_time;
               const layoverTime = correspondingLayover?.departure_time;
               const timeValue = String(connectionTime || layoverTime || '');
               
               // Convert "10:25 AM" to "2025-07-30 10:25" format expected by ConnectionAnalysis
               if (timeValue && timeValue.includes(' ') && (timeValue.includes('AM') || timeValue.includes('PM'))) {
                 const [time, ampm] = timeValue.split(' ');
                 const [hours, minutes] = time.split(':');
                 let hour = parseInt(hours);
                 if (ampm === 'PM' && hour !== 12) hour += 12;
                 if (ampm === 'AM' && hour === 12) hour = 0;
                 const hour24 = hour.toString().padStart(2, '0');
                 return `2025-07-30 ${hour24}:${minutes}`;
               }
               return timeValue || '2025-07-30 12:00';
             })(),
            weather_risk: (() => {
              // Get weather risk from the connection's layoverInfo
              const connectionLayoverInfo = correspondingConnection?.layoverInfo as Record<string, unknown>;
              if (connectionLayoverInfo?.weather_risk) {
                const weatherRisk = connectionLayoverInfo.weather_risk as Record<string, unknown>;
                return {
                  level: String(weatherRisk.level || 'medium'),
                  description: String(weatherRisk.description || 'Weather analysis available'),
                  reasoning: undefined
                };
              }
              
              return {
                level: 'medium',
                description: 'Weather analysis not available for route search',
                reasoning: undefined
              };
            })(),
            airport_complexity: (() => {
              // Get airport complexity from the connection's layoverInfo
              const connectionLayoverInfo = correspondingConnection?.layoverInfo as Record<string, unknown>;
              if (connectionLayoverInfo?.airport_complexity) {
                const airportComplexity = connectionLayoverInfo.airport_complexity as Record<string, unknown>;
                return {
                  complexity: String(airportComplexity.complexity || 'medium'),
                  description: String(airportComplexity.description || 'Airport complexity analysis available'),
                  concerns: Array.isArray(airportComplexity.concerns) ? airportComplexity.concerns : ['Analysis available'],
                  reasoning: undefined
                };
              }
              
              return {
                complexity: 'medium',
                description: 'Airport complexity analysis not available for route search',
                concerns: ['Analysis not available'],
                reasoning: undefined
              };
            })()
          } : undefined
        } as RouteFlightData;
      });
      
      // For SerpAPI route search, use total_duration for final segment
      const totalDuration = Number(flight.total_duration || 0);
      finalSegmentTravelTime = totalDuration > 0 ? 
        `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : 
        undefined;
    }
    
    // Create the main flight object for SerpAPI route search
    const flightObject: RouteFlightData = {
      id: `route-${index}`,
      searchType: 'route',
      airline: airlineName,
      flightNumber: flightNumber,
      aircraft: (() => {
        // First try to get from main flight object
        let aircraft = flight.airplane || flight.airplane_model || flight.aircraft_type;
        
        // If not found, try to get from the first segment
        if (!aircraft && flight.flights && Array.isArray(flight.flights) && flight.flights.length > 0) {
          const firstSegment = flight.flights[0] as Record<string, unknown>;
          aircraft = firstSegment.airplane || firstSegment.airplane_model || firstSegment.aircraft_type;
          console.log(`✈️ MAIN AIRCRAFT DEBUG - Using first segment aircraft:`, aircraft);
        }
        
        const finalAircraft = String(aircraft || 'Unknown');
        console.log(`✈️ MAIN AIRCRAFT DEBUG - flight.airplane:`, flight.airplane);
        console.log(`✈️ MAIN AIRCRAFT DEBUG - final value:`, finalAircraft);
        return finalAircraft;
      })(),
      departure: {
        airport: {
          code: originCode,
          name: String(flight.origin_airport_name || `${originCity} Airport`),
          city: originCity,
          country: 'United States'
        },
        time: isSerpAPITimeFormat(originTime) && !isAlreadyFormatted(originTime) ? 
          formatSerpAPITime(originTime) : originTime
      },
      arrival: {
        airport: {
          code: destinationCode,
          name: String(flight.destination_airport_name || `${destinationCity} Airport`),
          city: destinationCity,
          country: 'United States'
        },
        time: isSerpAPITimeFormat(destinationTime) && !isAlreadyFormatted(destinationTime) ? 
          formatSerpAPITime(destinationTime) : destinationTime
      },
      duration: (() => {
        const totalMinutes = Number(flight.total_duration || 0);
        if (totalMinutes > 0) {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return `${hours}h ${minutes}m`;
        }
        return '0h 0m';
      })(),
      price: Number(flight.price || 0),
      riskScore: Number(riskAssessment?.overall_risk_score || 50),
      riskLevel: String(riskAssessment?.risk_level || 'medium') as 'low' | 'medium' | 'high',
      often_delayed_by_over_30_min: (() => {
        // Try to get from main flight object first
        if (flight.often_delayed_by_over_30_min !== undefined) {
          return Boolean(flight.often_delayed_by_over_30_min);
        }
        // If not found, check if any segment has this flag
        if (flight.flights && Array.isArray(flight.flights)) {
          for (const segment of flight.flights) {
            if ((segment as Record<string, unknown>).often_delayed_by_over_30_min) {
              console.log(`⚠️ OFTEN DELAYED - Found in segment:`, true);
              return true;
            }
          }
        }
        return false;
      })(),
      riskFactors: {
        overallRisk: String(riskAssessment?.risk_level || riskAssessment?.overall_risk),
        delayProbability: delayProbability,
        cancellationRate: cancellationRate,
        weatherRisk: (() => {
          // Try to get weather risk from origin or destination analysis
          const originAnalysis = weatherAnalysis?.origin_airport_analysis as Record<string, unknown>;
          const destinationAnalysis = weatherAnalysis?.destination_airport_analysis as Record<string, unknown>;
          
          if (originAnalysis?.weather_risk) {
            return String((originAnalysis.weather_risk as Record<string, unknown>).level || 'medium');
          } else if (destinationAnalysis?.weather_risk) {
            return String((destinationAnalysis.weather_risk as Record<string, unknown>).level || 'medium');
          }
          
          return 'medium'; // Fallback
        })(),
        airportComplexity: (() => {
          // Try to get airport complexity from origin or destination analysis
          const originAnalysis = weatherAnalysis?.origin_airport_analysis as Record<string, unknown>;
          const destinationAnalysis = weatherAnalysis?.destination_airport_analysis as Record<string, unknown>;
          
          if (originAnalysis?.airport_complexity) {
            return String((originAnalysis.airport_complexity as Record<string, unknown>).complexity || 'medium');
          } else if (destinationAnalysis?.airport_complexity) {
            return String((destinationAnalysis.airport_complexity as Record<string, unknown>).complexity || 'medium');
          }
          
          return 'medium'; // Fallback
        })(),
        connectionTime: hasConnections && layovers.length > 0 ? parseDurationToMinutes(layovers[0].duration || '0') : undefined,
        connectionType: hasConnections ? 'connecting' : 'direct',
        connectionRisk: (() => {
          // Use backend layover analysis risk assessment
          if (hasConnections && cloudConnections && cloudConnections.length > 0) {
            const firstConnection = cloudConnections[0];
            if (firstConnection?.layover_analysis?.feasibility_risk) {
              return String(firstConnection.layover_analysis.feasibility_risk) as 'low' | 'medium' | 'high';
            }
          }
          return hasConnections ? 'unknown' : 'low'; // Return 'unknown' if backend analysis failed
        })(),
        historicalDelays: parseFloat(String(riskAssessment?.historical_performance?.average_delay || '0 minutes').replace(' minutes', '')) || 0,
        seasonalFactors: extractedSeasonalFactors,
        keyRiskFactors: extractedKeyRiskFactors
      },
      connections,
      layoverInfo: hasConnections && layovers.length > 0 ? {
        airport: String(layovers[0].airport_code || layovers[0].airport || ''),
        airport_name: String(layovers[0].airport_name || `${String(layovers[0].city || extractCityFromAirportCode(String(layovers[0].airport_code || '')))} Airport`),
        city: String(layovers[0].city || extractCityFromAirportCode(String(layovers[0].airport_code || ''))),
        duration: layovers[0].layover_duration_minutes ? 
          `${Math.floor(Number(layovers[0].layover_duration_minutes) / 60)}h ${Number(layovers[0].layover_duration_minutes) % 60}m` : 
          String(layovers[0].duration || '0m'),
                 arrival_time: (() => {
           const connectionTime = (cloudConnections && cloudConnections[0]?.layoverInfo as Record<string, unknown>)?.arrival_time;
           const layoverTime = layovers[0].arrival_time;
           const timeValue = String(connectionTime || layoverTime || '');
           
           // Convert "9:36 AM" to "2025-07-30 09:36" format expected by ConnectionAnalysis
           if (timeValue && timeValue.includes(' ') && (timeValue.includes('AM') || timeValue.includes('PM'))) {
             const [time, ampm] = timeValue.split(' ');
             const [hours, minutes] = time.split(':');
             let hour = parseInt(hours);
             if (ampm === 'PM' && hour !== 12) hour += 12;
             if (ampm === 'AM' && hour === 12) hour = 0;
             const hour24 = hour.toString().padStart(2, '0');
             return `2025-07-30 ${hour24}:${minutes}`;
           }
           return timeValue || '2025-07-30 12:00';
         })(),
         departure_time: (() => {
           const connectionTime = (cloudConnections && cloudConnections[0]?.layoverInfo as Record<string, unknown>)?.departure_time;
           const layoverTime = layovers[0].departure_time;
           const timeValue = String(connectionTime || layoverTime || '');
           
           // Convert "10:25 AM" to "2025-07-30 10:25" format expected by ConnectionAnalysis
           if (timeValue && timeValue.includes(' ') && (timeValue.includes('AM') || timeValue.includes('PM'))) {
             const [time, ampm] = timeValue.split(' ');
             const [hours, minutes] = time.split(':');
             let hour = parseInt(hours);
             if (ampm === 'PM' && hour !== 12) hour += 12;
             if (ampm === 'AM' && hour === 12) hour = 0;
             const hour24 = hour.toString().padStart(2, '0');
             return `2025-07-30 ${hour24}:${minutes}`;
           }
           return timeValue || '2025-07-30 12:00';
         })(),
        weather_risk: (() => {
          // Get weather risk from the first cloud connection's layoverInfo
          const firstConnection = cloudConnections && cloudConnections.length > 0 ? cloudConnections[0] : null;
          const firstConnectionLayoverInfo = firstConnection?.layoverInfo as Record<string, unknown>;
          if (firstConnectionLayoverInfo?.weather_risk) {
            const weatherRisk = firstConnectionLayoverInfo.weather_risk as Record<string, unknown>;
            return {
              level: String(weatherRisk.level || 'medium'),
              description: String(weatherRisk.description || 'Weather analysis available'),
              reasoning: undefined
            };
          }
          
          return {
            level: 'medium',
            description: 'Weather analysis not available for route search',
            reasoning: undefined
          };
        })(),
        airport_complexity: (() => {
          // Get airport complexity from the first cloud connection's layoverInfo
          const firstConnection = cloudConnections && cloudConnections.length > 0 ? cloudConnections[0] : null;
          const firstConnectionLayoverInfo = firstConnection?.layoverInfo as Record<string, unknown>;
          if (firstConnectionLayoverInfo?.airport_complexity) {
            const airportComplexity = firstConnectionLayoverInfo.airport_complexity as Record<string, unknown>;
            return {
              complexity: String(airportComplexity.complexity || 'medium'),
              description: String(airportComplexity.description || 'Airport complexity analysis available'),
              concerns: Array.isArray(airportComplexity.concerns) ? airportComplexity.concerns : ['Analysis available'],
              reasoning: undefined
            };
          }
          
          return {
            complexity: 'medium',
            description: 'Airport complexity analysis not available for route search',
            concerns: ['Analysis not available'],
            reasoning: undefined
          };
        })()
      } : undefined,
      finalSegmentTravelTime,
      adkStatus,
      on_time_rate: Number(flight.on_time_rate || 0),
      on_time_data: flight.on_time_data as Flight['on_time_data'],
      originAnalysis: (() => {
        console.log(`🔍 ROUTE FLIGHT CONVERTER - Origin Analysis:`, flight.origin_analysis);
        return flight.origin_analysis as Flight['originAnalysis'];
      })(),
      destinationAnalysis: (() => {
        console.log(`🔍 ROUTE FLIGHT CONVERTER - Destination Analysis:`, flight.destination_analysis);
        return flight.destination_analysis as Flight['destinationAnalysis'];
      })(),
      connection_analysis: flight.connection_analysis as Flight['connection_analysis'],
      insurance_recommendation: flight.insurance_recommendation as Flight['insurance_recommendation']
    };
    
    console.log(`✅ ROUTE FLIGHT CONVERTER - Successfully converted flight ${index}:`, {
      airline: flightObject.airline,
      flightNumber: flightObject.flightNumber,
      hasConnections: Boolean(flightObject.connections),
      connectionsCount: flightObject.connections?.length || 0,
      layoverInfo: flightObject.layoverInfo
    });
    
    return flightObject;
  } catch (error) {
    console.error('❌ ROUTE FLIGHT CONVERTER - Error:', error);
    return null;
  }
};