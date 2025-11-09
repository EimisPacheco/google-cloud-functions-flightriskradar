"""
Weather Intelligence Agent - Google ADK Implementation
Provides real-time weather analysis for flight risk assessment
"""
import os
import google.generativeai as genai
from datetime import datetime, timedelta
import json
from typing import Dict, Any, List
import requests

# Import Google ADK - REAL IMPLEMENTATION ONLY
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
print("✅ Weather Intelligence Agent: Using real Google ADK")

class WeatherIntelligenceAgent(Agent):
    """
    Google ADK Weather Intelligence Agent for real-time weather analysis
    """
    
    def __init__(self):
        super().__init__(
            name="weather_intelligence_agent",
            description="Analyzes weather conditions and provides flight risk assessment",
            tools=[
                FunctionTool(func=self.analyze_weather_conditions)
            ]
        )
        
        # Initialize Gemini AI
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel('gemini-2.0-flash')
        
        # OpenWeatherMap API key for real-time weather (preferred)
        self._openweather_key = os.getenv('OPENWEATHER_API_KEY')
        # Fallback to SerpAPI if OpenWeatherMap not available
        self._serpapi_key = os.getenv('SERPAPI_API_KEY')
        
        if self._openweather_key:
            print("✅ Using OpenWeatherMap API for real-time weather data")
            self._weather_source = "openweather"
        elif self._serpapi_key:
            print("⚠️ Falling back to SerpAPI for weather data")
            self._weather_source = "serpapi"
        else:
            print("⚠️ No weather API keys found - will use seasonal patterns only")
            self._weather_source = "seasonal"
        
        # Static airport mapping for reliable city name resolution
        self._airport_mapping = {
            "ATL": {"city": "Atlanta", "state": "GA", "name": "Hartsfield-Jackson Atlanta International Airport", "country": "United States"},
            "LAX": {"city": "Los Angeles", "state": "CA", "name": "Los Angeles International Airport", "country": "United States"},
            "ORD": {"city": "Chicago", "state": "IL", "name": "Chicago O'Hare International Airport", "country": "United States"},
            "DFW": {"city": "Dallas", "state": "TX", "name": "Dallas/Fort Worth International Airport", "country": "United States"},
            "DEN": {"city": "Denver", "state": "CO", "name": "Denver International Airport", "country": "United States"},
            "JFK": {"city": "New York", "state": "NY", "name": "John F. Kennedy International Airport", "country": "United States"},
            "SFO": {"city": "San Francisco", "state": "CA", "name": "San Francisco International Airport", "country": "United States"},
            "SEA": {"city": "Seattle", "state": "WA", "name": "Seattle-Tacoma International Airport", "country": "United States"},
            "LAS": {"city": "Las Vegas", "state": "NV", "name": "McCarran International Airport", "country": "United States"},
            "BOS": {"city": "Boston", "state": "MA", "name": "Boston Logan International Airport", "country": "United States"},
            "EWR": {"city": "Newark", "state": "NJ", "name": "Newark Liberty International Airport", "country": "United States"},
            "LGA": {"city": "New York", "state": "NY", "name": "LaGuardia Airport", "country": "United States"},
            "CLT": {"city": "Charlotte", "state": "NC", "name": "Charlotte Douglas International Airport", "country": "United States"},
            "PHX": {"city": "Phoenix", "state": "AZ", "name": "Phoenix Sky Harbor International Airport", "country": "United States"},
            "IAH": {"city": "Houston", "state": "TX", "name": "George Bush Intercontinental Airport", "country": "United States"},
            "MIA": {"city": "Miami", "state": "FL", "name": "Miami International Airport", "country": "United States"},
            "MCO": {"city": "Orlando", "state": "FL", "name": "Orlando International Airport", "country": "United States"},
            "MSP": {"city": "Minneapolis", "state": "MN", "name": "Minneapolis-St. Paul International Airport", "country": "United States"},
            "DTW": {"city": "Detroit", "state": "MI", "name": "Detroit Metropolitan Airport", "country": "United States"},
            "PHL": {"city": "Philadelphia", "state": "PA", "name": "Philadelphia International Airport", "country": "United States"},
            "BWI": {"city": "Baltimore", "state": "MD", "name": "Baltimore/Washington International Airport", "country": "United States"},
            "SAN": {"city": "San Diego", "state": "CA", "name": "San Diego International Airport", "country": "United States"},
            "DCA": {"city": "Washington", "state": "DC", "name": "Ronald Reagan Washington National Airport", "country": "United States"},
            "IAD": {"city": "Washington", "state": "DC", "name": "Washington Dulles International Airport", "country": "United States"},
            "TPA": {"city": "Tampa", "state": "FL", "name": "Tampa International Airport", "country": "United States"},
            "PDX": {"city": "Portland", "state": "OR", "name": "Portland International Airport", "country": "United States"},
            "STL": {"city": "St. Louis", "state": "MO", "name": "Lambert-St. Louis International Airport", "country": "United States"},
            "HNL": {"city": "Honolulu", "state": "HI", "name": "Daniel K. Inouye International Airport", "country": "United States"}
        }
    
    def _get_airport_info(self, airport_code: str) -> dict:
        """Get airport information using static mapping"""
        airport_code = airport_code.upper()
        if airport_code in self._airport_mapping:
            airport_info = self._airport_mapping[airport_code]
            print(f"✅ Weather Intelligence Agent: Using static airport info for {airport_code} → {airport_info['city']}, {airport_info['state']}")
            return airport_info
        else:
            print(f"⚠️ Weather Intelligence Agent: Airport {airport_code} not found in static mapping, using fallback")
            return {
                "city": "Unknown City",
                "state": "Unknown",
                "name": f"{airport_code} Airport",
                "country": "United States"
            }
    
    def analyze_weather_conditions(self, airport_code: str, flight_date: str, **kwargs) -> dict:
        """
        Analyze weather conditions using 7-day window logic
        """
        try:
            print(f"🌤️ Weather Intelligence Agent: Analyzing weather for {airport_code} on {flight_date}")
            
            # Get airport info for city/state data
            airport_info = self._get_airport_info(airport_code)
            
            # Check if flight is within 7 days
            flight_dt = datetime.strptime(flight_date, "%Y-%m-%d")
            current_dt = datetime.now()
            days_until_flight = (flight_dt.date() - current_dt.date()).days
            # Allow current weather for flights from today to 7 days in future
            is_within_7_days = 0 <= days_until_flight <= 7
            
            print("🚨" * 50)
            print(f"🌤️ WEATHER DECISION FOR {airport_code}:")
            print(f"🌤️ Flight date: {flight_date}")
            print(f"🌤️ Days until flight: {days_until_flight}")
            print(f"🌤️ Within 7 days: {is_within_7_days}")
            print(f"🌤️ Has SERPAPI key: {bool(self._serpapi_key)}")
            print("🚨" * 50)
            
            if is_within_7_days and (self._openweather_key or self._serpapi_key):
                if self._openweather_key:
                    print(f"🌤️ ✅ USING OPENWEATHERMAP for real-time weather analysis: {airport_code}")
                else:
                    print(f"🌤️ ✅ USING SERPAPI for real-time weather analysis: {airport_code}")
                # Use real-time weather (OpenWeatherMap preferred, SerpAPI fallback)
                result = self._analyze_realtime_weather(airport_code, flight_date)
            else:
                print(f"🌤️ ⚠️ USING SEASONAL PATTERNS for weather analysis: {airport_code}")
                if not is_within_7_days:
                    print(f"🌤️ Reason: Flight is {days_until_flight} days away (>7 days)")
                if not self._serpapi_key:
                    print(f"🌤️ Reason: SERPAPI key not available")
                # Use seasonal patterns
                result = self._analyze_seasonal_patterns(airport_code, flight_date)
            
            # Ensure we always return a dictionary with city information
            if isinstance(result, dict):
                # Add airport city/state information to result for proper display
                result['airport_code'] = airport_code
                result['city'] = airport_info.get('city', 'Unknown City')
                result['state'] = airport_info.get('state', 'Unknown')
                result['airport_name'] = airport_info.get('name', 'Unknown Airport')
                result['country'] = airport_info.get('country', 'United States')
                return result
            else:
                print(f"❌ Weather Intelligence Agent: Invalid result type: {type(result)}")
                return self._get_fallback_weather_analysis(airport_code, "error")
                
        except Exception as e:
            print(f"❌ Weather Intelligence Agent: Error analyzing weather: {e}")
            return self._get_fallback_weather_analysis(airport_code, "error")
    
    def _analyze_realtime_weather(self, airport_code: str, flight_date: str) -> dict:
        """
        Analyze real-time weather using OpenWeatherMap (preferred) or SerpAPI (fallback), with seasonal fallback if APIs fail
        """
        weather_data = None
        api_failed = False
        api_failure_reason = ""
        
        # Try OpenWeatherMap first if available
        if self._openweather_key:
            print(f"🌤️ WEATHER INTELLIGENCE: Attempting REAL-TIME OpenWeatherMap analysis for {airport_code} on {flight_date}")
            weather_data = self._get_openweather_data(airport_code)
            
            # Check if OpenWeatherMap failed
            if weather_data.get("source") == "OpenWeatherMap API (failed)" or "unavailable" in weather_data.get("conditions", ""):
                api_failed = True
                api_failure_reason = f"OpenWeatherMap API failed for {airport_code}"
                print(f"❌ WEATHER API FAILURE: {api_failure_reason}")
                print(f"🔄 WEATHER FALLBACK: Switching to SerpAPI for {airport_code}")
                weather_data = None
        
        # Try SerpAPI as secondary option if OpenWeatherMap failed or not available
        if weather_data is None and self._serpapi_key:
            if not api_failed:  # Only log if this is the primary attempt, not a fallback
                print(f"🌤️ WEATHER INTELLIGENCE: Attempting REAL-TIME SerpAPI analysis for {airport_code} on {flight_date}")
            
            serpapi_data = self._get_serpapi_weather(airport_code)
            
            # Check if SerpAPI failed
            if serpapi_data.get("source") == "SerpAPI (failed)" or "unavailable" in serpapi_data.get("conditions", ""):
                api_failed = True
                api_failure_reason += f" | SerpAPI failed for {airport_code}"
                print(f"❌ WEATHER API FAILURE: SerpAPI failed for {airport_code}")
                print(f"🔄 WEATHER FALLBACK: All weather APIs failed, switching to seasonal analysis for {airport_code}")
                weather_data = None
            else:
                weather_data = serpapi_data
        
        # If all weather APIs failed, fallback to seasonal analysis
        if weather_data is None:
            if not api_failed:
                api_failure_reason = f"No weather API keys available for {airport_code}"
                print(f"❌ WEATHER API FAILURE: {api_failure_reason}")
            
            print(f"🌦️ WEATHER FALLBACK ACTIVATED: Using seasonal analysis instead of real-time data for {airport_code}")
            print(f"🌦️ FALLBACK REASON: {api_failure_reason}")
            
            # Use seasonal analysis as fallback
            seasonal_result = self._analyze_seasonal_patterns(airport_code, flight_date)
            seasonal_result["fallback_used"] = True
            seasonal_result["fallback_reason"] = api_failure_reason
            
            # Update data source to indicate fallback
            if isinstance(seasonal_result, dict) and "data_source" in seasonal_result:
                seasonal_result["data_source"] = f"Seasonal Analysis (Weather API Fallback)"
            
            print(f"🚀 Weather Intelligence: Using seasonal fallback for {airport_code}")
            return seasonal_result
        
        # Continue with AI analysis using successful weather data
        try:
            # Analyze with AI
            prompt = f"""
            Analyze the real-time weather data for {airport_code} airport on {flight_date}.
            
            Weather Data: {json.dumps(weather_data, indent=2)}
            
            WEATHER RISK CLASSIFICATION GUIDELINES:
            - LOW RISK: Clear skies, partly cloudy, light winds, good visibility (>10 miles), no precipitation
            - MEDIUM RISK: Cloudy, moderate winds (10-25 mph), reduced visibility (5-10 miles), light rain/snow
            - HIGH RISK: Heavy rain/snow, thunderstorms, strong winds (>25 mph), poor visibility (<5 miles), fog, ice
            
            Provide a comprehensive weather risk assessment including:
            1. Overall weather risk level (low/medium/high) - FOLLOW THE GUIDELINES ABOVE
            2. Detailed weather impact description (MAXIMUM 250 characters)
            3. Specific risk factors for flight operations
            4. Airport complexity analysis (MAXIMUM 250 characters)
            5. Recommendations for travelers
            
            CRITICAL DESCRIPTION FORMAT REQUIREMENTS:
            - weather_risk.description: MUST start with "Moderate risk due to" or "Low risk due to" or "High risk due to" followed by specific weather conditions
            - Example: "Moderate risk due to overcast clouds, 88% humidity, and 6.2 miles visibility. Temperature at 80°F with 7.45 mph winds pose minor impacts."
            - MAXIMUM 250 characters, concise and professional
            - airport_complexity.description: MAXIMUM 250 characters, concise and professional
            - Keep all text professional, no truncation indicators like "..." or "❌"
            
            Format the response as JSON with this exact structure:
            {{
                "weather_risk": {{
                    "level": "medium",
                    "description": "Detailed weather impact description (max 250 chars)"
                }},
                "weather_conditions": {{
                    "conditions": "Current weather conditions"
                }},
                "airport_complexity": {{
                    "complexity": "high",
                    "description": "Airport complexity analysis (max 250 chars)",
                    "concerns": ["concern 1", "concern 2"]
                }},
                "data_source": f"Real-time weather data from {weather_data.get('source', 'Weather API')}"
            }}
            
            Return only valid JSON, no extra text.
            """
            
            print(f"🤖 SENDING WEATHER DATA TO AI FOR ANALYSIS:")
            print(f"   Airport: {airport_code}")
            print(f"   Weather Input: {json.dumps(weather_data, indent=2)}")
            
            response = self._model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean the response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            print(f"🤖 AI ANALYSIS RAW RESPONSE:")
            print(f"   Length: {len(response_text)} characters")
            print(f"   Content: {response_text[:500]}...")
            
            try:
                analysis = json.loads(response_text)
                print("✅ AI ANALYSIS SUCCESSFULLY PARSED AS JSON:")
                print(f"   Keys: {list(analysis.keys())}")
                if 'weather_risk' in analysis:
                    print(f"   Weather Risk Level: {analysis['weather_risk'].get('level', 'Unknown')}")
                    print(f"   Weather Risk Description: {analysis['weather_risk'].get('description', 'None')[:100]}")
                
                # Add fallback indicator for successful real-time analysis
                analysis["fallback_used"] = False
                return analysis
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed, response was: {response_text[:200]}...")
                # Return fallback structure
                return self._get_fallback_weather_analysis(airport_code, "real-time")
            
        except Exception as e:
            print(f"❌ Real-time weather analysis failed: {str(e)}")
            # Fallback to seasonal patterns
            try:
                return self._analyze_seasonal_patterns(airport_code, flight_date)
            except Exception as e2:
                print(f"❌ Seasonal patterns also failed: {str(e2)}")
                return self._get_fallback_weather_analysis(airport_code, "real-time")
    
    def _analyze_seasonal_patterns(self, airport_code: str, flight_date: str) -> dict:
        """
        Analyze seasonal weather patterns using AI knowledge
        """
        try:
            print(f"🌤️ Using seasonal patterns analysis: {airport_code}")
            
            flight_dt = datetime.strptime(flight_date, "%Y-%m-%d")
            month = flight_dt.month
            season = self._get_season(month)
            
            prompt = f"""
            Analyze typical weather patterns for {airport_code} airport during {season} (month {month}).
            
            WEATHER RISK CLASSIFICATION GUIDELINES:
            - LOW RISK: Clear skies, partly cloudy, light winds, good visibility (>10 miles), no precipitation
            - MEDIUM RISK: Cloudy, moderate winds (10-25 mph), reduced visibility (5-10 miles), light rain/snow
            - HIGH RISK: Heavy rain/snow, thunderstorms, strong winds (>25 mph), poor visibility (<5 miles), fog, ice
            
            Provide a comprehensive seasonal weather risk assessment including:
            1. Overall weather risk level (low/medium/high) - FOLLOW THE GUIDELINES ABOVE
            2. Typical weather conditions during this season (MAXIMUM 250 characters)
            3. Common weather-related flight risks
            4. Airport complexity analysis (MAXIMUM 250 characters)
            5. Seasonal recommendations for travelers
            
            CRITICAL DESCRIPTION FORMAT REQUIREMENTS:
            - weather_risk.description: MUST start with "Moderate risk due to" or "Low risk due to" or "High risk due to" followed by specific seasonal weather conditions
            - Example: "Moderate risk due to seasonal thunderstorms, high humidity, and variable winds. Summer heat may impact aircraft performance."
            - MAXIMUM 250 characters, concise and professional
            - airport_complexity.description: MAXIMUM 250 characters, concise and professional
            - Keep all text professional, no truncation indicators like "..." or "❌"
            
            Consider historical weather patterns, seasonal storms, temperature ranges, and typical flight impacts.
            
            Format the response as JSON with this exact structure:
            {{
                "weather_risk": {{
                    "level": "medium",
                    "description": "Seasonal weather impact description (max 250 chars)"
                }},
                "weather_conditions": {{
                    "conditions": "Typical seasonal conditions"
                }},
                "airport_complexity": {{
                    "complexity": "high",
                    "description": "Airport complexity analysis (max 250 chars)",
                    "concerns": ["concern 1", "concern 2"]
                }},
                "data_source": "Seasonal weather patterns analysis"
            }}
            
            Return only valid JSON, no extra text.
            """
            
            response = self._model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean the response
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"❌ JSON parsing failed, response was: {response_text[:200]}...")
                # Return fallback structure
                return self._get_fallback_weather_analysis(airport_code, "seasonal")
            
            return {
                **analysis,
                "data_source": "Seasonal weather patterns analysis"
            }
                            
        except Exception as e:
            print(f"❌ Seasonal patterns analysis failed: {str(e)}")
            return self._get_fallback_weather_analysis(airport_code, "seasonal")
    
    def _get_fallback_weather_analysis(self, airport_code: str, analysis_type: str) -> dict:
        """
        Get fallback weather analysis when AI analysis fails
        """
        return {
            "weather_risk": {
                "level": "medium",
                "description": f"Moderate risk due to weather analysis unavailable for {airport_code}. Standard seasonal patterns applied with typical operational conditions."
            },
            "weather_conditions": {
                "conditions": "Weather conditions analysis pending"
            },
            "airport_complexity": {
                "complexity": "medium",
                "description": f"Airport complexity analysis for {airport_code} currently unavailable, standard operational assessment applied",
                "concerns": ["Analysis temporarily unavailable"]
            },
            "data_source": f"Fallback {analysis_type} analysis"
        }
    
    def _get_openweather_data(self, airport_code: str) -> dict:
        """
        Get real-time weather data from OpenWeatherMap API
        """
        try:
            # Get airport info
            airport_info = self._airport_mapping.get(airport_code, {
                "city": airport_code,
                "state": "",
                "country": "US"
            })
            
            city = airport_info.get('city', airport_code)
            state = airport_info.get('state', '')
            country = airport_info.get('country', 'US')
            
            # Format location for OpenWeatherMap API
            location = f"{city},{state},{country}" if state else f"{city},{country}"
            
            print(f"🌤️ OPENWEATHERMAP REQUEST FOR {airport_code} -> {location}")
            
            # Build OpenWeatherMap API request
            url = "https://api.openweathermap.org/data/2.5/weather"
            params = {
                'q': location,
                'appid': self._openweather_key,
                'units': 'imperial'  # Fahrenheit, mph
            }
            
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            print(f"📥 OPENWEATHERMAP RESPONSE: {response.status_code}")
            
            # Extract relevant weather information
            main = data.get('main', {})
            weather = data.get('weather', [{}])[0]
            wind = data.get('wind', {})
            visibility = data.get('visibility', 0) / 1609.34  # Convert meters to miles
            clouds = data.get('clouds', {})
            
            # Format weather info
            conditions = weather.get('description', 'Unknown').title()
            temp = int(main.get('temp', 0))
            humidity = main.get('humidity', 0)
            wind_speed = wind.get('speed', 0)
            wind_direction = wind.get('deg', 0)
            cloud_coverage = clouds.get('all', 0)
            
            weather_info = {
                "conditions": conditions,
                "temperature": f"{temp}°F",
                "humidity": f"{humidity}%",
                "wind": f"{wind_speed} mph",
                "wind_direction": f"{wind_direction}°",
                "visibility": f"{visibility:.1f} miles" if visibility > 0 else "Unknown",
                "cloud_coverage": f"{cloud_coverage}%",
                "location": f"{city}, {state}" if state else city,
                "date": "Current",
                "source": "OpenWeatherMap API"
            }
            
            print("=" * 80)
            print("🌤️ OPENWEATHERMAP WEATHER DATA SUCCESSFULLY RETRIEVED:")
            print(f"   Airport: {airport_code}")
            print(f"   Location: {weather_info['location']}")
            print(f"   Conditions: {weather_info['conditions']}")
            print(f"   Temperature: {weather_info['temperature']}")
            print(f"   Humidity: {weather_info['humidity']}")
            print(f"   Wind: {weather_info['wind']} at {weather_info['wind_direction']}")
            print(f"   Visibility: {weather_info['visibility']}")
            print(f"   Cloud Coverage: {weather_info['cloud_coverage']}")
            print(f"   Source: {weather_info['source']}")
            print("=" * 80)
            
            return weather_info
            
        except Exception as e:
            print(f"❌ OpenWeatherMap weather fetch failed: {str(e)}")
            # Return a default weather structure instead of raising
            return {
                "conditions": "Weather data unavailable",
                "temperature": "Unknown",
                "humidity": "Unknown",
                "wind": "Unknown",
                "visibility": "Unknown",
                "location": airport_code,
                "date": "Unknown",
                "source": "OpenWeatherMap API (failed)"
            }
    
    def _get_serpapi_weather(self, airport_code: str) -> dict:
        """
        Get real-time weather data from SerpAPI
        """
        try:
            print("🚨" * 50)
            print(f"🌤️ SERPAPI WEATHER REQUEST FOR {airport_code}")
            print("🚨" * 50)
            
            url = "https://serpapi.com/search"
            params = {
                "engine": "google",
                "q": f"weather {airport_code} airport",
                "api_key": self._serpapi_key
            }
            
            print(f"📤 SERPAPI WEATHER URL: {url}")
            print(f"📤 SERPAPI WEATHER QUERY: weather {airport_code} airport")
            print("🚨" * 50)
            
            response = requests.get(url, params=params, timeout=10)
            
            print("🚨" * 50)
            print(f"📥 SERPAPI WEATHER RESPONSE STATUS: {response.status_code}")
            print("🚨" * 50)
            
            response.raise_for_status()
            
            data = response.json()
            
            print("🚨" * 50)
            print(f"📥 SERPAPI WEATHER RESPONSE KEYS: {list(data.keys())}")
            if 'weather_result' in data:
                print(f"📥 SERPAPI WEATHER RESULT FOUND: {data['weather_result']['weather']}")
            print("🚨" * 50)
            
            # Extract weather information from SerpAPI response
            weather_info = {}
            
            if "weather_result" in data:
                raw_weather = data["weather_result"]
                # Map SERPAPI fields to our expected format
                weather_info = {
                    "conditions": raw_weather.get("weather", "Unknown"),
                    "temperature": raw_weather.get("temperature", "N/A"),
                    "wind_speed": raw_weather.get("wind", "N/A"),
                    "humidity": raw_weather.get("humidity", "N/A"),
                    "precipitation": raw_weather.get("precipitation", "N/A"),
                    "location": raw_weather.get("location", "Unknown"),
                    "date": raw_weather.get("date", "Unknown")
                }
                print(f"🌤️ SERPAPI WEATHER DATA MAPPED FROM weather_result: {weather_info}")
            elif "answer_box" in data:
                print(f"🌤️ PROCESSING ANSWER_BOX: {list(data['answer_box'].keys())}")
                # Handle answer_box structure which contains weather data
                answer_box = data["answer_box"]
                if answer_box.get("type") == "weather_result":
                    # Extract weather data from answer_box
                    weather_info = {
                        "conditions": answer_box.get("weather", "Unknown"),
                        "temperature": answer_box.get("temperature", "N/A"),
                        "wind_speed": answer_box.get("wind", "N/A"),
                        "humidity": answer_box.get("humidity", "N/A"),
                        "precipitation": answer_box.get("precipitation", "N/A"),
                        "location": answer_box.get("location", "Unknown"),
                        "date": answer_box.get("date", "Unknown")
                    }
                    print(f"🌤️ SERPAPI WEATHER DATA MAPPED FROM answer_box: {weather_info}")
                else:
                    print(f"❌ ANSWER_BOX TYPE NOT weather_result: {answer_box.get('type', 'Unknown')}")
                    weather_info = {}
            
            # Add deterministic risk assessment
            weather_info = self._add_deterministic_risk_assessment(weather_info)
            
            return weather_info
            
        except Exception as e:
            print(f"❌ SerpAPI weather fetch failed: {str(e)}")
            # Return a default weather structure instead of raising
            return {
                "conditions": "Weather data unavailable",
                "temperature": "N/A",
                "wind_speed": "N/A",
                "visibility": "N/A",
                "source": "SerpAPI (failed)",
                "deterministic_risk": {
                    "level": "medium",
                    "description": "Weather data temporarily unavailable, using standard assessment"
                }
            }
    
    def _add_deterministic_risk_assessment(self, weather_data: dict) -> dict:
        """
        Add deterministic weather risk assessment based on aviation standards
        """
        try:
            # Extract weather conditions from the data
            conditions = weather_data.get('conditions', '').lower()
            temperature = weather_data.get('temperature', '')
            wind_speed = weather_data.get('wind_speed', '')
            visibility = weather_data.get('visibility', '')
            
            # Deterministic risk classification based on aviation standards
            risk_level = "low"
            risk_description = "Good flying conditions with minimal weather impact."
            
            # Check for high-risk conditions first
            if any(term in conditions for term in ['thunderstorm', 'storm', 'heavy rain', 'heavy snow', 'fog', 'ice']):
                risk_level = "high"
                risk_description = "Severe weather conditions may cause significant flight delays and cancellations."
            elif any(term in conditions for term in ['rain', 'snow', 'cloudy', 'overcast']):
                risk_level = "medium"
                risk_description = "Moderate weather conditions may cause minor delays and require standard precautions."
            elif any(term in conditions for term in ['partly cloudy', 'clear', 'sunny', 'fair']):
                risk_level = "low"
                risk_description = "Good weather conditions with minimal impact on flight operations."
            
            # Add deterministic assessment to weather data
            weather_data['deterministic_risk'] = {
                "level": risk_level,
                "description": risk_description
            }
            
            print(f"🌤️ Deterministic weather risk: {risk_level} - {risk_description}")
            
            return weather_data
            
        except Exception as e:
            print(f"❌ Deterministic risk assessment failed: {e}")
            # Ensure we always return a dictionary with required structure
            if isinstance(weather_data, dict):
                weather_data['deterministic_risk'] = {
                    "level": "medium",
                    "description": "Weather assessment temporarily unavailable"
                }
                return weather_data
            else:
                return {
                    "conditions": "Weather data unavailable",
                    "deterministic_risk": {
                        "level": "medium",
                        "description": "Weather assessment temporarily unavailable"
                    }
                }
    
    def _get_season(self, month: int) -> str:
        """
        Get season name from month
        """
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        else:
            return "Fall"

# Create agent instance
weather_intelligence_agent = WeatherIntelligenceAgent()

