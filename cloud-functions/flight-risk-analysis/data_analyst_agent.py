"""
FlightRiskRadar Data Analyst Agent - Google ADK Implementation
Handles BigQuery data analysis and SerpAPI integration using Google ADK
"""
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import requests
from google.cloud import bigquery
import google.generativeai as genai

# Import Google ADK - REAL IMPLEMENTATION ONLY
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
print("✅ Data Analyst Agent: Using real Google ADK")

# Import Google ADK Sub-Agents
from airport_complexity_agent import AirportComplexityAgent
from weather_impact_agent import WeatherImpactAgent
from layover_analysis_agent import LayoverAnalysisAgent

class DataAnalystAgent:
    """
    Google ADK Data Analyst Agent for flight data analysis
    """
    
    def __init__(self):
        self.name = "data_analyst_agent"
        self.description = "Analyzes flight data from BigQuery and SerpAPI using Google ADK"

        # Get SerpAPI key from environment variable
        self.serpapi_key = os.getenv('SERPAPI_API_KEY')
        if not self.serpapi_key:
            raise ValueError("SERPAPI_API_KEY environment variable is required")

        # Get project ID from environment variable
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT', 'crafty-cairn-469222-a8')
        
        # Initialize BigQuery client
        try:
            self.bq_client = bigquery.Client()
            self.bq_available = True  # FIXED: Set bq_available to True when successful
            print("🔍 Data Analyst Agent: BigQuery client initialized")
        except Exception as e:
            print(f"❌ Data Analyst Agent: BigQuery init failed: {e}")
            self.bq_client = None
            self.bq_available = False  # FIXED: Set bq_available to False when failed
        
        # Initialize Google ADK Sub-Agents
        try:
            self.airport_complexity_agent = AirportComplexityAgent()
            self.weather_impact_agent = WeatherImpactAgent()
            self.layover_analysis_agent = LayoverAnalysisAgent()
            print("📊 Data Analyst Agent: Google ADK sub-agents initialized")
        except Exception as e:
            print(f"❌ Data Analyst Agent: Failed to initialize ADK sub-agents: {e}")
            self.airport_complexity_agent = None
            self.weather_impact_agent = None
            self.layover_analysis_agent = None
        
        print("📊 Google ADK Data Analyst Agent initialized")
    
    def analyze_route(self, origin, destination, date, connections=None):
        """Analyze route using SerpAPI"""
        try:
            # Call SerpAPI to get real flight data
            flight_data = self._call_serpapi_flights(origin, destination, date)
            
            if not flight_data:
                print(f"❌ Data Analyst Agent: No SerpAPI data available for {origin} → {destination}")
                return {
                    'success': False,
                    'message': 'No flights found for this route',
                    'flights': []
                }
            
            # Extract and structure flight data
            structured_flights = self._extract_flight_data(flight_data, origin, destination, date)
            
            # Limit to maximum 10 flights
            original_count = len(structured_flights)
            if original_count > 10:
                structured_flights = structured_flights[:10]
                print(f"📊 Data Analyst Agent: Limited to 10 flights (was {original_count})")
            
            print(f"📊 Data Analyst Agent: Found {len(structured_flights)} flights")
            
            return {
                'success': True,
                'flights': structured_flights,
                'route_info': {
                    'origin': origin,
                    'destination': destination,
                    'date': date,
                    'connections': connections or []
                }
            }
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Route analysis failed: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'message': f'Route analysis failed: {str(e)}',
                'flights': []
            }
    
    def get_flight_data_from_bigquery(self, airline_code, flight_number, date, airline_name, origin_airport_code=None, destination_airport_code=None):
        """
        Get flight data from BigQuery for direct flight lookup - Enhanced with 4-field matching
        CRITICAL: airline_name is now required (not optional)
        """
        print("="*120)
        print("🎯 DIRECT FLIGHT LOOKUP - USING BIGQUERY FOR HISTORICAL + SERPAPI FOR CURRENT WEATHER")
        print("="*120)
        print(f"📊 DATA ANALYST AGENT: Querying BigQuery for {airline_code}{flight_number} on {date}")
        print(f"📊 DATA ANALYST AGENT: Airline name: {airline_name}")
        print(f"📊 DATA ANALYST AGENT: Airport codes: {origin_airport_code} → {destination_airport_code}")
        
        if not self.bq_available:
            print("❌ Data Analyst Agent: BigQuery not available")
            return None
        
        try:
            # UNIFIED QUERY: Both natural language and HTML forms use this same query
            # Make airline_name optional - if not provided, search by airline_code only
            airline_name_condition = ""
            if airline_name and airline_name.strip():
                airline_name_condition = f"AND UPPER(airline_name) = UPPER('{airline_name}')"
            
            query = f"""
            SELECT * FROM `{self.project_id}.airline_data.flight_data`
            WHERE UPPER(airline_code) = UPPER('{airline_code}') 
            {airline_name_condition}
            AND UPPER(CAST(flight_number AS STRING)) = UPPER('{flight_number}')
            AND DATE(departure_time_local) = '{date}'
            """
            
            print(f"📊 DATA ANALYST AGENT: Executing unified BigQuery query")
            print(f"🔍 DATA ANALYST AGENT: Query: {query}")
            
            query_job = self.bq_client.query(query)
            results = query_job.result()
            
            # Convert results to list
            flight_data_list = []
            for row in results:
                flight_data_list.append(dict(row))
            
            if flight_data_list:
                flight_data = flight_data_list[0]  # Take the first matching flight
                print(f"✅ DATA ANALYST AGENT: Found flight data in BigQuery")
                print(f"📊 DATA ANALYST AGENT: Flight: {flight_data.get('airline_name')} {flight_data.get('flight_number')}")
                print(f"📊 DATA ANALYST AGENT: Route: {flight_data.get('origin_airport_code')} → {flight_data.get('destination_airport_code')}")
                
                # Convert layovers to connections format if they exist
                if 'layovers' in flight_data and flight_data['layovers']:
                    # Parse layovers if it's a JSON string
                    layovers_data = flight_data['layovers']
                    print(f"🔍 DEBUG: Raw layovers_data type: {type(layovers_data)}")
                    print(f"🔍 DEBUG: Raw layovers_data: {layovers_data}")
                    
                    if isinstance(layovers_data, str):
                        try:
                            import json
                            layovers_data = json.loads(layovers_data)
                            print(f"📊 DATA ANALYST AGENT: Parsed layovers JSON string")
                        except json.JSONDecodeError as e:
                            print(f"❌ DATA ANALYST AGENT: Failed to parse layovers JSON: {e}")
                            print(f"❌ DATA ANALYST AGENT: Raw JSON string: {layovers_data}")
                            layovers_data = []
                    
                    if layovers_data:
                        print(f"📊 DATA ANALYST AGENT: Converting {len(layovers_data)} layovers to connections format")
                        print(f"🔍 DATA ANALYST AGENT: Layovers data type: {type(layovers_data)}, first item type: {type(layovers_data[0]) if layovers_data else 'N/A'}")
                        flight_data['connections'] = self._convert_layovers_to_connections_format(layovers_data)
                        print(f"✅ DATA ANALYST AGENT: Converted layovers to connections: {flight_data['connections']}")
                    else:
                        print(f"⚠️ DATA ANALYST AGENT: No layovers_data after processing")
                        flight_data['connections'] = []
                elif 'connections' not in flight_data or flight_data['connections'] is None:
                    flight_data['connections'] = []
                    print(f"ℹ️ DATA ANALYST AGENT: No layovers or connections found")
                
                return flight_data
            else:
                print(f"❌ DATA ANALYST AGENT: No flight found in BigQuery")
                print(f"❌ DATA ANALYST AGENT: Search criteria - Airline: {airline_code}/{airline_name}, Flight: {flight_number}, Date: {date}")
            return None
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: BigQuery query failed: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _convert_layovers_to_json_safe(self, layovers):
        """Convert layovers with datetime objects to JSON-safe format"""
        try:
            json_safe_layovers = []
            for layover in layovers:
                layover_dict = dict(layover)
                
                # Convert datetime objects to strings
                if 'arrival_time' in layover_dict and layover_dict['arrival_time']:
                    layover_dict['arrival_time'] = layover_dict['arrival_time'].strftime('%Y-%m-%d %H:%M:%S')
                
                if 'departure_time' in layover_dict and layover_dict['departure_time']:
                    layover_dict['departure_time'] = layover_dict['departure_time'].strftime('%Y-%m-%d %H:%M:%S')
                
                json_safe_layovers.append(layover_dict)
            
            return json_safe_layovers
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Failed to convert layovers: {e}")
            return []

    def _convert_layovers_to_connections_format(self, layovers):
        """Convert BigQuery layovers to the connections format the UI expects"""
        try:
            print(f"🔍 DEBUG: _convert_layovers_to_connections_format input type: {type(layovers)}")
            print(f"🔍 DEBUG: _convert_layovers_to_connections_format input: {layovers}")
            
            if not layovers:
                return []
                
            connections = []
            for i, layover in enumerate(layovers):
                print(f"🔍 DEBUG: Processing layover {i}: type={type(layover)}, value={layover}")
                
                # Handle different layover formats - SIMPLIFIED
                if isinstance(layover, dict):
                    layover_dict = layover
                else:
                    # For BigQuery Row objects or other types, try to convert to dict
                    try:
                        layover_dict = dict(layover)
                    except Exception as e:
                        print(f"❌ ERROR: Cannot convert layover to dict: {e}")
                        # Skip this layover if we can't convert it
                        continue
                
                # Convert datetime objects to strings and format for UI
                arrival_time = layover_dict.get('arrival_time')
                departure_time = layover_dict.get('departure_time')
                
                connection = {
                    'city': layover_dict.get('city', 'Unknown'),  # City name like 'Houston', 'Las Vegas'
                    'airport': layover_dict.get('airport_code', 'Unknown'),  # Airport code like 'IAH', 'LAS'
                    'airport_code': layover_dict.get('airport_code', 'Unknown'),  # Airport code for compatibility
                    'duration': layover_dict.get('layover_duration_minutes', '0'),  # Layover duration
                    'travel_time': layover_dict.get('travel_time_minutes', '0'),  # Travel time to this airport
                    'arrival_time': arrival_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(arrival_time, datetime) else str(arrival_time) if arrival_time else '',
                    'departure_time': departure_time.strftime('%Y-%m-%d %H:%M:%S') if isinstance(departure_time, datetime) else str(departure_time) if departure_time else ''
                }
                connections.append(connection)
            
            return connections
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Failed to convert layovers to connections: {e}")
            return []
    
    def _call_serpapi_flights(self, origin, destination, date):
        """Call SerpAPI to get flight data"""
        print("="*100)
        print("🌤️ SERPAPI CALL FOR CURRENT WEATHER ANALYSIS - ROUTE SEARCH")
        print("="*100)
        print(f"🔍 Data Analyst Agent: Searching flights {origin} → {destination} on {date}")
        
        try:
            # Ensure date is in correct format (YYYY-MM-DD)
            formatted_date = self._format_date_for_serpapi(date)
            print(f"🔍 Data Analyst Agent: Using formatted date: {formatted_date}")
            
            params = {
                'api_key': self.serpapi_key,
                'engine': 'google_flights',
                'departure_id': origin,
                'arrival_id': destination,
                'outbound_date': formatted_date,
                'type': '2',  # 2 = One way (not Round trip)
                'currency': 'USD',
                'hl': 'en'
            }
            
            print("🚨" * 50)
            print("SERPAPI REQUEST PARAMETERS:")
            print("🚨" * 50)
            for key, value in params.items():
                if key != 'api_key':  # Hide API key
                    print(f"📤 SERPAPI PARAM: {key} = {value}")
                else:
                    print(f"📤 SERPAPI PARAM: {key} = [HIDDEN]")
            print("🚨" * 50)
            
            response = requests.get('https://serpapi.com/search', params=params, timeout=30)
            
            print("🚨" * 50)
            print("SERPAPI RESPONSE RECEIVED:")
            print("🚨" * 50)
            print(f"📥 SERPAPI RESPONSE STATUS: {response.status_code}")
            print("🚨" * 50)
            
            response.raise_for_status()
            
            data = response.json()
            print("🚨" * 50)
            print("SERPAPI RESPONSE STRUCTURE:")
            print("🚨" * 50)
            print(f"📥 SERPAPI RESPONSE KEYS: {list(data.keys())}")
            if 'best_flights' in data:
                print(f"📥 SERPAPI BEST FLIGHTS COUNT: {len(data.get('best_flights', []))}")
            if 'other_flights' in data:
                print(f"📥 SERPAPI OTHER FLIGHTS COUNT: {len(data.get('other_flights', []))}")
            print("🚨" * 50)
            
            # Check for different response formats
            if 'best_flights' in data and data['best_flights']:
                print(f"✅ Data Analyst Agent: Found {len(data['best_flights'])} best flights")
                return data
            elif 'other_flights' in data and data['other_flights']:
                print(f"✅ Data Analyst Agent: Found {len(data['other_flights'])} other flights")
                return data
            elif 'flights' in data and data['flights']:
                print(f"✅ Data Analyst Agent: Found {len(data['flights'])} flights")
                return data
            else:
                print("⚠️ Data Analyst Agent: No flights found in response")
                print(f"🔍 Data Analyst Agent: Response data: {json.dumps(data, indent=2)}")
                
                # Check for error messages
                if 'error' in data:
                    print(f"❌ Data Analyst Agent: SerpAPI error: {data['error']}")
                
                return None
                
        except requests.exceptions.RequestException as e:
            error_message = str(e)
            if "429" in error_message or "Too Many Requests" in error_message:
                print(f"❌ Data Analyst Agent: SerpAPI rate limit exceeded - {error_message}")
                print(f"💡 Data Analyst Agent: Please check your SerpAPI account limits at https://serpapi.com/dashboard")
                return {
                    'error': 'SerpAPI rate limit exceeded',
                    'message': 'Please upgrade your SerpAPI plan or try again later',
                    'account_status': 'Rate limit exceeded'
                }
            print(f"❌ Data Analyst Agent: Request failed - {str(e)}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ Data Analyst Agent: JSON decode failed - {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Data Analyst Agent: SerpAPI call failed - {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _format_date_for_serpapi(self, date):
        """Format date for SerpAPI (YYYY-MM-DD format)"""
        try:
            # If already in YYYY-MM-DD format, return as is
            if isinstance(date, str) and len(date) == 10 and date.count('-') == 2:
                return date
            
            # Try to parse and format different date formats
            from datetime import datetime
            
            # Try different date formats
            date_formats = [
                '%Y-%m-%d',  # 2025-07-12
                '%m/%d/%Y',  # 07/12/2025
                '%B %d, %Y',  # July 12, 2025
                '%B %dth, %Y',  # July 12th, 2025
                '%B %dst, %Y',  # July 1st, 2025
                '%B %dnd, %Y',  # July 2nd, 2025
                '%B %drd, %Y',  # July 3rd, 2025
            ]
            
            for fmt in date_formats:
                try:
                    dt = datetime.strptime(date, fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # If no format matches, return original
            print(f"⚠️ Data Analyst Agent: Could not parse date format: {date}")
            return date
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Date formatting failed - {str(e)}")
            return date
    
    def _extract_flight_data(self, serpapi_data, origin, destination, date):
        """Extract and structure flight data from SerpAPI response"""
        flights = []
        
        try:
            # Validate SerpAPI response structure
            if not isinstance(serpapi_data, dict):
                print(f"❌ Data Analyst Agent: Invalid SerpAPI response format - expected dict, got {type(serpapi_data)}")
                return []
            
            best_flights = serpapi_data.get('best_flights', [])
            other_flights = serpapi_data.get('other_flights', [])
            all_flights = best_flights + other_flights
            
            if not all_flights:
                print(f"⚠️ Data Analyst Agent: No flights found in SerpAPI response")
                print(f"🔍 DEBUG: SerpAPI response keys: {list(serpapi_data.keys())}")
                return []
            
            print(f"📊 Data Analyst Agent: Processing {len(all_flights)} flights from SerpAPI")
            
            for i, flight_data in enumerate(all_flights):
                print(f"🔍 DEBUG: Processing flight {i+1}/{len(all_flights)}")
                flight_info = self._parse_flight_info(flight_data, origin, destination, date)
                if flight_info:
                    flights.append(flight_info)
                else:
                    print(f"⚠️ Data Analyst Agent: Failed to parse flight {i+1}")
            
            print(f"📊 Data Analyst Agent: Successfully extracted {len(flights)} flights")
            return flights
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Data extraction failed - {str(e)}")
            import traceback
            traceback.print_exc()
            return []
    
    def _parse_flight_info(self, flight_data, origin, destination, date):
        """Parse individual flight information from SerpAPI"""
        try:
            # Validate flight data structure
            if not isinstance(flight_data, dict):
                print(f"⚠️ Data Analyst Agent: Invalid flight data format - expected dict, got {type(flight_data)}")
                return None
            
            # Extract basic flight info
            flights = flight_data.get('flights', [])
            if not flights:
                print(f"⚠️ Data Analyst Agent: No flight segments found in flight data")
                return None
            
            print(f"🔍 DEBUG: Processing flight with {len(flights)} segments")
            
            # Validate each flight segment
            for i, segment in enumerate(flights):
                if not isinstance(segment, dict):
                    print(f"⚠️ Data Analyst Agent: Invalid flight segment {i} format")
                    continue
                
                required_fields = ['departure_airport', 'arrival_airport', 'airline', 'flight_number']
                missing_fields = [field for field in required_fields if field not in segment]
                if missing_fields:
                    print(f"⚠️ Data Analyst Agent: Flight segment {i} missing required fields: {missing_fields}")
            
            # Get airline info from first flight segment (origin flight)
            first_flight = flights[0]
            print(f"🔍 DEBUG: SerpAPI first_flight keys: {list(first_flight.keys())}")
            airline_name = first_flight.get('airline', 'Unknown')
            flight_number = first_flight.get('flight_number', 'Unknown')
            
            # Extract airline code from flight number or map from airline name
            airline_code = self._extract_airline_code(flight_number, airline_name)
            
            # Clean flight number by removing airline code prefix to avoid duplication
            clean_flight_number = self._clean_flight_number(flight_number, airline_code)
            
            # Format flight number as airline code + number (e.g., "AA179")
            formatted_flight_number = f"{airline_code}{clean_flight_number}"
            print(f"📊 Data Analyst Agent: Formatted flight number: {formatted_flight_number} (from {flight_number})")
            
            # Extract departure and arrival info
            departure_airport = first_flight.get('departure_airport', {})
            arrival_airport = flights[-1].get('arrival_airport', {})
            
            # CRITICAL FIX: Format SerpAPI times properly
            raw_departure_time = departure_airport.get('time', 'Unknown')
            raw_arrival_time = arrival_airport.get('time', 'Unknown')
            
            departure_time = self._format_serpapi_time(raw_departure_time)
            arrival_time = self._format_serpapi_time(raw_arrival_time)
            
            print(f"🔍 DEBUG: Raw departure time: '{raw_departure_time}' → Formatted: '{departure_time}'")
            print(f"🔍 DEBUG: Raw arrival time: '{raw_arrival_time}' → Formatted: '{arrival_time}'")
            
            # CRITICAL: Use total_duration from SerpAPI (not individual segment duration)
            total_duration_minutes = flight_data.get('total_duration', 0)
            duration = self._format_duration_from_minutes(total_duration_minutes) if total_duration_minutes > 0 else 'Unknown'
            print(f"📊 Data Analyst Agent: Total flight duration: {total_duration_minutes} minutes = {duration}")
            
            # Extract price
            price_info = flight_data.get('price', 0)
            
            # Extract aircraft from FIRST segment (origin flight)
            aircraft = first_flight.get('airplane', first_flight.get('aircraft', first_flight.get('aircraft_type', 'Unknown')))
            print(f"📊 Data Analyst Agent: Aircraft from first segment: {aircraft}")
            
            # Extract delay frequency from first segment
            often_delayed_by_over_30_min = first_flight.get('often_delayed_by_over_30_min', False)
            if often_delayed_by_over_30_min:
                print(f"⚠️ Data Analyst Agent: Main flight {formatted_flight_number} is often delayed by 30+ minutes")
            
            # Check for layovers from SerpAPI structure
            serpapi_layovers = flight_data.get('layovers', [])
            has_layovers = len(serpapi_layovers) > 0 or len(flights) > 1
            
            # DEBUG: Log the exact SerpAPI layover structure
            print(f"🔍 DEBUG: SerpAPI layovers structure: {json.dumps(serpapi_layovers, indent=2)}")
            print(f"🔍 DEBUG: Number of SerpAPI layovers: {len(serpapi_layovers)}")
            print(f"🔍 DEBUG: Number of flight segments: {len(flights)}")
            print(f"🔍 DEBUG: Has layovers: {has_layovers}")
            
            # Calculate connections and layovers for multi-segment flights
            connections = []
            layovers = []
            
            if has_layovers:
                print(f"🔗 Data Analyst Agent: Processing {len(flights)} flight segments with {len(serpapi_layovers)} layovers")
                
                for i in range(len(flights)):
                    segment = flights[i]
                    segment_departure = segment.get('departure_airport', {})
                    segment_arrival = segment.get('arrival_airport', {})
                    
                    # Extract segment details
                    segment_duration = segment.get('duration', 0)
                    segment_aircraft = segment.get('airplane', segment.get('aircraft', 'Unknown'))
                    segment_flight_number = segment.get('flight_number', 'Unknown')
                    
                    # Extract delay frequency flag
                    often_delayed = segment.get('often_delayed_by_over_30_min', False)
                    if often_delayed:
                        print(f"⚠️ Data Analyst Agent: Flight {segment_flight_number} is often delayed by 30+ minutes")
                    
                    # Format segment flight number
                    segment_airline_code = self._extract_airline_code(segment_flight_number, segment.get('airline', airline_name))
                    segment_clean_number = self._clean_flight_number(segment_flight_number, segment_airline_code)
                    segment_formatted_number = f"{segment_airline_code}{segment_clean_number}"
                    
                    # Create connection object
                    connection = {
                        'id': f'segment_{i}',
                        'flight_number': segment_formatted_number,
                        'aircraft': segment_aircraft,
                        'duration': self._format_duration_from_minutes(segment_duration),
                        'often_delayed_by_over_30_min': often_delayed,
                        'departure': {
                            'airport': {
                                'code': segment_departure.get('id', 'Unknown'),
                                'name': segment_departure.get('name', 'Unknown'),
                                'city': self._extract_city_from_airport_code(segment_departure.get('id', 'Unknown'))
                            },
                            'time': self._format_serpapi_time(segment_departure.get('time', 'Unknown'))
                        },
                        'arrival': {
                            'airport': {
                                'code': segment_arrival.get('id', 'Unknown'),
                                'name': segment_arrival.get('name', 'Unknown'),
                                'city': self._extract_city_from_airport_code(segment_arrival.get('id', 'Unknown'))
                            },
                            'time': self._format_serpapi_time(segment_arrival.get('time', 'Unknown'))
                        }
                    }
                    
                    # Add layover info if this is not the last segment
                    if i < len(flights) - 1 and i < len(serpapi_layovers):
                        # Use SerpAPI layover data directly
                        layover_data = serpapi_layovers[i]
                        
                        # CRITICAL FIX: Use layover duration from SerpAPI, not flight duration
                        layover_duration_minutes = layover_data.get('duration', 0)
                        if layover_duration_minutes <= 0:
                            print(f"⚠️ Data Analyst Agent: Invalid layover duration for layover {i}: {layover_duration_minutes}")
                            layover_duration_minutes = 90  # Default fallback
                        
                        # CRITICAL FIX: Extract airport code and name from SerpAPI layover data
                        layover_airport_code = layover_data.get('id', '')
                        layover_airport_name = layover_data.get('name', '')
                        
                        # Validate required layover data
                        if not layover_airport_code or not layover_airport_name:
                            print(f"⚠️ Data Analyst Agent: Missing layover airport data for layover {i}")
                            print(f"🔍 DEBUG: Layover {i} data: {json.dumps(layover_data, indent=2)}")
                            # Continue with available data instead of failing
                        
                        # DEBUG: Log what we're extracting from layover data
                        print(f"🔍 DEBUG: Layover {i} data: {json.dumps(layover_data, indent=2)}")
                        print(f"🔍 DEBUG: Layover {i} - Duration: {layover_duration_minutes}min, Airport: {layover_airport_code}, Name: {layover_airport_name}")
                        
                        # Extract city name from airport code or airport name
                        layover_city = self._extract_city_from_airport_code(layover_airport_code)
                        if layover_city == layover_airport_code and layover_airport_name:  # If no mapping found, extract from airport name
                            layover_city = self._extract_city_from_airport_name(layover_airport_name)
                        
                        print(f"🔍 DEBUG: Layover {i} - Final city: '{layover_city}'")
                        
                        # Create layover info with proper error handling
                        layover_info = {
                            'airport': layover_airport_code if layover_airport_code else 'Unknown',
                            'airport_name': layover_airport_name if layover_airport_name else 'Unknown Airport',
                            'city': layover_city if layover_city else 'Unknown City',
                            'duration': self._format_duration_from_minutes(layover_duration_minutes),
                            'arrival_time': self._format_serpapi_time(segment_arrival.get('time', '')),
                            'departure_time': self._format_serpapi_time(flights[i + 1].get('departure_airport', {}).get('time', '')),
                            'overnight': layover_data.get('overnight', False)
                        }
                        
                        connection["layoverInfo"] = layover_info
                        
                        # Add layover feasibility analysis
                        if self.layover_analysis_agent:
                            try:
                                layover_analysis = self.layover_analysis_agent.analyze_layover_feasibility(
                                    duration_str=layover_info['duration'],
                                    airport_code=layover_info['airport'],
                                    arrival_time=layover_info['arrival_time'],
                                    travel_date=date,
                                    incoming_flight_often_delayed=often_delayed
                                )
                                
                                if layover_analysis and not layover_analysis.get('analysis_failed'):
                                    ai_analysis = layover_analysis.get('ai_analysis', {})
                                    connection["layover_analysis"] = {
                                        "feasibility_risk": ai_analysis.get('risk_level', 'unknown'),
                                        "feasibility_score": ai_analysis.get('risk_score', 0),
                                        "feasibility_description": ai_analysis.get('overall_feasibility', 'Analysis not available')
                                    }
                                    print(f"✅ Data Analyst Agent: Added layover feasibility analysis for {layover_info['airport']}")
                                else:
                                    # Set default analysis based on duration
                                    duration_str = layover_info.get('duration', '2h')
                                    duration_minutes = 120  # Default
                                    try:
                                        import re
                                        match = re.match(r'(\d+)h\s*(\d+)m', duration_str)
                                        if match:
                                            hours, minutes = match.groups()
                                            duration_minutes = int(hours) * 60 + int(minutes)
                                    except:
                                        pass
                                    
                                    # Determine risk based on duration
                                    if duration_minutes >= 180:  # 3+ hours
                                        risk_level = "low"
                                        risk_score = 25
                                        feasibility = f"Comfortable {duration_str} layover at {layover_info['airport']}"
                                    elif duration_minutes >= 90:  # 1.5-3 hours
                                        risk_level = "medium"
                                        risk_score = 50
                                        feasibility = f"Adequate {duration_str} layover at {layover_info['airport']}"
                                    else:
                                        risk_level = "high"
                                        risk_score = 75
                                        feasibility = f"Tight {duration_str} layover at {layover_info['airport']}"
                                    
                                    connection["layover_analysis"] = {
                                        "feasibility_risk": risk_level,
                                        "feasibility_score": risk_score,
                                        "feasibility_description": feasibility,
                                        "minimum_connection_time": 60,
                                        "buffer_analysis": {"buffer_adequacy": "Calculated based on duration"},
                                        "recommendations": ["Monitor flight status", "Check gate information"],
                                        "risk_factors": ["Default analysis based on layover duration"],
                                        "contextual_analysis": {"airport_specific": f"{duration_minutes} minutes layover"}
                                    }
                                    print(f"⚠️ Data Analyst Agent: Using default analysis for {layover_info['airport']} ({duration_str})")
                            except Exception as e:
                                print(f"❌ Data Analyst Agent: Error analyzing layover {layover_info['airport']}: {e}")
                                # Don't set failure here - let main.py handle it with default analysis
                        else:
                            # Don't set failure here - let main.py handle it with default analysis
                            print("⚠️ Data Analyst Agent: Layover analysis agent not available")
                        
                        # Also add to layovers array for backward compatibility
                        layovers.append({
                            'airport': layover_info['airport'],
                            'airport_name': layover_info['airport_name'],
                            'city': layover_info['city'],
                            'duration': layover_info['duration'],
                            'arrival_time': layover_info['arrival_time'],
                            'departure_time': layover_info['departure_time'],
                            'travel_date': date
                        })
                        
                        print(f"✅ Data Analyst Agent: Created layover {i}: {layover_info['airport']} ({layover_info['city']}) - {layover_info['duration']}")
                    elif i < len(flights) - 1:
                        # Handle case where we have multiple flight segments but no layover data
                        print(f"⚠️ Data Analyst Agent: Missing layover data for segment {i} (expected {len(flights)-1} layovers, got {len(serpapi_layovers)})")
                        # Create a basic layover entry with available data
                        next_segment = flights[i + 1]
                        next_departure = next_segment.get('departure_airport', {})
                        
                        layover_info = {
                            'airport': next_departure.get('id', 'Unknown'),
                            'airport_name': next_departure.get('name', 'Unknown Airport'),
                            'city': self._extract_city_from_airport_code(next_departure.get('id', 'Unknown')),
                            'duration': 'Unknown',  # No layover duration available
                            'arrival_time': self._format_serpapi_time(segment_arrival.get('time', '')),
                            'departure_time': self._format_serpapi_time(next_departure.get('time', '')),
                            'overnight': False
                        }
                        
                        connection["layoverInfo"] = layover_info
                        
                        # Add layover feasibility analysis for missing layover data case
                        if layover_info['duration'] == 'Unknown':
                            # Can't analyze unknown duration
                            connection["layover_analysis"] = {
                                "feasibility_risk": "unknown",
                                "feasibility_score": 0,
                                "feasibility_description": "❌ Cannot analyze - layover duration unknown"
                            }
                            print(f"⚠️ Data Analyst Agent: Cannot analyze layover {layover_info['airport']} - duration unknown")
                        elif self.layover_analysis_agent:
                            try:
                                layover_analysis = self.layover_analysis_agent.analyze_layover_feasibility(
                                    duration_str=layover_info['duration'],
                                    airport_code=layover_info['airport'],
                                    arrival_time=layover_info['arrival_time'],
                                    travel_date=date,
                                    incoming_flight_often_delayed=often_delayed
                                )
                                
                                if layover_analysis and not layover_analysis.get('analysis_failed'):
                                    ai_analysis = layover_analysis.get('ai_analysis', {})
                                    connection["layover_analysis"] = {
                                        "feasibility_risk": ai_analysis.get('risk_level', 'unknown'),
                                        "feasibility_score": ai_analysis.get('risk_score', 0),
                                        "feasibility_description": ai_analysis.get('overall_feasibility', 'Analysis not available')
                                    }
                                    print(f"✅ Data Analyst Agent: Added layover feasibility analysis for {layover_info['airport']}")
                                else:
                                    # Set default analysis based on duration
                                    duration_str = layover_info.get('duration', '2h')
                                    duration_minutes = 120  # Default
                                    try:
                                        import re
                                        match = re.match(r'(\d+)h\s*(\d+)m', duration_str)
                                        if match:
                                            hours, minutes = match.groups()
                                            duration_minutes = int(hours) * 60 + int(minutes)
                                    except:
                                        pass
                                    
                                    # Determine risk based on duration
                                    if duration_minutes >= 180:  # 3+ hours
                                        risk_level = "low"
                                        risk_score = 25
                                        feasibility = f"Comfortable {duration_str} layover at {layover_info['airport']}"
                                    elif duration_minutes >= 90:  # 1.5-3 hours
                                        risk_level = "medium"
                                        risk_score = 50
                                        feasibility = f"Adequate {duration_str} layover at {layover_info['airport']}"
                                    else:
                                        risk_level = "high"
                                        risk_score = 75
                                        feasibility = f"Tight {duration_str} layover at {layover_info['airport']}"
                                    
                                    connection["layover_analysis"] = {
                                        "feasibility_risk": risk_level,
                                        "feasibility_score": risk_score,
                                        "feasibility_description": feasibility,
                                        "minimum_connection_time": 60,
                                        "buffer_analysis": {"buffer_adequacy": "Calculated based on duration"},
                                        "recommendations": ["Monitor flight status", "Check gate information"],
                                        "risk_factors": ["Default analysis based on layover duration"],
                                        "contextual_analysis": {"airport_specific": f"{duration_minutes} minutes layover"}
                                    }
                                    print(f"⚠️ Data Analyst Agent: Using default analysis for {layover_info['airport']} ({duration_str})")
                            except Exception as e:
                                print(f"❌ Data Analyst Agent: Error analyzing layover {layover_info['airport']}: {e}")
                                # Don't set failure here - let main.py handle it with default analysis
                        else:
                            # Don't set failure here - let main.py handle it with default analysis
                            print("⚠️ Data Analyst Agent: Layover analysis agent not available")
                        
                        layovers.append({
                            'airport': layover_info['airport'],
                            'airport_name': layover_info['airport_name'],
                            'city': layover_info['city'],
                            'duration': layover_info['duration'],
                            'arrival_time': layover_info['arrival_time'],
                            'departure_time': layover_info['departure_time'],
                            'travel_date': date
                        })
                    
                    connections.append(connection)
                
                print(f"✅ Data Analyst Agent: Created {len(connections)} connections with {len(layovers)} layovers")
                # DEBUG: Log the connections structure
                for i, conn in enumerate(connections):
                    print(f"🔍 DEBUG: Connection {i}: {conn.get('departure', {}).get('airport', {}).get('code')} → {conn.get('arrival', {}).get('airport', {}).get('code')}")
                    if 'layoverInfo' in conn:
                        print(f"🔍 DEBUG: Connection {i} has layoverInfo: {conn['layoverInfo']}")
            else:
                print(f"✅ Data Analyst Agent: Direct flight - no layovers")
            
            flight_info = {
                'airline_name': airline_name,
                'airline_code': airline_code,
                'flight_number': formatted_flight_number,  # Use formatted number (e.g., "AA179")
                'origin': origin,
                'destination': destination,
                'origin_airport_code': origin,
                'destination_airport_code': destination,
                'departure_time': departure_time,
                'arrival_time': arrival_time,
                'duration': duration,  # Total duration from SerpAPI
                'price': price_info,
                'aircraft': aircraft,  # Aircraft from first segment
                'layovers': layovers,
                'connections': connections,  # Add connections array
                'flights': flights,  # CRITICAL: Include original SerpAPI flights array for frontend mapping
                'number_of_stops': len(layovers),  # Number of stops
                'total_duration': total_duration_minutes,
                'date': date,
                'data_source': 'SerpAPI',
                'type': flight_data.get('type', 'One way'),  # Include flight type
                'often_delayed_by_over_30_min': often_delayed_by_over_30_min  # Add delay frequency flag
            }
            
            # Add connection_analysis at the top level if there are connections
            if connections and len(connections) > 0:
                # Check if the first connection has connection_analysis
                first_connection = connections[0]
                if 'connection_analysis' in first_connection:
                    flight_info['connection_analysis'] = first_connection['connection_analysis']
                    print(f"✅ Data Analyst Agent: Added top-level connection_analysis from first connection")
                else:
                    # Provide default if missing
                    flight_info['connection_analysis'] = {
                        "feasibility_risk": "medium",
                        "feasibility_score": 50,
                        "feasibility_description": f"Connection analysis for {len(connections)} stop(s)"
                    }
                    print(f"⚠️ Data Analyst Agent: Added default top-level connection_analysis")
            
            return flight_info
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Failed to parse flight info: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _format_duration(self, minutes):
        """
        Format duration from minutes to readable format - ORIGINAL LOGIC
        """
        try:
            minutes = int(minutes)
            hours = minutes // 60
            mins = minutes % 60
            
            if hours > 0 and mins > 0:
                return f"{hours}h {mins}m"
            elif hours > 0:
                return f"{hours}h"
            else:
                return f"{mins}m"
        except (ValueError, TypeError):
            return "0m"

    def _format_duration_from_minutes(self, minutes):
        """Format duration from minutes to readable format"""
        if minutes <= 0:
            return 'Unknown'
        
        hours = minutes // 60
        mins = minutes % 60
        
        if hours > 0 and mins > 0:
            return f"{hours}h {mins}m"
        elif hours > 0:
            return f"{hours}h"
        else:
            return f"{mins}m"
    
    def _format_serpapi_time(self, time_str):
        """Format SerpAPI time string (e.g., '2025-07-30 06:59') to readable format (e.g., '6:59 AM')"""
        if not time_str or time_str == 'Unknown':
            return 'Unknown'
        
        try:
            # Parse SerpAPI time format: "2025-07-30 06:59"
            from datetime import datetime
            time_obj = datetime.strptime(time_str, "%Y-%m-%d %H:%M")
            return time_obj.strftime("%I:%M %p").lstrip("0")
        except Exception as e:
            print(f"⚠️ Data Analyst Agent: Failed to format time '{time_str}': {e}")
            return time_str
    
    def _calculate_duration(self, time1_str: str, time2_str: str) -> str:
        """Calculate duration between two time strings"""
        try:
            # Implementation would go here - calculate actual duration
            return '1h 30m'  # TODO: Implement proper calculation based on actual times
            
        except Exception:
            return 'Unknown'
    
    def _extract_city_from_airport_code(self, airport_code: str) -> str:
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

    def _extract_city_from_airport_name(self, airport_name: str) -> str:
        """Extract city name from airport name (e.g., 'Los Angeles International Airport' -> 'Los Angeles')"""
        try:
            if not airport_name or airport_name == 'Unknown':
                return 'Unknown'
            
            # Remove common airport suffixes
            suffixes = ['International Airport', 'International', 'Airport', 'Regional', 'Municipal', 'Field']
            city = airport_name
            
            for suffix in suffixes:
                if city.endswith(suffix):
                    city = city[:-len(suffix)].strip()
            
            return city if city else 'Unknown'
            
        except Exception:
            return 'Unknown' 
    
    def _calculate_layover_minutes(self, arrival_time: str, departure_time: str) -> int:
        """Calculate layover duration in minutes between arrival and departure times"""
        try:
            if not arrival_time or not departure_time:
                return 90  # Default 1.5 hours if times not available
            
            # Parse times (format: "2025-07-18 09:30" or similar)
            from datetime import datetime
            
            # Try different time formats
            time_formats = [
                '%Y-%m-%d %H:%M',
                '%Y-%m-%d %H:%M:%S',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%dT%H:%M:%SZ'
            ]
            
            arrival_dt = None
            departure_dt = None
            
            for fmt in time_formats:
                if not arrival_dt:
                    try:
                        arrival_dt = datetime.strptime(arrival_time, fmt)
                    except:
                        pass
                
                if not departure_dt:
                    try:
                        departure_dt = datetime.strptime(departure_time, fmt)
                    except:
                        pass
            
            if arrival_dt and departure_dt:
                # Calculate difference in minutes
                diff = departure_dt - arrival_dt
                minutes = int(diff.total_seconds() / 60)
                
                # Handle negative or very small layovers (likely next day)
                if minutes < 30:
                    minutes += 24 * 60  # Add 24 hours
                
                return minutes
            
            return 90  # Default if parsing fails
            
        except Exception as e:
            print(f"⚠️ Data Analyst Agent: Failed to calculate layover duration: {e}")
            return 90  # Default 1.5 hours
    
    def _extract_airline_code(self, flight_number: str, airline_name: str) -> str:
        """Extract airline code from flight number or map from airline name"""
        try:
            # First try to extract from flight number (e.g., "DL1590" → "DL", "B6 615" → "B6")
            if isinstance(flight_number, str) and len(flight_number) >= 2:
                # Check if flight number starts with letters and numbers
                import re
                # FIXED: Include both letters and numbers to capture codes like B6, AA, DL, etc.
                match = re.match(r'^([A-Z0-9]{1,3})', flight_number.upper())
                if match:
                    airline_code = match.group(1)
                    print(f"📊 Data Analyst Agent: Extracted airline code '{airline_code}' from flight number '{flight_number}'")
                    return airline_code
            
            # Fallback: Map airline name to code using common mappings
            airline_mapping = {
                'delta air lines': 'DL',
                'delta': 'DL',
                'american airlines': 'AA', 
                'american': 'AA',
                'united airlines': 'UA',
                'united': 'UA',
                'southwest airlines': 'WN',
                'southwest': 'WN',
                'jetblue airways': 'B6',
                'jetblue': 'B6',
                'alaska airlines': 'AS',
                'alaska': 'AS',
                'spirit airlines': 'NK',
                'spirit': 'NK',
                'frontier airlines': 'F9',
                'frontier': 'F9',
                'hawaiian airlines': 'HA',
                'hawaiian': 'HA',
                'allegiant air': 'G4',
                'allegiant': 'G4'
            }
            
            airline_key = airline_name.lower().strip()
            if airline_key in airline_mapping:
                airline_code = airline_mapping[airline_key]
                print(f"📊 Data Analyst Agent: Mapped airline name '{airline_name}' to code '{airline_code}'")
                return airline_code
            
            # If no mapping found, try to guess from first letters
            if isinstance(airline_name, str) and len(airline_name) >= 2:
                words = airline_name.upper().split()
                if len(words) >= 2:
                    airline_code = words[0][:1] + words[1][:1]  # e.g., "Virgin America" → "VA"
                    print(f"📊 Data Analyst Agent: Guessed airline code '{airline_code}' from '{airline_name}'")
                    return airline_code
            
            print(f"⚠️ Data Analyst Agent: Could not determine airline code for '{airline_name}' / '{flight_number}'")
            return 'Unknown'
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Airline code extraction failed: {e}")
            return 'Unknown'
    
    def _clean_flight_number(self, flight_number: str, airline_code: str) -> str:
        """Remove airline code prefix from flight number to avoid duplication"""
        try:
            if not flight_number or not airline_code or airline_code == 'Unknown':
                return flight_number
            
            # Convert to uppercase for comparison
            flight_upper = flight_number.upper().strip()
            airline_upper = airline_code.upper().strip()
            
            # Remove airline code prefix (e.g., "AS 41" → "41", "DL1732" → "1732")
            if flight_upper.startswith(airline_upper):
                clean_number = flight_upper[len(airline_upper):].strip()
                # Remove leading space or non-alphanumeric chars
                import re
                clean_number = re.sub(r'^[^A-Z0-9]+', '', clean_number)
                
                # If we have a number left, return it, otherwise return original
                if clean_number:
                    print(f"📊 Data Analyst Agent: Cleaned flight number: {flight_number} → {clean_number}")
                    return clean_number
            
            # If no cleaning needed or cleaning failed, return original
            return flight_number
            
        except Exception as e:
            print(f"❌ Data Analyst Agent: Flight number cleaning failed: {e}")
            return flight_number
 