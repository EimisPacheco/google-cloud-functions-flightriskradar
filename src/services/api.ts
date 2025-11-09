import { API_CONFIG } from '../config/constants';

export interface FlightAnalysisRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers: number;
  trip_type: 'oneWay' | 'roundTrip';
  trip_cost: number;
}

export interface RiskComponent {
  score: number;
  weight: number;
  contribution: number;
}

export interface RiskAssessment {
  overall_risk_score: number;
  overall_risk_level: string;
  route: string;
  airline: string;
  risk_components: {
    historical_performance: RiskComponent;
    weather_conditions: RiskComponent;
    airline_reliability: RiskComponent;
    seasonal_factors: RiskComponent;
    route_complexity: RiskComponent;
  };
  recommendations: string[];
  confidence_level: string;
  analysis_timestamp: string;
  key_factors: string[];
}

export interface InsuranceRecommendation {
  recommendation_tier: string;
  overall_recommendation: string;
  risk_assessment_summary: {
    risk_score: number;
    risk_level: string;
  };
  cost_estimates: {
    total_estimated_cost: number;
    cost_percentage: number;
  };
  recommendations: string[];
  analysis_timestamp: string;
}

export interface FlightAnalysisResponse {
  success: boolean;
  analysis_id: string;
  flight_request: {
    origin: string;
    destination: string;
    departure_date: string;
    return_date?: string;
    passengers: number;
    trip_type: string;
    trip_cost: number;
  };
  risk_assessment: RiskAssessment;
  insurance_recommendation: InsuranceRecommendation;
  weather_analysis: Record<string, unknown>;
  alternatives?: unknown[];
  confidence_level: string;
  analysis_timestamp: string;
  error?: string;
}

export interface HealthStatus {
  status: string;
  services: {
    orchestrator: string;
    bigquery: string;
    weather: string;
  };
  timestamp: string;
}

// SerpAPI Google Flights Response Interface
export interface SerpAPIGoogleFlightsResponse {
  search_metadata: Record<string, unknown>;
  search_parameters: Record<string, unknown>;
  best_flights: Array<Record<string, unknown>>;
  other_flights?: Array<Record<string, unknown>>;
  price_insights?: Record<string, unknown>;
  airports?: Array<Record<string, unknown>>;
}

export interface RiskAnalysisRequest {
  airline_code: string;
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  route_type: string;
  has_connections: boolean;
  connection_airports?: string[];
}

export interface RiskAnalysisResponse {
  risk_score: number;
  risk_level: string;
  risk_factors: {
    weather_risk: number;
    route_risk: number;
    airline_performance: number;
    seasonal_factors: number;
    historical_delays: number;
  };
  recommendations: {
    insurance_needed: boolean;
    coverage_type: string;
    estimated_premium: number;
    risk_mitigation: string[];
  };
  insights: {
    summary: string;
    key_risks: string[];
    weather_forecast: string;
    alternative_routes: string[];
  };
}

export interface FlightSearchRequest {
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  return_date?: string;
  passengers: number;
  cabin_class: string;
}

export interface FlightSearchResponse {
  flights: Array<{
    airline: string;
    flight_number: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    price: number;
    aircraft: string;
    stops: number;
    risk_score: number;
    risk_level: string;
  }>;
  search_metadata: {
    total_results: number;
    search_time: number;
    currency: string;
  };
}

export interface WeatherData {
  airport_code: string;
  current_conditions: {
    temperature: number;
    weather: string;
    visibility: number;
    wind_speed: number;
    precipitation: number;
  };
  forecast: Array<{
    date: string;
    conditions: string;
    temperature_high: number;
    temperature_low: number;
    precipitation_chance: number;
    wind_speed: number;
  }>;
  risk_assessment: {
    weather_risk_score: number;
    risk_factors: string[];
    recommendations: string[];
  };
}

export interface FlightDetails {
  flight_id: string;
  airline: string;
  flight_number: string;
  aircraft: string;
  departure: {
    airport: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
    gate?: string;
  };
  status: string;
  duration: string;
  distance: number;
}

export interface InsuranceQuote {
  quote_id: string;
  coverage_type: string;
  premium: number;
  coverage_amount: number;
  deductible: number;
  benefits: string[];
  exclusions: string[];
  valid_until: string;
}

export interface AirlinePerformance {
  airline_code: string;
  airline_name: string;
  on_time_performance: number;
  cancellation_rate: number;
  delay_statistics: {
    average_delay: number;
    delay_frequency: number;
    common_delay_reasons: string[];
  };
  safety_rating: number;
  customer_satisfaction: number;
}

export interface RouteAnalysis {
  route: string;
  distance: number;
  average_flight_time: string;
  popular_airlines: string[];
  seasonal_trends: {
    peak_season: string;
    off_season: string;
    price_variations: number[];
  };
  weather_patterns: {
    best_months: string[];
    worst_months: string[];
    typical_conditions: string;
  };
}

export interface HistoricalDelays {
  route: string;
  airline: string;
  delay_statistics: {
    average_delay: number;
    on_time_percentage: number;
    delay_categories: {
      weather: number;
      mechanical: number;
      air_traffic: number;
      other: number;
    };
  };
  monthly_trends: Array<{
    month: string;
    average_delay: number;
    on_time_percentage: number;
  }>;
}

// Real BigQuery Data Interfaces
export interface AirlinePerformanceData {
  code: string;
  name: string;
  total_flights: number;
  on_time_rate: number;
  avg_delay: number;
  cancellation_rate: number;
  delay_probability: number;
  delayed_departures: number;
  delayed_arrivals: number;
  cancelled_flights: number;
  diverted_flights: number;
  avg_departure_delay: number;
  avg_arrival_delay: number;
  performance_category?: string;
  delay_category?: string;
  market_share?: number;
  performance_score?: number;
}

export interface RoutePerformanceData {
  route: string;
  total_flights: number;
  avg_delay: number;
  delay_probability: number;
  cancellation_rate: number;
}

export interface AirlineTrendData {
  trend_percentage: number;
  trend_direction: 'improving' | 'declining';
  current_delay_rate: number;
  previous_delay_rate: number;
}

export interface IndustryBenchmarks {
  total_flights?: number;
  avg_on_time_rate?: number;
  avg_delay?: number;
  avg_cancellation_rate?: number;
  top_performers?: {
    on_time: string[];
    lowest_delay: string[];
    lowest_cancellation: string[];
  };
}

export interface AirlineAnalysisResponse {
  airlines: AirlinePerformanceData[];
  routes: Record<string, RoutePerformanceData[]>;
  trends: Record<string, AirlineTrendData>;
  industry_benchmarks: IndustryBenchmarks;
  analysis_date: string;
  data_period: string;
}

export interface AirportPerformanceData {
  code: string;
  name: string;
  city: string;
  type: string;
  latitude: number;
  longitude: number;
  elevation: number;
  home_link: string;
  wikipedia_link: string;
  total_departures: number;
  on_time_rate: number;
  avg_delay: number;
  cancellation_rate: number;
  delay_probability: number;
  complexity_score: number;
  delayed_departures: number;
  cancelled_departures: number;
  diverted_departures: number;
  unique_airlines: number;
  unique_destinations: number;
  avg_delay_when_delayed: number;
  total_operations?: number;
  total_arrivals?: number;
  delayed_arrivals?: number;
  cancelled_arrivals?: number;
  avg_arrival_delay?: number;
  combined_on_time_rate?: number;
  performance_category?: string;
  complexity_category?: string;
  market_share?: number;
  efficiency_score?: number;
  risk_factors?: string[];
  risk_level?: string;
}

export interface AirportAirlinePerformance {
  airline_code: string;
  total_flights: number;
  avg_delay: number;
  delay_probability: number;
  cancellation_rate: number;
}

export interface AirportDetailedMetrics {
  total_flights: number;
  delayed_departures: number;
  delayed_arrivals: number;
  cancelled_flights: number;
  diverted_flights: number;
}

export interface AirportIndustryBenchmarks {
  total_operations?: number;
  avg_on_time_rate?: number;
  avg_delay?: number;
  avg_complexity?: number;
  top_performers?: {
    on_time: string[];
    lowest_delay: string[];
    highest_complexity: string[];
  };
}

export interface AirportAnalysisResponse {
  airports: AirportPerformanceData[];
  airline_performance: Record<string, AirportAirlinePerformance[]>;
  trends: Record<string, AirlineTrendData>;
  detailed_metrics: Record<string, AirportDetailedMetrics>;
  industry_benchmarks: AirportIndustryBenchmarks;
  analysis_date: string;
  data_period: string;
}

export interface AirportStatusResponse {
  success: boolean;
  data: {
    airport_code: string;
    timestamp: string;
    airport_details?: {
      iata_code: string;
      name: string;
      municipality: string;
      type: string;
      latitude_deg: number;
      longitude_deg: number;
      elevation_ft: number;
      home_link: string;
      wikipedia_link: string;
    };
    operational_status: {
      status: string;
      message: string;
      capacity_percentage: number;
      last_update: string;
    };
    weather: {
      conditions: string;
      description: string;
      temperature: string;
      visibility: number;
      wind_speed: string;
      wind_direction: number;
      humidity: string;
      pressure: string;
      impact: {
        level: string;
        score: number;
        delay_factor: number;
        factors: string[];
      };
      last_update: string;
    };
    delays: {
      average_departure_delay: number;
      average_arrival_delay: number;
      delayed_departures: number;
      delayed_arrivals: number;
      cancellations: number;
      delay_reasons: Array<{
        reason: string;
        percentage: number;
        impact: string;
      }>;
      last_update: string;
    };
    traffic: {
      current_period: string;
      traffic_volume: string;
      scheduled_departures_next_hour: number;
      scheduled_arrivals_next_hour: number;
      active_flights: number;
      ground_traffic: string;
      last_update: string;
    };
    runway_status: {
      total_runways: number;
      active_runways: number;
      configuration: string;
      efficiency: number;
      maintenance: number;
      last_update: string;
    };
    alerts: Array<{
      type: string;
      severity: string;
      title: string;
      description: string;
      issued: string;
    }>;
    overall_status: {
      score: number;
      level: string;
      color: string;
      description: string;
      factors: string[];
    };
  };
  error?: string;
}

class FlightRiskAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.CLOUD_FUNCTION.BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        ...options.headers,
        },
        ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  private async directRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        ...options.headers,
        },
        ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${url}:`, error);
      throw error;
    }
  }

  async analyzeFlightRisk(data: RiskAnalysisRequest): Promise<RiskAnalysisResponse> {
    return this.request<RiskAnalysisResponse>(API_CONFIG.CLOUD_FUNCTION.ENDPOINTS.FLIGHT_RISK_ANALYSIS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchFlights(data: FlightSearchRequest): Promise<FlightSearchResponse> {
    return this.request<FlightSearchResponse>('/flight-search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFlightDetails(flightId: string): Promise<FlightDetails> {
    return this.request<FlightDetails>(`/flight-details/${flightId}`);
  }

  async getWeatherData(airportCode: string): Promise<WeatherData> {
    return this.request<WeatherData>(`/weather/${airportCode}`);
  }

  async getWeatherForecast(airportCode: string, days: number = 5): Promise<WeatherData> {
    return this.request<WeatherData>(`/weather/forecast?airport=${airportCode}&days=${days}`);
  }

  async getInsuranceQuote(flightData: FlightDetails, riskScore: number): Promise<InsuranceQuote> {
    return this.request<InsuranceQuote>('/insurance/quote', {
      method: 'POST',
      body: JSON.stringify({ flight_data: flightData, risk_score: riskScore }),
    });
  }

  async getAirlinePerformance(airlineCode: string): Promise<AirlinePerformance> {
    return this.request<AirlinePerformance>(`/airline-performance/${airlineCode}`);
  }

  async getRouteAnalysis(departureAirport: string, arrivalAirport: string): Promise<RouteAnalysis> {
    return this.request<RouteAnalysis>(`/route-analysis?from=${departureAirport}&to=${arrivalAirport}`);
  }

  async getHistoricalDelays(airlineCode: string, route: string): Promise<HistoricalDelays> {
    return this.request<HistoricalDelays>(`/historical-delays?airline=${airlineCode}&route=${route}`);
  }

  // Real BigQuery Data APIs
  async getAirlinePerformanceAnalysis(airlineCode?: string): Promise<AirlineAnalysisResponse> {
    const url = API_CONFIG.ANALYTICS_FUNCTION.AIRLINE_PERFORMANCE_URL || `${API_CONFIG.ANALYTICS_FUNCTION.BASE_URL}/airline-performance-analysis`;
    
    return this.directRequest<AirlineAnalysisResponse>(url, {
      method: 'POST',
      body: JSON.stringify(airlineCode ? { airline_code: airlineCode } : {}),
    });
  }

  async getAirportPerformanceAnalysis(airportCode?: string): Promise<AirportAnalysisResponse> {
    let url = API_CONFIG.ANALYTICS_FUNCTION.AIRPORT_PERFORMANCE_URL || `${API_CONFIG.ANALYTICS_FUNCTION.BASE_URL}/airport-performance-analysis`;

    // Add airport code as query parameter if provided
    if (airportCode) {
      url += `?airport_code=${encodeURIComponent(airportCode)}`;
    }

    return this.directRequest<AirportAnalysisResponse>(url, {
      method: 'GET',
    });
  }

  async getAirportSentimentAnalysis(airportCode: string, queryText?: string): Promise<any> {
    // Use Elasticsearch + Gemini powered sentiment analysis
    const url = 'https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/airport-sentiment-elasticsearch';

    return this.directRequest<any>(url, {
      method: 'POST',
      body: JSON.stringify({
        airport_code: airportCode,
        query_text: queryText || ''
      }),
    });
  }

  async getAirlineSentimentAnalysis(airlineCode: string, queryText?: string): Promise<any> {
    // Use Elasticsearch + Gemini powered sentiment analysis
    const url = 'https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/airline-sentiment-elasticsearch';

    return this.directRequest<any>(url, {
      method: 'POST',
      body: JSON.stringify({
        airline_code: airlineCode,
        query_text: queryText || ''
      }),
    });
  }

  async getAirportCurrentStatus(airportCode: string): Promise<AirportStatusResponse> {
    const url = API_CONFIG.ANALYTICS_FUNCTION.AIRPORT_PERFORMANCE_URL || `${API_CONFIG.ANALYTICS_FUNCTION.BASE_URL}/airport-performance-analysis`;
    
    return this.directRequest<AirportStatusResponse>(url, {
      method: 'POST',
      body: JSON.stringify({ 
        airport_code: airportCode,
        type: 'status'
      }),
    });
  }

  async sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendChatMessageWithIntentDetection(data: ChatRequest): Promise<ChatResponse> {
    // Send to main endpoint for AI-powered intent detection
    // Use longer timeout for complex AI processing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000); // 150 second timeout
    
    try {
      const result = await this.request<ChatResponse>('/', {
      method: 'POST',
      body: JSON.stringify({
        message: data.message,
        session_id: data.session_id,
        context: data.context
      }),
        signal: controller.signal,
    });
      
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const flightRiskAPI = new FlightRiskAPI();

// Utility functions for the frontend
export const formatRiskLevel = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'low': return 'Low Risk';
    case 'medium': return 'Medium Risk';
    case 'high': return 'High Risk';
    default: return 'Unknown Risk';
  }
};

export const getRiskColor = (level: string): string => {
  switch (level.toLowerCase()) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Chat interfaces
export interface ChatRequest {
  message: string;
  session_id?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  session_id: string;
  timestamp: string;
}

// Amadeus API interfaces
export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  price: {
    currency: string;
    total: string;
    base: string;
    fees?: Array<{
      amount: string;
      type: string;
    }>;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
  }>;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        terminal?: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      operating?: {
        carrierCode: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
}

export interface AmadeusFlightSearchResponse {
  success: boolean;
  data?: {
    data: AmadeusFlightOffer[];
  };
  offers_count: number;
  source: string;
  note?: string;
  error?: string;
  details?: unknown;
  route_found?: string;
}

// Enhanced Route Search Response Interface
export interface RouteFlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
  };
  itinerary: {
    duration: string;
    segments_count: number;
    departure: {
      airport: string;
      terminal?: string;
      time: string;
    };
    arrival: {
      airport: string;
      terminal?: string;
      time: string;
    };
  };
  airlines: string[];
  aircraft: string[];
  stops: number;
} 