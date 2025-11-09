"""
Risk Assessment Agent - Google ADK Implementation
Flight risk assessment using Google ADK and Gemini AI with real historical data
"""
import json
from datetime import datetime, timedelta
import google.generativeai as genai
from bigquery_tool import get_flight_historical_data

class RiskAssessmentAgent:
    """
    Google ADK Risk Assessment Agent for flight risk analysis
    """
    
    def __init__(self):
        self.name = "risk_assessment_agent"
        self.description = "Flight risk assessment using Google ADK and Gemini AI"
        
        # Simple cache for consistency (cache for 10 minutes)
        self.analysis_cache = {}
        self.cache_ttl = 600  # 10 minutes in seconds
        
        # Initialize Gemini model with deterministic settings
        try:
            generation_config = genai.types.GenerationConfig(
                temperature=0.1,  # Low temperature for more deterministic responses
                top_p=0.8,
                top_k=10,
                max_output_tokens=1024,
            )
            self.model = genai.GenerativeModel('gemini-2.0-flash', generation_config=generation_config)
            print("⚠️ Google ADK Risk Assessment Agent initialized with Gemini 2.0 Flash (deterministic settings)")
        except Exception as e:
            print(f"❌ Risk Assessment Agent: Gemini init failed: {e}")
            self.model = None
    
    def assess_flight_risk(self, flight_data, weather_analysis):
        """Assess overall flight risk based on weather and airport complexity"""
        print("⚠️ Risk Assessment Agent: Assessing flight risk")
        
        try:
            # Extract key risk factors
            origin_weather_risk = weather_analysis.get('origin_airport_analysis', {}).get('weather_risk', {}).get('risk_level', 'medium')
            destination_weather_risk = weather_analysis.get('destination_airport_analysis', {}).get('weather_risk', {}).get('risk_level', 'medium')
            origin_complexity = weather_analysis.get('origin_airport_analysis', {}).get('airport_complexity', {}).get('complexity', 'medium')
            destination_complexity = weather_analysis.get('destination_airport_analysis', {}).get('airport_complexity', {}).get('complexity', 'medium')
            
            # Convert risk levels to scores
            risk_scores = {
                'very_low': 0,
                'low': 1,
                'medium': 2,
                'high': 3,
                'very_high': 4
            }
            
            # Calculate weighted risk scores
            weather_score = (risk_scores.get(origin_weather_risk, 2) + risk_scores.get(destination_weather_risk, 2)) / 2
            complexity_score = (risk_scores.get(origin_complexity, 2) + risk_scores.get(destination_complexity, 2)) / 2
            
            # Weather has higher weight (60%) than airport complexity (40%)
            total_score = (weather_score * 0.6) + (complexity_score * 0.4)
            
            # Determine overall risk level
            if total_score <= 1:
                risk_level = 'low'
            elif total_score <= 2:
                risk_level = 'medium'
            else:
                risk_level = 'high'
            
            # Calculate numeric risk score (0-100)
            risk_score = min(int((total_score / 4) * 100), 100)
            
            # Generate AI-powered risk factors - NO FALLBACKS
            risk_factors = []
            recommendations = []
            
            try:
                if hasattr(self, 'model') and self.model:
                    risk_factors = self._ai_generate_risk_factors(flight_data, weather_analysis, risk_level)
                    recommendations = self._ai_generate_recommendations(flight_data, weather_analysis, risk_level)
                else:
                    print("❌ Risk Assessment Agent: Gemini model not available")
                    return {
                        'error': 'AI risk analysis model not available',
                        'overall_risk_level': risk_level,
                        'risk_score': risk_score,
                        'delay_probability': 'Analysis unavailable',
                        'cancellation_probability': 'Analysis unavailable',
                        'key_risk_factors': ['❌ AI risk analysis model not available'],
                        'recommendations': ['❌ AI recommendations not available'],
                        'explanation': 'Risk assessment requires AI model initialization'
                    }
            except Exception as e:
                print(f"❌ Risk Assessment Agent: AI factor generation failed: {e}")
                return {
                    'error': f'AI risk analysis failed: {str(e)}',
                    'overall_risk_level': risk_level,
                    'risk_score': risk_score,
                    'delay_probability': 'Analysis failed',
                    'cancellation_probability': 'Analysis failed',
                    'key_risk_factors': [f'❌ AI risk analysis failed: {str(e)}'],
                    'recommendations': [f'❌ AI recommendations failed: {str(e)}'],
                    'explanation': 'Risk assessment system encountered an error'
                }

            # Calculate probabilities based on risk level
            delay_prob = {
                'low': '10-20%',
                'medium': '25-40%',
                'high': '45-60%'
            }
            
            cancel_prob = {
                'low': '2-5%',
                'medium': '5-10%',
                'high': '10-20%'
            }
            
            return {
                'overall_risk_level': risk_level,
                'risk_score': risk_score,
                'delay_probability': delay_prob.get(risk_level, '25-40%'),
                'cancellation_probability': cancel_prob.get(risk_level, '5-10%'),
                'key_risk_factors': risk_factors[:4],  # Limit to top 4 factors
                'recommendations': recommendations,
                'explanation': f"Risk assessment based on weather conditions and airport complexity at both origin and destination airports. Weather conditions weighted at 60%, airport complexity at 40%."
            }
            
        except Exception as e:
            print(f"❌ Risk Assessment Agent: Assessment failed - {str(e)}")
            return {
                'error': f"Risk assessment failed: {str(e)}",
                'overall_risk_level': 'unknown',
                'risk_score': 0,
                'delay_probability': 'Analysis failed',
                'cancellation_probability': 'Analysis failed',
                'key_risk_factors': [f'❌ Risk assessment system error: {str(e)}'],
                'recommendations': [f'❌ System error - contact support'],
                'explanation': f'Risk assessment system error: {str(e)}'
            }
    
    def generate_flight_risk_analysis(self, flight_data, weather_analysis, parameters):
        """Generate comprehensive flight risk analysis using DETERMINISTIC ALGORITHM with AI explanation"""
        print("⚠️ Risk Assessment Agent: Analyzing flight risk with DETERMINISTIC algorithm")
        
        # Create cache key for consistency
        import time
        cache_key = f"{flight_data.get('airline_code', '')}_{flight_data.get('flight_number', '')}_{parameters.get('date', '')}"
        current_time = time.time()
        
        # Check cache first
        if cache_key in self.analysis_cache:
            cached_data, timestamp = self.analysis_cache[cache_key]
            if current_time - timestamp < self.cache_ttl:
                print(f"⚡ Risk Assessment Agent: Using cached analysis for {cache_key}")
                return cached_data
        
        try:
            # Extract flight details
            origin = flight_data.get('origin_airport_code', 'Unknown')
            destination = flight_data.get('destination_airport_code', 'Unknown')
            airline = flight_data.get('airline_name', 'Unknown')
            airline_code = flight_data.get('airline_code', 'Unknown')
            flight_number = flight_data.get('flight_number', 'Unknown')
            
            # ROUTE-BASED HISTORICAL ANALYSIS: Using airline + origin + destination only
            print(f"📊 Risk Assessment Agent: Fetching historical data for {airline_code} {origin} -> {destination}")
            
            # DETERMINE ANALYSIS TYPE: Check if this is route analysis or direct flight lookup
            # Route analysis comes from SerpAPI with multiple flights, direct flight comes from BigQuery with specific flight number
            is_route_analysis = flight_data.get('data_source') == 'SerpAPI'
            
            if is_route_analysis:
                # ROUTE ANALYSIS: Use get_route_historical_data for airline + route aggregation
                print(f"📊 Risk Assessment Agent: ROUTE ANALYSIS detected - using route-based historical data")
                from bigquery_tool import get_route_historical_data
                
                # Get route historical data (aggregated by airline + route)
                route_historical_data = get_route_historical_data(origin, destination)
                
                # Find the specific airline data from the route results
                historical_data = {'error': 'No data found'}
                if 'airlines' in route_historical_data and route_historical_data['airlines']:
                    for airline_data in route_historical_data['airlines']:
                        if airline_data['airline'] == airline_code:
                            # Convert route data format to match expected format
                            historical_data = {
                                'historical_summary': {
                                    'total_flights': airline_data['total_flights'],
                                    'data_reliability': 'high' if airline_data['total_flights'] >= 100 else 'medium' if airline_data['total_flights'] >= 50 else 'low'
                                },
                                'cancellation_metrics': {
                                    'cancellation_rate': airline_data['cancellation_rate'],
                                    'total_cancellations': int(airline_data['total_flights'] * airline_data['cancellation_rate'] / 100)
                                },
                                'delay_metrics': {
                                    'avg_departure_delay_minutes': airline_data['avg_departure_delay'],
                                    'avg_arrival_delay_minutes': airline_data['avg_arrival_delay'],
                                    'on_time_performance': airline_data['on_time_performance']
                                }
                            }
                            print(f"✅ Risk Assessment Agent: Found route historical data for {airline_code}: {airline_data['total_flights']} flights, {airline_data['cancellation_rate']}% cancellation")
                            break
                    else:
                        print(f"⚠️ Risk Assessment Agent: No route data found for airline {airline_code} on route {origin}->{destination}")
                else:
                    print(f"⚠️ Risk Assessment Agent: No route historical data available for {origin}->{destination}")
            else:
                # DIRECT FLIGHT LOOKUP: Use get_flight_historical_data for specific flight number
                print(f"📊 Risk Assessment Agent: DIRECT FLIGHT LOOKUP detected - using flight-specific historical data")
                from bigquery_tool import get_flight_historical_data
                
                # Get historical data for this specific flight
                historical_data = get_flight_historical_data(
                    airline_code, 
                    flight_number,  # Used for direct flight lookup
                    origin, 
                    destination
                )
            
            # Get weather risk information
            origin_weather_risk = weather_analysis.get('origin_weather', {}).get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
            destination_weather_risk = weather_analysis.get('destination_weather', {}).get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
            
            # Get airport analysis information
            origin_airport_analysis = weather_analysis.get('origin_airport_analysis', {})
            destination_airport_analysis = weather_analysis.get('destination_airport_analysis', {})
            
            # ===== DETERMINISTIC ALGORITHM START =====
            print("🔢 Risk Assessment Agent: Calculating DETERMINISTIC risk score from real data")
            
            # Initialize base score
            risk_score = 0
            
            # 1. HISTORICAL PERFORMANCE (50% weight)
            if 'error' not in historical_data and historical_data.get('historical_summary', {}).get('total_flights', 0) > 0:
                cancellation_rate = historical_data['cancellation_metrics']['cancellation_rate']
                avg_delay = historical_data['delay_metrics']['avg_departure_delay_minutes']
                on_time_performance = historical_data['delay_metrics']['on_time_performance']
                total_flights = historical_data['historical_summary']['total_flights']
                
                # Cancellation risk component (0-25 points)
                cancellation_score = min(cancellation_rate * 12.5, 25)  # 2% cancellation = 25 points
                
                # Delay risk component (0-25 points)  
                delay_score = min(avg_delay / 2.4, 25)  # 60min avg delay = 25 points
                
                historical_score = cancellation_score + delay_score
                print(f"📊 Historical score: {historical_score:.1f} (cancel: {cancellation_score:.1f}, delay: {delay_score:.1f})")
                historical_available = True
            else:
                historical_score = 25  # Default medium risk if no data
                cancellation_rate = None
                avg_delay = None
                on_time_performance = None
                total_flights = 0
                historical_available = False
                print(f"⚠️ No historical data - using default score: {historical_score}")
                print("🚨🚨🚨 NO HISTORICAL DATA FOUND - USING FALLBACK PROBABILITIES 🚨🚨🚨")
                print("🚨🚨🚨 THIS MEANS THE ALGORITHM IS USING ESTIMATED RANGES INSTEAD OF REAL DATA 🚨🚨🚨")
            
            risk_score += historical_score * 0.5  # 50% weight
            
            # 2. WEATHER CONDITIONS (30% weight)
            weather_risk_map = {'low': 5, 'medium': 15, 'high': 25, 'very_high': 30}
            origin_weather_score = weather_risk_map.get(origin_weather_risk, 15)
            dest_weather_score = weather_risk_map.get(destination_weather_risk, 15)
            weather_score = (origin_weather_score + dest_weather_score) / 2
            
            risk_score += weather_score * 0.3  # 30% weight
            print(f"🌤️ Weather score: {weather_score:.1f} (origin: {origin_weather_score}, dest: {dest_weather_score})")
            
            # 3. AIRPORT COMPLEXITY (20% weight)
            complexity_risk_map = {'low': 3, 'medium': 10, 'high': 20}
            origin_complexity = origin_airport_analysis.get('airport_complexity', {}).get('complexity', 'medium')
            dest_complexity = destination_airport_analysis.get('airport_complexity', {}).get('complexity', 'medium')
            origin_complexity_score = complexity_risk_map.get(origin_complexity, 10)
            dest_complexity_score = complexity_risk_map.get(dest_complexity, 10)
            complexity_score = (origin_complexity_score + dest_complexity_score) / 2
            
            risk_score += complexity_score * 0.2  # 20% weight
            print(f"🏢 Airport complexity score: {complexity_score:.1f} (origin: {origin_complexity_score}, dest: {dest_complexity_score})")
            
            # 4. CONNECTION/LAYOVER ANALYSIS (NEW - 15% weight)
            connections = flight_data.get('connections', [])
            num_connections = len(connections)
            connection_score = 0
            
            # DEBUG: Log what we're receiving
            print(f"🔍 DEBUG: Risk Assessment - flight_data keys: {list(flight_data.keys())}")
            print(f"🔍 DEBUG: Risk Assessment - connections data: {connections}")
            print(f"🔍 DEBUG: Risk Assessment - num_connections: {num_connections}")
            
            if num_connections == 0:
                # Direct flight = lowest risk
                connection_score = 0
                print(f"✈️ Direct flight: 0 connection penalty")
            else:
                print(f"🔗 Analyzing {num_connections} connection(s)")
                
                # Base penalty for having connections
                base_connection_penalty = num_connections * 20  # INCREASED: 20 points per connection (was 15)
                
                # Analyze each connection
                connection_penalties = []
                layover_complexity_penalties = []
                layover_weather_penalties = []
                
                for i, connection in enumerate(connections):
                    connection_penalty = 0
                    
                    # DEBUG: Log connection structure
                    print(f"🔍 DEBUG: Connection {i+1} type: {type(connection)}")
                    print(f"🔍 DEBUG: Connection {i+1} keys: {list(connection.keys()) if isinstance(connection, dict) else 'Not a dict'}")
                    print(f"🔍 DEBUG: Connection {i+1} layoverInfo: {connection.get('layoverInfo', 'Not found')}")
                    
                    # 1. ENHANCED: Airport-specific duration penalties
                    duration_str = connection.get('duration', '60m')
                    duration_minutes = self._parse_duration_to_minutes(duration_str)
                    
                    # FIXED: Get airport code from layoverInfo structure with proper type checking
                    layover_info = connection.get('layoverInfo', {})
                    if isinstance(layover_info, dict):
                        layover_airport = connection.get('airport', layover_info.get('airport', 'Unknown'))
                    else:
                        layover_airport = connection.get('airport', 'Unknown')
                    
                    # Airport-specific thresholds (same as layover_analysis_agent.py)
                    major_international_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'NRT', 'ICN']
                    large_hubs = ['IAH', 'DEN', 'CLT', 'MIA', 'LAS', 'SEA', 'SFO', 'BOS', 'IAD', 'MSP', 'DTW', 'PHL']
                    
                    if layover_airport in major_international_hubs:
                        tight_threshold = 90
                        reasonable_threshold = 240
                    elif layover_airport in large_hubs:
                        tight_threshold = 75
                        reasonable_threshold = 180
                    else:
                        tight_threshold = 60
                        reasonable_threshold = 120
                    
                    # Airport-specific duration penalties based on thresholds
                    if duration_minutes < tight_threshold * 0.5:  # Less than half the tight threshold
                        base_duration_penalty = 50  # Ultra-tight connection
                    elif duration_minutes < tight_threshold:  # Below tight threshold
                        base_duration_penalty = 35  # Tight connection
                    elif duration_minutes < tight_threshold * 1.5:  # 1.5x tight threshold
                        base_duration_penalty = 20  # Moderate connection
                    elif duration_minutes < reasonable_threshold:  # Below reasonable threshold
                        base_duration_penalty = 8   # Standard connection
                    elif duration_minutes > reasonable_threshold * 2:  # More than 2x reasonable threshold
                        base_duration_penalty = 3   # Very long layovers have minimal risk
                    else:
                        base_duration_penalty = 1   # Comfortable connection
                    
                    # ENHANCED: Apply airport-specific multipliers to duration penalties (but reduced since we already have airport-specific base penalties)
                    if layover_airport in major_international_hubs:
                        duration_multiplier = 1.2  # Reduced multiplier since base penalties are already airport-specific
                    elif layover_airport in large_hubs:
                        duration_multiplier = 1.1  # Slight multiplier for large hubs
                    else:
                        duration_multiplier = 1.0  # Standard penalty for regular airports
                    
                    duration_penalty = base_duration_penalty * duration_multiplier
                    print(f"🔗 DURATION PENALTY: {base_duration_penalty} × {duration_multiplier}x = {duration_penalty:.1f} for {layover_airport} ({duration_minutes}min vs {tight_threshold}min/{reasonable_threshold}min thresholds)")
                    
                    connection_penalty += duration_penalty
                    
                    # 2. ENHANCED Layover airport complexity penalty with multipliers
                    
                    # FIXED: Read nested airport_complexity structure
                    airport_complexity_obj = connection.get('airport_complexity', {})
                    if isinstance(airport_complexity_obj, dict):
                        layover_complexity = airport_complexity_obj.get('complexity', 'medium')
                    else:
                        layover_complexity = airport_complexity_obj or 'medium'
                    
                    # ENHANCED: Apply complexity multipliers for major hubs
                    base_complexity_penalty = complexity_risk_map.get(layover_complexity, 10)
                    
                    # Major hub multiplier (2.0x for highest complexity airports)
                    major_hubs = ['ATL', 'ORD', 'LAX', 'JFK', 'IAH', 'LAS', 'DFW', 'DEN', 'CLT', 'MIA']
                    if layover_airport in major_hubs:
                        complexity_multiplier = 2.0
                        print(f"🚨 MAJOR HUB DETECTED: {layover_airport} - applying 2.0x complexity multiplier")
                    elif layover_complexity == 'high':
                        complexity_multiplier = 1.5
                        print(f"⚠️ HIGH COMPLEXITY: {layover_airport} - applying 1.5x complexity multiplier")
                    else:
                        complexity_multiplier = 1.0
                    
                    complexity_penalty = base_complexity_penalty * complexity_multiplier
                    layover_complexity_penalties.append(complexity_penalty)
                    connection_penalty += complexity_penalty
                    
                    # 3. ENHANCED: Airport-specific missed connection penalties using consistent thresholds
                    missed_connection_penalty = 0
                    
                    # Use the same thresholds as layover classification for consistency
                    recommended_minimum = tight_threshold  # Use the tight threshold as recommended minimum
                    
                    if layover_airport in major_international_hubs:
                        penalty_multiplier = 2.5  # Higher penalty for major hubs
                    elif layover_airport in large_hubs:
                        penalty_multiplier = 2.0  # High penalty for large hubs
                    else:
                        penalty_multiplier = 1.5  # Lower penalty for standard airports
                    
                    if duration_minutes < recommended_minimum:
                        minutes_short = recommended_minimum - duration_minutes
                        missed_connection_penalty = minutes_short * penalty_multiplier
                        print(f"🚨 MISSED CONNECTION RISK: {layover_airport} layover {duration_minutes}m is {minutes_short}m shorter than recommended {recommended_minimum}m")
                        print(f"🚨 PENALTY MULTIPLIER: {penalty_multiplier}x for {layover_airport} complexity")
                    
                    connection_penalty += missed_connection_penalty
                    
                    # 4. Layover airport weather penalty
                    # FIXED: Read nested weather_risk structure
                    weather_risk_obj = connection.get('weather_risk', {})
                    if isinstance(weather_risk_obj, dict):
                        layover_weather_risk = weather_risk_obj.get('level', 'medium')
                    else:
                        layover_weather_risk = weather_risk_obj or 'medium'
                    weather_penalty = weather_risk_map.get(layover_weather_risk, 15)
                    layover_weather_penalties.append(weather_penalty)
                    connection_penalty += weather_penalty
                    
                    connection_penalties.append(connection_penalty)
                    
                    print(f"  🔗 Connection {i+1} at {layover_airport}: {duration_minutes}min layover")
                    print(f"    Duration penalty: {duration_penalty}, Complexity: {complexity_penalty:.1f} (base: {base_complexity_penalty} × {complexity_multiplier}x)")
                    print(f"    Missed connection penalty: {missed_connection_penalty}, Weather: {weather_penalty}")
                    print(f"    Total connection penalty: {connection_penalty}")
                
                # Calculate total connection score
                total_connection_penalty = base_connection_penalty + sum(connection_penalties)
                # REMOVED: Cap at 30 points - this was preventing proper risk assessment
                connection_score = total_connection_penalty
                
                avg_layover_complexity = sum(layover_complexity_penalties) / len(layover_complexity_penalties) if layover_complexity_penalties else 0
                avg_layover_weather = sum(layover_weather_penalties) / len(layover_weather_penalties) if layover_weather_penalties else 0
                
                print(f"🔗 Connection analysis: {num_connections} connections, total penalty: {connection_score:.1f}")
                print(f"🔗 Average layover complexity: {avg_layover_complexity:.1f}, weather: {avg_layover_weather:.1f}")
            
            # INCREASED: Connection weight from 25% to 30% for better risk assessment
            risk_score += connection_score * 0.30  # Increased from 25% to 30%
            
            # NEW: Add seasonal analysis
            seasonal_score = self._calculate_seasonal_risk_score(parameters.get('date', ''))
            risk_score += seasonal_score * 0.05  # 5% weight for seasonal factors
            
            # Adjust weights for other factors to accommodate increased connections and seasonal (total still 100%)
            # New weights: Historical 30%, Weather 20%, Airport 15%, Connections 30%, Seasonal 5%
            # We need to recalculate with new weights
            risk_score = 0  # Reset and recalculate with proper weights
            
            # Recalculate with adjusted weights - EQUAL WEIGHTS for Historical and Connections
            risk_score += historical_score * 0.30  # EQUAL: 30% weight for historical performance
            risk_score += weather_score * 0.20     # Kept at 20%
            risk_score += complexity_score * 0.15  # Kept at 15%
            risk_score += connection_score * 0.30  # EQUAL: 30% weight for connections
            risk_score += seasonal_score * 0.05    # NEW: 5% weight for seasonal factors
            
            print(f"📊 WEIGHTED SCORES: Historical: {historical_score * 0.30:.1f}, Weather: {weather_score * 0.20:.1f}, Complexity: {complexity_score * 0.15:.1f}, Connections: {connection_score * 0.30:.1f}, Seasonal: {seasonal_score * 0.05:.1f}")
            
            # Cap at 100
            risk_score = min(risk_score, 100)
            
            # CRITICAL SAFETY CHECK: Override for tight connections with high delay probability
            override_to_high_risk = False
            tight_connection_with_high_delays = False
            
            # Check for tight connections with dangerous delay probabilities
            if num_connections > 0:
                for i, connection in enumerate(connections):
                    duration_str = connection.get('duration', '60m')
                    duration_minutes = self._parse_duration_to_minutes(duration_str)
                    
                    # Get layover airport
                    layover_info = connection.get('layoverInfo', {})
                    if isinstance(layover_info, dict):
                        layover_airport = connection.get('airport', layover_info.get('airport', 'Unknown'))
                    else:
                        layover_airport = connection.get('airport', 'Unknown')
                    
                    # Airport-specific tight thresholds
                    major_international_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'NRT', 'ICN']
                    large_hubs = ['IAH', 'DEN', 'CLT', 'MIA', 'LAS', 'SEA', 'SFO', 'BOS', 'IAD', 'MSP', 'DTW', 'PHL']
                    
                    if layover_airport in major_international_hubs:
                        tight_threshold = 90
                    elif layover_airport in large_hubs:
                        tight_threshold = 75
                    else:
                        tight_threshold = 60
                    
                    # Check if this is a tight connection
                    is_tight_connection = duration_minutes < tight_threshold
                    
                    if is_tight_connection:
                        tight_connection_with_high_delays = True
                        print(f"🚨 TIGHT CONNECTION DETECTED: {duration_minutes}min at {layover_airport} (threshold: {tight_threshold}min)")
                        break
            
            # Calculate delay probability to check for dangerous combinations
            delay_probability_numeric = 0
            if historical_available:
                base_delay_prob = max(100 - on_time_performance, 5)
                weather_modifier = (weather_score - 10) / 20
                complexity_modifier = (complexity_score - 6.5) / 13.5
                connection_modifier = (connection_score - 7.5) / 15
                total_modifier = 1 + weather_modifier + complexity_modifier + connection_modifier
                delay_probability_numeric = base_delay_prob * total_modifier
            
            # CRITICAL OVERRIDE: Tight connection + high delay probability = HIGH RISK
            if tight_connection_with_high_delays and delay_probability_numeric > 100:
                override_to_high_risk = True
                risk_level = 'high'
                risk_score = max(risk_score, 75)  # Ensure score reflects high risk
                print(f"🚨 CRITICAL OVERRIDE: Tight connection with {delay_probability_numeric:.0f}% delay probability → HIGH RISK")
            elif tight_connection_with_high_delays and delay_probability_numeric > 80:
                # Even 80%+ delay with tight connection should be high risk
                override_to_high_risk = True
                risk_level = 'high'
                risk_score = max(risk_score, 70)
                print(f"⚠️ SAFETY OVERRIDE: Tight connection with {delay_probability_numeric:.0f}% delay probability → HIGH RISK")
            else:
                # Normal risk level calculation
                if risk_score <= 25:
                    risk_level = 'low'
                elif risk_score <= 55:
                    risk_level = 'medium'
                else:
                    risk_level = 'high'
            
            # Calculate probability ranges based on historical data + modifiers
            if historical_available:
                # Use real historical data as baseline
                base_delay_prob = max(100 - on_time_performance, 5)  # Convert on-time % to delay %
                base_cancel_prob = cancellation_rate
                
                # Apply weather/complexity/connection modifiers
                weather_modifier = (weather_score - 10) / 20  # -0.5 to +1.0 modifier
                complexity_modifier = (complexity_score - 6.5) / 13.5  # -0.5 to +1.0 modifier
                connection_modifier = (connection_score - 7.5) / 15  # -0.5 to +1.5 modifier (connections have bigger impact)
                
                total_modifier = 1 + weather_modifier + complexity_modifier + connection_modifier
                adjusted_delay_prob = base_delay_prob * total_modifier
                adjusted_cancel_prob = base_cancel_prob * total_modifier
                
                # Format as ranges
                delay_min = max(int(adjusted_delay_prob * 0.8), 1)
                delay_max = int(adjusted_delay_prob * 1.2)
                cancel_min = max(round(adjusted_cancel_prob * 0.8, 1), 0.1)
                cancel_max = round(adjusted_cancel_prob * 1.2, 1)
                
                delay_probability = f"{delay_min}-{delay_max}%"
                cancellation_probability = f"{cancel_min}-{cancel_max}%"
                
                print(f"📈 Calculated probabilities from historical data: delay {delay_probability}, cancel {cancellation_probability}")
                print(f"🔗 Modifiers applied: weather: {weather_modifier:.2f}, complexity: {complexity_modifier:.2f}, connections: {connection_modifier:.2f}")
            else:
                # Fallback probability ranges
                delay_probs = {'low': '5-15%', 'medium': '20-35%', 'high': '40-60%'}
                cancel_probs = {'low': '0.5-2%', 'medium': '2-6%', 'high': '6-12%'}
                delay_probability = delay_probs[risk_level]
                cancellation_probability = cancel_probs[risk_level]
                print(f"📊 Using fallback probabilities: delay {delay_probability}, cancel {cancellation_probability}")
                print("🚨🚨🚨 FALLBACK PROBABILITIES USED - NO HISTORICAL DATA AVAILABLE 🚨🚨🚨")
                print(f"🚨🚨🚨 DELAY: {delay_probability}, CANCELLATION: {cancellation_probability} 🚨🚨🚨")
            
            print(f"🎯 FINAL DETERMINISTIC SCORE: {risk_score:.1f}/100 ({risk_level} risk)")
            # ===== DETERMINISTIC ALGORITHM END =====
            
            # Now use AI only for EXPLANATION and FACTORS (not score calculation)
            explanation_prompt = f"""
            You are explaining the results of a deterministic flight risk algorithm. The algorithm has already calculated:
            - Risk Score: {risk_score:.1f}/100
            - Risk Level: {risk_level}
            - Delay Probability: {delay_probability}
            - Cancellation Probability: {cancellation_probability}
            
            FLIGHT: {airline} {flight_number} ({origin} → {destination})
            
            ALGORITHM INPUTS USED:
            Historical Data: {f'{total_flights} flights, {cancellation_rate}% cancellation, {avg_delay}min avg delay' if historical_available else 'No historical data'}
            Weather: Origin {origin_weather_risk}, Destination {destination_weather_risk}
            Airport Complexity: Origin {origin_complexity}, Destination {dest_complexity}
            Connections: {f'{num_connections} layover(s)' if num_connections > 0 else 'Direct flight'}
            {'SAFETY OVERRIDE APPLIED: Tight connection with extremely high delay probability automatically classified as HIGH RISK' if override_to_high_risk else ''}
            
            Provide ONLY these outputs:
            1. key_risk_factors: Array of 3-4 specific factors that explain the calculated score
            2. recommendations: Array of 3-4 actionable travel recommendations  
            3. explanation: Brief explanation of how the algorithm reached this score {'(including safety override for dangerous tight connection)' if override_to_high_risk else ''}
            
            Do NOT suggest different scores. Explain the given deterministic results.
            
            Respond with valid JSON only:
            {{
                "key_risk_factors": ["factor1", "factor2", "factor3"],
                "recommendations": ["rec1", "rec2", "rec3"],
                "explanation": "explanation text"
            }}
            """
            
            # Get AI explanation (NOT score calculation)
            if self.model:
                try:
                    response = self.model.generate_content(explanation_prompt)
                    ai_explanation = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
                    key_risk_factors = ai_explanation.get('key_risk_factors', [])
                    recommendations = ai_explanation.get('recommendations', [])
                    explanation = ai_explanation.get('explanation', '')
                except:
                    key_risk_factors = [f"Historical performance analysis", f"Weather conditions assessment", f"Airport operational complexity"]
                    recommendations = [f"Monitor weather updates", f"Consider travel insurance", f"Arrive early at airport"]
                    explanation = f"Risk calculated using deterministic algorithm based on historical data and current conditions"
            else:
                key_risk_factors = [f"Algorithm-based risk assessment", f"Historical data analysis", f"Weather and complexity factors"]
                recommendations = [f"Review calculated risk factors", f"Plan accordingly for {risk_level} risk", f"Monitor flight status"]
                explanation = f"Deterministic risk score of {risk_score:.1f} calculated from historical performance and current conditions"
            
            # Build final analysis with DETERMINISTIC scores
            risk_analysis = {
                'overall_risk_score': int(risk_score),
                'risk_level': risk_level,
                'delay_probability': delay_probability,
                'cancellation_probability': cancellation_probability,
                'key_risk_factors': key_risk_factors[:4],
                'recommendations': recommendations[:4],
                'explanation': explanation,
                'seasonal_factors': getattr(self, 'seasonal_analysis', {}).get('seasonal_factors', []) + 
                                   getattr(self, 'seasonal_analysis', {}).get('holiday_factors', [])
            }
            
            # Add REAL historical metrics
            if historical_available:
                risk_analysis['historical_performance'] = {
                    'total_flights_analyzed': total_flights,
                    'cancellation_rate': f"{cancellation_rate}%",
                    'average_delay': f"{avg_delay} minutes",
                    'on_time_performance': f"{on_time_performance}%",
                    'data_source': 'BigQuery Historical Data (2016-2018)',
                    'data_reliability': historical_data['historical_summary']['data_reliability']
                }
                print(f"📊 Added real historical metrics - {total_flights} flights, {cancellation_rate}% cancellation rate")
            else:
                risk_analysis['historical_performance'] = {
                    'total_flights_analyzed': 0,
                    'cancellation_rate': 'No historical data',
                    'average_delay': 'No historical data', 
                    'on_time_performance': 'No historical data',
                    'data_source': 'No historical data available',
                    'data_reliability': 'unavailable'
                }
                print("🚨🚨🚨 HISTORICAL PERFORMANCE: NO DATA AVAILABLE - USING FALLBACK 🚨🚨🚨")
            
            # Cache the result
            self.analysis_cache[cache_key] = (risk_analysis, current_time)
            print(f"✅ Risk Assessment Agent: DETERMINISTIC analysis complete - Score: {risk_score:.1f}")
            return risk_analysis
            
        except Exception as e:
            print(f"❌ Risk Assessment Agent: DETERMINISTIC analysis failed - {str(e)}")
            fallback_analysis = self._get_fallback_risk_analysis(flight_data, weather_analysis)
            fallback_analysis['historical_performance'] = {
                'total_flights_analyzed': 0,
                'cancellation_rate': 'Analysis failed',
                'average_delay': 'Analysis failed',
                'on_time_performance': 'Analysis failed',
                'data_source': 'Analysis failed',
                'data_reliability': 'unavailable'
            }
            return fallback_analysis

    def generate_route_risk_analysis(self, flight_data, weather_analysis, parameters):
        """Generate route risk analysis using Gemini AI"""
        print("⚠️ Risk Assessment Agent: Analyzing route risk")
        
        try:
            if self.model:
                # Create route analysis prompt
                prompt = self._create_route_analysis_prompt(flight_data, weather_analysis, parameters)
                
                # Use Gemini AI for analysis
                response = self.model.generate_content(prompt)
                analysis_text = response.text
                
                # Parse structured response
                risk_analysis = self._parse_gemini_response(analysis_text)
            else:
                # Fallback analysis
                risk_analysis = self._generate_fallback_analysis(flight_data, weather_analysis)
            
            print("✅ Risk Assessment Agent: Route risk analysis complete")
            return risk_analysis
            
        except Exception as e:
            print(f"❌ Risk Assessment Agent: Route analysis failed - {str(e)}")
            return self._generate_fallback_analysis(flight_data, weather_analysis)
    
    def _create_flight_analysis_prompt(self, flight_data, weather_analysis, parameters):
        """Create Gemini prompt for flight analysis"""
        # Extract origin and destination from flight data
        origin = flight_data.get('origin_airport_code') or flight_data.get('origin', 'UNK')
        destination = flight_data.get('destination_airport_code') or flight_data.get('destination', 'UNK')
        
        # Extract date from parameters or flight data
        date = parameters.get('date') or flight_data.get('date', 'Unknown')
        
        # Extract airline information
        airline = flight_data.get('airline_code') or flight_data.get('airline', 'UNK')
        flight_number = flight_data.get('flight_number', 'UNK')
        aircraft = flight_data.get('airplane_model') or flight_data.get('aircraft_type') or flight_data.get('aircraft', 'Unknown')
        
        return f"""
        You are a flight risk assessment expert using Google ADK. Analyze the following flight data.

        FLIGHT DATA:
        - Airline: {airline}
        - Flight: {flight_number}
        - Route: {origin} → {destination}
        - Date: {date}
        - Aircraft: {aircraft}
        - Historical Delay: {flight_data.get('delay_minutes', 0)} minutes
        - Cancelled: {flight_data.get('cancelled', False)}
        - Diverted: {flight_data.get('diverted', False)}

        WEATHER ANALYSIS:
        """ + (json.dumps(weather_analysis, indent=2) if weather_analysis else "No detailed weather data available") + """

        RISK SCORE GUIDELINES:
        - Low Risk (0-20): < 5% chance of issues
        - Medium Risk (21-60): 5-20% chance of issues  
        - High Risk (61-100): > 20% chance of issues

        Respond with JSON:
        {{
            "overall_risk_score": <number 0-100>,
            "risk_level": "<low/medium/high>",
            "delay_probability": "<percentage>",
            "cancellation_probability": "<percentage>",
            "key_risk_factors": ["factor1", "factor2"],
            "recommendations": ["rec1", "rec2"],
            "explanation": "Risk assessment explanation"
        }}
        """
    
    def _create_route_analysis_prompt(self, flight_data, weather_analysis, parameters):
        """Create Gemini prompt for route analysis"""
        origin = flight_data.get('origin') or flight_data.get('origin_airport_code', 'UNK')
        destination = flight_data.get('destination') or flight_data.get('destination_airport_code', 'UNK')
        date = parameters.get('date') or flight_data.get('date', 'Unknown')
        airline = flight_data.get('airline_name') or flight_data.get('airline', 'Unknown')
        
        # ENHANCED: Build detailed connections information
        connections_info = ""
        connections = flight_data.get('connections', [])
        if connections:
            connections_info = f"Flight Type: {len(connections)}-stop flight with connections"
            for i, conn in enumerate(connections):
                airport = conn.get('airport', 'Unknown')
                airport_name = conn.get('airport_name', 'Unknown Airport')
                city = conn.get('city', 'Unknown City')
                duration = conn.get('duration', 'Unknown')
                
                # Calculate connection risk
                if 'h' in duration and 'm' in duration:
                    parts = duration.replace('h', ':').replace('m', '').split(':')
                    total_minutes = int(parts[0]) * 60 + int(parts[1]) if len(parts) > 1 else int(parts[0]) * 60
                elif 'h' in duration:
                    total_minutes = int(duration.replace('h', '')) * 60
                elif 'm' in duration:
                    total_minutes = int(duration.replace('m', ''))
                else:
                    total_minutes = 60
                
                connection_risk = "HIGH RISK" if total_minutes < 60 else "MODERATE RISK" if total_minutes < 90 else "LOW RISK"
                
                connections_info += f"\n  - Connection {i+1}: {airport} ({city}) - {duration} layover - {connection_risk}"
                
                # Add layover weather and complexity if available
                if weather_analysis:
                    layover_weather = weather_analysis.get('layover_weather_analysis', {}).get(airport, {})
                    if layover_weather and layover_weather.get('weather_risk'):
                        weather_risk = layover_weather['weather_risk']
                        connections_info += f"\n    Weather: {weather_risk.get('risk_level', 'medium')} - {weather_risk.get('description', 'No description')}"
                    
                    layover_complexity = weather_analysis.get('layover_complexity_analysis', {}).get(airport, {})
                    if layover_complexity and layover_complexity.get('complexity'):
                        complexity = layover_complexity['complexity']
                        connections_info += f"\n    Airport Complexity: {complexity.get('complexity', 'medium')} - {complexity.get('description', 'No description')}"
        else:
            connections_info = "Flight Type: Direct flight (no connections)"
        
        # ENHANCED: Build detailed weather summary
        weather_summary = ""
        if weather_analysis:
            weather_summary = "DETAILED WEATHER ANALYSIS:\n"
            
            # Origin weather
            origin_weather = weather_analysis.get('origin_airport_analysis', {})
            if origin_weather:
                weather_summary += f"Origin Airport ({origin}):\n"
                weather_risk = origin_weather.get('weather_risk', {})
                if weather_risk:
                    weather_summary += f"  - Weather Risk: {weather_risk.get('risk_level', 'medium')}\n"
                    weather_summary += f"  - Conditions: {weather_risk.get('description', 'No description')}\n"
                    if weather_risk.get('temperature'):
                        weather_summary += f"  - Temperature: {weather_risk['temperature']}\n"
                    if weather_risk.get('wind_speed'):
                        weather_summary += f"  - Wind: {weather_risk['wind_speed']}\n"
                
                airport_complexity = origin_weather.get('airport_complexity', {})
                if airport_complexity:
                    weather_summary += f"  - Airport Complexity: {airport_complexity.get('complexity', 'medium')}\n"
                    weather_summary += f"  - Complexity Factors: {airport_complexity.get('description', 'No description')}\n"
            
            # Destination weather
            dest_weather = weather_analysis.get('destination_airport_analysis', {})
            if dest_weather:
                weather_summary += f"Destination Airport ({destination}):\n"
                weather_risk = dest_weather.get('weather_risk', {})
                if weather_risk:
                    weather_summary += f"  - Weather Risk: {weather_risk.get('risk_level', 'medium')}\n"
                    weather_summary += f"  - Conditions: {weather_risk.get('description', 'No description')}\n"
                    if weather_risk.get('temperature'):
                        weather_summary += f"  - Temperature: {weather_risk['temperature']}\n"
                    if weather_risk.get('wind_speed'):
                        weather_summary += f"  - Wind: {weather_risk['wind_speed']}\n"
                
                airport_complexity = dest_weather.get('airport_complexity', {})
                if airport_complexity:
                    weather_summary += f"  - Airport Complexity: {airport_complexity.get('complexity', 'medium')}\n"
                    weather_summary += f"  - Complexity Factors: {airport_complexity.get('description', 'No description')}\n"
        
        # ENHANCED: Build seasonal factors
        seasonal_factors = flight_data.get('seasonal_factors', [])
        seasonal_info = ""
        if seasonal_factors:
            seasonal_info = f"SEASONAL FACTORS:\n"
            for i, factor in enumerate(seasonal_factors):
                seasonal_info += f"  - Factor {i+1}: {factor}\n"
        
        return f"""
        You are a flight risk assessment expert using Google ADK. Analyze the following comprehensive route data.

        ROUTE DATA:
        - Airline: {airline}
        - Route: {origin} → {destination}
        - Date: {date}
        - {connections_info}

        {weather_summary}

        {seasonal_info}

        COMPLETE WEATHER ANALYSIS DATA:
        """ + (json.dumps(weather_analysis, indent=2) if weather_analysis else "No detailed weather data available") + """

        ANALYSIS REQUIREMENTS:
        1. Consider ALL specific factors: connection times, weather at each airport, airport complexity, seasonal factors
        2. Assess the impact of each connection's duration and risk level
        3. Evaluate weather conditions at origin, destination, and all layover airports
        4. Consider airport complexity factors that could cause delays
        5. Factor in seasonal patterns that affect this specific date
        6. Provide specific risk factors based on the actual data provided

        RISK SCORE GUIDELINES:
        - Low Risk (0-30): < 10% chance of significant issues
        - Medium Risk (31-70): 10-30% chance of issues  
        - High Risk (71-100): > 30% chance of issues

        Respond with JSON:
        {{
            "overall_risk_score": <number 0-100>,
            "risk_level": "<low/medium/high>",
            "delay_probability": "<percentage>",
            "cancellation_probability": "<percentage>",
            "key_risk_factors": ["specific factor 1", "specific factor 2", "specific factor 3"],
            "recommendations": ["specific recommendation 1", "specific recommendation 2"],
            "explanation": "Detailed risk assessment explanation referencing specific data points"
        }}
        """
    
    def _parse_gemini_response(self, analysis_text):
        """Parse Gemini response into structured format"""
        try:
            # Clean up response text
            if analysis_text.startswith('```json'):
                analysis_text = analysis_text.replace('```json', '').replace('```', '').strip()
            elif analysis_text.startswith('```'):
                analysis_text = analysis_text.replace('```', '').strip()
            
            # Parse JSON
            risk_analysis = json.loads(analysis_text)
            
            # Validate required fields
            required_fields = ['overall_risk_score', 'risk_level', 'key_risk_factors', 'recommendations']
            for field in required_fields:
                if field not in risk_analysis:
                    raise ValueError(f"Missing required field: {field}")
            
            return risk_analysis
            
        except Exception as e:
            print(f"❌ Risk Assessment Agent: Failed to parse Gemini response: {e}")
            return self._generate_fallback_analysis(flight_data, weather_analysis)

    def _parse_gemini_risk_response(self, response_text, flight_data, weather_analysis):
        """Parse Gemini response and ensure correct format"""
        try:
            # Try to extract structured data from the response
            # Look for patterns in the response text
            
            # Default values that match UI expectations
            risk_analysis = {
                "overall_risk_score": 50,
                "risk_level": "medium", 
                "delay_probability": "25-35%",
                "cancellation_probability": "3-8%",
                "key_risk_factors": ["Weather conditions", "Connection complexity"],
                "recommendations": ["Monitor flight status", "Allow extra time", "Consider insurance"],
                "explanation": "Moderate risk assessment based on available data"
            }
            
            # Parse risk level from response
            response_lower = response_text.lower()
            if "high risk" in response_lower or "high overall" in response_lower:
                risk_analysis["risk_level"] = "high"
                risk_analysis["overall_risk_score"] = 75
                risk_analysis["delay_probability"] = "45-65%"
                risk_analysis["cancellation_probability"] = "8-15%"
            elif "low risk" in response_lower or "low overall" in response_lower:
                risk_analysis["risk_level"] = "low"
                risk_analysis["overall_risk_score"] = 25
                risk_analysis["delay_probability"] = "10-20%"
                risk_analysis["cancellation_probability"] = "1-3%"
            
            # Generate AI-based risk factors instead of hardcoded content
            origin_weather = weather_analysis.get('origin_weather', {})
            destination_weather = weather_analysis.get('destination_weather', {})
            
            # Use AI to generate specific risk factors instead of hardcoded logic
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel('gemini-2.0-flash')
                
                # Get flight details for context
                origin_code = flight_data.get('origin_airport_code', 'origin')
                dest_code = flight_data.get('destination_airport_code', 'destination')
                airline = flight_data.get('airline', 'Unknown')
                flight_num = flight_data.get('flight_number', 'Unknown')
                
                # Get weather risk levels
                origin_risk = origin_weather.get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
                dest_risk = destination_weather.get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
            
                # Get connection details
                connections = flight_data.get('connections', [])
                num_stops = flight_data.get('number_of_stops', 0)
                
                # Generate AI-based risk factors
                risk_factors_prompt = f"""
                Generate 3-4 specific flight risk factors for this flight:
                Flight: {airline} {flight_num}
                Route: {origin_code} → {dest_code}
                Origin weather risk: {origin_risk}
                Destination weather risk: {dest_risk}
                Number of stops: {num_stops}
                
                Create specific, actionable risk factors based on:
                - Actual weather conditions at both airports
                - Airport operational complexity
                - Connection timing if applicable
                - Airline-specific factors
                
                Format each as a brief, specific sentence under 80 characters.
                Avoid generic phrases. Be specific to this route and conditions.
                Return 3-4 factors, one per line.
                """
                
                response = model.generate_content(risk_factors_prompt)
                ai_factors = response.text.strip().split('\n')
                
                # Process AI-generated factors
                risk_factors = []
                for factor in ai_factors:
                    factor = factor.strip()
                    if factor and len(factor) < 100 and not factor.startswith('*') and not factor.startswith('-'):
                        risk_factors.append(factor)
                
                # Ensure we have at least 2 factors
                if len(risk_factors) < 2:
                    risk_factors.extend([
                        f"❌ AI risk analysis incomplete for {origin_code} → {dest_code}",
                        f"Weather/operational analysis system error"
                    ])
                    
            except Exception as e:
                print(f"❌ AI risk factor generation failed: {e}")
                risk_factors = [
                    f"❌ AI risk analysis failed for {origin_code} → {dest_code}",
                    f"Flight risk assessment system error: {str(e)}",
                    "AI-powered risk analysis unavailable"
                ]
            
            if risk_factors:
                risk_analysis["key_risk_factors"] = risk_factors[:4]  # Limit to 4 factors
            
            return risk_analysis
            
        except Exception as e:
            print(f"❌ Error parsing Gemini response: {e}")
            return self._get_fallback_risk_analysis(flight_data, weather_analysis)

    def _get_fallback_risk_analysis(self, flight_data, weather_analysis):
        """Provide DETERMINISTIC fallback risk analysis when main algorithm fails"""
        print("🔢 Risk Assessment Agent: Using DETERMINISTIC fallback algorithm")
        
        # Get risk factors from weather and airport analysis
        origin_risk = weather_analysis.get('origin_weather', {}).get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
        dest_risk = weather_analysis.get('destination_weather', {}).get('flight_risk_assessment', {}).get('overall_risk_level', 'medium')
        
        origin_airport_analysis = weather_analysis.get('origin_airport_analysis', {})
        dest_airport_analysis = weather_analysis.get('destination_airport_analysis', {})
        origin_complexity = origin_airport_analysis.get('airport_complexity', {}).get('complexity', 'medium')
        dest_complexity = dest_airport_analysis.get('airport_complexity', {}).get('complexity', 'medium')
        
        # DETERMINISTIC FALLBACK CALCULATION
        risk_score = 0
        
        # 1. No historical data penalty (30 points)
        risk_score += 30
        print(f"📊 No historical data penalty: +30 points")
        
        # 2. Weather conditions (30% weight = 30 points max)
        weather_risk_map = {'low': 5, 'medium': 15, 'high': 25, 'very_high': 30}
        origin_weather_score = weather_risk_map.get(origin_risk, 15)
        dest_weather_score = weather_risk_map.get(dest_risk, 15)
        weather_score = (origin_weather_score + dest_weather_score) / 2
        risk_score += weather_score
        print(f"🌤️ Weather score: +{weather_score:.1f} points")
        
        # 3. Airport complexity (20% weight = 20 points max)
        complexity_risk_map = {'low': 3, 'medium': 10, 'high': 20}
        origin_complexity_score = complexity_risk_map.get(origin_complexity, 10)
        dest_complexity_score = complexity_risk_map.get(dest_complexity, 10)
        complexity_score = (origin_complexity_score + dest_complexity_score) / 2
        risk_score += complexity_score
        print(f"🏢 Airport complexity score: +{complexity_score:.1f} points")
        
        # 4. Connection penalty (enhanced)
        connections = flight_data.get('connections', [])
        num_connections = len(connections)
        if num_connections == 0:
            num_connections = flight_data.get('number_of_stops', 0)  # Fallback to number_of_stops
        
        if num_connections == 0:
            connection_penalty = 0
            print(f"✈️ Direct flight: 0 connection penalty")
        else:
            # Enhanced connection penalty calculation for fallback
            base_penalty = num_connections * 8  # Base penalty per connection
            
            # Add estimated penalties for unknown layover details
            estimated_duration_penalty = num_connections * 5  # Average duration risk
            estimated_complexity_penalty = num_connections * 8  # Average airport complexity risk
            
            connection_penalty = base_penalty + estimated_duration_penalty + estimated_complexity_penalty
            connection_penalty = min(connection_penalty, 25)  # Cap for fallback
            
            print(f"🔗 Connection penalty: +{connection_penalty} points for {num_connections} connection(s) (fallback calculation)")
        
        risk_score += connection_penalty
        
        # Cap at 100
        risk_score = min(risk_score, 100)
        
        # Determine risk level based on score
        if risk_score <= 35:
            final_risk_level = 'low'
        elif risk_score <= 70:
            final_risk_level = 'medium'
        else:
            final_risk_level = 'high'
        
        print(f"🎯 FALLBACK DETERMINISTIC SCORE: {risk_score:.1f}/100 ({final_risk_level} risk)")
        
        # Deterministic probability calculations
        delay_probs = {'low': '10-20%', 'medium': '25-35%', 'high': '45-65%'}
        cancel_probs = {'low': '1-3%', 'medium': '3-8%', 'high': '8-15%'}
        
        # Get basic flight info for factors
        origin_code = flight_data.get('origin_airport_code', 'Unknown')
        dest_code = flight_data.get('destination_airport_code', 'Unknown')
        
        # Deterministic risk factors (no AI needed)
        risk_factors = [
            f"No historical flight data available for analysis",
            f"Weather conditions: {origin_risk} at origin, {dest_risk} at destination",
            f"Airport complexity: {origin_complexity} origin, {dest_complexity} destination"
        ]
        
        if num_connections > 0:
            risk_factors.append(f"Flight has {num_connections} connection(s) increasing complexity")
        
        # Deterministic recommendations 
        recommendations = [
            f"Monitor weather conditions closely",
            f"Arrive early for {final_risk_level} risk flight",
            f"Consider travel insurance for protection"
        ]
        
        if num_connections > 0:
            recommendations.append(f"Allow extra time for {num_connections} connection(s)")
        
        return {
            "overall_risk_score": int(risk_score),
            "risk_level": final_risk_level,
            "delay_probability": delay_probs[final_risk_level], 
            "cancellation_probability": cancel_probs[final_risk_level],
            "key_risk_factors": risk_factors[:4],
            "recommendations": recommendations[:4],
            "explanation": f"Fallback deterministic risk score of {risk_score:.1f} calculated from weather conditions, airport complexity, and connection factors"
        } 

    def _format_connection_analysis_for_prompt(self, flight_data):
        """Format connection analysis for the AI prompt"""
        connections = flight_data.get('connections', [])
        if not connections:
            return "This is a direct flight with no connections."
        
        analysis = f"This flight has {len(connections)} connection(s):\n"
        for i, connection in enumerate(connections, 1):
            duration = connection.get('duration', 'Unknown')
            airport = connection.get('airport', 'Unknown')
            analysis += f"- Connection {i}: {duration} layover at {airport}\n"
        
        return analysis

    def _parse_duration_to_minutes(self, duration_str):
        """Parse duration string to minutes"""
        try:
            if isinstance(duration_str, (int, float)):
                return int(duration_str)
            
            duration_str = str(duration_str).strip().lower()
            
            # Handle "1h 30m" format
            if 'h' in duration_str and 'm' in duration_str:
                parts = duration_str.split()
                hours = int(parts[0].replace('h', ''))
                minutes = int(parts[1].replace('m', ''))
                return hours * 60 + minutes
            
            # Handle "90m" format
            elif 'm' in duration_str:
                return int(duration_str.replace('m', ''))
            
            # Handle "1.5h" format
            elif 'h' in duration_str:
                hours = float(duration_str.replace('h', ''))
                return int(hours * 60)
            
            # Handle plain numbers
            else:
                return int(duration_str)
                
        except (ValueError, AttributeError):
            return 60  # Default to 60 minutes
    
    def _calculate_seasonal_risk_score(self, date_str):
        """
        Calculate seasonal risk score based on date
        Includes season analysis and holiday period detection
        """
        try:
            from datetime import datetime, timedelta
            
            if not date_str:
                return 10  # Default moderate seasonal risk
            
            # Parse the date
            flight_date = datetime.strptime(date_str, "%Y-%m-%d")
            month = flight_date.month
            day = flight_date.day
            
            seasonal_score = 0
            seasonal_factors = []
            
            # 1. SEASON ANALYSIS
            if month in [12, 1, 2]:  # Winter
                seasonal_score += 15
                seasonal_factors.extend([
                    "❄️ Winter weather risks (snow, ice, de-icing delays)",
                    "🎄 Holiday travel peaks increase delays",
                    "🌨️ Runway closures and weather cancellations"
                ])
                season = "Winter"
                weather_multiplier = 1.4
                
            elif month in [3, 4, 5]:  # Spring
                seasonal_score += 12
                seasonal_factors.extend([
                    "🌸 Spring break travel increases volume",
                    "🌪️ Weather volatility (storms, wind)",
                    "🌧️ Rain and thunderstorms affect operations"
                ])
                season = "Spring"
                weather_multiplier = 1.2
                
            elif month in [6, 7, 8]:  # Summer
                seasonal_score += 18
                seasonal_factors.extend([
                    "☀️ Peak summer vacation travel",
                    "⛈️ Thunderstorms and heat delays",
                    "🔥 Weight restrictions due to extreme heat",
                    "🏖️ Family boarding increases departure delays"
                ])
                season = "Summer"
                weather_multiplier = 1.3
                
            else:  # Fall (Sep, Oct, Nov)
                seasonal_score += 10
                seasonal_factors.extend([
                    "🍂 Hurricane season affects coastal airports",
                    "📚 Back-to-school travel increases volume",
                    "🍁 Weather transitions create delays"
                ])
                season = "Fall"
                weather_multiplier = 1.1
            
            # 2. HOLIDAY PERIOD ANALYSIS
            holiday_multiplier = 1.0
            holiday_factors = []
            
            # Thanksgiving (4th Thursday in November)
            if month == 11:
                thanksgiving_week = self._get_thanksgiving_week(flight_date.year)
                if thanksgiving_week[0] <= day <= thanksgiving_week[1]:
                    seasonal_score += 20
                    holiday_multiplier = 1.5
                    holiday_factors.extend([
                        "🦃 Thanksgiving travel peak (highest volume)",
                        "🚗 Road traffic affects airport access",
                        "👨‍👩‍👧‍👦 Family travel increases boarding times"
                    ])
            
            # Christmas/New Year (Dec 20 - Jan 5)
            elif (month == 12 and day >= 20) or (month == 1 and day <= 5):
                seasonal_score += 25
                holiday_multiplier = 1.6
                holiday_factors.extend([
                    "🎄 Christmas/New Year peak travel",
                    "❄️ Winter weather combined with holiday volume",
                    "🎁 Gift baggage increases handling delays"
                ])
            
            # July 4th (July 1-7)
            elif month == 7 and 1 <= day <= 7:
                seasonal_score += 15
                holiday_multiplier = 1.3
                holiday_factors.extend([
                    "🎆 July 4th holiday travel peak",
                    "☀️ Summer heat combined with high volume",
                    "🏖️ Vacation travel increases delays"
                ])
            
            # Memorial Day (last Monday in May)
            elif month == 5:
                memorial_day = self._get_memorial_day(flight_date.year)
                if abs(day - memorial_day) <= 3:  # 3 days before/after
                    seasonal_score += 12
                    holiday_multiplier = 1.2
                    holiday_factors.extend([
                        "🇺🇸 Memorial Day weekend travel",
                        "🌺 Spring weather volatility",
                        "🚗 Weekend getaway traffic"
                    ])
            
            # Labor Day (first Monday in September)
            elif month == 9:
                labor_day = self._get_labor_day(flight_date.year)
                if abs(day - labor_day) <= 3:  # 3 days before/after
                    seasonal_score += 12
                    holiday_multiplier = 1.2
                    holiday_factors.extend([
                        "👷 Labor Day weekend travel",
                        "🍂 End of summer vacation rush",
                        "🌪️ Hurricane season risks"
                    ])
            
            # Spring Break (March-April)
            elif month in [3, 4]:
                spring_break_weeks = self._get_spring_break_weeks(flight_date.year)
                for week_start, week_end in spring_break_weeks:
                    if week_start <= day <= week_end:
                        seasonal_score += 15
                        holiday_multiplier = 1.3
                        holiday_factors.extend([
                            "🎓 Spring break travel peak",
                            "🌴 Vacation destination congestion",
                            "🌧️ Spring weather volatility"
                        ])
                        break
            
            # 3. WEEKEND TRAVEL ANALYSIS
            weekday = flight_date.weekday()  # 0=Monday, 6=Sunday
            if weekday in [4, 5, 6]:  # Friday, Saturday, Sunday
                seasonal_score += 5
                seasonal_factors.append("📅 Weekend travel increases volume")
            
            # 4. PEAK TRAVEL MONTHS
            peak_months = [7, 8, 12]  # July, August, December
            if month in peak_months:
                seasonal_score += 8
                seasonal_factors.append("📈 Peak travel month increases delays")
            
            # 5. CALCULATE FINAL SEASONAL SCORE
            final_seasonal_score = seasonal_score * holiday_multiplier
            
            # Store seasonal analysis for later use
            self.seasonal_analysis = {
                'season': season,
                'seasonal_score': seasonal_score,
                'holiday_multiplier': holiday_multiplier,
                'weather_multiplier': weather_multiplier,
                'final_score': final_seasonal_score,
                'seasonal_factors': seasonal_factors,
                'holiday_factors': holiday_factors,
                'is_holiday_period': holiday_multiplier > 1.0,
                'is_peak_travel': month in peak_months,
                'is_weekend': weekday in [4, 5, 6]
            }
            
            print(f"🌍 SEASONAL ANALYSIS: {season} season, score: {final_seasonal_score:.1f}")
            print(f"🌍 Holiday multiplier: {holiday_multiplier}x, Weather multiplier: {weather_multiplier}x")
            print(f"🌍 Seasonal factors: {len(seasonal_factors)} factors identified")
            
            return final_seasonal_score
            
        except Exception as e:
            print(f"❌ Seasonal analysis failed: {e}")
            return 10  # Default moderate risk
    
    def _get_thanksgiving_week(self, year):
        """Get Thanksgiving week (Wednesday before and Sunday after)"""
        # Find 4th Thursday in November
        november_first = datetime(year, 11, 1)
        days_until_thursday = (3 - november_first.weekday()) % 7
        thanksgiving = november_first + timedelta(days=days_until_thursday + 21)  # 4th Thursday
        
        # Return Wednesday to Sunday
        wednesday = thanksgiving - timedelta(days=1)
        sunday = thanksgiving + timedelta(days=3)
        return (wednesday.day, sunday.day)
    
    def _get_memorial_day(self, year):
        """Get Memorial Day (last Monday in May)"""
        may_last = datetime(year, 5, 31)
        days_back = may_last.weekday()
        memorial_day = may_last - timedelta(days=days_back)
        return memorial_day.day
    
    def _get_labor_day(self, year):
        """Get Labor Day (first Monday in September)"""
        september_first = datetime(year, 9, 1)
        days_until_monday = (0 - september_first.weekday()) % 7
        labor_day = september_first + timedelta(days=days_until_monday)
        return labor_day.day
    
    def _get_spring_break_weeks(self, year):
        """Get major spring break weeks (simplified)"""
        # Major spring break weeks (simplified approximation)
        return [
            (8, 15),   # Early March
            (15, 22),  # Mid March
            (22, 29),  # Late March
            (5, 12),   # Early April
            (12, 19)   # Mid April
        ]

    def _format_layover_analysis_for_prompt(self, layovers):
        """Format layover analysis for the AI prompt"""
        if not layovers:
            return "This is a direct flight with no layovers."
        
        analysis = f"This flight has {len(layovers)} layover(s):\n"
        for i, layover in enumerate(layovers, 1):
            duration = layover.get('duration', 'Unknown')
            airport = layover.get('airport', 'Unknown')
            analysis += f"- Layover {i}: {duration} at {airport}\n"
        
        return analysis

    def _get_fallback_route_risk_analysis(self, flight_data, weather_analysis):
        """Provide fallback risk analysis for route flights"""
        # Determine risk level based on weather and layovers
        weather_risk = weather_analysis.get('summary', {}).get('overall_risk_level', 'medium')
        
        # Calculate overall risk
        risk_levels = {'low': 1, 'medium': 2, 'high': 3}
        base_risk = risk_levels.get(weather_risk, 2)
        
        # Adjust for layovers
        num_layovers = len(flight_data.get('layovers', []))
        if num_layovers > 0:
            base_risk = min(base_risk + 1, 3)  # Increase risk for layovers
        
        risk_level_map = {1: 'low', 2: 'medium', 3: 'high'}
        final_risk_level = risk_level_map[base_risk]
        
        # Generate AI-based content instead of hardcoded factors
        try:
            import google.generativeai as genai
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Get flight details
            origin = flight_data.get('origin', 'Unknown')
            destination = flight_data.get('destination', 'Unknown')
            airline = flight_data.get('airline_name', 'Unknown')
            flight_num = flight_data.get('flight_number', 'Unknown')
            
            # Generate AI-based risk factors
            risk_factors_prompt = f"""
            Generate 2-3 specific route risk factors for this flight:
            Flight: {airline} {flight_num}
            Route: {origin} → {destination}
            Weather risk level: {weather_risk}
            Number of layovers: {num_layovers}
            Overall risk: {final_risk_level}
            
            Create specific risk factors based on the route and conditions.
            Format each as a brief sentence under 80 characters.
            Return 2-3 factors, one per line.
            """
            
            response = model.generate_content(risk_factors_prompt)
            ai_factors = response.text.strip().split('\n')
            
            # Process AI-generated factors
            risk_factors = []
            for factor in ai_factors:
                factor = factor.strip()
                if factor and len(factor) < 100 and not factor.startswith('*') and not factor.startswith('-'):
                    risk_factors.append(factor)
            
            # Generate AI-based recommendations
            rec_prompt = f"""
            Generate 3 specific travel recommendations for this route:
            Route: {origin} → {destination}
            Risk level: {final_risk_level}
            Layovers: {num_layovers}
            
            Provide practical advice based on the risk level.
            Keep each under 60 characters.
            Return 3 recommendations, one per line.
            """
            
            rec_response = model.generate_content(rec_prompt)
            ai_recommendations = rec_response.text.strip().split('\n')
            
            # Process AI-generated recommendations
            recommendations = []
            for rec in ai_recommendations:
                rec = rec.strip()
                if rec and len(rec) < 80 and not rec.startswith('*') and not rec.startswith('-'):
                    recommendations.append(rec)
            
            # Ensure minimum content
            if len(risk_factors) < 2:
                risk_factors = [f"❌ AI route analysis failed for {origin} → {destination}", f"Route risk assessment system error"]
            
            if not recommendations:
                recommendations = [f"❌ AI route recommendation failed for {final_risk_level} risk"]
                
        except Exception as e:
            print(f"❌ AI route fallback analysis failed: {e}")
            risk_factors = [f"❌ AI route analysis failed for {origin} → {destination}", f"Route risk system error: {str(e)}"]
            recommendations = [f"❌ AI route recommendation failed: {str(e)}"]
        
        # Map to UI expected format
        risk_scores = {'low': 25, 'medium': 50, 'high': 75}
        delay_probs = {'low': '10-20%', 'medium': '25-35%', 'high': '45-65%'}
        cancel_probs = {'low': '1-3%', 'medium': '3-8%', 'high': '8-15%'}
        
        return {
            "overall_risk_score": risk_scores[final_risk_level],
            "risk_level": final_risk_level,
            "delay_probability": delay_probs[final_risk_level], 
            "cancellation_probability": cancel_probs[final_risk_level],
            "key_risk_factors": risk_factors[:3],
            "recommendations": recommendations[:3],
            "explanation": f"AI-generated risk assessment for {final_risk_level} conditions with {num_layovers} layover(s)"
        }
    
    def _ai_generate_risk_factors(self, flight_data, weather_analysis, risk_level):
        """Generate AI-powered risk factors"""
        try:
            if not hasattr(self, 'model') or not self.model:
                print("❌ Risk Assessment Agent: Gemini model not initialized")
                raise Exception("Gemini model not initialized")
            
            # Extract relevant information
            origin = flight_data.get('origin_airport_code', 'Unknown')
            destination = flight_data.get('destination_airport_code', 'Unknown')
            airline = flight_data.get('airline_name', 'Unknown')
            flight_number = flight_data.get('flight_number', 'Unknown')
            
            # Generate AI-powered risk factors
            prompt = f"""
            As a flight risk analyst, generate specific risk factors for:
            Flight: {airline} {flight_number}
            Route: {origin} → {destination}
            Overall Risk Level: {risk_level}
            
            Based on the weather and airport data provided, generate 3-4 specific, actionable risk factors.
            Each factor should be under 60 characters and include relevant emojis.
            
            Return as JSON array: ["factor1", "factor2", "factor3"]
            """
            
            response = self.model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Parse response
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            factors = json.loads(ai_response)
            if isinstance(factors, list) and len(factors) > 0:
                return factors
            else:
                raise Exception("AI generated invalid risk factors")
                
        except Exception as e:
            print(f"❌ Risk Assessment Agent: AI risk factor generation failed: {e}")
            raise e

    def _ai_generate_recommendations(self, flight_data, weather_analysis, risk_level):
        """Generate AI-powered recommendations"""
        try:
            if not hasattr(self, 'model') or not self.model:
                print("❌ Risk Assessment Agent: Gemini model not initialized")
                raise Exception("Gemini model not initialized")
            
            # Extract relevant information
            origin = flight_data.get('origin_airport_code', 'Unknown')
            destination = flight_data.get('destination_airport_code', 'Unknown')
            airline = flight_data.get('airline_name', 'Unknown')
            flight_number = flight_data.get('flight_number', 'Unknown')
            
            # Generate AI-powered recommendations
            prompt = f"""
            As a flight risk analyst, generate specific recommendations for:
            Flight: {airline} {flight_number}
            Route: {origin} → {destination}
            Overall Risk Level: {risk_level}
            
            Generate 3-5 actionable recommendations to mitigate risks.
            Each recommendation should be specific and helpful.
            
            Return as JSON array: ["recommendation1", "recommendation2", "recommendation3"]
            """
            
            response = self.model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Parse response
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            recommendations = json.loads(ai_response)
            if isinstance(recommendations, list) and len(recommendations) > 0:
                return recommendations
            else:
                raise Exception("AI generated invalid recommendations")
                
        except Exception as e:
            print(f"❌ Risk Assessment Agent: AI recommendation generation failed: {e}")
            raise e 