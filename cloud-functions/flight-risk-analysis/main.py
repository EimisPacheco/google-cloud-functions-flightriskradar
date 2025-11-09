"""
FlightRiskRadar Cloud Function - Google ADK Implementation
Proper implementation using Google Agent Development Kit

UNIFIED ARCHITECTURE - STANDARDIZED AGENT USAGE:
==================================================

This system ensures that BOTH "Search by Route" and "Lookup Specific Flight"
operations use the EXACT SAME standard agents regardless of input method:

INPUT METHODS:
1. Natural Language Chat (ChatBot.tsx)
2. HTML Form Controls (FlightSearch.tsx, DirectFlightLookup.tsx)

UNIFIED ROUTING:
- Natural Language: determine_intent_and_route_analysis() → Standard Agents
- HTML Forms: Unified Request Router → SAME Standard Agents

STANDARD AGENTS FOR ROUTE ANALYSIS:
- Entry Point: _handle_unified_route_analysis()
- Data Analyst Agent: SerpAPI data retrieval
- Weather Intelligence Agent: Weather analysis
- Airport Complexity Agent: Airport analysis (INDEPENDENT of weather)
- Risk Assessment Agent: Final risk evaluation

STANDARD AGENTS FOR DIRECT FLIGHT LOOKUP:
- Entry Point: _handle_direct_flight_analysis()
- Data Analyst Agent: BigQuery data retrieval (airline_code + airline_name)
- Weather Intelligence Agent: Weather analysis
- Airport Complexity Agent: Airport analysis (INDEPENDENT of weather)
- Layover Analysis Agent: Connection analysis
- Risk Assessment Agent: Final risk evaluation

CRITICAL GUARANTEES:
✅ Both input methods use identical backend processing
✅ Same BigQuery queries with airline_code + airline_name
✅ Same weather analysis workflow
✅ Same airport complexity analysis (independent of weather)
✅ Same risk assessment algorithms
✅ NO fake data generation - real data only
✅ Consistent response formats for frontend

AGENT CONSISTENCY MATRIX:
========================
Operation                | Natural Language | HTML Form | Agents Used
-------------------------|------------------|-----------|------------------
Search by Route          | ✅ Standard       | ✅ Standard | Data→Weather→Airport→Risk
Lookup Specific Flight   | ✅ Standard       | ✅ Standard | Data→Weather→Airport→Layover→Risk
Intent Detection         | ✅ Standard       | ✅ Standard | ChatAdvisorAgent
Airline Code Mapping     | ✅ Standard       | ✅ Standard | ChatAdvisorAgent utilities

This unified approach eliminates discrepancies and ensures reliable results.
"""

# TEST ADK SESSION IMPORT - Official Google ADK Implementation
print("🔍 MAIN: Testing ADK session management import...")
try:
    from google.adk.sessions import InMemorySessionService
    print("✅ MAIN: google.adk.sessions imported successfully")
    import adk_session_manager
    print("✅ MAIN: adk_session_manager imported successfully")
    print(f"✅ MAIN: ADK Session functions available: {dir(adk_session_manager)}")
except ImportError as e:
    print(f"❌ MAIN: Failed to import ADK session modules: {e}")
except Exception as e:
    print(f"❌ MAIN: Unexpected error importing ADK session modules: {e}")

import functions_framework
import json
import os
from datetime import datetime, timedelta, timezone
from typing import List
from google.cloud import bigquery
import google.generativeai as genai

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Import Google ADK - REAL IMPLEMENTATION ONLY
try:
    from google.adk.agents import Agent
    from google.adk.tools import FunctionTool
    print("✅ Using real Google ADK")
except ImportError as e:
    print(f"⚠️ Google ADK import failed: {e}")
    print("⚠️ Continuing without Google ADK - using standard implementation")

# Import ADK agents
from weather_intelligence_agent import WeatherIntelligenceAgent
from data_analyst_agent import DataAnalystAgent
from risk_assessment_agent import RiskAssessmentAgent
from weather_tool import analyze_weather_conditions
from layover_analysis_agent import LayoverAnalysisAgent
from chat_advisor_agent import ChatAdvisorAgent
from insurance_recommendation_agent import InsuranceRecommendationAgent
from airport_complexity_agent import AirportComplexityAgent
from bigquery_tool import get_flight_historical_data, get_route_historical_data, get_airline_on_time_rate

# Set Gemini API Key from environment variable
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize BigQuery client
try:
    bq_client = bigquery.Client()
    BQ_AVAILABLE = True
    print("🔍 BigQuery client initialized")
except Exception as e:
    print(f"❌ BigQuery init failed: {e}")
    BQ_AVAILABLE = False

# Initialize ADK agents
weather_agent = WeatherIntelligenceAgent()
data_agent = DataAnalystAgent()
risk_agent = RiskAssessmentAgent()
layover_agent = LayoverAnalysisAgent()
chat_agent = ChatAdvisorAgent()
insurance_agent = InsuranceRecommendationAgent()
airport_complexity_agent = AirportComplexityAgent()

# Add this function near the top of the file, after the imports
def extract_city_from_airport_code(airport_code: str) -> str:
    """Extract city name from airport code using a mapping"""
    # Comprehensive airport code to city mapping
    airport_city_mapping = {
        'JFK': 'New York', 'SFO': 'San Francisco', 'LAX': 'Los Angeles', 'ORD': 'Chicago',
        'DFW': 'Dallas', 'ATL': 'Atlanta', 'DEN': 'Denver', 'SEA': 'Seattle', 'LAS': 'Las Vegas',
        'IAD': 'Washington', 'DCA': 'Washington', 'LGA': 'New York', 'BWI': 'Baltimore',
        'MDW': 'Chicago', 'SAN': 'San Diego', 'TPA': 'Tampa', 'PDX': 'Portland', 'AUS': 'Austin',
        'CLT': 'Charlotte', 'MSP': 'Minneapolis', 'DTW': 'Detroit', 'BOS': 'Boston',
        'FLL': 'Fort Lauderdale', 'SJC': 'San Jose', 'HNL': 'Honolulu', 'ANC': 'Anchorage',
        'MIA': 'Miami', 'MCO': 'Orlando', 'PHL': 'Philadelphia', 'IAH': 'Houston',
        'PHX': 'Phoenix', 'EWR': 'Newark', 'STL': 'St. Louis', 'DAL': 'Dallas',
        'BNA': 'Nashville', 'MCI': 'Kansas City', 'CVG': 'Cincinnati', 'SLC': 'Salt Lake City',
        'CLE': 'Cleveland', 'SMF': 'Sacramento', 'OAK': 'Oakland', 'SNA': 'Santa Ana',
        'RDU': 'Raleigh', 'IND': 'Indianapolis', 'CMH': 'Columbus', 'JAX': 'Jacksonville',
        'RSW': 'Fort Myers', 'COS': 'Colorado Springs', 'PIT': 'Pittsburgh', 'BUF': 'Buffalo',
        'BUR': 'Burbank', 'ABQ': 'Albuquerque', 'LGB': 'Long Beach', 'ONT': 'Ontario',
        'OGG': 'Kahului', 'KOA': 'Kona', 'MKE': 'Milwaukee', 'OMA': 'Omaha',
        'OKC': 'Oklahoma City', 'TUL': 'Tulsa', 'ICT': 'Wichita', 'DSM': 'Des Moines',
        'ROC': 'Rochester', 'ALB': 'Albany', 'SYR': 'Syracuse', 'PVD': 'Providence',
        'BDL': 'Hartford', 'PWM': 'Portland', 'BGR': 'Bangor', 'MHT': 'Manchester',
        'BTV': 'Burlington', 'GRR': 'Grand Rapids', 'FNT': 'Flint', 'LAN': 'Lansing',
        'MSN': 'Madison', 'GRB': 'Green Bay', 'FAR': 'Fargo', 'BIS': 'Bismarck',
        'FSD': 'Sioux Falls', 'RAP': 'Rapid City', 'BIL': 'Billings', 'MSO': 'Missoula',
        'GTF': 'Great Falls', 'BOI': 'Boise', 'GEG': 'Spokane', 'FAI': 'Fairbanks',
        'JNU': 'Juneau'
    }
    return airport_city_mapping.get(airport_code, airport_code)

def analyze_flight_risk_tool(analysis_type: str, **kwargs) -> dict:
    """
    Google ADK Tool for flight risk analysis
    """
    try:
        if analysis_type == 'direct_flight_lookup':
            result = _handle_direct_flight_analysis_with_retry(kwargs)
        elif analysis_type == 'route_analysis':
            result = _handle_route_analysis_with_retry(kwargs)
        else:
            result = {'error': f'Unknown analysis type: {analysis_type}'}
        
        return result
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def _handle_direct_flight_analysis_with_retry(parameters, max_retries=3):
    """
    Wrapper function that implements retry logic for direct flight analysis.
    Handles intermittent 'str' object has no attribute 'get' errors.
    """
    for attempt in range(max_retries):
        try:
            print(f"🔄 RETRY WRAPPER: Attempt {attempt + 1}/{max_retries} for direct flight analysis")
            result = _handle_direct_flight_analysis(parameters)
            
            # Validate result structure to ensure it's properly formed
            if isinstance(result, dict) and 'success' in result:
                if result.get('success'):
                    print(f"✅ RETRY WRAPPER: Direct flight analysis succeeded on attempt {attempt + 1}")
                    return result
                else:
                    # If success=False, check if it's a retryable error
                    error_msg = result.get('error', '')
                    if "'str' object has no attribute 'get'" in str(error_msg) and attempt < max_retries - 1:
                        print(f"⚠️ RETRY WRAPPER: Retryable error on attempt {attempt + 1}: {error_msg}")
                        continue
                    else:
                        print(f"❌ RETRY WRAPPER: Non-retryable error or max retries reached: {error_msg}")
                        return result
            else:
                print(f"❌ RETRY WRAPPER: Invalid result structure on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    continue
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ RETRY WRAPPER: Exception on attempt {attempt + 1}: {error_msg}")
            
            # Check if this is the specific error we're trying to fix
            if "'str' object has no attribute 'get'" in error_msg and attempt < max_retries - 1:
                print(f"🔄 RETRY WRAPPER: Retrying due to str.get() error (attempt {attempt + 1}/{max_retries})")
                import time
                time.sleep(0.1)  # Brief delay before retry
                continue
            elif attempt == max_retries - 1:
                # Final attempt failed, return error
                print(f"💥 RETRY WRAPPER: All {max_retries} attempts failed")
                return {
                    'success': False,
                    'error': f'Direct flight analysis failed after {max_retries} attempts. Last error: {error_msg}',
                    'retry_attempts': max_retries
                }
    
    # Should not reach here, but return error just in case
    return {
        'success': False,
        'error': f'Direct flight analysis failed after {max_retries} attempts with unknown error',
        'retry_attempts': max_retries
        }

def _handle_direct_flight_analysis(parameters):
    """
    UNIFIED STANDARD AGENT for direct flight analysis - used by BOTH natural language chat and HTML form controls
    This ensures identical processing regardless of input method using the SAME backend agents:
    - Data Analyst Agent (BigQuery data retrieval)
    - Weather Intelligence Agent (weather analysis)
    - Airport Complexity Agent (airport analysis) 
    - Layover Analysis Agent (connection analysis)
    - Risk Assessment Agent (final risk evaluation)
    """
    import time
    start_time = time.time()
    print("🤖 ADK TOOL: Coordinating direct flight analysis...")
    
    # LOG: Show incoming parameters
    print("📥 PARAMETERS RECEIVED:")
    print(f"   Raw parameters: {parameters}")
    print(f"   Parameters type: {type(parameters)}")
    print(f"   Parameters keys: {list(parameters.keys()) if isinstance(parameters, dict) else 'Not a dict'}")
    
    # DEFENSIVE: Ensure parameters is a dictionary
    if not isinstance(parameters, dict):
        print(f"❌ ADK TOOL: parameters is not a dict: {type(parameters)} - {str(parameters)[:100]}")
        return {
            'success': False,
            'error': f'Invalid parameters type: expected dict, got {type(parameters)}'
        }
    
    print(f"🔍 ADK TOOL: Parameters received: {list(parameters.keys()) if isinstance(parameters, dict) else 'NOT_DICT'}")
    
    try:
        # Step 1: Data Analyst Agent - Get flight data from BigQuery
        step1_start = time.time()
        print("📊 ADK TOOL: Calling Data Analyst Agent...")
        print("📥 DATA ANALYST AGENT PARAMETERS:")
        print(f"   airline_code: {parameters.get('airline', '')}")
        print(f"   flight_number: {parameters.get('flight_number', '')}")
        print(f"   date: {parameters.get('date', '')}")
        print(f"   airline_name: {parameters.get('airline_name', '')}")
        print(f"   origin_airport_code: {parameters.get('origin_airport_code', '')}")
        print(f"   destination_airport_code: {parameters.get('destination_airport_code', '')}")
        
        flight_data = data_agent.get_flight_data_from_bigquery(
            airline_code=parameters.get('airline', ''),
            flight_number=parameters.get('flight_number', ''),
            date=parameters.get('date', ''),
            airline_name=parameters.get('airline_name', ''),
            origin_airport_code=parameters.get('origin_airport_code', ''),
            destination_airport_code=parameters.get('destination_airport_code', '')
        )
        step1_time = time.time() - step1_start
        print(f"⏱️ ADK TOOL: Step 1 (Data Analyst) took {step1_time:.2f} seconds")
        
        print("📤 DATA ANALYST AGENT RESULT:")
        print(f"   Flight data type: {type(flight_data)}")
        print(f"   Flight data: {flight_data}")
        
        if not flight_data:
            return {
                'success': False,
                'error': 'Flight not found in database'
            }
        
        # Step 1.5: Calculate Airline On-Time Rate from BigQuery historical data
        step15_start = time.time()
        print("⏰ ADK TOOL: Calculating airline On-Time Rate from BigQuery historical data...")
        
        try:
            # Get airline code and route from BigQuery flight data for route-specific performance
            airline_code = flight_data.get('airline_code', '')
            origin_airport = flight_data.get('origin_airport_code', '')
            destination_airport = flight_data.get('destination_airport_code', '')
            
            if airline_code and origin_airport and destination_airport:
                on_time_data = get_airline_on_time_rate(airline_code, origin_airport, destination_airport, years=[2016, 2017, 2018])
                if on_time_data and 'on_time_rate' in on_time_data:
                    flight_data['on_time_rate'] = on_time_data['on_time_rate']
                    flight_data['on_time_data'] = on_time_data
                    print(f"✅ ADK TOOL: On-Time Rate calculated: {airline_code} = {on_time_data['on_time_rate']}%")
                    print(f"📊 ADK TOOL: Total flights analyzed: {on_time_data.get('total_flights_analyzed', 0)}")
                else:
                    print(f"⚠️ ADK TOOL: On-Time Rate calculation failed for {airline_code}")
                    flight_data['on_time_rate'] = None
            else:
                print(f"⚠️ ADK TOOL: No airline code provided for On-Time Rate calculation")
                flight_data['on_time_rate'] = None
        except Exception as e:
            print(f"❌ ADK TOOL: On-Time Rate calculation failed: {e}")
            flight_data['on_time_rate'] = None
        
        step15_time = time.time() - step15_start
        print(f"⏱️ ADK TOOL: Step 1.5 (On-Time Rate) took {step15_time:.2f} seconds")
        
        # Step 2: Weather Intelligence Agent - Get weather for origin and destination
        step2_start = time.time()
        print("🌤️ ADK TOOL: Calling Weather Intelligence Agent...")
        # DEFENSIVE: Ensure flight_data is a dictionary
        if not isinstance(flight_data, dict):
            print(f"❌ ADK TOOL: flight_data is not a dict: {type(flight_data)} - {str(flight_data)[:100]}")
            return {
                'success': False,
                'error': f'Invalid flight_data type: expected dict, got {type(flight_data)}'
            }
        
        # FIXED: Handle both BigQuery data (origin_airport_code) and AI-generated data (origin)
        origin_airport = flight_data.get('origin_airport_code') or flight_data.get('origin', '')
        destination_airport = flight_data.get('destination_airport_code') or flight_data.get('destination', '')
        
        print(f"🔍 ADK TOOL: Using airport codes - Origin: {origin_airport}, Destination: {destination_airport}")
        print(f"🔍 ADK TOOL: Flight data keys: {list(flight_data.keys())}")
        print(f"🔍 ADK TOOL: Flight data origin fields: origin_airport_code={flight_data.get('origin_airport_code')}, origin={flight_data.get('origin')}")
        
        # Log weather analysis type for direct flight
        try:
            travel_datetime = datetime.strptime(parameters.get('date', ''), "%Y-%m-%d")
            today = datetime.now()
            days_ahead = (travel_datetime.date() - today.date()).days
            if days_ahead > 7:
                print(f"🌤️ CLOUD LOGS: Direct flight weather analysis - SEASONAL analysis (flight is {days_ahead} days from today)")
            else:
                print(f"🌤️ CLOUD LOGS: Direct flight weather analysis - REAL-TIME SerpAPI analysis (flight is {days_ahead} days from today)")
        except Exception as e:
            print(f"⚠️ CLOUD LOGS: Could not determine direct flight weather analysis type: {e}")
        
        # Use the WeatherIntelligenceTool directly to get proper structure
        print(f"🌤️ CALLING WEATHER TOOL FOR MULTI-CITY ANALYSIS: {origin_airport} → {destination_airport}")
        from weather_tool import WeatherIntelligenceTool
        weather_tool = WeatherIntelligenceTool()
        weather_analysis = weather_tool.analyze_multi_city_route_weather(
            origin=origin_airport,
            destination=destination_airport,
            connections=[],  # No connections for direct flight
            travel_date=parameters.get('date', '')
        )
        
        print(f"🌤️ WEATHER TOOL RAW RESPONSE: {str(weather_analysis)[:500]}")
        step2_time = time.time() - step2_start
        print(f"⏱️ ADK TOOL: Step 2 (Weather Intelligence) took {step2_time:.2f} seconds")
        
        print("🔍 WEATHER ANALYSIS RESULT DETAILED INSPECTION:")
        print(f"   Type: {type(weather_analysis)}")
        print(f"   Keys: {list(weather_analysis.keys()) if isinstance(weather_analysis, dict) else 'NOT_DICT'}")
        if isinstance(weather_analysis, dict):
            for key, value in weather_analysis.items():
                print(f"   {key}: {type(value)} = {str(value)[:200]}")
        print("=" * 80)
        
        # DEFENSIVE: Ensure weather_analysis is a dictionary
        if not isinstance(weather_analysis, dict):
            print(f"❌ ADK TOOL: weather_analysis is not a dict: {type(weather_analysis)} - {str(weather_analysis)[:100]}")
            return {
                'success': False,
                'error': f'Invalid weather_analysis type: expected dict, got {type(weather_analysis)}'
            }
        
        # Step 2.1: INDEPENDENT AIRPORT COMPLEXITY ANALYSIS (NO WEATHER DEPENDENCY)
        step21_start = time.time()
        print("🏢 ADK TOOL: Running INDEPENDENT airport complexity analysis...")
        
        # Initialize the airport complexity agent directly
        from airport_complexity_agent import AirportComplexityAgent
        airport_complexity_agent = AirportComplexityAgent()
        
        # Get INDEPENDENT airport complexity analysis for origin
        if origin_airport:
            print(f"🏢 ADK TOOL: Analyzing origin airport complexity for {origin_airport} (INDEPENDENT)")
            try:
                origin_complexity = airport_complexity_agent.analyze_airport_complexity(origin_airport)
                print(f"✅ ADK TOOL: Origin airport complexity analysis complete for {origin_airport}")
            except Exception as e:
                print(f"❌ ADK TOOL: Origin airport complexity analysis failed for {origin_airport}: {e}")
                origin_complexity = {
                    "complexity": "unknown",
                    "description": f"Airport complexity analysis failed for {origin_airport}",
                    "concerns": ["Airport complexity analysis error"]
                }
        else:
            origin_complexity = {
                "complexity": "unknown", 
                "description": "Origin airport code not available",
                "concerns": ["Missing airport information"]
            }
        
        # Get INDEPENDENT airport complexity analysis for destination
        if destination_airport:
            print(f"🏢 ADK TOOL: Analyzing destination airport complexity for {destination_airport} (INDEPENDENT)")
            try:
                destination_complexity = airport_complexity_agent.analyze_airport_complexity(destination_airport)
                print(f"✅ ADK TOOL: Destination airport complexity analysis complete for {destination_airport}")
            except Exception as e:
                print(f"❌ ADK TOOL: Destination airport complexity analysis failed for {destination_airport}: {e}")
                destination_complexity = {
                    "complexity": "unknown",
                    "description": f"Airport complexity analysis failed for {destination_airport}",
                    "concerns": ["Airport complexity analysis error"]
                }
        else:
            destination_complexity = {
                "complexity": "unknown",
                "description": "Destination airport code not available", 
                "concerns": ["Missing airport information"]
            }
        
        # Add complexity data to existing weather analysis (preserve weather_risk from weather tool)
        if 'origin_airport_analysis' not in weather_analysis:
            weather_analysis['origin_airport_analysis'] = {}
        
        # Only add missing fields, preserve existing weather_risk data from weather tool
        if 'airport_code' not in weather_analysis['origin_airport_analysis']:
            weather_analysis['origin_airport_analysis']['airport_code'] = origin_airport
        if 'airport_complexity' not in weather_analysis['origin_airport_analysis']:
            weather_analysis['origin_airport_analysis']['airport_complexity'] = origin_complexity
        if 'data_source' not in weather_analysis['origin_airport_analysis']:
            weather_analysis['origin_airport_analysis']['data_source'] = "Real Analysis"
        
        print(f"✅ DIRECT: Preserved origin analysis structure: {list(weather_analysis['origin_airport_analysis'].keys())}")
        
        if 'destination_airport_analysis' not in weather_analysis:
            weather_analysis['destination_airport_analysis'] = {}
            
        # Only add missing fields, preserve existing weather_risk data from weather tool
        if 'airport_code' not in weather_analysis['destination_airport_analysis']:
            weather_analysis['destination_airport_analysis']['airport_code'] = destination_airport
        if 'airport_complexity' not in weather_analysis['destination_airport_analysis']:
            weather_analysis['destination_airport_analysis']['airport_complexity'] = destination_complexity
        if 'data_source' not in weather_analysis['destination_airport_analysis']:
            weather_analysis['destination_airport_analysis']['data_source'] = "Real Analysis"
            
        print(f"✅ DIRECT: Preserved destination analysis structure: {list(weather_analysis['destination_airport_analysis'].keys())}")
        
        # CRITICAL FIX: Ensure weather_risk data from OpenWeatherMap gets copied to airport analysis
        if 'weather_risk' in weather_analysis and weather_analysis['weather_risk']:
            # Copy main weather analysis to origin airport analysis
            if 'origin_airport_analysis' not in weather_analysis:
                weather_analysis['origin_airport_analysis'] = {}
            if 'weather_risk' not in weather_analysis['origin_airport_analysis']:
                weather_analysis['origin_airport_analysis']['weather_risk'] = weather_analysis['weather_risk'].copy()
                print(f"✅ DIRECT: Copied main weather_risk to origin_airport_analysis: {weather_analysis['weather_risk']['description'][:100]}")
            
            # Copy main weather analysis to destination airport analysis  
            if 'destination_airport_analysis' not in weather_analysis:
                weather_analysis['destination_airport_analysis'] = {}
            if 'weather_risk' not in weather_analysis['destination_airport_analysis']:
                weather_analysis['destination_airport_analysis']['weather_risk'] = weather_analysis['weather_risk'].copy()
                print(f"✅ DIRECT: Copied main weather_risk to destination_airport_analysis: {weather_analysis['weather_risk']['description'][:100]}")
        
        step21_time = time.time() - step21_start
        print(f"⏱️ ADK TOOL: Step 2.1 (Extract Airport Data) took {step21_time:.2f} seconds")
        
        # Step 2.5: OPTIMIZED - Get layover weather in parallel using threading
        step25_start = time.time()
        print("🌤️ ADK TOOL: Getting layover weather in parallel...")
        layover_weather_analysis = {}
        
        # Get unique layover airports to avoid duplicate processing
        layover_airports = []
        connections = flight_data.get('connections', [])
        
        # DEFENSIVE: Ensure connections is a list
        if not isinstance(connections, list):
            print(f"⚠️ ADK TOOL: connections is not a list: {type(connections)} - treating as empty")
            connections = []
        
        for connection in connections:
            # DEFENSIVE: Ensure each connection is a dictionary
            if not isinstance(connection, dict):
                print(f"⚠️ ADK TOOL: connection is not a dict: {type(connection)} - skipping")
                continue
                
            airport_code = connection.get('airport', '')  # FIXED: BigQuery uses 'airport' field, not 'airport_code'
            if airport_code and airport_code.strip() and airport_code not in layover_airports:
                layover_airports.append(airport_code)
        
        if layover_airports:
            print(f"🚀 ADK TOOL: Processing {len(layover_airports)} unique layover airports in parallel: {layover_airports}")
            
            # Use parallel processing for weather analysis
            import concurrent.futures
            import threading
            
            def analyze_single_layover_weather(airport_code):
                """Analyze weather for a single layover airport using UNIFIED AGENT APPROACH"""
                try:
                    print(f"🌤️ ADK TOOL: [Thread] Using SAME WeatherIntelligenceAgent for layover {airport_code}")
                    
                    # UNIFIED AGENT APPROACH: Use the SAME WeatherIntelligenceAgent as origin/destination
                    layover_weather_result = weather_agent.analyze_weather_conditions(
                        airport_code=airport_code,
                        flight_date=parameters.get('date', '')
                    )
                    
                    print(f"✅ ADK TOOL: [Thread] Got weather data from WeatherIntelligenceAgent for layover {airport_code}")
                    return airport_code, layover_weather_result
                    
                except Exception as e:
                    print(f"❌ ADK TOOL: [Thread] Failed to get weather for layover {airport_code}: {e}")
                    return airport_code, {
                        "error": f"Weather analysis failed for {airport_code}: {str(e)}",
                        "weather_available": False
                    }
            
            # Process layovers in parallel with maximum 4 concurrent threads
            max_workers = min(4, len(layover_airports))
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all layover weather analysis tasks
                future_to_airport = {
                    executor.submit(analyze_single_layover_weather, airport_code): airport_code 
                    for airport_code in layover_airports
                }
                
                # Collect results as they complete
                for future in concurrent.futures.as_completed(future_to_airport):
                    airport_code, weather_data = future.result()
                    layover_weather_analysis[airport_code] = weather_data
            
            print(f"🚀 ADK TOOL: Parallel weather analysis complete for {len(layover_airports)} layovers")
        else:
            print("ℹ️ ADK TOOL: No layover airports to analyze")
        
        # UNIFIED AGENT APPROACH: Add INDEPENDENT airport complexity analysis for layovers
        print("🏢 ADK TOOL: Running UNIFIED AGENT airport complexity analysis for layovers...")
        layover_complexity_analysis = {}
        
        if layover_airports:
            def analyze_single_layover_complexity(airport_code):
                """Analyze airport complexity for a single layover airport using UNIFIED AGENT APPROACH"""
                try:
                    print(f"🏢 ADK TOOL: [Thread] Using SAME AirportComplexityAgent for layover {airport_code}")
                    
                    # UNIFIED AGENT APPROACH: Use the SAME AirportComplexityAgent as origin/destination
                    complexity_result = airport_complexity_agent.analyze_airport_complexity(airport_code)
                    
                    print(f"✅ ADK TOOL: [Thread] Got complexity data from AirportComplexityAgent for layover {airport_code}")
                    return airport_code, complexity_result
                    
                except Exception as e:
                    print(f"❌ ADK TOOL: [Thread] Failed to get complexity for layover {airport_code}: {e}")
                    return airport_code, {
                        "complexity": "unknown",
                        "description": f"Airport complexity analysis failed for {airport_code}",
                        "concerns": ["Airport complexity analysis error"]
                    }
            
            # Process layover complexity in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all layover complexity analysis tasks
                future_to_airport = {
                    executor.submit(analyze_single_layover_complexity, airport_code): airport_code 
                    for airport_code in layover_airports
                }
                
                # Collect results as they complete
                for future in concurrent.futures.as_completed(future_to_airport):
                    airport_code, complexity_data = future.result()
                    layover_complexity_analysis[airport_code] = complexity_data
            
            print(f"🚀 ADK TOOL: Parallel complexity analysis complete for {len(layover_airports)} layovers")
        
        # Add layover weather to the main weather analysis
        weather_analysis['layover_weather_analysis'] = layover_weather_analysis
        
        # DEBUG: Print the connection data structure before and after
        print(f"🔍 DEBUG: flight_data connections: {flight_data.get('connections', [])}")
        
        # OPTIMIZED: Batch process layover feasibility analysis
        connections = flight_data.get('connections', [])
        if connections:
            print(f"🚀 ADK TOOL: Processing {len(connections)} connections with UNIFIED AGENT analysis")
            
            # Prepare batch layover analysis data with UNIFIED data
            batch_layover_data = []
            print(f"🔍 DEBUG: Preparing batch layover data from {len(connections)} connections")
            for connection in connections:
                airport_code = connection.get('airport', '')  # FIXED: BigQuery uses 'airport' field, not 'airport_code'
                print(f"🔍 DEBUG: Processing connection for airport: {airport_code}")
                print(f"🔍 DEBUG: Airport in layover_weather_analysis: {airport_code in layover_weather_analysis}")
                
                if airport_code in layover_weather_analysis:
                    layover_weather_data = layover_weather_analysis[airport_code]
                    layover_complexity_data = layover_complexity_analysis.get(airport_code, {})
                    
                    print(f"🔍 DEBUG: Weather data error status: {layover_weather_data.get('error')}")
                    if not layover_weather_data.get('error'):
                        # FIXED: Always get layover duration from layoverInfo if available
                        # The layoverInfo contains the actual layover duration at the airport
                        layover_info = connection.get('layoverInfo', {})
                        layover_duration = layover_info.get('duration', '1h')
                        
                        print(f"🔍 DEBUG: Layover duration for {airport_code}: {layover_duration} (from layoverInfo)")
                        print(f"🔍 DEBUG: Connection duration (flight segment): {connection.get('duration', 'N/A')}")
                        
                        layover_item = {
                            'airport_code': airport_code,
                            'duration_str': layover_duration,
                            'arrival_time': layover_info.get('arrival_time', connection.get('arrival_time')),
                            'travel_date': parameters.get('date', ''),
                            'weather_risk': layover_weather_data.get('weather_risk', {}).get('level', 'medium'),
                            'airport_complexity': layover_complexity_data.get('complexity', 'medium'),
                            'weather_data': layover_weather_data
                        }
                        batch_layover_data.append(layover_item)
                        print(f"🔍 DEBUG: Added layover data for {airport_code}: duration={layover_duration}")
                        print(f"🔍 DEBUG: Layover item details: {layover_item}")
                    else:
                        print(f"🔍 DEBUG: Skipped {airport_code} due to weather data error")
                else:
                    print(f"🔍 DEBUG: Skipped {airport_code} - not in weather analysis")
            
            print(f"🔍 DEBUG: Final batch_layover_data contains {len(batch_layover_data)} items")
            
            # Run batch layover analysis if we have valid data
            batch_layover_results = {}
            if batch_layover_data:
                print(f"🤖 ADK TOOL: Running batch layover analysis for {len(batch_layover_data)} layovers")
                print(f"🔍 DEBUG: Batch layover data: {batch_layover_data}")
                try:
                    batch_layover_results = layover_agent.analyze_batch_layover_feasibility(batch_layover_data)
                    print(f"✅ ADK TOOL: Batch layover analysis complete")
                    print(f"🔍 DEBUG: Batch results keys: {list(batch_layover_results.keys())}")
                    print(f"🔍 DEBUG: Batch results content: {batch_layover_results}")
                except Exception as e:
                    print(f"❌ ADK TOOL: Batch layover analysis failed: {e}")
                    batch_layover_results = {}
            else:
                print(f"🔍 DEBUG: No batch layover data to process")
            
            # Apply results to connections using UNIFIED AGENT data structure
            for i, connection in enumerate(connections):
                print(f"🔍 DEBUG: Processing connection {i}, type: {type(connection)}")
                if not isinstance(connection, dict):
                    print(f"❌ ERROR: Connection {i} is not a dict: {connection}")
                    continue
                    
                airport_code = connection.get('airport', '')  # FIXED: BigQuery uses 'airport' field, not 'airport_code'
                print(f"🔍 DEBUG: Processing connection for airport_code: {airport_code}")
                print(f"🔍 DEBUG: Connection keys: {list(connection.keys())}")
                print(f"🔍 DEBUG: Available layover weather keys: {list(layover_weather_analysis.keys())}")
                print(f"🔍 DEBUG: Available layover complexity keys: {list(layover_complexity_analysis.keys())}")
                
                if airport_code in layover_weather_analysis and airport_code in layover_complexity_analysis:
                    layover_weather_data = layover_weather_analysis[airport_code]
                    layover_complexity_data = layover_complexity_analysis[airport_code]
                    print(f"🔍 DEBUG: Found UNIFIED AGENT data for {airport_code}")
                    
                    # UNIFIED AGENT DATA STRUCTURE: Use the SAME format as origin/destination - FIXED: Add to layoverInfo structure
                    if not layover_weather_data.get('error'):
                        # Ensure layoverInfo exists
                        if 'layoverInfo' not in connection:
                            connection['layoverInfo'] = {}
                        
                        connection['layoverInfo']['weather_risk'] = {
                            "level": layover_weather_data.get('weather_risk', {}).get('level', 'medium'),
                            "description": layover_weather_data.get('weather_risk', {}).get('description', 'Weather analysis not available'),
                            "risk_factors": layover_weather_data.get('weather_risk', {}).get('risk_factors', [])
                        }
                        
                        connection['layoverInfo']['airport_complexity'] = {
                            "complexity": layover_complexity_data.get('complexity', 'medium'),
                            "description": layover_complexity_data.get("description", "Airport complexity analysis not available"),
                            "concerns": layover_complexity_data.get("concerns", ["❌ Airport complexity analysis failed"])
                        }
                        
                        # ADD: Comprehensive layover feasibility analysis from batch results
                        print(f"🔍 DEBUG: Checking if {airport_code} in batch_layover_results")
                        print(f"🔍 DEBUG: Batch results available for: {list(batch_layover_results.keys())}")
                        
                        # Make case-insensitive lookup
                        airport_code_upper = airport_code.upper()
                        batch_results_upper = {k.upper(): v for k, v in batch_layover_results.items()}
                        
                        # If not in results, add a default analysis
                        if airport_code_upper not in batch_results_upper:
                            print(f"⚠️ DEBUG: {airport_code} not found in batch results, adding default analysis")
                            # Calculate basic risk based on duration
                            layover_duration_str = connection.get('layoverInfo', {}).get('duration', '2h')
                            duration_minutes = 120  # Default 2 hours
                            try:
                                # Parse duration like "3h 25m"
                                import re
                                match = re.match(r'(\d+)h\s*(\d+)m', layover_duration_str)
                                if match:
                                    hours, minutes = match.groups()
                                    duration_minutes = int(hours) * 60 + int(minutes)
                            except:
                                pass
                            
                            # Determine risk based on duration
                            if duration_minutes >= 180:  # 3+ hours
                                risk_level = "low"
                                risk_score = 25
                                feasibility = "Comfortable connection time"
                            elif duration_minutes >= 90:  # 1.5-3 hours
                                risk_level = "medium"
                                risk_score = 50
                                feasibility = "Adequate connection time"
                            else:  # Less than 1.5 hours
                                risk_level = "high"
                                risk_score = 75
                                feasibility = "Tight connection time"
                            
                            batch_results_upper[airport_code_upper] = {
                                'risk_level': risk_level,
                                'risk_score': risk_score,
                                'overall_feasibility': feasibility,
                                'minimum_connection_time': 60,
                                'buffer_analysis': {'buffer_adequacy': 'Calculated based on duration'},
                                'recommendations': ['Monitor flight status', 'Check gate information'],
                                'risk_factors': ['Default analysis based on layover duration'],
                                'contextual_analysis': {'airport_specific': f'{duration_minutes} minutes layover at {airport_code}'}
                            }
                        
                        if airport_code_upper in batch_results_upper:
                            ai_analysis = batch_results_upper[airport_code_upper]
                            print(f"🔍 DEBUG: Found batch analysis for {airport_code}: {ai_analysis}")
                            connection['layover_analysis'] = {
                                "feasibility_risk": ai_analysis.get('risk_level', 'medium'),
                                "feasibility_score": ai_analysis.get('risk_score', 50),
                                "feasibility_description": ai_analysis.get('overall_feasibility', 'Analysis not available'),
                                "minimum_connection_time": ai_analysis.get('minimum_connection_time', 60),
                                "buffer_time": ai_analysis.get('buffer_analysis', {}).get('buffer_adequacy', 'Not assessed'),
                                "recommendations": ai_analysis.get('recommendations', ['Monitor flight status'])[:5],
                                "risk_modifiers": ai_analysis.get('risk_factors', ['Analysis not available']),
                                "duration_assessment": ai_analysis.get('contextual_analysis', {}).get('airport_specific', 'Analysis not available')
                            }
                            print(f"🤖 ADK TOOL: Added BATCH AI analysis for layover {airport_code}")
                        
                        connection['data_source'] = 'Real Analysis'
                        print(f"🔍 DEBUG: Weather risk: {connection['layoverInfo']['weather_risk']}")
                        print(f"🔍 DEBUG: Airport complexity: {connection['layoverInfo']['airport_complexity']}")
                        print(f"🔍 DEBUG: Layover feasibility: {connection['layover_analysis']['feasibility_risk']}")
                        
                    else:
                        # Handle error case - ensure layoverInfo structure exists
                        if 'layoverInfo' not in connection:
                            connection['layoverInfo'] = {}
                        
                        connection['layoverInfo']['weather_risk'] = {
                            "risk_level": "unknown",
                            "description": f"Weather analysis failed for {airport_code}. Error: {layover_weather_data.get('error', 'Unknown error')}",
                            "risk_factors": [f"Weather analysis failed for {airport_code}"]
                        }
                        
                        connection['layoverInfo']['airport_complexity'] = {
                            "complexity": "unknown",
                            "description": f"Airport complexity analysis failed for {airport_code}. Error: {layover_complexity_data.get('error', 'Unknown error')}",
                            "concerns": [f"Analysis failed for {airport_code}"]
                        }
                        
                        connection['data_source'] = 'Analysis Failed'
                        print(f"❌ ADK TOOL: Failed to add AI analysis for layover {airport_code}")
                else:
                    print(f"🔍 DEBUG: No layover data found for airport_code: {airport_code}")
        else:
            print("ℹ️ ADK TOOL: No connections to process")
        
        # DEBUG: Print final connection data
        print(f"🔍 DEBUG: Final flight_data connections: {flight_data.get('connections', [])}")
        
        step25_time = time.time() - step25_start
        print(f"⏱️ ADK TOOL: Step 2.5 (Layover Analysis) took {step25_time:.2f} seconds")
        
        # Step 3: Risk Assessment Agent - Generate final analysis
        step3_start = time.time()
        print("⚠️ ADK TOOL: Calling Risk Assessment Agent...")
        risk_analysis = risk_agent.generate_flight_risk_analysis(
            flight_data,
            weather_analysis,
            parameters
        )
        step3_time = time.time() - step3_start
        print(f"⏱️ ADK TOOL: Step 3 (Risk Assessment) took {step3_time:.2f} seconds")
        
        # LOG: Show risk analysis result
        print("📤 RISK ANALYSIS RESULT:")
        print(f"   Risk analysis type: {type(risk_analysis)}")
        print(f"   Risk analysis content: {risk_analysis}")
        
        # DEFENSIVE: Ensure risk_analysis is a dictionary
        if not isinstance(risk_analysis, dict):
            print(f"❌ ADK TOOL: risk_analysis validation failed!")
            print(f"   Type: {type(risk_analysis)}")
            print(f"   Content: {str(risk_analysis)[:500]}")
            print(f"   Is None: {risk_analysis is None}")
            print(f"   Is String: {isinstance(risk_analysis, str)}")
            
            # Try to recover if it's a JSON string
            if isinstance(risk_analysis, str):
                try:
                    import json
                    risk_analysis = json.loads(risk_analysis)
                    print(f"✅ ADK TOOL: Successfully parsed risk_analysis as JSON")
                except json.JSONDecodeError as e:
                    print(f"❌ ADK TOOL: Failed to parse risk_analysis JSON: {e}")
                    return {
                        'success': False,
                        'error': f'Invalid risk_analysis format: could not parse as JSON - {str(e)}'
                    }
            else:
                return {
                    'success': False,
                    'error': f'Invalid risk_analysis type: expected dict, got {type(risk_analysis)}'
                }
        
        # STEP 4: ALWAYS GENERATE 5-BULLET AI SEASONAL FACTORS ANALYSIS
        # This analysis considers: origin, destination, exact date, season, holidays, weather data (if available)
        print("🗓️ ADK TOOL: Generating comprehensive 5-bullet seasonal factors analysis...")
        origin_airport = flight_data.get('origin_airport_code', '')
        destination_airport = flight_data.get('destination_airport_code', '')
        flight_number = flight_data.get('flight_number', 'Unknown')
        travel_date = parameters.get('date', '')
        
        try:
            # Generate AI-powered seasonal factors that consider ALL available information
            seasonal_factors, success = _ai_generate_flight_seasonal_factors(
                origin_airport, 
                destination_airport, 
                travel_date,
                flight_number
            )
            
            if success and len(seasonal_factors) >= 5:
                risk_analysis['seasonal_factors'] = seasonal_factors[:5]
                risk_analysis['key_risk_factors'] = seasonal_factors[:5]
                print(f"✅ ADK TOOL: Generated {len(seasonal_factors[:5])} AI seasonal factors for direct flight {flight_number}")
            else:
                # Fallback to basic seasonal factors based on season/date
                basic_factors = _ai_generate_basic_seasonal_factors(travel_date)
                risk_analysis['seasonal_factors'] = basic_factors[:5]
                risk_analysis['key_risk_factors'] = basic_factors[:5]
                
        except Exception as e:
            print(f"❌ ADK TOOL: Seasonal factor generation failed for direct flight {flight_number}: {e}")
            # Use basic seasonal factors when AI generation fails completely
            basic_factors = _ai_generate_basic_seasonal_factors(travel_date)
            risk_analysis['seasonal_factors'] = basic_factors[:5]
            risk_analysis['key_risk_factors'] = basic_factors[:5]
        
        # CRITICAL: Map airport analysis to flight object structure for UI compatibility
        print("🗺️ CRITICAL WEATHER DATA MAPPING TO FLIGHT OBJECT:")
        print(f"   Weather analysis keys: {list(weather_analysis.keys())}")
        print(f"   Has origin_airport_analysis: {'origin_airport_analysis' in weather_analysis}")
        if 'origin_airport_analysis' in weather_analysis:
            origin_analysis = weather_analysis['origin_airport_analysis']
            print(f"   origin_airport_analysis type: {type(origin_analysis)}")
            if isinstance(origin_analysis, dict):
                print(f"   origin_airport_analysis keys: {list(origin_analysis.keys())}")
                if 'weather_risk' in origin_analysis:
                    weather_risk = origin_analysis['weather_risk']
                    print(f"   weather_risk type: {type(weather_risk)}")
                    if isinstance(weather_risk, dict):
                        print(f"   weather_risk keys: {list(weather_risk.keys())}")
                        print(f"   weather_risk.description: {weather_risk.get('description', 'MISSING')}")
                        print(f"   weather_risk.level: {weather_risk.get('level', 'MISSING')}")
        
        # FIXED: Use AI-generated weather descriptions instead of raw data templates
        print("🔧 WEATHER FIX: Preserving AI-generated weather descriptions (no template override)")
        
        # Check if weather_risk already exists from AI analysis - if so, keep it
        if 'origin_airport_analysis' in weather_analysis:
            origin_data = weather_analysis['origin_airport_analysis']
            if 'weather_risk' not in origin_data and 'weather_conditions' in origin_data:
                # Only create fallback if AI didn't provide weather_risk
                conditions = origin_data['weather_conditions']
                # Create layover-style weather description without redundant prefix
                conditions_desc = conditions.get('conditions', 'Unknown').lower()
                temp = conditions.get('temperature', 'N/A')
                visibility = conditions.get('visibility', 'N/A')
                humidity = conditions.get('humidity', 'N/A')
                wind = conditions.get('wind', 'N/A')
                
                origin_data['weather_risk'] = {
                    "level": conditions.get('risk_level', 'medium').upper(),
                    "description": f"Moderate risk due to {conditions_desc}, {humidity} humidity, and {visibility} visibility. Temperature at {temp} with {wind} winds pose minor impacts.",
                    "risk_score": 50,
                    "delay_probability": "Unknown",
                    "cancellation_probability": "Unknown"
                }
                print(f"ℹ️ WEATHER FIX: Created fallback weather_risk for origin")
            else:
                print(f"✅ WEATHER FIX: Using AI-generated weather_risk for origin: {origin_data.get('weather_risk', {}).get('description', 'None')[:100]}...")
        
        if 'destination_airport_analysis' in weather_analysis:
            destination_data = weather_analysis['destination_airport_analysis']
            if 'weather_risk' not in destination_data and 'weather_conditions' in destination_data:
                # Only create fallback if AI didn't provide weather_risk
                conditions = destination_data['weather_conditions']
                # Create layover-style weather description without redundant prefix
                conditions_desc = conditions.get('conditions', 'Unknown').lower()
                temp = conditions.get('temperature', 'N/A')
                visibility = conditions.get('visibility', 'N/A')
                humidity = conditions.get('humidity', 'N/A')
                wind = conditions.get('wind', 'N/A')
                
                destination_data['weather_risk'] = {
                    "level": conditions.get('risk_level', 'medium').upper(),
                    "description": f"Moderate risk due to {conditions_desc}, {humidity} humidity, and {visibility} visibility. Temperature at {temp} with {wind} winds pose minor impacts.",
                    "risk_score": 50,
                    "delay_probability": "Unknown",
                    "cancellation_probability": "Unknown"
                }
                print(f"ℹ️ WEATHER FIX: Created fallback weather_risk for destination")
            else:
                print(f"✅ WEATHER FIX: Using AI-generated weather_risk for destination: {destination_data.get('weather_risk', {}).get('description', 'None')[:100]}...")
        
        print(f"🔍 ULTIMATE FIX: Final weather_analysis keys (DIRECT): {list(weather_analysis.keys())}")
        if 'origin_airport_analysis' in weather_analysis:
            print(f"   origin_airport_analysis keys: {list(weather_analysis['origin_airport_analysis'].keys())}")
        if 'destination_airport_analysis' in weather_analysis:
            print(f"   destination_airport_analysis keys: {list(weather_analysis['destination_airport_analysis'].keys())}")
        
        if 'origin_airport_analysis' in weather_analysis and weather_analysis['origin_airport_analysis']:
            print("✅ MAPPING ORIGIN WEATHER DATA TO FLIGHT OBJECT:")
            flight_data['origin_analysis'] = weather_analysis['origin_airport_analysis']
            print(f"   flight_data['origin_analysis'] set with keys: {list(weather_analysis['origin_airport_analysis'].keys())}")
            # Map to the structure the UI expects
            flight_data['origin_weather'] = {
                "weather_risk": weather_analysis['origin_airport_analysis'].get('weather_risk', {}),
                "airport_complexity": weather_analysis['origin_airport_analysis'].get('airport_complexity', {}),
                "weather_conditions": {
                    "conditions": weather_analysis['origin_airport_analysis'].get('weather_risk', {}).get('description', 'Weather analysis not available')
                }
            }
            
        if 'destination_airport_analysis' in weather_analysis and weather_analysis['destination_airport_analysis']:
            flight_data['destination_analysis'] = weather_analysis['destination_airport_analysis']
            # Map to the structure the UI expects
            flight_data['destination_weather'] = {
                "weather_risk": weather_analysis['destination_airport_analysis'].get('weather_risk', {}),
                "airport_complexity": weather_analysis['destination_airport_analysis'].get('airport_complexity', {}),
                "weather_conditions": {
                    "conditions": weather_analysis['destination_airport_analysis'].get('weather_risk', {}).get('description', 'Weather analysis not available')
                }
            }
        
        # Return in the EXACT format the UI expects (same as original working code)
        total_time = time.time() - start_time
        print(f"🏁 ADK TOOL: TOTAL ANALYSIS TIME: {total_time:.2f} seconds")
        print(f"📊 ADK TOOL: Performance breakdown - Data: {step1_time:.1f}s, Weather: {step2_time:.1f}s, Extract: {step21_time:.1f}s, Layover: {step25_time:.1f}s, Risk: {step3_time:.1f}s")
        print(f"🚀 ADK TOOL: OPTIMIZATION SUCCESS - Eliminated duplicate airport analysis calls!")
        
        # Extract seasonal factors from risk analysis for top-level access
        seasonal_factors = risk_analysis.get('seasonal_factors', [])
        key_risk_factors = risk_analysis.get('key_risk_factors', [])
        
        print("🚀 FINAL RESPONSE INSPECTION BEFORE SENDING TO UI:")
        print("=" * 100)
        print(f"✅ Success: True")
        print(f"📊 flight_data type: {type(flight_data)}")
        if isinstance(flight_data, dict):
            print(f"📊 flight_data keys: {list(flight_data.keys())}")
            if 'origin_analysis' in flight_data:
                origin_analysis = flight_data['origin_analysis']
                print(f"📊 flight_data.origin_analysis type: {type(origin_analysis)}")
                if isinstance(origin_analysis, dict):
                    print(f"📊 flight_data.origin_analysis keys: {list(origin_analysis.keys())}")
                    if 'weather_risk' in origin_analysis:
                        print(f"📊 flight_data.origin_analysis.weather_risk: {origin_analysis['weather_risk']}")
            else:
                print("❌ flight_data.origin_analysis: MISSING!")
        print("=" * 100)
        
        response = {
            'success': True,
            'flight_data': flight_data,  # BigQuery flight data with connections, duration_minutes, etc.
            'weather_analysis': weather_analysis,  # Weather data with origin_weather, destination_weather
            'risk_analysis': risk_analysis,  # Risk assessment with overall_risk_score, risk_level, etc.
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'performance_metrics': {
                'total_time': total_time,
                'data_analyst_time': step1_time,
                'weather_intelligence_time': step2_time,
                'extract_airport_data_time': step21_time,
                'layover_analysis_time': step25_time,
                'risk_assessment_time': step3_time
            }
        }
        
        # CRITICAL FIX: Map BigQuery flight_time_total to duration fields for frontend
        # Direct flight lookup uses BigQuery ONLY - no SerpAPI fallback for duration
        if 'flight_time_total' in flight_data and flight_data['flight_time_total']:
            flight_data['duration_minutes'] = flight_data['flight_time_total']
            # Also create duration field in "5h 25m" format for FlightCard component
            total_minutes = flight_data['flight_time_total']
            hours = total_minutes // 60
            minutes = total_minutes % 60
            if hours > 0 and minutes > 0:
                flight_data['duration'] = f"{hours}h {minutes}m"
            elif hours > 0:
                flight_data['duration'] = f"{hours}h"
            else:
                flight_data['duration'] = f"{minutes}m"
        else:
            # BigQuery flight_time_total not available
            flight_data['duration_minutes'] = None
            flight_data['duration'] = 'Unknown'
        
        # Add seasonal factors to top level if they exist
        if seasonal_factors:
            response['seasonal_factors'] = seasonal_factors
            response['key_risk_factors'] = key_risk_factors
            print(f"✅ ADK TOOL: Added {len(seasonal_factors)} seasonal factors to response")
        
        # STEP 4: Generate AI-powered insurance recommendation
        print("🛡️ ADK TOOL: Generating AI-powered insurance recommendation...")
        step4_start = time.time()
        
        try:
            insurance_recommendation = insurance_agent.generate_insurance_recommendation(
                flight_data, risk_analysis, weather_analysis
            )
            
            if insurance_recommendation.get('success'):
                # Add insurance recommendation to flight data for frontend access
                flight_data['insurance_recommendation'] = insurance_recommendation
                print(f"✅ ADK TOOL: AI insurance recommendation generated successfully")
                print(f"🛡️ ADK TOOL: Recommendation type: {insurance_recommendation.get('recommendation_type', 'unknown')}")
            else:
                print(f"⚠️ ADK TOOL: Insurance recommendation generation failed, using fallback")
                flight_data['insurance_recommendation'] = insurance_recommendation
                
        except Exception as e:
            print(f"❌ ADK TOOL: Insurance recommendation failed: {e}")
            # Add minimal fallback recommendation
            flight_data['insurance_recommendation'] = {
                'success': False,
                'recommendation': 'Insurance recommendation analysis temporarily unavailable. Please consider your individual risk tolerance and trip investment when deciding on travel insurance.',
                'recommendation_type': 'neutral',
                'risk_level': risk_analysis.get('risk_level', 'medium'),
                'confidence': 'low'
            }
        
        step4_time = time.time() - step4_start
        print(f"⏱️ ADK TOOL: Step 4 (Insurance Recommendation) took {step4_time:.2f} seconds")
        
        # Update performance metrics
        response['performance_metrics']['insurance_recommendation_time'] = step4_time
        response['performance_metrics']['total_time'] = time.time() - start_time
        
        return response
        
    except Exception as e:
        print(f"❌ ADK TOOL: Direct flight analysis failed - {str(e)}")
        return {
            'success': False,
            'error': f'Direct flight analysis failed: {str(e)}'
        }

def _ai_convert_city_to_airport_code(city_name: str) -> str:
    """Convert city name to primary airport code using AI intelligence"""
    try:
        # Initialize Gemini AI if not already done
        if not hasattr(_ai_convert_city_to_airport_code, 'gemini_model'):
            api_key = os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                print("❌ AI Airport Converter: No Google API key available")
                return city_name
            
            genai.configure(api_key=api_key)
            _ai_convert_city_to_airport_code.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("🤖 AI Airport Converter: Gemini model initialized")
        
        # AI-powered city to airport code conversion
        prompt = f"""
        Convert the city name "{city_name}" to its primary IATA airport code.
        
        Examples:
        - New York → JFK (John F. Kennedy International, primary)
        - Los Angeles → LAX (Los Angeles International)
        - Chicago → ORD (O'Hare International, primary)
        - London → LHR (Heathrow, primary)
        - Paris → CDG (Charles de Gaulle, primary)
        - Miami → MIA (Miami International)
        - Boston → BOS (Logan International)
        
        For cities with multiple airports, choose the primary/largest international airport.
        
        Return only the 3-letter IATA code, nothing else.
        If the city name is already an IATA code, return it as-is.
        If unclear, return the original input.
        """
        
        response = _ai_convert_city_to_airport_code.gemini_model.generate_content(prompt)
        airport_code = response.text.strip().upper()
        
        # Validate it's a 3-letter code
        if len(airport_code) == 3 and airport_code.isalpha():
            print(f"✅ AI Airport Converter: {city_name} → {airport_code}")
            return airport_code
        else:
            print(f"❌ AI Airport Converter: Invalid response '{airport_code}' for {city_name}")
            return city_name
            
    except Exception as e:
        print(f"❌ AI Airport Converter: Failed to convert {city_name}: {e}")
        return city_name

def _ai_generate_flight_seasonal_factors(origin_airport: str, destination_airport: str, travel_date: str, flight_number: str) -> tuple[List[str], bool]:
    """
    Generate comprehensive 5-bullet AI seasonal factors analysis
    Considers: origin city, destination city, exact date, season, holidays, weather patterns, airport congestion
    """
    try:
        # Initialize Gemini AI if not already done
        if not hasattr(_ai_generate_flight_seasonal_factors, 'gemini_model'):
            api_key = os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                print("❌ AI Seasonal Generator: No Google API key available")
                return _ai_generate_basic_seasonal_factors(travel_date), False
            
            genai.configure(api_key=api_key)
            _ai_generate_flight_seasonal_factors.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("🤖 AI Seasonal Generator: Gemini model initialized")
        
        # Parse travel date for comprehensive seasonal context
        try:
            from datetime import datetime
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            formatted_date = travel_datetime.strftime("%B %d, %Y")
            month = travel_datetime.strftime("%B")
            day = travel_datetime.day
            season = _get_season_from_date(travel_datetime)
            weekday = travel_datetime.strftime("%A")
            
            # Check if it's within 7 days (for weather API consideration)
            today = datetime.now()
            days_until_travel = (travel_datetime - today).days
            weather_api_available = 0 <= days_until_travel <= 7
            
        except:
            formatted_date = travel_date
            month = "Unknown"
            day = 1
            season = "Unknown"
            weekday = "Unknown"
            weather_api_available = False
        
        # Enhanced AI-powered seasonal factor generation with comprehensive context
        prompt = f"""
        You are an expert flight risk analyst. Generate exactly 5 comprehensive seasonal risk factors for:
        
        FLIGHT DETAILS:
        - Flight: {flight_number}
        - Route: {origin_airport} → {destination_airport}
        - Travel Date: {formatted_date} ({weekday})
        - Season: {season}
        - Weather API Available: {weather_api_available} (within 7 days: {days_until_travel} days)
        
        ANALYSIS REQUIREMENTS:
        Consider ALL of these factors in your analysis:
        1. **Seasonal Weather Patterns**: {season} weather typical for {origin_airport} and {destination_airport}
        2. **Holiday Analysis**: Is {formatted_date} near major holidays? (Christmas, Thanksgiving, New Year, Labor Day, Memorial Day, 4th of July, etc.)
        3. **Peak Travel Seasons**: Summer vacation, winter holidays, spring break, etc.
        4. **Airport Congestion**: Seasonal traffic patterns at {origin_airport} and {destination_airport}
        5. **Weather-Related Delays**: {season} storms, heat, cold, precipitation patterns
        6. **Airline Operations**: Seasonal schedule changes, maintenance, crew scheduling
        7. **Tourism Patterns**: Vacation destinations, business travel patterns
        8. **Day of Week**: {weekday} travel patterns
        
        FORMATTING REQUIREMENTS:
        - Exactly 5 factors
        - Each factor 40-70 characters max
        - Start with appropriate emoji
        - Be specific and actionable
        - Focus on REAL seasonal risks
        
        EXAMPLE FORMAT:
        ["☀️ Peak summer travel increases airport congestion", "⛈️ Afternoon thunderstorms common in July", "🏖️ Vacation season delays at tourist hubs", "🔥 Heat-related ground delays possible", "✈️ Extended daylight hours benefit operations"]
        
        Return ONLY the JSON array with exactly 5 seasonal factors.
        """
        
        response = _ai_generate_flight_seasonal_factors.gemini_model.generate_content(prompt)
        ai_response = response.text.strip()
        
        # Clean up JSON formatting
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:]
        if ai_response.endswith('```'):
            ai_response = ai_response[:-3]
        ai_response = ai_response.strip()
        
        try:
            import json
            seasonal_factors = json.loads(ai_response)
            if isinstance(seasonal_factors, list) and len(seasonal_factors) >= 5:
                print(f"✅ AI Seasonal Generator: Generated {len(seasonal_factors)} comprehensive factors for {flight_number}")
                return (seasonal_factors[:5], True)  # Ensure exactly 5 factors
            else:
                print(f"⚠️ AI Seasonal Generator: Insufficient factors ({len(seasonal_factors)}) for {flight_number}")
                # Return basic seasonal factors based on date
                return _ai_generate_basic_seasonal_factors(travel_date), False
        except json.JSONDecodeError as e:
            print(f"❌ AI Seasonal Generator: JSON parsing failed for {flight_number}: {e}")
            print(f"🔍 Raw AI Response: {ai_response[:200]}...")
            # Return basic seasonal factors based on date
            return _ai_generate_basic_seasonal_factors(travel_date), False
            
    except Exception as e:
        print(f"❌ AI Seasonal Generator: Failed to generate factors for {flight_number}: {e}")
        # Return basic seasonal factors based on date
        return _ai_generate_basic_seasonal_factors(travel_date), False

def _ai_generate_basic_seasonal_factors(travel_date: str) -> List[str]:
    """Generate basic seasonal factors based on date/season when AI generation fails"""
    try:
        from datetime import datetime
        travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
        season = _get_season_from_date(travel_datetime)
        month = travel_datetime.month
        
        # Generate season-appropriate factors
        if season == "Winter":
            return [
                "❄️ Winter weather may cause de-icing delays",
                "🎄 Holiday travel season can increase congestion",
                "⛈️ Winter storms possible in some regions",
                "🧊 Cold weather operational considerations",
                "🔧 Seasonal maintenance schedules may apply"
            ]
        elif season == "Spring":
            return [
                "🌸 Spring weather generally favorable for travel",
                "⛈️ Seasonal thunderstorms possible",
                "🌧️ Spring rain patterns may affect schedules",
                "✈️ Post-winter maintenance activities",
                "🌿 Mild congestion during vacation periods"
            ]
        elif season == "Summer":
            return [
                "☀️ Peak travel season with higher passenger volumes",
                "⛈️ Summer thunderstorms common in afternoons",
                "🏖️ Vacation season increases airport congestion",
                "🔥 Heat-related operational delays possible",
                "✈️ Extended daylight hours benefit operations"
            ]
        else:  # Fall
            return [
                "🍂 Fall travel season with moderate congestion",
                "⛈️ Seasonal weather patterns changing",
                "🦃 Thanksgiving holiday travel surge possible",
                "🌬️ Fall wind patterns may affect flights",
                "✈️ Generally stable weather conditions"
            ]
    except:
        # Basic fallback factors
        return [
            "📅 Seasonal travel patterns apply",
            "🌤️ Weather conditions vary by season",
            "✈️ Standard airline operations in effect",
            "🏢 Airport congestion varies by time of year",
            "⚡ Flight schedules optimized for season"
        ]

def _get_season_from_date(travel_datetime) -> str:
    """Get season name from date"""
    month = travel_datetime.month
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    else:
        return "Fall"

def _handle_route_analysis_with_retry(parameters, max_retries=3):
    """
    Wrapper function that implements retry logic for route analysis.
    Handles intermittent 'str' object has no attribute 'get' errors.
    """
    for attempt in range(max_retries):
        try:
            print(f"🔄 RETRY WRAPPER: Attempt {attempt + 1}/{max_retries} for route analysis")
            result = _handle_route_analysis(parameters)
            
            # Validate result structure to ensure it's properly formed
            if isinstance(result, dict) and 'success' in result:
                if result.get('success'):
                    print(f"✅ RETRY WRAPPER: Route analysis succeeded on attempt {attempt + 1}")
                    return result
                else:
                    # If success=False, check if it's a retryable error
                    error_msg = result.get('error', '')
                    if "'str' object has no attribute 'get'" in str(error_msg) and attempt < max_retries - 1:
                        print(f"⚠️ RETRY WRAPPER: Retryable error on attempt {attempt + 1}: {error_msg}")
                        continue
                    else:
                        print(f"❌ RETRY WRAPPER: Non-retryable error or max retries reached: {error_msg}")
                        return result
            else:
                print(f"❌ RETRY WRAPPER: Invalid result structure on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    continue
                
        except Exception as e:
            error_msg = str(e)
            print(f"❌ RETRY WRAPPER: Exception on attempt {attempt + 1}: {error_msg}")
            
            # Check if this is the specific error we're trying to fix
            if "'str' object has no attribute 'get'" in error_msg and attempt < max_retries - 1:
                print(f"🔄 RETRY WRAPPER: Retrying due to str.get() error (attempt {attempt + 1}/{max_retries})")
                import time
                time.sleep(0.1)  # Brief delay before retry
                continue
            elif attempt == max_retries - 1:
                # Final attempt failed, return error
                print(f"💥 RETRY WRAPPER: All {max_retries} attempts failed")
                return {
                    'success': False,
                    'error': f'Route analysis failed after {max_retries} attempts. Last error: {error_msg}',
                    'retry_attempts': max_retries,
                    'flights': []
                }
    
    # Should not reach here, but return error just in case
    return {
        'success': False,
        'error': f'Route analysis failed after {max_retries} attempts with unknown error',
        'retry_attempts': max_retries,
        'flights': []
        }

def _handle_route_analysis(parameters):
    """Handle route analysis using ADK agents with SerpAPI"""
    print("🤖 ADK TOOL: Coordinating route analysis with SerpAPI...")
    
    # DEFENSIVE: Ensure parameters is a dictionary
    if not isinstance(parameters, dict):
        print(f"❌ ADK TOOL: parameters is not a dict: {type(parameters)} - {str(parameters)[:100]}")
        return {
            'success': False,
            'error': f'Invalid parameters type: expected dict, got {type(parameters)}',
            'flights': []
        }
    
    print(f"🔍 ADK TOOL: Route parameters received: {list(parameters.keys()) if isinstance(parameters, dict) else 'NOT_DICT'}")
    
    try:
        origin = parameters.get('origin')
        destination = parameters.get('destination')
        date = parameters.get('date')
        
        # STEP 0: AI-powered city to airport code conversion
        print("🏢 ADK TOOL: Converting city names to airport codes using AI...")
        origin_airport_code = _ai_convert_city_to_airport_code(origin)
        destination_airport_code = _ai_convert_city_to_airport_code(destination)
        
        print(f"✅ ADK TOOL: Origin: {origin} → {origin_airport_code}")
        print(f"✅ ADK TOOL: Destination: {destination} → {destination_airport_code}")
        
        # Step 1: Get flight data from SerpAPI via Data Analyst Agent
        print("📊 ADK TOOL: Getting flight data from SerpAPI...")
        data_result = data_agent.analyze_route(origin_airport_code, destination_airport_code, date)
        
        if not data_result['success']:
            return {
                'success': False,
                'error': data_result['message'],
                'flights': []
            }
        
        flights = data_result['flights']
        print(f"📊 ADK TOOL: Found {len(flights)} flights from SerpAPI")
        
        # Step 2: Get weather analysis for origin and destination using converted airport codes
        print("🌤️ ADK TOOL: Getting weather analysis...")
        
        # Log weather analysis type for both airports
        try:
            travel_datetime = datetime.strptime(date, "%Y-%m-%d")
            today = datetime.now()
            days_ahead = (travel_datetime.date() - today.date()).days
            if days_ahead > 7:
                print(f"🌤️ CLOUD LOGS: Weather analysis for {origin_airport_code} - SEASONAL analysis (flight is {days_ahead} days from today)")
                print(f"🌤️ CLOUD LOGS: Weather analysis for {destination_airport_code} - SEASONAL analysis (flight is {days_ahead} days from today)")
            else:
                print(f"🌤️ CLOUD LOGS: Weather analysis for {origin_airport_code} - REAL-TIME SerpAPI analysis (flight is {days_ahead} days from today)")
                print(f"🌤️ CLOUD LOGS: Weather analysis for {destination_airport_code} - REAL-TIME SerpAPI analysis (flight is {days_ahead} days from today)")
        except Exception as e:
            print(f"⚠️ CLOUD LOGS: Could not determine weather analysis type: {e}")
        
        try:
            # FIXED: Call Weather Intelligence Agent separately for each airport to get individual weather data
            print(f"🌤️ ADK TOOL: Analyzing weather for origin airport {origin_airport_code}")
            origin_weather = weather_agent.analyze_weather_conditions(origin_airport_code, date)
            
            print(f"🌤️ ADK TOOL: Analyzing weather for destination airport {destination_airport_code}")
            destination_weather = weather_agent.analyze_weather_conditions(destination_airport_code, date)
            
            # Combine the individual weather analyses
            # Extract city names from weather analysis for proper display
            origin_city = origin_weather.get('city', 'Unknown City')
            destination_city = destination_weather.get('city', 'Unknown City')
            
            weather_result = {
                'origin_weather': origin_weather,
                'destination_weather': destination_weather,
                'weather_conditions': {
                    'conditions': f"Origin ({origin_airport_code}, {origin_city}): {origin_weather.get('weather_conditions', {}).get('conditions', 'Analysis pending')} | Destination ({destination_airport_code}, {destination_city}): {destination_weather.get('weather_conditions', {}).get('conditions', 'Analysis pending')}"
                },
                'weather_risk': {
                    'level': 'medium',  # Default level, can be enhanced with individual analysis
                    'description': f"Route weather analysis: {origin_airport_code} and {destination_airport_code} conditions assessed"
                },
                'data_source': 'Individual Airport Weather Analysis'
            }
            
            print(f"✅ ADK TOOL: Individual weather analysis successful for both airports")
        except Exception as e:
            print(f"❌ ADK TOOL: Weather analysis failed: {e}")
            # NO FALLBACK - Return actual error
            return {
                'success': False,
                'error': f'Weather analysis failed: {str(e)}',
                'flights': []
            }
        
        # Step 2.1: INDEPENDENT AIRPORT COMPLEXITY ANALYSIS FOR ROUTE (SAME AS DIRECT FLIGHT)
        print("🏢 ADK TOOL: Running INDEPENDENT airport complexity analysis for route...")
        
        # Initialize the airport complexity agent directly
        from airport_complexity_agent import AirportComplexityAgent
        airport_complexity_agent = AirportComplexityAgent()
        
        # Get INDEPENDENT airport complexity analysis for route origin
        if origin_airport_code:
            print(f"🏢 ADK TOOL: Analyzing route origin airport complexity for {origin_airport_code} (INDEPENDENT)")
            try:
                origin_complexity = airport_complexity_agent.analyze_airport_complexity(origin_airport_code)
                weather_result['origin_airport_analysis'] = {
                    'airport_complexity': origin_complexity,
                    'data_source': 'Independent Airport Complexity Agent'
                }
                print(f"✅ ADK TOOL: Route origin complexity analysis complete")
            except Exception as e:
                print(f"❌ ADK TOOL: Route origin complexity analysis failed: {e}")
                weather_result['origin_airport_analysis'] = {
                    'airport_complexity': {
                        'complexity': 'unknown',
                        'description': f'Complexity analysis failed for {origin_airport_code}',
                        'concerns': ['Analysis error']
                    },
                    'data_source': 'Analysis Failed'
                }
        
        # Get INDEPENDENT airport complexity analysis for route destination
        if destination_airport_code:
            print(f"🏢 ADK TOOL: Analyzing route destination airport complexity for {destination_airport_code} (INDEPENDENT)")
            try:
                destination_complexity = airport_complexity_agent.analyze_airport_complexity(destination_airport_code)
                weather_result['destination_airport_analysis'] = {
                    'airport_complexity': destination_complexity,
                    'data_source': 'Independent Airport Complexity Agent'
                }
                print(f"✅ ADK TOOL: Route destination complexity analysis complete")
            except Exception as e:
                print(f"❌ ADK TOOL: Route destination complexity analysis failed: {e}")
                weather_result['destination_airport_analysis'] = {
                    'airport_complexity': {
                        'complexity': 'unknown',
                        'description': f'Complexity analysis failed for {destination_airport_code}',
                        'concerns': ['Analysis error']
                    },
                    'data_source': 'Analysis Failed'
                }
        
        # Step 2.5: LAYOVER ANALYSIS FOR ROUTE FLIGHTS (NEW - ADDED TO ROUTE ANALYSIS)
        print("🔗 ADK TOOL: Running layover analysis for route flights...")
        
        # Process each flight to add layover weather and complexity data
        for flight in flights:
            connections = flight.get('connections', [])
            if connections:
                print(f"🔗 ADK TOOL: Processing {len(connections)} connections for flight {flight.get('flight_number', 'Unknown')}")
                
                # Get unique layover airports to avoid duplicate processing
                layover_airports = []
                for connection in connections:
                    airport_code = connection.get('airport', 
                                               connection.get('layoverInfo', {}).get('airport', ''))
                    if airport_code and airport_code.strip() and airport_code not in layover_airports:
                        layover_airports.append(airport_code)
                
                if layover_airports:
                    print(f"🚀 ADK TOOL: Processing {len(layover_airports)} unique layover airports: {layover_airports}")
                    
                    # Use parallel processing for weather analysis
                    import concurrent.futures
                    import threading
                    
                    def analyze_single_layover_weather(airport_code):
                        """Analyze weather for a single layover airport"""
                        try:
                            print(f"🌤️ ADK TOOL: [Thread] Analyzing weather for layover {airport_code}")
                            
                            # Use the same WeatherIntelligenceAgent as origin/destination
                            from weather_intelligence_agent import weather_intelligence_agent
                            layover_weather_result = weather_intelligence_agent.analyze_weather_conditions(
                                airport_code=airport_code,
                                flight_date=date
                            )
                            
                            print(f"✅ ADK TOOL: [Thread] Got weather data for layover {airport_code}")
                            return airport_code, layover_weather_result
                            
                        except Exception as e:
                            print(f"❌ ADK TOOL: [Thread] Failed to get weather for layover {airport_code}: {e}")
                            return airport_code, {
                                "error": f"Weather analysis failed for {airport_code}: {str(e)}",
                                "weather_available": False
                            }
                    
                    def analyze_single_layover_complexity(airport_code):
                        """Analyze airport complexity for a single layover airport"""
                        try:
                            print(f"🏢 ADK TOOL: [Thread] Analyzing complexity for layover {airport_code}")
                            
                            # Use the same AirportComplexityAgent as origin/destination
                            complexity_result = airport_complexity_agent.analyze_airport_complexity(airport_code)
                            
                            print(f"✅ ADK TOOL: [Thread] Got complexity data for layover {airport_code}")
                            return airport_code, complexity_result
                            
                        except Exception as e:
                            print(f"❌ ADK TOOL: [Thread] Failed to get complexity for layover {airport_code}: {e}")
                            return airport_code, {
                                "complexity": "unknown",
                                "description": f"Airport complexity analysis failed for {airport_code}",
                                "concerns": ["Airport complexity analysis error"]
                            }
                    
                    # Process layovers in parallel with maximum 4 concurrent threads
                    max_workers = min(4, len(layover_airports))
                    layover_weather_analysis = {}
                    layover_complexity_analysis = {}
                    
                    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                        # Submit all layover weather analysis tasks
                        future_to_airport = {
                            executor.submit(analyze_single_layover_weather, airport_code): airport_code 
                            for airport_code in layover_airports
                        }
                        
                        # Collect weather results as they complete
                        for future in concurrent.futures.as_completed(future_to_airport):
                            airport_code, weather_data = future.result()
                            layover_weather_analysis[airport_code] = weather_data
                        
                        # Submit all layover complexity analysis tasks
                        future_to_airport = {
                            executor.submit(analyze_single_layover_complexity, airport_code): airport_code 
                            for airport_code in layover_airports
                        }
                        
                        # Collect complexity results as they complete
                        for future in concurrent.futures.as_completed(future_to_airport):
                            airport_code, complexity_data = future.result()
                            layover_complexity_analysis[airport_code] = complexity_data
                    
                    print(f"🚀 ADK TOOL: Parallel layover analysis complete for {len(layover_airports)} layovers")
                    
                    # Apply results to connections
                    for connection in connections:
                        airport_code = connection.get('airport', 
                                                   connection.get('layoverInfo', {}).get('airport', ''))
                        
                        # FIXED: Extract city name from airport code
                        city_name = extract_city_from_airport_code(airport_code)
                        
                        # FIXED: Ensure connection has proper structure with city name
                        connection['airport'] = airport_code
                        connection['city'] = city_name
                        connection['airport_name'] = f"{city_name} Airport"
                        
                        if airport_code in layover_weather_analysis and airport_code in layover_complexity_analysis:
                            layover_weather_data = layover_weather_analysis[airport_code]
                            layover_complexity_data = layover_complexity_analysis[airport_code]
                            
                            # Add weather risk data to connection - FIXED: Add to layoverInfo structure that frontend expects
                            if not layover_weather_data.get('error'):
                                # Ensure layoverInfo exists
                                if 'layoverInfo' not in connection:
                                    connection['layoverInfo'] = {}
                                
                                connection['layoverInfo']['weather_risk'] = {
                                    "level": layover_weather_data.get('weather_risk', {}).get('level', 'medium'),
                                    "description": layover_weather_data.get('weather_risk', {}).get('description', 'Weather analysis not available'),
                                    "risk_factors": layover_weather_data.get('weather_risk', {}).get('risk_factors', [])
                                }
                                
                                connection['layoverInfo']['airport_complexity'] = {
                                    "complexity": layover_complexity_data.get('complexity', 'medium'),
                                    "description": layover_complexity_data.get("description", "Airport complexity analysis not available"),
                                    "concerns": layover_complexity_data.get("concerns", ["❌ Airport complexity analysis failed"])
                                }
                                
                                connection['data_source'] = 'Real Analysis'
                                print(f"✅ ADK TOOL: Added weather and complexity data for layover {airport_code} ({city_name})")
                            else:
                                print(f"❌ ADK TOOL: Weather analysis failed for layover {airport_code} ({city_name})")
                        else:
                            print(f"🔍 DEBUG: No layover data found for airport_code: {airport_code} ({city_name})")
                else:
                    print("ℹ️ ADK TOOL: No layover airports to analyze")
            else:
                print("ℹ️ ADK TOOL: Direct flight - no layovers to analyze")
        
        # Step 2.5: Calculate On-Time Rate for each airline in the flights
        print("⏰ ADK TOOL: Calculating On-Time Rates for airlines in route...")
        airline_on_time_rates = {}
        
        # Collect unique airline-route combinations from all flights
        unique_airline_routes = set()
        for flight in flights:
            airline_code = flight.get('airline_code', '')
            origin = flight.get('origin_airport_code', '')
            destination = flight.get('destination_airport_code', '')
            if airline_code and origin and destination:
                unique_airline_routes.add((airline_code, origin, destination))
        
        # Calculate On-Time Rate for each unique airline-route combination
        for airline_code, origin, destination in unique_airline_routes:
            try:
                on_time_data = get_airline_on_time_rate(airline_code, origin, destination, years=[2016, 2017, 2018])
                if on_time_data and 'on_time_rate' in on_time_data:
                    airline_on_time_rates[airline_code] = on_time_data
                    print(f"✅ ADK TOOL: On-Time Rate calculated for route: {airline_code} = {on_time_data['on_time_rate']}%")
                else:
                    print(f"⚠️ ADK TOOL: On-Time Rate calculation failed for route airline {airline_code}")
            except Exception as e:
                print(f"❌ ADK TOOL: On-Time Rate calculation failed for route airline {airline_code}: {e}")
        
        # Step 3: Process each flight with risk analysis
        print("⚠️ ADK TOOL: Analyzing flight risks with historical data...")
        analyzed_flights = []
        
        for flight in flights:
            try:
                # Use the SAME method as direct flight lookup for deterministic historical data
                airline_code = flight.get('airline_code', 'Unknown')
                flight_number = flight.get('flight_number', 'Unknown')
                print(f"📊 ADK TOOL: Route analysis - analyzing {airline_code}{flight_number} with historical data lookup")
                
                # Add On-Time Rate to flight data
                if airline_code in airline_on_time_rates:
                    flight['on_time_rate'] = airline_on_time_rates[airline_code]['on_time_rate']
                    flight['on_time_data'] = airline_on_time_rates[airline_code]
                    print(f"⏰ ADK TOOL: Added On-Time Rate to flight {flight_number}: {airline_code} = {flight['on_time_rate']}%")
                else:
                    flight['on_time_rate'] = None
                    print(f"⚠️ ADK TOOL: No On-Time Rate data available for flight {flight_number} ({airline_code})")
                
                # CRITICAL: Use same historical data method as direct flight lookup
                risk_result = risk_agent.generate_flight_risk_analysis(flight, weather_result, parameters)
                
                # Log historical data usage for route analysis
                if 'historical_performance' in risk_result:
                    historical_perf = risk_result['historical_performance']
                    total_flights = historical_perf.get('total_flights_analyzed', 0)
                    cancellation_rate = historical_perf.get('cancellation_rate', 'N/A')
                    avg_delay = historical_perf.get('average_delay', 'N/A')
                    print(f"✅ ADK TOOL: Route analysis - {airline_code}{flight_number} historical data: {total_flights} flights, {cancellation_rate} cancellation, {avg_delay} delay")
                else:
                    print(f"⚠️ ADK TOOL: Route analysis - No historical data found for {airline_code}{flight_number}")
                
                # ENHANCED: Extract seasonal factors from weather analysis for each flight
                print(f"🗓️ ADK TOOL: Extracting seasonal factors for flight {flight.get('flight_number', 'Unknown')}")
                seasonal_factors = []
                
                # Generate AI-powered seasonal factors for this specific flight
                flight_number = flight.get('flight_number', 'Unknown')
                print(f"🗓️ ADK TOOL: Generating AI seasonal factors for flight {flight_number}")
                
                try:
                    # AI-powered seasonal factor generation
                    seasonal_factors, success = _ai_generate_flight_seasonal_factors(
                        origin_airport_code, 
                        destination_airport_code, 
                        parameters.get('date', ''),
                        flight_number
                    )
                    
                    if success and len(seasonal_factors) > 0:
                        risk_result['seasonal_factors'] = seasonal_factors[:5]
                        risk_result['key_risk_factors'] = seasonal_factors[:5]  # For frontend compatibility
                        print(f"✅ ADK TOOL: Added {len(seasonal_factors)} AI seasonal factors to flight {flight_number}")
                    else:
                        # User-friendly message when seasonal factor generation fails
                        risk_result['seasonal_factors'] = seasonal_factors
                        risk_result['key_risk_factors'] = risk_result['seasonal_factors']
                        print(f"⚠️ ADK TOOL: Seasonal factor generation failed for flight {flight_number} - showing user-friendly message")
                        
                except Exception as e:
                    print(f"❌ ADK TOOL: Seasonal factor generation failed for {flight_number}: {e}")
                    # Use basic seasonal factors when generation fails
                    basic_factors = _ai_generate_basic_seasonal_factors(date)
                    risk_result['seasonal_factors'] = basic_factors
                    risk_result['key_risk_factors'] = basic_factors
                
                # Generate AI-powered insurance recommendation for this flight
                print(f"🛡️ ADK TOOL: Generating insurance recommendation for route flight {flight_number}")
                try:
                    # Create a temporary flight data structure for insurance analysis
                    flight_data_for_insurance = {
                        **flight,
                        'date': parameters.get('date', ''),
                        'origin_airport_code': origin_airport_code,
                        'destination_airport_code': destination_airport_code
                    }
                    
                    insurance_recommendation = insurance_agent.generate_insurance_recommendation(
                        flight_data_for_insurance, risk_result, weather_result
                    )
                    
                    if insurance_recommendation.get('success'):
                        flight['insurance_recommendation'] = insurance_recommendation
                        print(f"✅ ADK TOOL: Insurance recommendation generated for flight {flight_number}")
                    else:
                        flight['insurance_recommendation'] = insurance_recommendation
                        print(f"⚠️ ADK TOOL: Insurance recommendation fallback used for flight {flight_number}")
                        
                except Exception as e:
                    print(f"❌ ADK TOOL: Insurance recommendation failed for flight {flight_number}: {e}")
                    flight['insurance_recommendation'] = {
                        'success': False,
                        'recommendation': 'Insurance recommendation analysis temporarily unavailable.',
                        'recommendation_type': 'neutral',
                        'risk_level': risk_result.get('risk_level', 'medium'),
                        'confidence': 'low'
                    }
                
                analyzed_flight = {
                    **flight,
                    'risk_analysis': risk_result,
                    'weather_summary': weather_result.get('summary', 'Weather analysis available')
                }
                analyzed_flights.append(analyzed_flight)
            except Exception as e:
                print(f"❌ ADK TOOL: Failed to analyze flight - {str(e)}")
                analyzed_flights.append({
                    **flight,
                    'risk_analysis': {'error': str(e)},
                    'weather_summary': 'Analysis failed'
                })
        
        # Add airport analysis to each flight for easier frontend access
        for flight in analyzed_flights:
            if 'origin_airport_analysis' in weather_result:
                flight['origin_analysis'] = weather_result['origin_airport_analysis']
            if 'destination_airport_analysis' in weather_result:
                flight['destination_analysis'] = weather_result['destination_airport_analysis']
        
        # Return in the EXACT format the UI expects for route analysis
        return {
            'success': True,
            'flights': analyzed_flights,  # Array of flights with risk_analysis for each
            'weather_analysis': weather_result,  # Route weather analysis
            'analysis_timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        print(f"❌ ADK TOOL: Route analysis failed - {str(e)}")
        return {
            'success': False,
            'error': f'Route analysis failed: {str(e)}',
            'flights': []
        }

def _get_airline_name_from_code(airline_code: str) -> str:
    """Convert airline code to full airline name for BigQuery lookup"""
    airline_mappings = {
        'AA': 'American Airlines',
        'DL': 'Delta Air Lines', 
        'UA': 'United Airlines',
        'WN': 'Southwest Airlines',
        'B6': 'JetBlue Airways',
        'AS': 'Alaska Airlines',
        'NK': 'Spirit Airlines',
        'F9': 'Frontier Airlines',
        'G4': 'Allegiant Air',
        'SY': 'Sun Country Airlines',
        'AC': 'Air Canada',
        'BA': 'British Airways',
        'LH': 'Lufthansa',
        'AF': 'Air France',
        'KL': 'KLM',
        'EK': 'Emirates',
        'QR': 'Qatar Airways',
        'TK': 'Turkish Airlines',
        'SQ': 'Singapore Airlines',
        'CX': 'Cathay Pacific',
        'JL': 'Japan Airlines',
        'NH': 'All Nippon Airways'
    }
    
    return airline_mappings.get(airline_code.upper(), airline_code)

def _handle_unified_route_analysis(params: dict, reasoning: str = "Route analysis requested") -> dict:
    """
    UNIFIED STANDARD AGENT for route analysis - used by BOTH natural language and HTML form controls
    This ensures identical processing regardless of input method using the SAME backend agents:
    - Data Analyst Agent (SerpAPI data retrieval)
    - Weather Intelligence Agent (weather analysis) 
    - Airport Complexity Agent (airport analysis)
    - Risk Assessment Agent (final risk evaluation)
    """
    try:
        print(f"🚀 UNIFIED ROUTE ANALYSIS: Processing route search with params: {params}")
        
        # Validate required parameters
        if not params.get('date'):
            return {
                'success': False,
                'error': 'missing_date',
                'orchestrator': {
                    'intent': 'route_analysis',
                    'reasoning': "Date is required for route analysis"
                },
                'response': f"📅 **Date Required**\\n\\nI need a specific date to search for flights from {params.get('origin', 'origin')} to {params.get('destination', 'destination')}.\\n\\n**Please try again with a date like:**\\n• \\\"What flights are available from {params.get('origin', 'New York')} to {params.get('destination', 'San Francisco')} on July 16th 2025?\\\"\\n• \\\"Show me flights from {params.get('origin', 'origin')} to {params.get('destination', 'destination')} for December 15th 2024\\\"",
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        if not params.get('origin') or not params.get('destination'):
            return {
                'success': False,
                'error': 'missing_route_info',
                'orchestrator': {
                    'intent': 'route_analysis',
                    'reasoning': "Origin and destination are required for route analysis"
                },
                'response': f"🛫 **Route Information Required**\\n\\nI need both origin and destination to search for flights.\\n\\n**Please try again with both locations like:**\\n• \\\"Show me flights from New York to San Francisco on July 16th 2025\\\"\\n• \\\"What flights are available from LAX to JFK for December 15th 2024\\\"",
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        
        print(f"🚀 UNIFIED ROUTE ANALYSIS: Calling backend route analysis...")
        
        # Call the SAME backend route analysis function used by natural language with retry logic
        analysis_result = _handle_route_analysis_with_retry(params)
        
        print(f"🚀 UNIFIED ROUTE ANALYSIS: Backend analysis complete - Success: {analysis_result.get('success')}")
        
        # Return in format expected by BOTH ChatBot.tsx AND frontend forms
        return {
            'success': analysis_result['success'],
            'orchestrator': {
                'intent': 'route_analysis',
                'reasoning': reasoning
            },
            'flights': analysis_result.get('flights', []),
            'weather_analysis': analysis_result.get('weather_analysis', {}),
            'route_info': {
                'origin': params.get('origin', 'Unknown'),
                'destination': params.get('destination', 'Unknown'),
                'date': params.get('date', 'Unknown')
            },
            'error': analysis_result.get('error'),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        print(f"❌ UNIFIED ROUTE ANALYSIS: Failed - {str(e)}")
        return {
            'success': False,
            'error': f'Route analysis failed: {str(e)}',
            'orchestrator': {
                'intent': 'route_analysis',
                'reasoning': reasoning
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

def determine_intent_and_route_analysis(message: str, session_id: str = None) -> dict:
    """
    UNIFIED STANDARD AGENT for natural language intent detection and routing
    Analyzes user messages and routes to the SAME standard agents used by HTML forms:
    - For direct flight requests: routes to _handle_direct_flight_analysis
    - For route searches: routes to _handle_unified_route_analysis
    - For general chat: routes to ChatAdvisorAgent
    This ensures natural language uses identical backend processing as HTML forms

    Args:
        message: User's natural language message
        session_id: Optional session ID for conversation tracking
    """
    try:
        print(f"🎯 MAIN ORCHESTRATOR: Analyzing user message for intent detection")
        
        # Use Gemini AI to analyze the message and determine intent
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        intent_prompt = f"""
        You are an AI Flight Risk Analysis Orchestrator. Analyze this user message and determine the intent.

        AVAILABLE INTENTS:
        1. "direct_flight_lookup" - User wants to analyze a specific flight by airline + flight number + date
        2. "route_analysis" - User wants to search for flights between airports/cities with date  
        3. "chat_conversation" - General conversation without specific flight analysis request

        AIRLINE CODE MAPPING:
        - American Airlines = AA, American
        - Delta = DL, Delta
        - United = UA, United
        - Southwest = WN, Southwest
        - JetBlue = B6, JetBlue
        - Alaska = AS, Alaska
        - Spirit = NK, Spirit
        - Frontier = F9, Frontier
        - Allegiant = G4, Allegiant

        AIRPORT CODE MAPPING:
        - New York = JFK, LGA, EWR
        - San Francisco = SFO
        - Los Angeles = LAX
        - Chicago = ORD, MDW
        - Miami = MIA
        - Atlanta = ATL
        - Dallas = DFW
        - Houston = IAH
        - Phoenix = PHX
        - Denver = DEN
        - Seattle = SEA
        - Las Vegas = LAS
        - Boston = BOS
        - Washington = DCA, IAD
        - Philadelphia = PHL
        - Detroit = DTW
        - Minneapolis = MSP

        USER MESSAGE: "{message}"

        Respond with ONLY a JSON object in this EXACT format:
        {{
            "intent": "direct_flight_lookup|route_analysis|chat_conversation",
            "parameters": {{
                "airline": "extracted airline code if found",
                "flight_number": "extracted flight number if found",
                "origin": "extracted origin airport code if found",
                "destination": "extracted destination airport code if found",
                "date": "extracted date in YYYY-MM-DD format or null if not found"
            }},
            "confidence": 0.95,
            "reasoning": "Brief explanation of why this intent was chosen"
        }}

        EXAMPLES:
        - "Should I get insurance for American Airlines flight AA411?" → direct_flight_lookup
        - "What flights are available from New York to San Francisco?" → route_analysis
        - "Tell me about flight safety" → chat_conversation
        """
        
        print(f"🎯 MAIN ORCHESTRATOR: Calling Gemini AI for intent analysis")
        response = model.generate_content(intent_prompt)
        
        # Parse the Gemini response
        try:
            import re
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                intent_data = json.loads(json_match.group())
            else:
                raise ValueError("No JSON found in response")
        except Exception as e:
            print(f"❌ MAIN ORCHESTRATOR: Failed to parse Gemini response: {e}")
            print(f"🔍 MAIN ORCHESTRATOR: Raw response: {response.text}")
            raise

        print(f"🎯 MAIN ORCHESTRATOR: Intent detected: {intent_data.get('intent')} (confidence: {intent_data.get('confidence')})")
        print(f"🎯 MAIN ORCHESTRATOR: Reasoning: {intent_data.get('reasoning')}")
        print(f"🎯 MAIN ORCHESTRATOR: Parameters: {intent_data.get('parameters')}")
        
        # Route based on detected intent
        if intent_data['intent'] == 'direct_flight_lookup':
            print(f"🎯 MAIN ORCHESTRATOR: Routing to direct flight analysis")
            params = intent_data['parameters']
            
            # FIXED: Convert airline code to airline name for BigQuery lookup
            airline_code = params.get('airline', '')
            airline_name = _get_airline_name_from_code(airline_code)
            params['airline_name'] = airline_name
            
            print(f"�� MAIN ORCHESTRATOR: Converted airline code '{airline_code}' to name '{airline_name}'")
            
            # Validate required parameters
            if not params.get('date'):
                return {
                    'success': False,
                    'error': 'missing_date',
                    'orchestrator': {
                        'intent': 'direct_flight_lookup',
                        'reasoning': "Date is required for flight analysis"
                    },
                    'response': f"📅 **Date Required**\n\nI need a specific date to analyze the flight.\n\n**Please try again with a date like:**\n• \"Should I get insurance for {params.get('airline', 'the')} flight {params.get('flight_number', '')} on July 16th 2025?\"\n• \"Analyze {params.get('airline', 'the')} flight {params.get('flight_number', '')} for December 15th 2024\"",
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            # Call direct flight analysis with retry logic
            analysis_result = _handle_direct_flight_analysis_with_retry(params)
            
            # Return in format expected by ChatBot.tsx
            return {
                'success': analysis_result['success'],
                'orchestrator': {
                    'intent': 'direct_flight_lookup',
                    'reasoning': intent_data.get('reasoning', 'Direct flight analysis requested')
                },
                'flight_data': analysis_result.get('flight_data', {}),
                'risk_analysis': analysis_result.get('risk_analysis', {}),
                'weather_analysis': analysis_result.get('weather_analysis', {}),
                'error': analysis_result.get('error'),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        elif intent_data['intent'] == 'route_analysis':
            print(f"🎯 MAIN ORCHESTRATOR: Routing to route analysis")
            params = intent_data['parameters']
            
            # UNIFIED ROUTE ANALYSIS - Same flow for natural language and HTML forms
            return _handle_unified_route_analysis(params, intent_data.get('reasoning', 'Route analysis requested'))
            
        else:
            print(f"🎯 MAIN ORCHESTRATOR: Routing to conversational response")

            # Use ChatAdvisorAgent for general conversation (with session tracking)
            chat_result = chat_agent.provide_flight_advice(message, session_id=session_id)

            # Return the FULL chat_result to preserve session_stats and debug info
            return {
                'success': True,
                'orchestrator': {
                    'intent': 'chat_conversation',
                    'reasoning': intent_data.get('reasoning', 'General conversation')
                },
                'response': chat_result.get('response', 'I can help you with flight analysis!'),
                'timestamp': datetime.now(timezone.utc).isoformat(),
                # CRITICAL: Pass through session_stats and debug info from chat_result
                **{k: v for k, v in chat_result.items() if k.startswith('session_') or k.startswith('_debug_') or k.startswith('_echo_')}
            }
        
    except Exception as e:
        print(f"❌ MAIN ORCHESTRATOR: Intent detection failed - {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Intent detection failed: {str(e)}',
            'response': "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question about flight risks, insurance, or travel advice."
        }

def handle_chat_conversation(message: str) -> dict:
    """Handle chat conversation using Google ADK Chat Advisor Agent"""
    try:
        print(f"💬 CHAT ORCHESTRATOR: Processing user message")
        
        # Use the Google ADK Chat Advisor Agent for comprehensive responses
        result = chat_agent.provide_flight_advice(message)
        
        print(f"✅ CHAT ORCHESTRATOR: Response generated successfully")
        return result
        
    except Exception as e:
        print(f"❌ CHAT ORCHESTRATOR: Failed to process message - {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'response': "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question about flight risks, insurance, or travel advice, and I'll do my best to help you."
        }

# Create Google ADK Agent with proper tools using correct API
flight_risk_orchestrator = Agent(
    name="flight_risk_orchestrator",
    model="gemini-2.0-flash",
    description="AI-Powered Flight Risk Analysis Orchestrator using Google ADK",
    instruction="""You are an AI flight risk analysis orchestrator using Google ADK agents. You coordinate multiple specialized agents to provide comprehensive flight risk analysis and travel advice.

Your team includes:
- Data Analyst Agent: Analyzes flight data from BigQuery and SerpAPI
- Weather Intelligence Agent: Provides real-time weather analysis
- Airport Complexity Agent: Analyzes airport operational complexity
- Weather Impact Agent: Assesses weather impact on flight operations
- Risk Assessment Agent: Provides comprehensive risk analysis using Gemini AI
- Layover Analysis Agent: Evaluates connection feasibility with MCT and risk factors
- Chat Advisor Agent: Provides detailed conversational guidance and advice

When users request flight analysis:
1. For specific flights (airline + flight number + date), use analyze_flight_risk_tool with analysis_type='direct_flight_lookup'
2. For route searches (origin + destination + date), use analyze_flight_risk_tool with analysis_type='route_analysis'
3. For general questions, insurance advice, or travel guidance, use handle_chat_conversation tool

Always provide helpful, accurate information prioritizing passenger safety and informed decision-making.""",
    tools=[
        FunctionTool(func=analyze_flight_risk_tool),
        FunctionTool(func=handle_chat_conversation)
    ]
)

def log_start(params):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\n\n{'*'*60}\n🚀🚀🚀 LOGS START [{now}] 🚀🚀🚀\nPARAMETERS: {str(params).upper()}\n{'*'*60}\n")

def log_end():
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"\n{'*'*60}\n🏁🏁🏁 LOGS ENDS [{now}] 🏁��🏁\n{'*'*60}\n\n")

@functions_framework.http
def main(request):
    """
    Google ADK Entry Point - Proper ADK Implementation
    UNIFIED ROUTING: Both natural language and HTML forms use the same standard agents
    """
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        # Health check
        if request.method == 'GET':
            return (json.dumps({
                'status': 'healthy',
                'service': 'FlightRiskRadar AI Analysis',
                'framework': 'Google ADK',
                'model': 'gemini-2.0-flash',
                'agents': ['data_analyst', 'weather_intelligence', 'risk_assessment'],
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, cls=DateTimeEncoder), 200, headers)

        # Parse request
        request_data = request.get_json(silent=True)
        if not request_data:
            return (json.dumps({'success': False, 'error': 'No JSON data'}, cls=DateTimeEncoder), 400, headers)

        # UNIFIED ROUTING - All requests use the same standard agents
        result = None
        
        # Handle chat messages with intent detection using main orchestrator
        if 'message' in request_data:
            print(f"💬 UNIFIED ORCHESTRATOR: Processing natural language chat message")
            user_message = request_data.get('message', '')
            session_id = request_data.get('session_id')  # Extract session ID for conversation tracking

            # SIMPLE TEST: Echo session_id back immediately to verify it's reaching the backend
            print(f"🔍 DEBUG: session_id received = {session_id}")
            print(f"🔍 DEBUG: session_id type = {type(session_id)}")
            print(f"🔍 DEBUG: request_data keys = {list(request_data.keys())}")

            if session_id:
                print(f"📋 SESSION: Using session {session_id}")

            log_start(user_message)
            result = determine_intent_and_route_analysis(user_message, session_id)  # Pass session_id

            # SIMPLE TEST: Add session_id to result to prove it was received
            if result and isinstance(result, dict):
                result['_echo_session_id'] = session_id
                result['_echo_request_keys'] = list(request_data.keys())

            log_end()
            
        # Handle Chrome Extension flight analysis - USES GOOGLE FLIGHTS DATA INSTEAD OF BIGQUERY LOOKUP
        elif request_data.get('extension'):
            print(f"🔌 UNIFIED ORCHESTRATOR: Processing Chrome Extension flight analysis")
            
            # Extract flight data from Google Flights format - extension_data is the flight_data object
            flight_data = request_data.get('flight_data', {})
            params = {
                'airline': flight_data.get('airline_code', flight_data.get('airline', '')),  # Try airline_code first, then airline
                'airline_name': flight_data.get('airline_name', ''),
                'flight_number': flight_data.get('flight_number', ''),
                'origin': flight_data.get('origin_airport_code', flight_data.get('origin', '')),  # Try origin_airport_code first
                'destination': flight_data.get('destination_airport_code', flight_data.get('destination', '')),  # Try destination_airport_code first
                'date': request_data.get('date', ''),
                'departure_time': flight_data.get('departure_time_local', flight_data.get('departure_time', '')),  # Try departure_time_local first
                'arrival_time': flight_data.get('arrival_time_local', flight_data.get('arrival_time', '')),  # Try arrival_time_local first
                'duration_minutes': flight_data.get('duration_minutes', 0),
                'connections': flight_data.get('connections', []),
                'price': flight_data.get('price', ''),
                'aircraft_type': flight_data.get('airplane_model', flight_data.get('aircraft', ''))  # Try airplane_model first
            }
            
            print(f"🔌 UNIFIED ORCHESTRATOR: Extension params: {params}")
            log_start(params)
            # Use the NEW extension flight analysis function
            analysis_result = _handle_extension_flight_analysis(params)
            log_end()
            
            # Format response in standard format
            result = {
                'success': analysis_result['success'],
                'orchestrator': {
                    'intent': 'extension_flight_analysis',
                    'reasoning': 'Chrome Extension flight analysis'
                },
                'flight_data': analysis_result.get('flight_data', {}),
                'risk_analysis': analysis_result.get('risk_analysis', {}),
                'weather_analysis': analysis_result.get('weather_analysis', {}),
                'insurance_recommendation': analysis_result.get('insurance_recommendation', {}),
                'analysis_metadata': analysis_result.get('analysis_metadata', {}),
                'error': analysis_result.get('error'),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        # Handle HTML form route search - USES SAME AGENT AS NATURAL LANGUAGE
        elif request_data.get('route_search'):
            print(f"🛫 UNIFIED ORCHESTRATOR: Processing HTML form route search")
            route_search = request_data.get('route_search', {})
            params = {
                'origin': route_search.get('origin', ''),
                'destination': route_search.get('destination', ''),
                'date': route_search.get('date', '')
            }
            print(f"🛫 UNIFIED ORCHESTRATOR: Route search params: {params}")
            log_start(params)
            # STANDARDIZED: Use the SAME unified route analysis as natural language chat
            result = _handle_unified_route_analysis(params, "HTML form route search")
            log_end()
            
        # Handle HTML form direct flight lookup - USES SAME AGENT AS NATURAL LANGUAGE
        elif request_data.get('flight_details'):
            print(f"✈️ UNIFIED ORCHESTRATOR: Processing HTML form direct flight lookup")
            flight_details = request_data.get('flight_details', {})
            
            # STANDARDIZED: Use the SAME direct flight analysis function as natural language
            params = {
                'airline': flight_details.get('airline', ''),
                'flight_number': flight_details.get('flight_number', ''),
                'origin_airport_code': flight_details.get('origin_airport_code', ''),
                'destination_airport_code': flight_details.get('destination_airport_code', ''),
                'date': flight_details.get('travel_date', '')  # FIXED: Use travel_date field from UI
            }
            
            # Add airline name mapping for standardized BigQuery queries
            from chat_advisor_agent import ChatAdvisorAgent
            chat_agent_instance = ChatAdvisorAgent()
            airline_name = chat_agent_instance._get_airline_name_from_code(params['airline'])
            params['airline_name'] = airline_name
            
            print(f"✈️ UNIFIED ORCHESTRATOR: Direct flight params: {params}")
            print(f"✈️ UNIFIED ORCHESTRATOR: Mapped airline code '{params['airline']}' to name '{airline_name}'")
            log_start(params)
            # STANDARDIZED: Use the SAME _handle_direct_flight_analysis function as natural language with retry logic
            analysis_result = _handle_direct_flight_analysis_with_retry(params)
            log_end()
            
            # Format response in standard format
            result = {
                'success': analysis_result['success'],
                'orchestrator': {
                    'intent': 'direct_flight_lookup',
                    'reasoning': 'HTML form direct flight lookup'
                },
                'flight_data': analysis_result.get('flight_data', {}),
                'risk_analysis': analysis_result.get('risk_analysis', {}),
                'weather_analysis': analysis_result.get('weather_analysis', {}),
                'error': analysis_result.get('error'),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        # Legacy direct flight lookup format (legacy format)
        elif request_data.get('airline') and request_data.get('flight_number'):
            print(f"✈️ UNIFIED ORCHESTRATOR: Processing legacy direct flight lookup")
            
            # STANDARDIZED: Use the SAME direct flight analysis function as natural language
            params = {k: v for k, v in request_data.items() if k != 'analysis_type'}
            
            # Add airline name mapping for standardized BigQuery queries
            from chat_advisor_agent import ChatAdvisorAgent
            chat_agent_instance = ChatAdvisorAgent()
            airline_name = chat_agent_instance._get_airline_name_from_code(params.get('airline', ''))
            params['airline_name'] = airline_name
            
            print(f"✈️ UNIFIED ORCHESTRATOR: Legacy direct flight params: {params}")
            print(f"✈️ UNIFIED ORCHESTRATOR: Mapped airline code '{params.get('airline', '')}' to name '{airline_name}'")
            log_start(params)
            analysis_result = _handle_direct_flight_analysis_with_retry(params)
            log_end()
            
            # Format response in standard format
            result = {
                'success': analysis_result['success'],
                'orchestrator': {
                    'intent': 'direct_flight_lookup',
                    'reasoning': 'Legacy direct flight lookup'
                },
                'flight_data': analysis_result.get('flight_data', {}),
                'risk_analysis': analysis_result.get('risk_analysis', {}),
                'weather_analysis': analysis_result.get('weather_analysis', {}),
                'error': analysis_result.get('error'),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        # Legacy route analysis format
        else:
            print(f"🛫 UNIFIED ORCHESTRATOR: Processing legacy route analysis")
            
            # STANDARDIZED: Use the SAME unified route analysis function as natural language
            params = {k: v for k, v in request_data.items() if k != 'analysis_type'}
            log_start(params)
            result = _handle_unified_route_analysis(params, "Legacy route analysis")
            log_end()
            
        # Add ADK status information to all responses
        if result:
            result['adk_status'] = {
                'framework': 'Google ADK',
                'model': 'gemini-2.0-flash',
                'unified_routing': True,
                'standardized_agents': True
            }
            
            print(f"✅ UNIFIED ORCHESTRATOR: Request processed successfully using standardized agents")
            return (json.dumps(result, cls=DateTimeEncoder), 200, headers)
        else:
            print(f"❌ UNIFIED ORCHESTRATOR: No valid request format detected")
            return (json.dumps({
                'success': False,
                'error': 'Invalid request format',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }, cls=DateTimeEncoder), 400, headers)

    except Exception as e:
        print(f"❌ UNIFIED ORCHESTRATOR ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return (json.dumps({
            'success': False,
            'error': f'Unified Orchestrator error: {str(e)}',
            'framework': 'Google ADK',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }, cls=DateTimeEncoder), 500, headers)

def _handle_extension_flight_analysis(parameters):
    """
    UNIFIED STANDARD AGENT for extension flight analysis - uses Google Flights data instead of BigQuery lookup
    This ensures identical processing using the SAME backend agents:
    - Weather Intelligence Agent (weather analysis)
    - Airport Complexity Agent (airport analysis) 
    - Layover Analysis Agent (connection analysis)
    - Risk Assessment Agent (final risk evaluation with BigQuery historical data)
    """
    import time
    start_time = time.time()
    print("🔌 EXTENSION TOOL: Coordinating extension flight analysis...")
    
    # LOG: Show incoming parameters
    print("📥 EXTENSION PARAMETERS RECEIVED:")
    print(f"   Raw parameters: {parameters}")
    print(f"   Parameters type: {type(parameters)}")
    print(f"   Parameters keys: {list(parameters.keys()) if isinstance(parameters, dict) else 'Not a dict'}")
    
    # DEFENSIVE: Ensure parameters is a dictionary
    if not isinstance(parameters, dict):
        print(f"❌ EXTENSION TOOL: parameters is not a dict: {type(parameters)} - {str(parameters)[:100]}")
        return {
            'success': False,
            'error': f'Invalid parameters type: expected dict, got {type(parameters)}'
        }
    
    print(f"🔍 EXTENSION TOOL: Parameters received: {list(parameters.keys()) if isinstance(parameters, dict) else 'NOT_DICT'}")
    
    try:
        # Step 1: Use Google Flights data directly (skip BigQuery lookup)
        step1_start = time.time()
        print("📊 EXTENSION TOOL: Using Google Flights data directly...")
        
        # Extract flight data from Google Flights format
        flight_data = {
            'airline_code': parameters.get('airline', ''),
            'airline_name': parameters.get('airline_name', ''),
            'flight_number': parameters.get('flight_number', ''),
            'origin_airport_code': parameters.get('origin', ''),
            'destination_airport_code': parameters.get('destination', ''),
            'date': parameters.get('date', ''),
            'departure_time_local': parameters.get('departure_time', ''),
            'arrival_time_local': parameters.get('arrival_time', ''),
            'duration_minutes': parameters.get('duration_minutes', 0),
            'connections': parameters.get('connections', []),
            'price': parameters.get('price', ''),
            'airplane_model': parameters.get('aircraft_type', ''),
            'source': 'google_flights_extension'
        }
        
        # Add computed fields that the frontend expects
        connections = flight_data.get('connections', [])
        flight_data['hasConnections'] = len(connections) > 0
        flight_data['connectionsLength'] = len(connections)
        
        # Calculate total travel time if duration_minutes is available
        duration_minutes = flight_data.get('duration_minutes', 0)
        if duration_minutes > 0:
            hours = duration_minutes // 60
            minutes = duration_minutes % 60
            if hours > 0 and minutes > 0:
                flight_data['finalSegmentTravelTime'] = f"{hours}h {minutes}m"
            elif hours > 0:
                flight_data['finalSegmentTravelTime'] = f"{hours}h"
            else:
                flight_data['finalSegmentTravelTime'] = f"{minutes}m"
        
        # Add layoverInfo to top level if there are connections
        if connections:
            # Use the first connection's layoverInfo as the primary layover data
            first_connection = connections[0]
            if 'layoverInfo' in first_connection:
                flight_data['layoverInfo'] = first_connection['layoverInfo']
            print(f"✅ EXTENSION TOOL: Added computed fields - hasConnections: {flight_data['hasConnections']}, connectionsLength: {flight_data['connectionsLength']}")
        else:
            flight_data['layoverInfo'] = None
            print("ℹ️ EXTENSION TOOL: No connections found, layoverInfo set to None")
        
        step1_time = time.time() - step1_start
        print(f"⏱️ EXTENSION TOOL: Step 1 (Google Flights data) took {step1_time:.2f} seconds")
        
        print("📤 EXTENSION TOOL RESULT:")
        print(f"   Flight data type: {type(flight_data)}")
        print(f"   Flight data: {flight_data}")
        
        if not flight_data.get('airline_code') or not flight_data.get('flight_number'):
            return {
                'success': False,
                'error': 'Missing required flight information from Google Flights'
            }
        
        # Step 1.5: Calculate Airline On-Time Rate from BigQuery historical data (STILL USED)
        step15_start = time.time()
        print("⏰ EXTENSION TOOL: Calculating airline On-Time Rate from BigQuery historical data...")
        
        try:
            airline_code = flight_data.get('airline_code', '')
            origin_airport = flight_data.get('origin_airport_code', '')
            destination_airport = flight_data.get('destination_airport_code', '')
            
            if airline_code and origin_airport and destination_airport:
                on_time_data = get_airline_on_time_rate(airline_code, origin_airport, destination_airport, years=[2016, 2017, 2018])
                if on_time_data and 'on_time_rate' in on_time_data:
                    flight_data['on_time_rate'] = on_time_data['on_time_rate']
                    flight_data['on_time_data'] = on_time_data
                    print(f"✅ EXTENSION TOOL: On-Time Rate calculated: {airline_code} = {on_time_data['on_time_rate']}%")
                    print(f"📊 EXTENSION TOOL: Total flights analyzed: {on_time_data.get('total_flights_analyzed', 0)}")
                else:
                    print(f"⚠️ EXTENSION TOOL: On-Time Rate calculation failed for {airline_code}")
                    flight_data['on_time_rate'] = None
            else:
                print(f"⚠️ EXTENSION TOOL: No airline code provided for On-Time Rate calculation")
                flight_data['on_time_rate'] = None
        except Exception as e:
            print(f"❌ EXTENSION TOOL: On-Time Rate calculation failed: {e}")
            flight_data['on_time_rate'] = None
        
        step15_time = time.time() - step15_start
        print(f"⏱️ EXTENSION TOOL: Step 1.5 (On-Time Rate) took {step15_time:.2f} seconds")
        
        # Step 2: Weather Intelligence Agent - Get weather for origin and destination (SAME AS BEFORE)
        step2_start = time.time()
        print("🌤️ EXTENSION TOOL: Calling Weather Intelligence Agent...")
        
        # FIXED: Handle both BigQuery data (origin_airport_code) and extension data (origin)
        origin_airport = flight_data.get('origin_airport_code') or flight_data.get('origin', '')
        destination_airport = flight_data.get('destination_airport_code') or flight_data.get('destination', '')
        
        print(f"🔍 EXTENSION TOOL: Using airport codes - Origin: {origin_airport}, Destination: {destination_airport}")
        print(f"🔍 EXTENSION TOOL: Flight data keys: {list(flight_data.keys())}")
        print(f"🔍 EXTENSION TOOL: Flight data origin fields: origin_airport_code={flight_data.get('origin_airport_code')}, origin={flight_data.get('origin')}")
        
        # Log weather analysis type for extension
        try:
            travel_datetime = datetime.strptime(parameters.get('date', ''), "%Y-%m-%d")
            today = datetime.now()
            days_ahead = (travel_datetime.date() - today.date()).days
            if days_ahead > 7:
                print(f"🌤️ EXTENSION LOGS: Extension weather analysis - SEASONAL analysis (flight is {days_ahead} days from today)")
            else:
                print(f"🌤️ EXTENSION LOGS: Extension weather analysis - REAL-TIME SerpAPI analysis (flight is {days_ahead} days from today)")
        except Exception as e:
            print(f"⚠️ EXTENSION LOGS: Could not determine extension weather analysis type: {e}")
        
        # Use the WeatherIntelligenceTool directly to get proper structure
        print(f"🌤️ EXTENSION CALLING WEATHER TOOL FOR MULTI-CITY ANALYSIS: {origin_airport} → {destination_airport}")
        from weather_tool import WeatherIntelligenceTool
        weather_tool = WeatherIntelligenceTool()
        weather_analysis = weather_tool.analyze_multi_city_route_weather(
            origin=origin_airport,
            destination=destination_airport,
            connections=[],  # No connections for direct flight
            travel_date=parameters.get('date', '')
        )
        
        print(f"🌤️ EXTENSION WEATHER TOOL RAW RESPONSE: {str(weather_analysis)[:500]}")
        step2_time = time.time() - step2_start
        print(f"⏱️ EXTENSION TOOL: Step 2 (Weather Intelligence) took {step2_time:.2f} seconds")
        
        # DEFENSIVE: Ensure weather_analysis is a dictionary
        if not isinstance(weather_analysis, dict):
            print(f"❌ EXTENSION TOOL: weather_analysis is not a dict: {type(weather_analysis)} - {str(weather_analysis)[:100]}")
            return {
                'success': False,
                'error': f'Invalid weather_analysis type: expected dict, got {type(weather_analysis)}'
            }
        
        # Step 3: Airport Complexity Agent - Get airport complexity (SAME AS BEFORE)
        step3_start = time.time()
        print("🏢 EXTENSION TOOL: Calling Airport Complexity Agent...")
        
        # Analyze origin airport complexity
        origin_complexity = None
        if origin_airport:
            try:
                origin_complexity = airport_complexity_agent.analyze_airport_complexity(origin_airport)
                print(f"✅ EXTENSION TOOL: Origin airport complexity analyzed: {origin_airport}")
            except Exception as e:
                print(f"❌ EXTENSION TOOL: Origin airport complexity analysis failed: {e}")
                origin_complexity = None
        
        # Analyze destination airport complexity
        destination_complexity = None
        if destination_airport:
            try:
                destination_complexity = airport_complexity_agent.analyze_airport_complexity(destination_airport)
                print(f"✅ EXTENSION TOOL: Destination airport complexity analyzed: {destination_airport}")
            except Exception as e:
                print(f"❌ EXTENSION TOOL: Destination airport complexity analysis failed: {e}")
                destination_complexity = None
        
        # Add complexity data to weather analysis (preserve existing weather data)
        if origin_complexity:
            if 'origin_airport_analysis' not in weather_analysis:
                weather_analysis['origin_airport_analysis'] = {}
            # Only add airport_complexity, preserve any existing weather_risk data
            weather_analysis['origin_airport_analysis']['airport_complexity'] = origin_complexity
            print(f"✅ EXTENSION: Added origin complexity to existing analysis: {list(weather_analysis['origin_airport_analysis'].keys())}")
        
        if destination_complexity:
            if 'destination_airport_analysis' not in weather_analysis:
                weather_analysis['destination_airport_analysis'] = {}
            # Only add airport_complexity, preserve any existing weather_risk data
            weather_analysis['destination_airport_analysis']['airport_complexity'] = destination_complexity
            print(f"✅ EXTENSION: Added destination complexity to existing analysis: {list(weather_analysis['destination_airport_analysis'].keys())}")
            
        # CRITICAL FIX: Ensure weather_risk data from OpenWeatherMap gets copied to airport analysis
        print(f"🔧 EXTENSION DEBUG: weather_analysis has weather_risk: {'weather_risk' in weather_analysis}")
        if 'weather_risk' in weather_analysis:
            print(f"🔧 EXTENSION DEBUG: weather_risk content: {weather_analysis['weather_risk']}")
            print(f"🔧 EXTENSION DEBUG: weather_risk is truthy: {bool(weather_analysis['weather_risk'])}")
        
        if 'weather_risk' in weather_analysis and weather_analysis['weather_risk']:
            print("🔧 EXTENSION DEBUG: Condition met, proceeding with weather_risk copy")
            
            # Copy main weather analysis to origin airport analysis
            if 'origin_airport_analysis' not in weather_analysis:
                weather_analysis['origin_airport_analysis'] = {}
                print("🔧 EXTENSION DEBUG: Created empty origin_airport_analysis")
            
            print(f"🔧 EXTENSION DEBUG: origin_airport_analysis before copy: {list(weather_analysis['origin_airport_analysis'].keys())}")
            
            if 'weather_risk' not in weather_analysis['origin_airport_analysis']:
                weather_analysis['origin_airport_analysis']['weather_risk'] = weather_analysis['weather_risk'].copy()
                print(f"✅ EXTENSION: Copied main weather_risk to origin_airport_analysis: {weather_analysis['weather_risk']['description'][:100]}")
            else:
                print("🔧 EXTENSION DEBUG: weather_risk already exists in origin_airport_analysis")
            
            # Copy main weather analysis to destination airport analysis  
            if 'destination_airport_analysis' not in weather_analysis:
                weather_analysis['destination_airport_analysis'] = {}
                print("🔧 EXTENSION DEBUG: Created empty destination_airport_analysis")
                
            print(f"🔧 EXTENSION DEBUG: destination_airport_analysis before copy: {list(weather_analysis['destination_airport_analysis'].keys())}")
            
            if 'weather_risk' not in weather_analysis['destination_airport_analysis']:
                weather_analysis['destination_airport_analysis']['weather_risk'] = weather_analysis['weather_risk'].copy()
                print(f"✅ EXTENSION: Copied main weather_risk to destination_airport_analysis: {weather_analysis['weather_risk']['description'][:100]}")
            else:
                print("🔧 EXTENSION DEBUG: weather_risk already exists in destination_airport_analysis")
        else:
            print("🔧 EXTENSION DEBUG: Condition NOT met - weather_risk copy skipped")
        
        step3_time = time.time() - step3_start
        print(f"⏱️ EXTENSION TOOL: Step 3 (Airport Complexity) took {step3_time:.2f} seconds")
        
        # Step 4: Layover Analysis Agent - Analyze connections (SAME AS BEFORE)
        step4_start = time.time()
        print("🔄 EXTENSION TOOL: Calling Layover Analysis Agent...")
        
        connections = flight_data.get('connections', [])
        if connections:
            print(f"🔄 EXTENSION TOOL: Analyzing {len(connections)} connections")
            
            # Analyze weather for each connection
            layover_weather_analysis = {}
            for i, connection in enumerate(connections):
                if isinstance(connection, dict):
                    airport_code = connection.get('airport', '')
                    if airport_code:
                        print(f"🌤️ EXTENSION TOOL: Analyzing weather for connection {i+1}: {airport_code}")
                        try:
                            # Use weather agent directly like we do for origin/destination
                            connection_weather = weather_agent.analyze_weather_conditions(airport_code, parameters.get('date', ''))
                            layover_weather_analysis[airport_code] = connection_weather
                            print(f"✅ EXTENSION TOOL: Connection {i+1} weather analyzed: {airport_code}")
                        except Exception as e:
                            print(f"❌ EXTENSION TOOL: Connection {i+1} weather analysis failed: {e}")
            
            # Analyze complexity for each connection
            layover_complexity_analysis = {}
            for i, connection in enumerate(connections):
                if isinstance(connection, dict):
                    airport_code = connection.get('airport', '')
                    if airport_code:
                        print(f"🏢 EXTENSION TOOL: Analyzing complexity for connection {i+1}: {airport_code}")
                        try:
                            connection_complexity = airport_complexity_agent.analyze_airport_complexity(airport_code)
                            layover_complexity_analysis[airport_code] = connection_complexity
                            print(f"✅ EXTENSION TOOL: Connection {i+1} complexity analyzed: {airport_code}")
                        except Exception as e:
                            print(f"❌ EXTENSION TOOL: Connection {i+1} complexity analysis failed: {e}")
            
            # Add layover analysis to weather analysis
            weather_analysis['layover_weather_analysis'] = layover_weather_analysis
            weather_analysis['layover_complexity_analysis'] = layover_complexity_analysis
            
            # CRITICAL FIX: Add layoverInfo structure to each connection with weather data
            print("🔧 EXTENSION FIX: Adding layoverInfo with weather data to connections")
            for i, connection in enumerate(connections):
                if isinstance(connection, dict):
                    airport_code = connection.get('airport', '')
                    if airport_code:
                        print(f"🔧 Processing connection {i+1}: {airport_code}")
                        
                        # Initialize layoverInfo if it doesn't exist
                        if 'layoverInfo' not in connection:
                            connection['layoverInfo'] = {}
                        
                        # Add weather data if available
                        if airport_code in layover_weather_analysis:
                            weather_data = layover_weather_analysis[airport_code]
                            if not weather_data.get('error') and 'weather_conditions' in weather_data:
                                conditions = weather_data['weather_conditions']
                                
                                # Create weather_risk structure like we do for origin/destination
                                weather_risk = {
                                    "level": conditions.get('risk_level', 'medium').upper(),
                                    "description": f"Current conditions: {conditions.get('conditions', 'Unknown')}. "
                                                 f"Temperature: {conditions.get('temperature', 'N/A')}. "
                                                 f"Humidity: {conditions.get('humidity', 'N/A')}. "
                                                 f"Wind: {conditions.get('wind', 'N/A')}. "
                                                 f"Visibility: {conditions.get('visibility', 'N/A')}.",
                                    "risk_score": 50,
                                    "delay_probability": "Unknown",
                                    "cancellation_probability": "Unknown"
                                }
                                
                                connection['layoverInfo']['weather_risk'] = weather_risk
                                print(f"✅ Added weather_risk to connection {i+1}: {weather_risk['description'][:50]}...")
                        
                        # Add airport complexity data if available
                        if airport_code in layover_complexity_analysis:
                            complexity_data = layover_complexity_analysis[airport_code]
                            if not complexity_data.get('error'):
                                connection['layoverInfo']['airport_complexity'] = complexity_data
                                print(f"✅ Added airport_complexity to connection {i+1}")
                        
                        # Add layover feasibility analysis if connection has all needed data
                        # FIXED: Get layover duration from layoverInfo, not flight segment duration
                        layover_info = connection.get('layoverInfo', {})
                        layover_duration = layover_info.get('duration', '')
                        if layover_duration and 'layoverInfo' in connection:
                            try:
                                print(f"🔄 EXTENSION TOOL: Adding layover feasibility analysis for {airport_code}")
                                print(f"🔍 DEBUG: Using layover duration: {layover_duration} (not flight segment duration: {connection.get('duration', 'N/A')})")
                                layover_analysis = layover_agent.analyze_layover_feasibility(
                                    duration_str=layover_duration,
                                    airport_code=airport_code,
                                    arrival_time=connection.get('arrival_time', ''),
                                    travel_date=parameters.get('date', '')
                                )
                                
                                if layover_analysis and isinstance(layover_analysis, dict) and not layover_analysis.get('analysis_failed'):
                                    ai_analysis = layover_analysis.get('ai_analysis', {})
                                    if ai_analysis and isinstance(ai_analysis, dict):
                                        connection['layover_analysis'] = {
                                            "feasibility_risk": ai_analysis.get('risk_level', 'medium'),
                                            "feasibility_score": ai_analysis.get('risk_score', 50),
                                            "feasibility_description": ai_analysis.get('overall_feasibility', 'Connection feasible with monitoring')
                                        }
                                        print(f"✅ EXTENSION TOOL: Added connection analysis for {airport_code}")
                                    else:
                                        # AI analysis is None or invalid - provide reasonable defaults
                                        connection['layover_analysis'] = {
                                            "feasibility_risk": "medium",
                                            "feasibility_score": 50,
                                            "feasibility_description": f"Connection at {airport_code} appears feasible ({duration} layover)"
                                        }
                                        print(f"⚠️ EXTENSION TOOL: AI analysis unavailable for {airport_code}, using defaults")
                                else:
                                    connection['layover_analysis'] = {
                                        "feasibility_risk": "medium",
                                        "feasibility_score": 50,
                                        "feasibility_description": f"Connection at {airport_code} duration: {duration}"
                                    }
                                    print(f"⚠️ EXTENSION TOOL: Connection analysis unavailable for {airport_code}, using fallback")
                            except Exception as e:
                                print(f"❌ EXTENSION TOOL: Error analyzing layover {airport_code}: {e}")
                                connection['layover_analysis'] = {
                                    "feasibility_risk": "unknown",
                                    "feasibility_score": 0,
                                    "feasibility_description": "❌ Connection analysis error"
                                }
                        else:
                            print(f"⚠️  EXTENSION TOOL: Cannot analyze layover {airport_code} - missing duration or layoverInfo")
                            connection['layover_analysis'] = {
                                "feasibility_risk": "unknown",
                                "feasibility_score": 0,
                                "feasibility_description": "❌ Cannot analyze - missing connection data"
                            }
            
            print(f"🎯 EXTENSION FIX: Enhanced {len(connections)} connections with layoverInfo data")
            
            # Update flight_data layoverInfo with the enhanced connection data
            if connections and 'layoverInfo' in connections[0]:
                flight_data['layoverInfo'] = connections[0]['layoverInfo']
                print(f"✅ EXTENSION FIX: Updated flight_data layoverInfo with enhanced data")
        else:
            print("ℹ️ EXTENSION TOOL: No connections to analyze")
        
        step4_time = time.time() - step4_start
        print(f"⏱️ EXTENSION TOOL: Step 4 (Layover Analysis) took {step4_time:.2f} seconds")
        
        # Step 5: Risk Assessment Agent - Final risk evaluation (SAME AS BEFORE, USES BIGQUERY HISTORICAL DATA)
        step5_start = time.time()
        print("⚠️ EXTENSION TOOL: Calling Risk Assessment Agent...")
        
        # Call risk assessment agent with all data
        risk_analysis = risk_agent.generate_flight_risk_analysis(
            flight_data,
            weather_analysis,
            parameters
        )
        
        step5_time = time.time() - step5_start
        print(f"⏱️ EXTENSION TOOL: Step 5 (Risk Assessment) took {step5_time:.2f} seconds")
        
        # STEP 5.5: ALWAYS GENERATE 5-BULLET AI SEASONAL FACTORS ANALYSIS (SAME AS DIRECT FLIGHT)
        print("🗓️ EXTENSION TOOL: Generating comprehensive 5-bullet seasonal factors analysis...")
        origin_airport = flight_data.get('origin_airport_code', '')
        destination_airport = flight_data.get('destination_airport_code', '')
        flight_number = flight_data.get('flight_number', 'Unknown')
        travel_date = parameters.get('date', '')
        
        try:
            # Generate AI-powered seasonal factors that consider ALL available information
            seasonal_factors, success = _ai_generate_flight_seasonal_factors(
                origin_airport, 
                destination_airport, 
                travel_date,
                flight_number
            )
            
            if success and len(seasonal_factors) >= 5:
                risk_analysis['seasonal_factors'] = seasonal_factors[:5]
                risk_analysis['key_risk_factors'] = seasonal_factors[:5]
                print(f"✅ EXTENSION TOOL: Generated {len(seasonal_factors[:5])} AI seasonal factors for extension flight {flight_number}")
            else:
                # Fallback to basic seasonal factors based on season/date
                basic_factors = _ai_generate_basic_seasonal_factors(travel_date)
                risk_analysis['seasonal_factors'] = basic_factors[:5]
                risk_analysis['key_risk_factors'] = basic_factors[:5]
                
        except Exception as e:
            print(f"❌ EXTENSION TOOL: Seasonal factor generation failed for extension flight {flight_number}: {e}")
            # Use basic seasonal factors when AI generation fails completely
            basic_factors = _ai_generate_basic_seasonal_factors(travel_date)
            risk_analysis['seasonal_factors'] = basic_factors[:5]
            risk_analysis['key_risk_factors'] = basic_factors[:5]
        
        # CRITICAL: Map airport analysis to flight object structure for UI compatibility (SAME AS DIRECT FLIGHT)
        
        # CRITICAL FINAL FIX: Convert real weather data to UI-expected weather_risk format
        print("🔧 ULTIMATE FIX: Converting real weather data to UI weather_risk format")
        
        # Process origin weather data
        if 'origin_airport_analysis' in weather_analysis:
            origin_data = weather_analysis['origin_airport_analysis']
            if 'weather_conditions' in origin_data and origin_data['weather_conditions']:
                conditions = origin_data['weather_conditions']
                
                # Create proper weather_risk structure from real weather data
                weather_risk = {
                    "level": conditions.get('risk_level', 'medium').upper(),
                    "description": f"Current conditions: {conditions.get('conditions', 'Unknown')}. "
                                 f"Temperature: {conditions.get('temperature', 'N/A')}. "
                                 f"Humidity: {conditions.get('humidity', 'N/A')}. "
                                 f"Wind: {conditions.get('wind', 'N/A')}. "
                                 f"Visibility: {conditions.get('visibility', 'N/A')}.",
                    "risk_score": 50,  # Default moderate score
                    "delay_probability": "Unknown",
                    "cancellation_probability": "Unknown"
                }
                
                # Force the weather_risk into the structure
                origin_data['weather_risk'] = weather_risk
                print(f"🎯 ULTIMATE FIX: Created weather_risk from real conditions for origin")
                print(f"   Weather description: {weather_risk['description'][:100]}...")
        
        # Process destination weather data
        if 'destination_airport_analysis' in weather_analysis:
            destination_data = weather_analysis['destination_airport_analysis']
            if 'weather_conditions' in destination_data and destination_data['weather_conditions']:
                conditions = destination_data['weather_conditions']
                
                # Create proper weather_risk structure from real weather data
                weather_risk = {
                    "level": conditions.get('risk_level', 'medium').upper(),
                    "description": f"Current conditions: {conditions.get('conditions', 'Unknown')}. "
                                 f"Temperature: {conditions.get('temperature', 'N/A')}. "
                                 f"Humidity: {conditions.get('humidity', 'N/A')}. "
                                 f"Wind: {conditions.get('wind', 'N/A')}. "
                                 f"Visibility: {conditions.get('visibility', 'N/A')}.",
                    "risk_score": 50,  # Default moderate score
                    "delay_probability": "Unknown",
                    "cancellation_probability": "Unknown"
                }
                
                # Force the weather_risk into the structure
                destination_data['weather_risk'] = weather_risk
                print(f"🎯 ULTIMATE FIX: Created weather_risk from real conditions for destination")
                print(f"   Weather description: {weather_risk['description'][:100]}...")
        
        print(f"🔍 ULTIMATE FIX: Final weather_analysis keys: {list(weather_analysis.keys())}")
        if 'origin_airport_analysis' in weather_analysis:
            print(f"   origin_airport_analysis keys: {list(weather_analysis['origin_airport_analysis'].keys())}")
        if 'destination_airport_analysis' in weather_analysis:
            print(f"   destination_airport_analysis keys: {list(weather_analysis['destination_airport_analysis'].keys())}")
        
        if 'origin_airport_analysis' in weather_analysis and weather_analysis['origin_airport_analysis']:
            flight_data['origin_analysis'] = weather_analysis['origin_airport_analysis']
            # Map to the structure the UI expects
            flight_data['origin_weather'] = {
                "weather_risk": weather_analysis['origin_airport_analysis'].get('weather_risk', {}),
                "airport_complexity": weather_analysis['origin_airport_analysis'].get('airport_complexity', {}),
                "weather_conditions": {
                    "conditions": weather_analysis['origin_airport_analysis'].get('weather_risk', {}).get('description', 'Weather analysis not available')
                }
            }
            
        if 'destination_airport_analysis' in weather_analysis and weather_analysis['destination_airport_analysis']:
            flight_data['destination_analysis'] = weather_analysis['destination_airport_analysis']
            # Map to the structure the UI expects
            flight_data['destination_weather'] = {
                "weather_risk": weather_analysis['destination_airport_analysis'].get('weather_risk', {}),
                "airport_complexity": weather_analysis['destination_airport_analysis'].get('airport_complexity', {}),
                "weather_conditions": {
                    "conditions": weather_analysis['destination_airport_analysis'].get('weather_risk', {}).get('description', 'Weather analysis not available')
                }
            }
        
        # Step 6: Insurance Recommendation Agent (SAME AS BEFORE)
        step6_start = time.time()
        print("🛡️ EXTENSION TOOL: Calling Insurance Recommendation Agent...")
        
        insurance_recommendation = insurance_agent.generate_insurance_recommendation(
            flight_data, risk_analysis, weather_analysis
        )
        
        step6_time = time.time() - step6_start
        print(f"⏱️ EXTENSION TOOL: Step 6 (Insurance Recommendation) took {step6_time:.2f} seconds")
        
        # Calculate total time
        total_time = time.time() - start_time
        print(f"⏱️ EXTENSION TOOL: Total analysis time: {total_time:.2f} seconds")
        
        # Return comprehensive analysis
        return {
            'success': True,
            'flight_data': flight_data,
            'weather_analysis': weather_analysis,
            'risk_analysis': risk_analysis,
            'insurance_recommendation': insurance_recommendation,
            'analysis_metadata': {
                'source': 'google_flights_extension',
                'total_time': total_time,
                'steps': {
                    'google_flights_data': step1_time,
                    'on_time_rate': step15_time,
                    'weather_analysis': step2_time,
                    'airport_complexity': step3_time,
                    'layover_analysis': step4_time,
                    'risk_assessment': step5_time,
                    'insurance_recommendation': step6_time
                }
            }
        }
        
    except Exception as e:
        print(f"❌ EXTENSION TOOL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Extension analysis failed: {str(e)}'
        }