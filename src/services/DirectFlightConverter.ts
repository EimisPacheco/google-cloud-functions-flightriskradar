// Converter specifically for Direct Flight Lookup (BigQuery/Cloud Function data)
import { DirectFlightData, Flight } from '../types/FlightTypes';
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

// Helper function to format BigQuery time strings
const formatBigQueryTime = (timeString: string): string => {
  try {
    if (!timeString) return '00:00';
    
    // BigQuery returns time in ISO format like "2025-07-30T15:00:00"
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else if (timeString.includes(':') && !timeString.includes(' ')) {
      // Format like "15:00" - convert to 12-hour format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    return timeString;
  } catch (error) {
    console.error('❌ Error formatting BigQuery time:', error);
    return timeString;
  }
};

export const convertDirectFlightData = (
  flight: Record<string, unknown>, 
  index: number, 
  adkStatus?: Flight['adkStatus'], 
  weatherAnalysis?: Record<string, unknown>,
  riskAnalysis?: Record<string, unknown>
): DirectFlightData | null => {
  try {
    console.log(`🔍 DIRECT FLIGHT CONVERTER - Processing flight ${index}`);
    console.log(`🔍 Flight data keys:`, Object.keys(flight));
    console.log(`✈️ AIRCRAFT DEBUG - flight.airplane:`, flight.airplane);
    console.log(`✈️ AIRCRAFT DEBUG - flight.aircraft:`, flight.aircraft);
    console.log(`✈️ AIRCRAFT DEBUG - flight.airplane_model:`, flight.airplane_model);
    console.log(`⚠️ OFTEN DELAYED DEBUG - flight.often_delayed_by_over_30_min:`, flight.often_delayed_by_over_30_min);
    
    // Extract times - handle BigQuery format
    const originTime = formatBigQueryTime(String(flight.departure_time_local || flight.departure_time || ''));
    const destinationTime = formatBigQueryTime(String(flight.arrival_time_local || flight.arrival_time || ''));
    
    // Extract risk data from risk_analysis (passed separately for direct flights)
    const riskAssessment = riskAnalysis || (flight.risk_analysis as Record<string, unknown>) || {};
    const delayProbability = riskAssessment?.delay_probability ? 
      parseFloat(String(riskAssessment.delay_probability).split('%')[0]) : undefined;
    const cancellationRate = riskAssessment?.cancellation_probability ? 
      parseFloat(String(riskAssessment.cancellation_probability).split('%')[0]) : undefined;
    
    // Extract seasonal factors and key risk factors
    const extractedSeasonalFactors = Array.isArray(riskAssessment?.seasonal_factors) ? 
      riskAssessment.seasonal_factors : [];
    const extractedKeyRiskFactors = Array.isArray(riskAssessment?.key_risk_factors) ? 
      riskAssessment.key_risk_factors : [];
    
    // For direct flights, weather data is in weatherAnalysis parameter
    const originWeather = weatherAnalysis?.origin_weather as Record<string, unknown>;
    const destinationWeather = weatherAnalysis?.destination_weather as Record<string, unknown>;
    
    // Extract airport codes and cities
    const originCode = String(flight.origin_airport_code || flight.origin || originWeather?.airport_code || 'Unknown');
    const destinationCode = String(flight.destination_airport_code || flight.destination || destinationWeather?.airport_code || 'Unknown');
    const originCity = String(originWeather?.city || extractCityFromAirportCode(originCode));
    const destinationCity = String(destinationWeather?.city || extractCityFromAirportCode(destinationCode));
    const originAirportName = String(originWeather?.airport_name || `${originCity} Airport`);
    const destinationAirportName = String(destinationWeather?.airport_name || `${destinationCity} Airport`);
    
    // Extract airline and flight number
    const airlineCode = String(flight.airline_code || flight.airline || 'Unknown');
    const airlineName = String(flight.airline_name || flight.airline || 'Unknown');
    const flightNumber = String(flight.flight_number || 'Unknown');
    
    // Extract layover information from BigQuery structure
    const layovers = flight.layovers as Array<Record<string, unknown>>;
    const hasConnections = layovers && layovers.length > 0;
    
    // Extract duration from BigQuery flight_time_total (in minutes)
    const totalFlightMinutes = Number(flight.flight_time_total || 0);
    const flightDuration = totalFlightMinutes > 0 ? 
      `${Math.floor(totalFlightMinutes / 60)}h ${totalFlightMinutes % 60}m` : 
      'Unknown';
    
    // Extract final segment travel time from BigQuery
    const finalSegmentMinutes = Number(flight.final_segment_travel_time_minutes || 0);
    const finalSegmentTravelTime = finalSegmentMinutes > 0 ? 
      `${Math.floor(finalSegmentMinutes / 60)}h ${finalSegmentMinutes % 60}m` : 
      undefined;
    
    console.log('🔍 BIGQUERY MAPPING DEBUG:', {
      flight_time_total: flight.flight_time_total,
      totalFlightMinutes,
      flightDuration,
      final_segment_travel_time_minutes: flight.final_segment_travel_time_minutes,
      finalSegmentMinutes,
      finalSegmentTravelTime,
      layovers: layovers,
      hasConnections
    });
    
    const formattedFlight: DirectFlightData = {
      id: `direct-${index}-${Date.now()}`,
      searchType: 'direct',
      airline: airlineName,
      flightNumber: flightNumber,
      aircraft: String(flight.airplane || flight.aircraft || flight.airplane_model || flight.aircraft_type || 'Unknown'),
      departure: {
        airport: {
          code: originCode,
          name: originAirportName,
          city: originCity,
          country: 'United States'
        },
        time: originTime
      },
      arrival: {
        airport: {
          code: destinationCode,
          name: destinationAirportName,
          city: destinationCity,
          country: 'United States'
        },
        time: destinationTime
      },
      duration: flightDuration,
      price: Number(flight.price_usd || flight.price || 0),
      riskScore: Number(riskAssessment?.overall_risk_score || 50),
      riskLevel: String(riskAssessment?.risk_level || 'medium') as 'low' | 'medium' | 'high',
      often_delayed_by_over_30_min: Boolean(flight.often_delayed_by_over_30_min),
      riskFactors: {
        overallRisk: String(riskAssessment?.risk_level || riskAssessment?.overall_risk),
        delayProbability: delayProbability,
        cancellationRate: cancellationRate,
        weatherRisk: String(originWeather?.flight_risk_assessment ? 
          (originWeather.flight_risk_assessment as Record<string, unknown>)?.overall_risk_level : 'medium'),
        airportComplexity: String(
          (((weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
          (((weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
          'medium'
        ),
        connectionTime: hasConnections && layovers.length > 0 ? Number(layovers[0].layover_duration_minutes || 0) : undefined,
        connectionType: hasConnections ? 'connecting' : 'direct',
        connectionRisk: (() => {
          // Use backend layover analysis assessment
          if (hasConnections && flight.connections && Array.isArray(flight.connections) && flight.connections.length > 0) {
            const firstConnection = flight.connections[0] as Record<string, unknown>;
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
      // Handle connections for extension flights vs direct flights
      connections: (() => {
        // For extension flights (source: google_flights_extension) OR BigQuery flights with connections, use the connections array from cloud function
        if (flight.connections && Array.isArray(flight.connections) && flight.connections.length > 0) {
          const flightConnections = flight.connections as Array<Record<string, unknown>>;
          console.log('🔧 EXTENSION FIX: Processing connections from cloud function:', flightConnections.length);
          
          const allSegments = [];
          
          // Create segments for each connection (intermediate stops)
          flightConnections.forEach((conn, connIndex) => {
            // Handle both BigQuery format (airport) and extension format (airport_code)
            const connectionAirport = String(conn.airport_code || conn.airport || 'Unknown');
            const connectionCity = String(conn.city || extractCityFromAirportCode(connectionAirport));
            
            // CRITICAL FIX: Use travel_time for segment duration, not layover duration
            // conn.travel_time = time to fly TO this airport (e.g., SJC->OAK = 120 minutes)
            // conn.duration = layover time AT this airport (e.g., at OAK = 45 minutes)
            const segmentTravelTime = String(conn.travel_time || '0'); // Travel time to this airport
            const layoverDuration = String(conn.duration || '0'); // Layover time at this airport
            
            // Extract layover weather data from cloud function response
            const layoverWeatherRisk = (conn.layoverInfo as Record<string, unknown>)?.weather_risk as Record<string, unknown>;
            const layoverAirportComplexity = (conn.layoverInfo as Record<string, unknown>)?.airport_complexity as Record<string, unknown>;
            
            const segment = {
              id: `extension-connection-${index}-${connIndex}`,
              airline: airlineName,
              flightNumber: `${flightNumber}-${connIndex + 1}`,
              aircraft: String(flight.airplane || flight.airplane_model || flight.aircraft_type || 'Unknown'),
              departure: {
                airport: {
                  code: connIndex === 0 ? originCode : String(flightConnections[connIndex - 1]?.airport_code || 'Unknown'),
                  name: connIndex === 0 ? originAirportName : `${String(flightConnections[connIndex - 1]?.city || 'Unknown')} Airport`,
                  city: connIndex === 0 ? originCity : String(flightConnections[connIndex - 1]?.city || 'Unknown'),
                  country: 'United States'
                },
                time: String(conn.arrival_time || '')
              },
              arrival: {
                airport: {
                  code: connectionAirport,
                  name: String(conn.airport_name || `${connectionCity} Airport`),
                  city: connectionCity,
                  country: 'United States'
                },
                time: String(conn.departure_time || '')
              },
              duration: (() => {
                // Convert travel time minutes to "Xh Ym" format
                const travelMinutes = Number(segmentTravelTime);
                if (travelMinutes > 0) {
                  const hours = Math.floor(travelMinutes / 60);
                  const mins = travelMinutes % 60;
                  if (hours > 0 && mins > 0) {
                    return `${hours}h ${mins}m`;
                  } else if (hours > 0) {
                    return `${hours}h`;
                  } else {
                    return `${mins}m`;
                  }
                }
                return '0m';
              })(),
              price: Number(flight.price || 0),
              riskScore: Number(layoverWeatherRisk?.risk_score || riskAssessment?.overall_risk_score || 50),
              riskLevel: String(layoverWeatherRisk?.level || riskAssessment?.risk_level || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
              riskFactors: {
                overallRisk: String(layoverWeatherRisk?.level || riskAssessment?.risk_level || 'medium'),
                delayProbability: delayProbability,
                cancellationRate: cancellationRate,
                weatherRisk: String(layoverWeatherRisk?.level || 'medium'),
                airportComplexity: String(layoverAirportComplexity?.complexity || 'medium'),
                connectionTime: Number(layoverDuration) || 0,
                connectionType: 'connecting',
                connectionRisk: (() => {
                  // Use backend layover analysis assessment
                  if (conn.layover_analysis?.feasibility_risk) {
                    return String(conn.layover_analysis.feasibility_risk) as 'low' | 'medium' | 'high';
                  }
                  return 'unknown'; // Return 'unknown' if backend analysis failed
                })(),
                historicalDelays: 0,
                seasonalFactors: extractedSeasonalFactors,
                keyRiskFactors: extractedKeyRiskFactors
              },
              layoverInfo: {
                airport: connectionAirport,
                airport_name: String(conn.airport_name || `${connectionCity} Airport`),
                city: connectionCity,
                duration: (() => {
                  // Format layover duration
                  const layoverMinutes = Number(layoverDuration);
                  if (layoverMinutes > 0) {
                    const hours = Math.floor(layoverMinutes / 60);
                    const mins = layoverMinutes % 60;
                    if (hours > 0 && mins > 0) {
                      return `${hours}h ${mins}m`;
                    } else if (hours > 0) {
                      return `${hours}h`;
                    } else {
                      return `${mins}m`;
                    }
                  }
                  return '0m';
                })(),
                arrival_time: String(conn.arrival_time || ''),
                departure_time: String(conn.departure_time || ''),
                weather_risk: {
                  level: String(layoverWeatherRisk?.level || 'medium'),
                  description: String(layoverWeatherRisk?.description || 'Weather data unavailable'),
                  reasoning: undefined
                },
                airport_complexity: {
                  complexity: String(layoverAirportComplexity?.complexity || 'medium'),
                  description: String(layoverAirportComplexity?.description || 'Airport complexity data unavailable'),
                  concerns: Array.isArray(layoverAirportComplexity?.concerns) ? layoverAirportComplexity.concerns : ['Data unavailable'],
                  reasoning: undefined
                }
              }
            } as DirectFlightData;
            
            allSegments.push(segment);
          });
          
          // Add the final segment (from last layover to destination)
          if (flight.final_segment_travel_time_minutes) {
            const finalTravelMinutes = Number(flight.final_segment_travel_time_minutes);
            const lastConnection = flightConnections[flightConnections.length - 1];
            
            const finalSegment = {
              id: `extension-final-segment-${index}`,
              airline: airlineName,
              flightNumber: `${flightNumber}-final`,
              aircraft: String(flight.airplane || flight.airplane_model || flight.aircraft_type || 'Unknown'),
              departure: {
                airport: {
                  code: String(lastConnection.airport_code || lastConnection.airport || destinationCode),
                  name: String(lastConnection.airport_name || `${String(lastConnection.city || 'Unknown')} Airport`),
                  city: String(lastConnection.city || 'Unknown'),
                  country: 'United States'
                },
                time: String(lastConnection.departure_time || '')
              },
              arrival: {
                airport: {
                  code: destinationCode,
                  name: destinationAirportName,
                  city: destinationCity,
                  country: 'United States'
                },
                time: String(flight.arrival_time_local || '')
              },
              duration: (() => {
                // Convert final segment travel time to "Xh Ym" format
                if (finalTravelMinutes > 0) {
                  const hours = Math.floor(finalTravelMinutes / 60);
                  const mins = finalTravelMinutes % 60;
                  if (hours > 0 && mins > 0) {
                    return `${hours}h ${mins}m`;
                  } else if (hours > 0) {
                    return `${hours}h`;
                  } else {
                    return `${mins}m`;
                  }
                }
                return '0m';
              })(),
              price: Number(flight.price || 0),
              riskScore: Number(riskAssessment?.overall_risk_score || 50),
              riskLevel: String(riskAssessment?.risk_level || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
              riskFactors: {
                overallRisk: String(riskAssessment?.risk_level || 'medium'),
                delayProbability: delayProbability,
                cancellationRate: cancellationRate,
                weatherRisk: 'medium',
                airportComplexity: 'medium',
                connectionTime: 0, // No layover at final destination
                connectionType: 'connecting',
                connectionRisk: 'low',
                historicalDelays: 0,
                seasonalFactors: extractedSeasonalFactors,
                keyRiskFactors: extractedKeyRiskFactors
              },
              layoverInfo: undefined // No layover at final destination
            } as DirectFlightData;
            
            allSegments.push(finalSegment);
          }
          
          return allSegments;
        }
        
        // For BigQuery direct flights, don't use connections array
        return undefined;
      })(),
      // Add layover information - different handling for extension vs BigQuery flights
      layoverInfo: (() => {
        // For extension flights OR BigQuery flights with connections, use the first connection's layover info
        if (flight.connections && Array.isArray(flight.connections) && flight.connections.length > 0) {
          const firstConn = (flight.connections as Array<Record<string, unknown>>)[0];
          if (!firstConn) return undefined;
          
          const layoverWeatherRisk = (firstConn.layoverInfo as Record<string, unknown>)?.weather_risk as Record<string, unknown>;
          const layoverAirportComplexity = (firstConn.layoverInfo as Record<string, unknown>)?.airport_complexity as Record<string, unknown>;
          
          return {
            airport: String(firstConn.airport_code || firstConn.airport || ''),
            airport_name: String(firstConn.airport_name || `${String(firstConn.city || 'Unknown')} Airport`),
            city: String(firstConn.city || 'Unknown'),
            duration: (() => {
              // Format layover duration properly
              const layoverMinutes = Number(firstConn.duration || 0);
              if (layoverMinutes > 0) {
                const hours = Math.floor(layoverMinutes / 60);
                const mins = layoverMinutes % 60;
                if (hours > 0 && mins > 0) {
                  return `${hours}h ${mins}m`;
                } else if (hours > 0) {
                  return `${hours}h`;
                } else {
                  return `${mins}m`;
                }
              }
              return '0m';
            })(),
            arrival_time: String(firstConn.arrival_time || ''),
            departure_time: String(firstConn.departure_time || ''),
            weather_risk: {
              level: String(layoverWeatherRisk?.level || 'medium'),
              description: String(layoverWeatherRisk?.description || 'Weather data unavailable'),
              reasoning: undefined
            },
            airport_complexity: {
              complexity: String(layoverAirportComplexity?.complexity || 'medium'),
              description: String(layoverAirportComplexity?.description || 'Airport complexity data unavailable'),
              concerns: Array.isArray(layoverAirportComplexity?.concerns) ? layoverAirportComplexity.concerns : ['Data unavailable'],
              reasoning: undefined
            }
          };
        }
        
        // For BigQuery flights, use the original BigQuery structure
        if (hasConnections && layovers.length > 0) {
          return {
            airport: String(layovers[0].airport_code || ''),
            airport_name: String(layovers[0].airport_name || `${String(layovers[0].city || 'Unknown')} Airport`),
            city: String(layovers[0].city || 'Unknown'),
            duration: layovers[0].layover_duration_minutes ? 
              (() => {
                const totalMinutes = Number(layovers[0].layover_duration_minutes);
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                
                if (totalMinutes >= 60) {
                  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                } else {
                  return `${totalMinutes}m`;
                }
              })() : 
              '0m',
            arrival_time: formatBigQueryTime(String(layovers[0].arrival_time || '')),
            departure_time: formatBigQueryTime(String(layovers[0].departure_time || '')),
            weather_risk: {
              level: 'medium',
              description: 'Weather analysis from Cloud Function',
              reasoning: undefined
            },
            airport_complexity: {
              complexity: 'medium',
              description: 'Airport complexity analysis from Cloud Function',
              concerns: ['Connection analysis available'],
              reasoning: undefined
            }
          };
        }
        
        return undefined;
      })(),
      // Add enhanced connection analysis from Cloud Function
      connection_analysis: flight.connection_analysis as Flight['connection_analysis'],
      // Add origin and destination analysis from Cloud Function
      originAnalysis: (() => {
        const originAnalysis = flight.origin_analysis || (weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis;
        console.log(`🔍 DIRECT FLIGHT CONVERTER - Origin Analysis:`, {
          flight_origin_analysis: flight.origin_analysis,
          weather_origin_airport_analysis: (weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis,
          final_originAnalysis: originAnalysis
        });
        return originAnalysis as Flight['originAnalysis'];
      })(),
      destinationAnalysis: (() => {
        const destinationAnalysis = flight.destination_analysis || (weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis;
        console.log(`🔍 DIRECT FLIGHT CONVERTER - Destination Analysis:`, {
          flight_destination_analysis: flight.destination_analysis,
          weather_destination_airport_analysis: (weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis,
          final_destinationAnalysis: destinationAnalysis
        });
        return destinationAnalysis as Flight['destinationAnalysis'];
      })(),
      // Add AI-generated insurance recommendation
      insurance_recommendation: flight.insurance_recommendation as Flight['insurance_recommendation'],
      finalSegmentTravelTime: finalSegmentTravelTime || String(flight.final_segment_travel_time || ''),
      adkStatus: adkStatus,
      // Add On-Time Rate from Cloud Function
      on_time_rate: flight.on_time_rate as number | undefined,
      on_time_data: flight.on_time_data as Flight['on_time_data']
    };

    console.log(`✅ DIRECT FLIGHT CONVERTER - Successfully converted flight ${index}`);
    return formattedFlight;
    
  } catch (error) {
    console.error('❌ DIRECT FLIGHT CONVERTER - Error:', error);
    return null;
  }
};