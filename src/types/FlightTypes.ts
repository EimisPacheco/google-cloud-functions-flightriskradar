// Separate TypeScript interfaces for different flight data types
// This prevents conflicts between Direct Flight Lookup and Route Search

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Base interface for common flight properties
interface BaseFlightData {
  id: string;
  airline: string;
  flightNumber: string;
  aircraft: string;
  departure: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  duration: string;
  price: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  often_delayed_by_over_30_min?: boolean;
}

// Direct Flight data structure (from BigQuery/Cloud Function)
export interface DirectFlightData extends BaseFlightData {
  searchType: 'direct';
  riskFactors: {
    overallRisk?: string;
    delayProbability?: number;
    cancellationRate?: number;
    weatherRisk: string;
    airportComplexity: string;
    connectionTime?: number;
    connectionType: string;
    connectionRisk: string;
    historicalDelays: number;
    seasonalFactors: string[];
    keyRiskFactors?: string[];
  };
  // Direct flights can have connections data from BigQuery
  connections?: DirectFlightConnection[];
  originAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  destinationAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  connection_analysis?: {
    connection_details: Array<{
      connection_number: number;
      airport: string;
      city: string;
      duration: string;
      weather_risk: {
        level: string;
        description: string;
        reasoning?: string;
      };
      airport_complexity: {
        complexity: string;
        description: string;
        reasoning?: string;
        concerns: string[];
      };
    }>;
    overall_risk: string;
    total_connections: number;
  };
  insurance_recommendation?: {
    success: boolean;
    recommendation: string;
    recommendation_type: 'skip_insurance' | 'consider_insurance' | 'strongly_recommend' | 'neutral';
    risk_level: string;
    risk_score?: number;
    confidence: 'high' | 'medium' | 'low';
  };
  finalSegmentTravelTime?: string;
  adkStatus?: {
    implementation: 'real' | 'mock';
    description: string;
    framework: string;
  };
  on_time_rate?: number;
  on_time_data?: {
    airline_code: string;
    years_analyzed: number[];
    total_flights_analyzed: number;
    on_time_rate: number;
    performance_metrics: {
      cancellation_rate: number;
      diversion_rate: number;
      delay_rate: number;
      severe_delay_rate: number;
      avg_departure_delay_minutes: number;
      avg_arrival_delay_minutes: number;
    };
    delay_breakdown: {
      carrier_delay: number;
      weather_delay: number;
      nas_delay: number;
      security_delay: number;
      late_aircraft_delay: number;
    };
    data_reliability: string;
    query_timestamp: string;
  };
}

// Route Search data structure (from SerpAPI)
export interface RouteFlightData extends BaseFlightData {
  searchType: 'route';
  riskFactors: {
    overallRisk?: string;
    delayProbability?: number;
    cancellationRate?: number;
    weatherRisk: string;
    airportComplexity: string;
    connectionTime?: number;
    connectionType: string;
    connectionRisk: string;
    historicalDelays: number;
    seasonalFactors: string[];
    keyRiskFactors?: string[];
  };
  // Route search flights have SerpAPI-style connections
  connections?: RouteFlightConnection[];
  layoverInfo?: {
    airport: string;
    airport_name: string;
    city: string;
    duration: string;
    arrival_time?: string;
    departure_time?: string;
    weather_risk?: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity?: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  finalSegmentTravelTime?: string;
  on_time_rate?: number;
}

// Connection types for Direct Flights (BigQuery format)
export interface DirectFlightConnection extends BaseFlightData {
  searchType: 'direct';
  layoverInfo?: {
    airport: string;
    airport_name: string;
    city: string;
    duration: string;
    arrival_time?: string;
    departure_time?: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  connectionAnalysis?: {
    connection_number: number;
    airport: string;
    city: string;
    duration: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      connection_risk: string;
      connection_note: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  riskFactors: DirectFlightData['riskFactors'];
}

// Connection types for Route Search (SerpAPI format)
export interface RouteFlightConnection extends BaseFlightData {
  searchType: 'route';
  layoverInfo?: RouteFlightData['layoverInfo'];
  riskFactors: RouteFlightData['riskFactors'];
}

// Union type for all flight data
export type FlightData = DirectFlightData | RouteFlightData;

// Legacy Flight interface for backward compatibility
export interface Flight extends BaseFlightData {
  riskFactors: {
    overallRisk?: string;
    delayProbability?: number;
    cancellationRate?: number;
    weatherRisk: string;
    airportComplexity: string;
    connectionTime?: number;
    connectionType: string;
    connectionRisk: string;
    historicalDelays: number;
    seasonalFactors: string[];
    keyRiskFactors?: string[];
  };
  connections?: Flight[];
  layoverInfo?: {
    airport: string;
    airport_name: string;
    city: string;
    duration: string;
    arrival_time?: string;
    departure_time?: string;
    weather_risk?: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity?: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  connectionAnalysis?: {
    connection_number: number;
    airport: string;
    city: string;
    duration: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      connection_risk: string;
      connection_note: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  originAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  destinationAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  insurance_recommendation?: {
    success: boolean;
    recommendation: string;
    recommendation_type: 'skip_insurance' | 'consider_insurance' | 'strongly_recommend' | 'neutral';
    risk_level: string;
    risk_score?: number;
    confidence: 'high' | 'medium' | 'low';
  };
  finalSegmentTravelTime?: string;
  connection_analysis?: {
    connection_details: Array<{
      connection_number: number;
      airport: string;
      city: string;
      duration: string;
      weather_risk: {
        level: string;
        description: string;
        reasoning?: string;
      };
      airport_complexity: {
        complexity: string;
        description: string;
        reasoning?: string;
        concerns: string[];
      };
    }>;
    overall_risk: string;
    total_connections: number;
  };
  adkStatus?: {
    implementation: 'real' | 'mock';
    description: string;
    framework: string;
  };
  on_time_rate?: number;
  on_time_data?: {
    airline_code: string;
    years_analyzed: number[];
    total_flights_analyzed: number;
    on_time_rate: number;
    performance_metrics: {
      cancellation_rate: number;
      diversion_rate: number;
      delay_rate: number;
      severe_delay_rate: number;
      avg_departure_delay_minutes: number;
      avg_arrival_delay_minutes: number;
    };
    delay_breakdown: {
      carrier_delay: number;
      weather_delay: number;
      nas_delay: number;
      security_delay: number;
      late_aircraft_delay: number;
    };
    data_reliability: string;
    query_timestamp: string;
  };
}

// Search parameter interfaces
export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  tripType: 'oneWay' | 'roundTrip';
}

export interface DirectFlightParams {
  airline: string;
  flightNumber: string;
  date: string;
}