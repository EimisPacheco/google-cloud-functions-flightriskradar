import React, { createContext, useContext, useState, ReactNode } from 'react';
import { extractCityFromAirportCode } from '../utils/airportsData';
import { API_CONFIG } from '../config/constants';
import { convertDirectFlightData } from '../services/DirectFlightConverter';
import { convertRouteFlightData } from '../services/RouteFlightConverter';
// Import types from separate file
import { Flight, FlightData, SearchParams, DirectFlightParams } from '../types/FlightTypes';

// Cache interface for storing Cloud Function results
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface FlightCache {
  [key: string]: CacheEntry;
}

// Cache utility functions
const generateCacheKey = (params: any, searchType: 'route' | 'direct'): string => {
  if (searchType === 'direct') {
    return `direct_${params.airline}_${params.flightNumber}_${params.date}`;
  } else {
    return `route_${params.origin}_${params.destination}_${params.departureDate}_${params.returnDate || 'oneway'}_${params.passengers}`;
  }
};

const isCacheValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  return now < entry.expiresAt;
};

const getCacheExpiryTime = (): number => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to midnight
  return tomorrow.getTime();
};

const getCachedResult = (cacheKey: string): any | null => {
  try {
    const cache: FlightCache = JSON.parse(localStorage.getItem('flightRiskCache') || '{}');
    const entry = cache[cacheKey];
    
    if (entry && isCacheValid(entry)) {
      console.log('🎯 Cache HIT: Using cached result for', cacheKey);
      return entry.data;
    } else if (entry) {
      console.log('⏰ Cache EXPIRED: Removing expired cache for', cacheKey);
      delete cache[cacheKey];
      localStorage.setItem('flightRiskCache', JSON.stringify(cache));
    }
    
    console.log('❌ Cache MISS: No valid cache found for', cacheKey);
    return null;
  } catch (error) {
    console.error('❌ Cache error:', error);
    return null;
  }
};

const setCachedResult = (cacheKey: string, data: any): void => {
  try {
    const cache: FlightCache = JSON.parse(localStorage.getItem('flightRiskCache') || '{}');
    const expiresAt = getCacheExpiryTime();
    
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      expiresAt
    };
    
    localStorage.setItem('flightRiskCache', JSON.stringify(cache));
    console.log('💾 Cache SAVED: Stored result for', cacheKey, 'expires at', new Date(expiresAt).toLocaleString());
  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
};

// All interfaces moved to separate types file

interface FlightContextType {
  searchParams: SearchParams | null;
  directFlightParams: DirectFlightParams | null;
  flights: FlightData[];
  selectedFlight: FlightData | null;
  isLoading: boolean;
  searchType: 'route' | 'direct' | null;
  error: string | null;
  setSearchParams: (params: SearchParams) => void;
  searchFlights: (params: SearchParams) => void;
  searchDirectFlight: (params: DirectFlightParams) => void;
  selectFlight: (flight: FlightData) => void;
  clearError: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

// Export the hook properly for Fast Refresh compatibility
export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error('useFlightContext must be used within a FlightProvider');
  }
  return context;
};

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

// Remove frontend calculation - use backend assessment only

export const FlightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [directFlightParams, setDirectFlightParams] = useState<DirectFlightParams | null>(null);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'route' | 'direct' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug loading state changes
  React.useEffect(() => {
    console.log('🔄 LOADING STATE CHANGED:', isLoading);
  }, [isLoading]);

  const searchFlights = (params: SearchParams) => {
    console.log('🔥 SEARCHFLIGHTS FUNCTION CALLED!');
    console.log('🚀 STARTING ROUTE SEARCH - LOOKING FOR CONNECTIONS');
    console.log('🔍 SEARCH PARAMS:', params);
    
    // Validate required parameters
    if (!params.origin || !params.destination || !params.departureDate) {
      console.error('❌ MISSING REQUIRED PARAMS:', { origin: params.origin, destination: params.destination, date: params.departureDate });
      setError('Missing required search parameters');
      return;
    }
    
    // Clear any existing data and errors
    setFlights([]);
    setError(null);
    setIsLoading(true);
    setSearchType('route');
    setSearchParams(params);
    
    // Use setTimeout to ensure loading state is visible
    setTimeout(async () => {
      const startTime = Date.now();
      
      try {
        // Check cache first
        const cacheKey = generateCacheKey(params, 'route');
        const cachedResult = getCachedResult(cacheKey);
        
        if (cachedResult) {
          console.log('🎯 Using cached result for route search');
          setFlights(cachedResult.flights || []);
          setIsLoading(false);
          return;
        }
        
        console.log('📡 CALLING CLOUD FUNCTION FOR ROUTE SEARCH...');
        const response = await fetch(`${API_CONFIG.CLOUD_FUNCTION.BASE_URL}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Use LEGACY ROUTE PARAMETERS format - same as working direct API test
            origin: params.origin,
            destination: params.destination,
            date: params.departureDate, // Note: 'date' not 'departure_date' 
            trip_type: params.tripType === 'oneWay' ? 'one-way' : 'round-trip'
          }),
        });
        console.log('📡 CLOUD FUNCTION RESPONSE STATUS:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.flights || !Array.isArray(result.flights)) {
          console.log('🔍 ROUTE SEARCH - Full response structure:', result);
          throw new Error('Invalid response format: missing flights array');
        }

        // Debug: Log the complete response structure
        console.log('🔍 ROUTE SEARCH - Complete API Response:', {
          success: result.success,
          flights_count: result.flights?.length,
          weather_analysis: result.weather_analysis,
          adk_status: result.adk_status,
          first_flight_sample: result.flights?.[0]
        });

        // Process each flight using the dedicated ROUTE CONVERTER
        const processedFlights = result.flights.map((flight: Record<string, unknown>, index: number) => {
          console.log(`🔍 ROUTE SEARCH - Processing flight ${index + 1}:`, {
            airline: flight.airline,
            flightNumber: flight.flight_number,
            riskAnalysis: flight.risk_analysis,
            delayProbability: flight.risk_analysis?.delay_probability,
            cancellationProbability: flight.risk_analysis?.cancellation_probability
          });
          
          // Log weather analysis type for React console
          try {
            const travelDate = params.departureDate;
            const travelDateTime = new Date(travelDate);
            const today = new Date();
            const daysAhead = Math.ceil((travelDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysAhead > 7) {
              console.log(`🌤️ ROUTE SEARCH: Weather analysis for flight ${index + 1} - SEASONAL analysis (flight is ${daysAhead} days from today)`);
            } else {
              console.log(`🌤️ ROUTE SEARCH: Weather analysis for flight ${index + 1} - REAL-TIME SerpAPI analysis (flight is ${daysAhead} days from today)`);
            }
          } catch (e) {
            console.log(`⚠️ ROUTE SEARCH: Could not determine weather analysis type for flight ${index + 1}:`, e);
          }
          
          // Use dedicated ROUTE CONVERTER for SerpAPI data
          return convertRouteFlightData(
            flight, 
            index, 
            result.adk_status, 
            result.weather_analysis,
            result.seasonal_factors,
            result.key_risk_factors
          );
        }).filter(Boolean);

        if (processedFlights.length === 0) {
          throw new Error('Failed to process any flights');
        }

        // Sort flights by price (cheapest first)
        const sortedFlights = processedFlights.sort((a, b) => a.price - b.price);
        
        setFlights(sortedFlights);
        
        // Save to cache for future requests
        const cacheKeyForSaving = generateCacheKey(params, 'route');
        setCachedResult(cacheKeyForSaving, { flights: sortedFlights });
        
      } catch (error) {
        console.error('❌ SEARCH ERROR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search flights';
        
        // Better error message for rate limiting
        if (errorMessage.includes('No flights found') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          setError('SerpAPI rate limit exceeded. Please upgrade your SerpAPI plan or try again later. Visit https://serpapi.com/dashboard to check your usage.');
        } else {
          setError(errorMessage);
        }
        setFlights([]);
      } finally {
        // Ensure minimum loading time of 2 seconds for better UX
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000; // 2 seconds
        
        if (elapsedTime < minLoadingTime) {
          const remainingTime = minLoadingTime - elapsedTime;
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
    setIsLoading(false);
      }
    }, 0);
  };

  // Moved to DirectFlightConverter.ts

  // Moved to RouteFlightConverter.ts

  // All helper functions moved to individual converter files



  const searchDirectFlight = (params: DirectFlightParams) => {
    console.log('🚀 SETTING LOADING STATE TO TRUE (DIRECT FLIGHT)');
    setIsLoading(true);
    setError(null);
    setSearchType('direct');
    setDirectFlightParams(params);
    
    // Check cache first
    const cacheKey = generateCacheKey(params, 'direct');
    const cachedResult = getCachedResult(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Using cached result for direct flight search');
      setFlights(cachedResult.flights || []);
      setIsLoading(false);
      return;
    }
    
    // Retry mechanism for specific error
    const callCloudFunctionWithRetry = async (retryCount = 0): Promise<any> => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second base delay
      
      try {
        console.log(`🔍 DIRECT FLIGHT SEARCH ATTEMPT ${retryCount + 1}/${maxRetries + 1}:`, params);
        console.log(`📊 Retry Status: ${retryCount === 0 ? 'Initial attempt' : `Retry #${retryCount}`}`);
        
        // Call the Cloud Function directly for BigQuery + AI analysis
        const cloudFunctionData = {
        airline: params.airline,
        flight_number: params.flightNumber,
          date: params.date
      };
      
        console.log('🤖 CALLING CLOUD FUNCTION for direct flight lookup:', cloudFunctionData);
        console.log(`⏱️ Request timestamp: ${new Date().toISOString()}`);
      
        const response = await fetch(`${API_CONFIG.CLOUD_FUNCTION.BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(cloudFunctionData)
      });
      
      if (!response.ok) {
          throw new Error(`Flight lookup failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('🎯 CLOUD FUNCTION RESULT:', result);
        console.log(`✅ SUCCESS on attempt ${retryCount + 1}!`);
        
        if (result.error) {
          // Check if this is the specific error we want to retry
          if (result.error.includes("'str' object has no attribute 'get'")) {
            console.log(`⚠️ RETRYABLE ERROR DETECTED: ${result.error}`);
            console.log(`🔄 Will retry due to: 'str' object has no attribute 'get' error`);
            throw new Error(`RETRYABLE_ERROR: ${result.error}`);
          }
          throw new Error(result.error);
        }
        
        // CRITICAL FIX: Check for success: false from Cloud Function
        if (result.success === false) {
          console.log('❌ Cloud Function returned success: false');
          console.log('🔍 DEBUG - Full result:', result);
          
          // Check if there's a specific error message in the result
          if (result.error) {
            throw new Error(result.error);
          } else if (result.message) {
            throw new Error(result.message);
          } else {
            throw new Error('Flight analysis failed: Cloud Function returned success: false');
          }
        }
        
        console.log(`🎉 FINAL SUCCESS: Cloud function completed successfully on attempt ${retryCount + 1}`);
        return result;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is the specific retryable error
        if (errorMessage.includes("'str' object has no attribute 'get'") || errorMessage.includes('RETRYABLE_ERROR:')) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
            console.log(`⚠️ Retryable error detected: ${errorMessage}`);
            console.log(`🔄 Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            console.log(`⏰ Next retry at: ${new Date(Date.now() + delay).toISOString()}`);
            console.log(`📈 Exponential backoff: ${baseDelay}ms → ${delay}ms (${Math.pow(2, retryCount)}x)`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`🚀 Starting retry attempt ${retryCount + 2}...`);
            return callCloudFunctionWithRetry(retryCount + 1);
          } else {
            console.error(`❌ Max retries (${maxRetries}) reached for direct flight analysis`);
            console.log(`📊 Final retry summary:`);
            console.log(`   • Total attempts: ${maxRetries + 1}`);
            console.log(`   • All attempts failed with: 'str' object has no attribute 'get'`);
            console.log(`   • Total time spent: ~${(baseDelay * (Math.pow(2, maxRetries) - 1) / 1000).toFixed(1)}s`);
            throw new Error(`Direct flight analysis failed after ${maxRetries} retries: ${errorMessage}`);
          }
        } else {
          // Non-retryable error, throw immediately
          console.log(`❌ Non-retryable error detected: ${errorMessage}`);
          console.log(`🛑 Stopping retry attempts - this error will not be retried`);
          throw error;
        }
      }
    };
    
    // Use setTimeout to allow UI to update with loading state before heavy work
    setTimeout(async () => {
      const startTime = Date.now();
      try {
        const now = new Date().toLocaleString();
        console.log(`\n\n${'*'.repeat(60)}\n🚀🚀🚀 LOGS START [${now}] 🚀🚀🚀\nPARAMETERS:`, params, `\n${'*'.repeat(60)}\n`);
        const result = await callCloudFunctionWithRetry();
        
        console.log('🔍 DEBUG - Cloud Function Response Structure:', {
          hasConnectionAnalysis: !!result.connection_analysis,
          connectionAnalysisKeys: result.connection_analysis ? Object.keys(result.connection_analysis) : 'none',
          connectionDetails: result.connection_analysis?.connection_details,
          connectionDetailsLength: result.connection_analysis?.connection_details?.length,
          agentsUsed: result.agents_used || 'none',
          adkStatus: result.adk_status || 'none'
        });
        
        console.log('🔍 DEBUG - Weather Analysis Structure:', {
          hasWeatherAnalysis: !!result.weather_analysis,
          weatherAnalysisKeys: result.weather_analysis ? Object.keys(result.weather_analysis) : 'none',
          hasOriginWeather: !!result.weather_analysis?.origin_weather,
          hasDestinationWeather: !!result.weather_analysis?.destination_weather,
          flightDataKeys: Object.keys(result.flight_data || {}),
          hasFlightDataOriginWeather: !!result.flight_data?.origin_weather,
          hasFlightDataDestinationWeather: !!result.flight_data?.destination_weather
        });
        
        console.log('🔍 DEBUG - Risk Assessment Data:', {
          riskAssessment: result.risk_analysis,
          delayProbability: result.risk_analysis?.delay_probability,
          cancellationProbability: result.risk_analysis?.cancellation_probability,
          riskLevel: result.risk_analysis?.risk_level,
          overallRiskScore: result.risk_analysis?.overall_risk_score
        });
        
        console.log('🔍 DEBUG - Raw Risk Assessment Values:', {
          delayProbabilityType: typeof result.risk_analysis?.delay_probability,
          delayProbabilityValue: result.risk_analysis?.delay_probability,
          cancellationProbabilityType: typeof result.risk_analysis?.cancellation_probability,
          cancellationProbabilityValue: result.risk_analysis?.cancellation_probability,
          delayProbabilityIncludesFailed: result.risk_analysis?.delay_probability?.includes?.('Analysis failed'),
          cancellationProbabilityIncludesFailed: result.risk_analysis?.cancellation_probability?.includes?.('Analysis failed')
        });
        
        console.log(`🎯 DIRECT FLIGHT SEARCH COMPLETED SUCCESSFULLY!`);
        console.log(`📊 Search Summary:`);
        console.log(`   • Flight: ${params.airline} ${params.flightNumber}`);
        console.log(`   • Date: ${params.date}`);
        console.log(`   • Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`   • Retry mechanism: Active and working`);
        
        if (!result.flight_data) {
          throw new Error('Flight not found in our database');
        }
        
        // Add defensive error handling for weather data access
        try {
          console.log('🔍 DEBUG - Attempting to access weather data...');
        
        // Convert the Cloud Function response to our Flight format
        const flightData = result.flight_data;
        // AI analysis data is at the root level, not nested
        
        // Log weather analysis type for React console (direct flight)
        try {
          const travelDate = params.date;
          const travelDateTime = new Date(travelDate);
          const today = new Date();
          const daysAhead = Math.ceil((travelDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysAhead > 7) {
            console.log(`🌤️ REACT CONSOLE: Direct flight weather analysis - SEASONAL analysis (flight is ${daysAhead} days from today)`);
          } else {
            console.log(`🌤️ REACT CONSOLE: Direct flight weather analysis - REAL-TIME SerpAPI analysis (flight is ${daysAhead} days from today)`);
          }
        } catch (e) {
          console.log(`⚠️ REACT CONSOLE: Could not determine direct flight weather analysis type:`, e);
        }
        
          // ... rest of the existing code for converting flight data ...
          
          // Debug: Log the complete direct flight response structure
          console.log('🔍 DIRECT FLIGHT - Complete API Response:', {
            success: result.success,
            flight_data: result.flight_data,
            weather_analysis: result.weather_analysis,
            risk_analysis: result.risk_analysis,
            adk_status: result.adk_status
          });

          // Use dedicated DIRECT FLIGHT CONVERTER for BigQuery data
          const convertedFlight = convertDirectFlightData(
            flightData,
            0, 
            result.adk_status,
            result.weather_analysis,
            result.risk_analysis
          );
          if (convertedFlight) {
            setFlights([convertedFlight]);
            setSelectedFlight(convertedFlight);
            setSearchType('direct');
            setError(null);
            
            // Save to cache for future requests
            const cacheKeyForSaving = generateCacheKey(params, 'direct');
            setCachedResult(cacheKeyForSaving, { flights: [convertedFlight] });
          } else {
            throw new Error('Failed to convert flight data to display format');
          }
          
        } catch (weatherError) {
          console.error('❌ Weather data access error:', weatherError);
          console.log('🔍 DEBUG - Falling back to basic flight data conversion...');
          
          // Fallback: try to convert without weather data
          try {
            const flightData = result.flight_data;
            const convertedFlight = convertDirectFlightData(flightData, 0, result.adk_status);
            if (convertedFlight) {
              setFlights([convertedFlight]);
              setSelectedFlight(convertedFlight);
              setSearchType('direct');
              setError(null);
              
              // Save to cache for future requests
              const cacheKeyForSaving = generateCacheKey(params, 'direct');
              setCachedResult(cacheKeyForSaving, { flights: [convertedFlight] });
            } else {
              throw new Error('Failed to convert flight data even in fallback mode');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback conversion also failed:', fallbackError);
            setError(`Flight analysis failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
        }
        
      } catch (error) {
        console.error('❌ Direct flight search failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to search direct flight');
        setFlights([]);
      } finally {
        const endNow = new Date().toLocaleString();
        console.log(`\n${'*'.repeat(60)}\n🏁🏁🏁 LOGS ENDS [${endNow}] 🏁🏁🏁\n${'*'.repeat(60)}\n\n`);
        // Ensure minimum loading time of 2 seconds for better UX
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000; // 2 seconds
        
        if (elapsedTime < minLoadingTime) {
          const remainingTime = minLoadingTime - elapsedTime;
          console.log(`⏳ Adding ${remainingTime}ms delay to show loading screen (DIRECT FLIGHT)`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log('🏁 SETTING LOADING STATE TO FALSE (DIRECT FLIGHT)');
        setIsLoading(false);
      }
    }, 0);
  };

  const formatBigQueryTime = (timeString: string): string => {
    try {
      if (!timeString) return '00:00';
      
      // Cloud Function now returns time in HH:MM format directly (like "10:50", "15:55")
      if (timeString.includes(':') && !timeString.includes('T') && !timeString.includes(' ')) {
        // Format like "10:50" or "15:55" - already in correct format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = parseInt(minutes || '0');
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      } else if (timeString.includes('T')) {
        // Fallback for ISO format like "2025-07-16T09:00:00"
        const date = new Date(timeString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (timeString.includes(' ')) {
        // Fallback for format like "2025-07-16 09:00:00"
        const [, time] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const min = parseInt(minutes);
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      }
      return timeString;
    } catch (error) {
      console.error('❌ Error formatting BigQuery time:', error);
      return timeString;
    }
  };

  const selectFlight = (flight: FlightData) => {
    setSelectedFlight(flight);
  };

  const clearError = () => {
    setError(null);
  };



  return (
    <FlightContext.Provider
      value={{
        searchParams,
        directFlightParams,
        flights,
        selectedFlight,
        isLoading,
        searchType,
        error,
        setSearchParams,
        searchFlights,
        searchDirectFlight,
        selectFlight,
        clearError,
      }}
    >
      {children}
    </FlightContext.Provider>
  );
}; 