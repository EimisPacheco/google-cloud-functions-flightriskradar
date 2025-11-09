"""
OpenWeatherMap Weather Intelligence Tool for Flight Risk Analysis
Replaces SerpAPI with OpenWeatherMap API for real-time weather conditions
Uses Google ADK agents for AI-powered analysis
"""
import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
import google.generativeai as genai

# Import Google ADK Sub-Agents
from airport_complexity_agent import AirportComplexityAgent
from weather_impact_agent import WeatherImpactAgent

logger = logging.getLogger(__name__)

class OpenWeatherIntelligenceTool:
    """Tool for weather-based flight risk assessment using OpenWeatherMap API and Google ADK agents"""
    
    def __init__(self):
        # Get OpenWeatherMap API key from environment variable
        self.openweather_key = os.getenv("OPENWEATHER_API_KEY")
        if not self.openweather_key:
            raise ValueError("OPENWEATHER_API_KEY environment variable is required")
        self.base_url = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5/weather")
        self.forecast_url = os.getenv("OPENWEATHER_FORECAST_URL", "https://api.openweathermap.org/data/2.5/forecast")
        
        # OPTIMIZED: Add caching to avoid duplicate analysis
        self.weather_cache = {}
        self.airport_info_cache = {}
        
        # Initialize Google ADK Sub-Agents
        try:
            self.airport_complexity_agent = AirportComplexityAgent()
            self.weather_impact_agent = WeatherImpactAgent()
            print("🌤️ OpenWeather Intelligence Tool: Google ADK agents initialized")
        except Exception as e:
            print(f"❌ OpenWeather Intelligence Tool: Failed to initialize ADK agents: {e}")
            self.airport_complexity_agent = None
            self.weather_impact_agent = None
        
        # Initialize Gemini model for AI-powered analysis
        try:
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("🤖 OpenWeather Intelligence Tool: Gemini AI model initialized")
        except Exception as e:
            print(f"❌ OpenWeather Intelligence Tool: Failed to initialize Gemini model: {e}")
            self.gemini_model = None
            
        # Static airport mapping for reliable city name resolution (primary method)
        self._airport_mapping = {
            "ATL": {"city": "Atlanta", "state": "GA", "name": "Hartsfield-Jackson Atlanta International Airport", "country": "United States", "valid": True},
            "LAX": {"city": "Los Angeles", "state": "CA", "name": "Los Angeles International Airport", "country": "United States", "valid": True},
            "ORD": {"city": "Chicago", "state": "IL", "name": "Chicago O'Hare International Airport", "country": "United States", "valid": True},
            "DFW": {"city": "Dallas", "state": "TX", "name": "Dallas/Fort Worth International Airport", "country": "United States", "valid": True},
            "DEN": {"city": "Denver", "state": "CO", "name": "Denver International Airport", "country": "United States", "valid": True},
            "JFK": {"city": "New York", "state": "NY", "name": "John F. Kennedy International Airport", "country": "United States", "valid": True},
            "SFO": {"city": "San Francisco", "state": "CA", "name": "San Francisco International Airport", "country": "United States", "valid": True},
            "SEA": {"city": "Seattle", "state": "WA", "name": "Seattle-Tacoma International Airport", "country": "United States", "valid": True},
            "LAS": {"city": "Las Vegas", "state": "NV", "name": "McCarran International Airport", "country": "United States", "valid": True},
            "BOS": {"city": "Boston", "state": "MA", "name": "Boston Logan International Airport", "country": "United States", "valid": True},
            "EWR": {"city": "Newark", "state": "NJ", "name": "Newark Liberty International Airport", "country": "United States", "valid": True},
            "LGA": {"city": "New York", "state": "NY", "name": "LaGuardia Airport", "country": "United States", "valid": True},
            "CLT": {"city": "Charlotte", "state": "NC", "name": "Charlotte Douglas International Airport", "country": "United States", "valid": True},
            "PHX": {"city": "Phoenix", "state": "AZ", "name": "Phoenix Sky Harbor International Airport", "country": "United States", "valid": True},
            "IAH": {"city": "Houston", "state": "TX", "name": "George Bush Intercontinental Airport", "country": "United States", "valid": True},
            "MIA": {"city": "Miami", "state": "FL", "name": "Miami International Airport", "country": "United States", "valid": True},
            "MCO": {"city": "Orlando", "state": "FL", "name": "Orlando International Airport", "country": "United States", "valid": True},
            "MSP": {"city": "Minneapolis", "state": "MN", "name": "Minneapolis-St. Paul International Airport", "country": "United States", "valid": True},
            "DTW": {"city": "Detroit", "state": "MI", "name": "Detroit Metropolitan Airport", "country": "United States", "valid": True},
            "PHL": {"city": "Philadelphia", "state": "PA", "name": "Philadelphia International Airport", "country": "United States", "valid": True},
            "BWI": {"city": "Baltimore", "state": "MD", "name": "Baltimore/Washington International Airport", "country": "United States", "valid": True},
            "SAN": {"city": "San Diego", "state": "CA", "name": "San Diego International Airport", "country": "United States", "valid": True},
            "DCA": {"city": "Washington", "state": "DC", "name": "Ronald Reagan Washington National Airport", "country": "United States", "valid": True},
            "IAD": {"city": "Washington", "state": "DC", "name": "Washington Dulles International Airport", "country": "United States", "valid": True},
            "TPA": {"city": "Tampa", "state": "FL", "name": "Tampa International Airport", "country": "United States", "valid": True},
            "PDX": {"city": "Portland", "state": "OR", "name": "Portland International Airport", "country": "United States", "valid": True},
            "STL": {"city": "St. Louis", "state": "MO", "name": "Lambert-St. Louis International Airport", "country": "United States", "valid": True},
            "HNL": {"city": "Honolulu", "state": "HI", "name": "Daniel K. Inouye International Airport", "country": "United States", "valid": True},
            "DAL": {"city": "Dallas", "state": "TX", "name": "Dallas Love Field", "country": "United States", "valid": True},
            "MDW": {"city": "Chicago", "state": "IL", "name": "Chicago Midway International Airport", "country": "United States", "valid": True},
            "BNA": {"city": "Nashville", "state": "TN", "name": "Nashville International Airport", "country": "United States", "valid": True},
            "AUS": {"city": "Austin", "state": "TX", "name": "Austin-Bergstrom International Airport", "country": "United States", "valid": True},
            "MCI": {"city": "Kansas City", "state": "MO", "name": "Kansas City International Airport", "country": "United States", "valid": True},
            "CVG": {"city": "Cincinnati", "state": "OH", "name": "Cincinnati/Northern Kentucky International Airport", "country": "United States", "valid": True},
            "SLC": {"city": "Salt Lake City", "state": "UT", "name": "Salt Lake City International Airport", "country": "United States", "valid": True},
            "CLE": {"city": "Cleveland", "state": "OH", "name": "Cleveland Hopkins International Airport", "country": "United States", "valid": True},
            "SJC": {"city": "San Jose", "state": "CA", "name": "San Jose International Airport", "country": "United States", "valid": True},
            "OAK": {"city": "Oakland", "state": "CA", "name": "Oakland International Airport", "country": "United States", "valid": True}
        }
    
    def _ai_get_airport_info(self, airport_code: str) -> Dict[str, Any]:
        """Get airport information using static mapping first, then AI analysis"""
        
        # PRIMARY: Check static mapping first for reliable results
        if airport_code.upper() in self._airport_mapping:
            airport_info = self._airport_mapping[airport_code.upper()]
            print(f"✅ OpenWeather Tool: Using static airport info for {airport_code} → {airport_info['city']}, {airport_info['state']}")
            
            # Cache the static result for consistency
            self.airport_info_cache[airport_code] = airport_info
            return airport_info
        
        # Check cache for AI-generated results
        if airport_code in self.airport_info_cache:
            print(f"🚀 OpenWeather Tool: Using cached airport info for {airport_code}")
            return self.airport_info_cache[airport_code]
        
        # FALLBACK: Use AI if not in static mapping
        if not self.gemini_model:
            return {"error": f"Airport {airport_code} not found in static mapping and AI lookup unavailable", "valid": False}
        
        print(f"🔍 OpenWeather Tool: Falling back to AI lookup for {airport_code}")
        
        try:
            prompt = f"""Provide airport information for IATA code: {airport_code}

Return airport details in JSON format:
{{
    "city": "city name",
    "state": "state/province/country code",
    "name": "full airport name",
    "country": "country name",
    "valid": true
}}

If the airport code is invalid or unknown, return:
{{
    "error": "Invalid airport code",
    "valid": false
}}

Return only the JSON object."""
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Clean up JSON formatting
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            try:
                airport_info = json.loads(ai_response)
                
                # OPTIMIZED: Cache the result
                self.airport_info_cache[airport_code] = airport_info
                print(f"🤖 OpenWeather Tool: AI generated airport info for {airport_code}: {airport_info.get('city', 'Unknown')}, {airport_info.get('state', 'Unknown')}")
                
                return airport_info
            except json.JSONDecodeError as e:
                print(f"❌ OpenWeather Tool: AI airport info JSON parsing failed for {airport_code}: {e}")
                print(f"🔍 Raw AI response: {ai_response}")
                return {"error": "AI airport info parsing failed", "valid": False}
                
        except Exception as e:
            print(f"❌ AI airport lookup failed: {e}")
            return {"error": f"AI airport lookup failed: {str(e)}", "valid": False}
    
    def _is_within_7_days(self, travel_date: str) -> bool:
        """Check if travel date is within next 7 days using deterministic calculation"""
        try:
            # FIXED: Use deterministic calculation instead of AI to ensure consistent results
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            today = datetime.now()
            days_ahead = (travel_datetime.date() - today.date()).days
            is_within_7_days = 0 <= days_ahead <= 7
            
            print(f"🔍 DEBUG: Date check - Today: {today.date()}, Travel: {travel_datetime.date()}, Days ahead: {days_ahead}, Within 7 days: {is_within_7_days}")
            
            return is_within_7_days
            
        except Exception as e:
            print(f"❌ Date analysis failed: {e}")
            return False
    
    def _get_openweather_data(self, city: str, state: str) -> Dict[str, Any]:
        """Get current weather data from OpenWeatherMap API"""
        try:
            # Build query for US cities
            query = f"{city},{state},US"
            
            params = {
                "q": query,
                "appid": self.openweather_key,
                "units": "imperial"  # Fahrenheit, mph, etc.
            }
            
            print(f"🌤️ OpenWeather API: Fetching weather for {query}")
            response = requests.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            # Extract relevant weather information
            weather_info = {
                "conditions": data["weather"][0]["description"].title(),
                "main_condition": data["weather"][0]["main"],
                "temperature": int(data["main"]["temp"]),
                "feels_like": int(data["main"]["feels_like"]),
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "visibility": data.get("visibility", 10000) / 1609.34,  # Convert meters to miles
                "wind_speed": data["wind"].get("speed", 0),
                "wind_direction": data["wind"].get("deg", 0),
                "clouds": data["clouds"]["all"],
                "timestamp": datetime.now().isoformat(),
                "api_response": data
            }
            
            # Add precipitation data if available
            if "rain" in data:
                weather_info["rain_1h"] = data["rain"].get("1h", 0)
                weather_info["rain_3h"] = data["rain"].get("3h", 0)
            
            if "snow" in data:
                weather_info["snow_1h"] = data["snow"].get("1h", 0)
                weather_info["snow_3h"] = data["snow"].get("3h", 0)
            
            print(f"✅ OpenWeather API: Successfully fetched weather for {city}, {state}")
            print(f"   Conditions: {weather_info['conditions']}, Temp: {weather_info['temperature']}F")
            
            return weather_info
            
        except requests.RequestException as e:
            print(f"❌ OpenWeather API request failed: {e}")
            return {"error": f"OpenWeatherMap API request failed: {str(e)}"}
        except Exception as e:
            print(f"❌ OpenWeather API error: {e}")
            return {"error": f"OpenWeatherMap API error: {str(e)}"}
    
    def _ai_assess_weather_risk_level(self, weather_info: Dict[str, Any]) -> str:
        """Assess flight risk level based on weather conditions using AI analysis"""
        if not self.gemini_model:
            return "medium"
        
        try:
            conditions = weather_info.get("conditions", "Unknown")
            main_condition = weather_info.get("main_condition", "Unknown")
            temperature = weather_info.get("temperature", 70)
            wind_speed = weather_info.get("wind_speed", 0)
            visibility = weather_info.get("visibility", 10)
            humidity = weather_info.get("humidity", 50)
            
            prompt = f"""
            Assess the flight risk level for the following weather conditions:
            - Conditions: {conditions} ({main_condition})
            - Temperature: {temperature}F
            - Wind Speed: {wind_speed} mph
            - Visibility: {visibility} miles
            - Humidity: {humidity}%
            
            Consider factors like:
            - Flight safety and operational impact
            - Visibility and wind conditions
            - Precipitation and storm severity
            - Temperature extremes
            - General aviation weather risks
            
            Return only one of these risk levels: "very_low", "low", "medium", "high"
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_risk = response.text.strip().lower()
            
            # Validate AI response
            valid_risks = ["very_low", "low", "medium", "high"]
            if ai_risk in valid_risks:
                return ai_risk
            else:
                return "unknown"  # Return 'unknown' if AI analysis failed
                
        except Exception as e:
            print(f"❌ AI risk assessment failed: {e}")
            return "unknown"
    
    def _get_seasonal_weather_analysis(self, airport_code: str, travel_date: str) -> Dict[str, Any]:
        """
        Get seasonal weather analysis for flights >7 days out
        Based on AI analysis of seasonal patterns
        """
        # Get airport information using AI
        airport = self._ai_get_airport_info(airport_code)
        if not airport.get("valid", False):
            return {"error": f"Airport {airport_code} not found or invalid"}
        
        if "error" in airport:
            return {"error": f"Airport lookup failed: {airport['error']}"}
        
        try:
            # Parse the travel date
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            formatted_date = travel_datetime.strftime("%B %d, %Y")
            
            # AI-powered seasonal patterns analysis
            seasonal_patterns = self._ai_get_seasonal_patterns(airport_code, travel_date)
            
            # AI-powered seasonal risk assessment
            seasonal_risk = self._ai_generate_seasonal_risk_assessment(seasonal_patterns, airport_code, travel_date)
            
            return {
                "airport_code": airport_code,
                "airport_name": airport.get("name", "Unknown Airport"),
                "city": airport.get("city", "Unknown"),
                "state": airport.get("state", "Unknown"),
                "travel_date": travel_date,
                "weather_available": True,
                "analysis_type": "seasonal",
                "timestamp": datetime.now().isoformat(),
                "seasonal_patterns": seasonal_patterns,
                "flight_risk_assessment": seasonal_risk,
                "data_source": "AI-Generated Seasonal Analysis (OpenWeatherMap fallback)"
            }
            
        except ValueError as e:
            print(f"❌ Date parsing failed in seasonal analysis: {e}")
            return {
                "error": f"Invalid date format or date parsing failed: {str(e)}. Use YYYY-MM-DD format.",
                "airport_code": airport_code,
                "weather_available": False,
                "analysis_type": "seasonal",
                "flight_risk_assessment": {
                    "risk_factors": ["❌ AI seasonal factor generation failed - date parsing error"],
                    "recommendations": ["Check date format and try again"]
                }
            }
        except Exception as e:
            print(f"❌ Seasonal analysis failed: {e}")
            return {
                "error": f"Seasonal analysis failed: {str(e)}",
                "airport_code": airport_code,
                "weather_available": False,
                "analysis_type": "seasonal",
                "flight_risk_assessment": {
                    "risk_factors": ["❌ AI seasonal factor generation failed - analysis error"],
                    "recommendations": ["Try searching again"]
                }
            }
    
    def _ai_get_seasonal_patterns(self, airport_code: str, travel_date: str) -> Dict[str, Any]:
        """Get seasonal weather patterns using AI analysis"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            airport = self._ai_get_airport_info(airport_code)
            if not airport.get("valid", False):
                return {"error": f"Airport {airport_code} not found or invalid"}
            
            city = airport.get("city", "Unknown")
            state = airport.get("state", "Unknown")
            
            # Parse date for seasonal context
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            formatted_date = travel_datetime.strftime("%B %d, %Y")
            
            prompt = f"""
            Analyze seasonal weather patterns for {airport_code} ({city}, {state}) for travel on {formatted_date}.
            
            Provide a comprehensive seasonal weather analysis including:
            1. Typical weather conditions for this time of year
            2. Temperature ranges expected
            3. Precipitation likelihood
            4. Common weather risks and disruptions
            5. Holiday season impacts if applicable
            
            Format the response as a JSON object with these fields:
            - typical_conditions: array of typical weather conditions
            - temperature_range: string describing temperature range
            - precipitation_likelihood: string describing precipitation chances
            - weather_risks: array of common weather risks
            - common_disruptions: array of typical flight disruptions
            - holiday_impact: string describing any holiday season impacts
            
            Return only the JSON object.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Clean up JSON formatting before parsing
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()
            
            # Try to parse JSON response
            try:
                patterns = json.loads(ai_response)
                return patterns
            except Exception as parse_error:
                print(f"❌ JSON parsing failed for seasonal patterns: {parse_error}")
                print(f"🔍 AI Response: {ai_response[:200]}...")
                return {
                    "error": "AI seasonal pattern analysis failed - invalid JSON response",
                    "ai_response": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response
                }
                
        except Exception as e:
            print(f"❌ AI seasonal patterns analysis failed: {e}")
            return {"error": f"AI seasonal patterns analysis failed: {str(e)}"}
    
    def _ai_generate_seasonal_risk_assessment(self, seasonal_patterns: Dict[str, Any], airport_code: str, travel_date: str) -> Dict[str, Any]:
        """Generate comprehensive seasonal risk assessment using AI"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            airport = self._ai_get_airport_info(airport_code)
            if not airport.get("valid", False):
                city = "Unknown"
                state = "Unknown"
            else:
                city = airport.get("city", "Unknown")
                state = airport.get("state", "Unknown")
            
            # Parse travel date for more context
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            formatted_date = travel_datetime.strftime("%B %d, %Y")
            
            # Generate comprehensive risk assessment
            prompt = f"""
            Generate a comprehensive seasonal flight risk assessment for {airport_code} ({city}, {state}) on {formatted_date}.
            
            Based on seasonal patterns: """ + json.dumps(seasonal_patterns) + """
            
            Analyze seasonal factors like:
            - Weather patterns typical for this time of year
            - Holiday travel impacts
            - Seasonal airport congestion
            - Weather-related delays (winter storms, summer thunderstorms, etc.)
            - Seasonal maintenance schedules
            - Tourist season impacts
            
            Provide:
            1. Overall risk level (very_low, low, medium, high)
            2. Risk score (0-100)
            3. 4-5 specific seasonal risk factors with descriptive emojis
            4. 3-4 practical recommendations
            5. Delay probability percentage
            6. Cancellation probability percentage
            7. Weather outlook summary
            8. Weather impact description (detailed but max 250 characters)
            9. Airport complexity analysis (detailed but max 250 characters)
            
            Format as JSON with these exact fields:
            {
                "overall_risk_level": "medium",
                "risk_score": 60,
                "risk_factors": [
                    "❄️ Winter weather patterns may cause delays",
                    "🎄 Holiday travel season increases congestion",
                    "⛈️ Seasonal thunderstorms possible",
                    "🏗️ Airport construction during off-peak season"
                ],
                "recommendations": [
                    "Allow extra time for potential weather delays",
                    "Book early morning flights to avoid afternoon storms",
                    "Check flight status frequently during winter months"
                ],
                "delay_probability": "25-40%",
                "cancellation_probability": "5-10%",
                "weather_outlook": "summary",
                "weather_impact": "Detailed seasonal weather impact including temperature effects, seasonal storms, visibility concerns, runway conditions, and ground operations during this time of year (max 250 chars)",
                "airport_complexity": {
                    "complexity": "medium",
                    "description": "Comprehensive seasonal airport analysis including runway challenges, traffic patterns, operational restrictions, equipment limitations, and infrastructure impacts for this time of year (max 250 chars)",
                    "concerns": ["seasonal operational concern 1", "seasonal operational concern 2"]
                },
                "data_source": "OpenWeatherMap API + AI Analysis"
            }
            
            Generate meaningful, specific seasonal factors based on the actual time of year and location.
            Make weather_impact and airport_complexity descriptions detailed and specific to the actual airport and seasonal conditions. Maximum 250 characters each.
            Return only the JSON object.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
        
            # Clean up JSON formatting before parsing
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()
            
            # Try to parse JSON response
            try:
                assessment = json.loads(ai_response)
                
                # Ensure airport complexity description is truncated to 250 characters
                if 'airport_complexity' in assessment and isinstance(assessment['airport_complexity'], dict):
                    if 'description' in assessment['airport_complexity']:
                        assessment['airport_complexity']['description'] = assessment['airport_complexity']['description'][:250]
                
                # Ensure weather impact is also truncated to 250 characters
                if 'weather_impact' in assessment:
                    assessment['weather_impact'] = assessment['weather_impact'][:250]
                
                return assessment
            except Exception as parse_error:
                print(f"❌ JSON parsing failed for seasonal risk assessment: {parse_error}")
                print(f"🔍 AI Response: {ai_response[:200]}...")
                # If JSON parsing fails, return fallback
                return {
                    "overall_risk_level": "medium",
                    "risk_score": 50,
                    "risk_factors": [
                        f"❌ AI seasonal risk assessment failed for {airport_code}",
                        "AI analysis system error",
                        "Unable to generate seasonal factors",
                        "Manual verification recommended"
                    ],
                    "recommendations": [
                        "Monitor airport updates",
                        "Check airline policies",
                        "Verify current conditions"
                    ],
                    "delay_probability": "❌ AI calculation failed",
                    "cancellation_probability": "❌ AI calculation failed",
                    "weather_outlook": f"❌ AI analysis failed for {airport_code}",
                    "ai_generated": False,
                    "error": "AI response parsing failed"
                }
                
        except Exception as e:
            print(f"❌ AI seasonal risk assessment failed: {e}")
            return {
                "overall_risk_level": "medium",
                "risk_score": 50,
                "risk_factors": [
                    f"❌ AI seasonal risk assessment failed for {airport_code}",
                    f"AI analysis error: {str(e)}",
                    "System unable to generate seasonal analysis",
                    "Manual verification required"
                ],
                "recommendations": [
                    "Monitor airport updates",
                    "Check airline policies",
                    "Verify current conditions"
                ],
                "delay_probability": "❌ AI calculation failed",
                "cancellation_probability": "❌ AI calculation failed",
                "weather_outlook": f"❌ AI analysis failed for {airport_code}",
                "ai_generated": False,
                "error": str(e)
            }
    
    def get_weather_for_flight(self, airport_code: str, travel_date: str) -> Dict[str, Any]:
        """
        Get weather conditions for a specific airport and date with caching
        Uses OpenWeatherMap for flights within 7 days, AI seasonal analysis for longer periods
        
        Args:
            airport_code: IATA airport code
            travel_date: Travel date in YYYY-MM-DD format
            
        Returns:
            Dictionary with weather data and risk assessment
        """
        # OPTIMIZED: Check weather cache first
        cache_key = f"{airport_code}_{travel_date}"
        if cache_key in self.weather_cache:
            print(f"🚀 OpenWeather Tool: Using cached weather data for {airport_code} on {travel_date}")
            return self.weather_cache[cache_key]
        
        # Get airport information
        airport = self._ai_get_airport_info(airport_code)
        if not airport.get("valid", False):
            return {"error": f"Airport {airport_code} not found or invalid"}
        
        if "error" in airport:
            return {"error": f"Airport lookup failed: {airport['error']}"}
        
        # Check if flight is within 7 days
        if not self._is_within_7_days(travel_date):
            # For flights >7 days out, provide seasonal weather analysis
            print(f"🌤️ WEATHER ANALYSIS: Using SEASONAL analysis for {airport_code} on {travel_date} (more than 7 days from today)")
            result = self._get_seasonal_weather_analysis(airport_code, travel_date)
            # Cache the result
            self.weather_cache[cache_key] = result
            print(f"🚀 OpenWeather Tool: Cached seasonal weather data for {airport_code} on {travel_date}")
            return result
        
        print(f"🌤️ WEATHER ANALYSIS: Attempting REAL-TIME OpenWeatherMap analysis for {airport_code} on {travel_date} (within 7 days of today)")
        
        # Get current weather from OpenWeatherMap
        city = airport.get('city', 'Unknown')
        state = airport.get('state', 'Unknown')
        weather_info = self._get_openweather_data(city, state)
        
        if "error" in weather_info:
            # Weather API failed - return honest error message
            api_failure_reason = f"OpenWeatherMap API failed: {weather_info['error']}"
            print(f"❌ WEATHER API FAILURE: {api_failure_reason}")

            # Return error instead of fallback
            error_result = {
                "error": True,
                "airport_code": airport_code,
                "travel_date": travel_date,
                "message": "Weather data temporarily unavailable",
                "details": f"Unable to retrieve weather information for {airport_code}. The weather service is experiencing issues. Please try again later.",
                "api_error": api_failure_reason,
                "data_available": False,
                "timestamp": datetime.now().isoformat()
            }

            return error_result
        
        try:
            # Generate flight risk assessment
            risk_assessment = self._ai_generate_flight_risk_assessment(weather_info, airport_code, travel_date)
            
            result = {
                "airport_code": airport_code,
                "airport_name": airport.get("name", "Unknown Airport"),
                "city": city,
                "state": state,
                "travel_date": travel_date,
                "weather_available": True,
                "analysis_type": "real-time",
                "timestamp": datetime.now().isoformat(),
                "weather_conditions": weather_info,
                "flight_risk_assessment": risk_assessment,
                "data_source": "OpenWeatherMap API",
                "data_available": True
            }
            
            # OPTIMIZED: Cache the result
            self.weather_cache[cache_key] = result
            print(f"🚀 OpenWeather Tool: Cached real-time weather data for {airport_code} on {travel_date}")
            
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error in weather analysis: {str(e)}")
            return {
                "error": f"Weather analysis failed: {str(e)}",
                "airport_code": airport_code,
                "travel_date": travel_date,
                "weather_available": False
            }
    
    def _ai_generate_flight_risk_assessment(self, weather_info: Dict[str, Any], airport_code: str, travel_date: str) -> Dict[str, Any]:
        """Generate comprehensive flight risk assessment using AI"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            conditions = weather_info.get("conditions", "Unknown")
            temperature = weather_info.get("temperature", 70)
            wind_speed = weather_info.get("wind_speed", 0)
            visibility = weather_info.get("visibility", 10)
            humidity = weather_info.get("humidity", 50)
            
            # Get airport info for more specific analysis
            airport = self._ai_get_airport_info(airport_code)
            if not airport.get("valid", False):
                city = "Unknown"
                state = "Unknown"
            else:
                city = airport.get("city", "Unknown")
                state = airport.get("state", "Unknown")
        
            # AI-powered risk assessment with OpenWeatherMap data
            prompt = f"""
            Risk assessment for {airport_code} ({city}, {state}) on {travel_date}:
            Weather: {conditions}
            Temperature: {temperature}F
            Wind Speed: {wind_speed} mph
            Visibility: {visibility} miles
            Humidity: {humidity}%
            Details: {json.dumps(weather_info)}
            
            JSON output with:
            - overall_risk_level: very_low/low/medium/high
            - risk_score: 0-100
            - risk_factors: [4 factors with emojis]
            - recommendations: [3 recommendations]
            - weather_impact: airport-specific impact (250 chars max)
            - delay_probability: percentage range
            - cancellation_probability: percentage range
            - airport_complexity: {{complexity, description (250 chars), concerns}}
            
            Consider real weather conditions and airport-specific factors. Return only JSON.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Clean up JSON formatting before parsing
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()
            
            # Try to parse JSON response
            try:
                assessment = json.loads(ai_response)
                return assessment
            except json.JSONDecodeError:
                # If JSON parsing fails, return fallback
                return {
                    "overall_risk_level": "medium",
                    "risk_score": 50,
                    "risk_factors": [
                        f"❌ AI flight risk assessment failed for {airport_code}",
                        f"Weather analysis error for {conditions}",
                        "AI system unable to generate risk factors"
                    ],
                    "recommendations": [
                        "Monitor weather updates",
                        "Check airline policies",
                        "Allow extra time"
                    ],
                    "weather_impact": f"❌ AI weather impact analysis failed for {conditions}",
                    "delay_probability": "❌ AI calculation failed",
                    "cancellation_probability": "❌ AI calculation failed",
                    "airport_complexity": {
                        "complexity": "unknown",
                        "description": f"❌ AI complexity analysis failed for {airport_code}",
                        "concerns": ["AI analysis unavailable"]
                    }
                }
                
        except Exception as e:
            print(f"❌ AI flight risk assessment failed: {e}")
            return {
                "overall_risk_level": "medium",
                "risk_score": 50,
                "risk_factors": [
                    f"❌ AI flight risk assessment failed for {airport_code}",
                    f"AI analysis error: {str(e)}",
                    "System unable to generate risk assessment"
                ],
                "recommendations": [
                    "Monitor weather updates",
                    "Check airline policies", 
                    "Allow extra time"
                ],
                "weather_impact": f"❌ AI weather impact analysis failed: {str(e)}",
                "delay_probability": "❌ AI calculation failed",
                "cancellation_probability": "❌ AI calculation failed",
                "airport_complexity": {
                    "complexity": "unknown",
                    "description": f"❌ AI complexity analysis failed: {str(e)}",
                    "concerns": ["AI system error"]
                },
                "error": str(e)
            }

    def analyze_multi_city_route_weather(self, origin: str, destination: str, connections: List[Dict[str, str]], travel_date: str) -> Dict[str, Any]:
        """
        Analyze weather for multi-city route including all layover cities
        """
        print(f"🌤️ Analyzing multi-city weather for {origin} → {destination} on {travel_date}")
        
        results = {
            "origin_airport_analysis": None,
            "destination_airport_analysis": None,
            "layover_weather_analysis": {}
        }
        
        # Analyze origin airport
        try:
            origin_analysis = self.get_weather_for_flight(origin, travel_date)
            results["origin_airport_analysis"] = origin_analysis
            print(f"✅ Origin analysis completed for {origin}")
        except Exception as e:
            print(f"❌ Origin analysis failed for {origin}: {e}")
            results["origin_airport_analysis"] = {
                "error": f"Analysis failed: {str(e)}",
                "weather_risk": {"risk_level": "medium", "description": "Unable to analyze origin weather"},
                "airport_complexity": {"complexity": "unknown", "description": "Analysis unavailable"}
            }
        
        # Analyze destination airport
        try:
            destination_analysis = self.get_weather_for_flight(destination, travel_date)
            results["destination_airport_analysis"] = destination_analysis
            print(f"✅ Destination analysis completed for {destination}")
        except Exception as e:
            print(f"❌ Destination analysis failed for {destination}: {e}")
            results["destination_airport_analysis"] = {
                "error": f"Analysis failed: {str(e)}",
                "weather_risk": {"risk_level": "medium", "description": "Unable to analyze destination weather"},
                "airport_complexity": {"complexity": "unknown", "description": "Analysis unavailable"}
            }
        
        # Analyze each layover airport
        for connection in connections:
            airport_code = connection.get('airport_code', connection.get('airport', ''))
            if airport_code:
                try:
                    layover_analysis = self.get_weather_for_flight(airport_code, travel_date)
                    results["layover_weather_analysis"][airport_code] = layover_analysis
                    print(f"✅ Layover analysis completed for {airport_code}")
                except Exception as e:
                    print(f"❌ Layover analysis failed for {airport_code}: {e}")
                    results["layover_weather_analysis"][airport_code] = {
                        "error": f"Analysis failed: {str(e)}",
                        "weather_risk": {"risk_level": "medium", "description": "Unable to analyze layover weather"},
                        "airport_complexity": {"complexity": "unknown", "description": "Analysis unavailable"}
                    }
        
        return results

# Main function for agent integration (backwards compatibility)
def analyze_weather_conditions(analysis_type: str, **kwargs) -> str:
    """
    Main function for weather analysis integration with agents
    Now uses OpenWeatherMap instead of SerpAPI
    """
    tool = OpenWeatherIntelligenceTool()
    
    try:
        if analysis_type == "flight_weather" or analysis_type == "airport":
            # Single airport weather analysis
            airport_code = kwargs.get("airport_code", "")
            travel_date = kwargs.get("travel_date", "")
            
            if not airport_code or not travel_date:
                return json.dumps({
                    "error": "Missing required parameters: airport_code and travel_date"
                })
            
            result = tool.get_weather_for_flight(airport_code, travel_date)
            return json.dumps(result, indent=2)
        
        elif analysis_type == "route_weather":
            # Route weather analysis (origin and destination)
            origin = kwargs.get("origin", "")
            destination = kwargs.get("destination", "")
            travel_date = kwargs.get("travel_date", "")
            
            if not origin or not destination or not travel_date:
                return json.dumps({
                    "error": "Missing required parameters: origin, destination, and travel_date"
                })
            
            # Get weather for both airports
            origin_weather = tool.get_weather_for_flight(origin, travel_date)
            destination_weather = tool.get_weather_for_flight(destination, travel_date)
            
            # Combine results for route analysis
            combined_analysis = {
                "route": f"{origin} → {destination}",
                "travel_date": travel_date,
                "origin_weather": origin_weather,
                "destination_weather": destination_weather,
                "data_source": "OpenWeatherMap API"
            }
            
            return json.dumps(combined_analysis, indent=2)
        
        elif analysis_type == "multi_city_route_weather":
            # Multi-city route weather analysis
            origin = kwargs.get("origin", "")
            destination = kwargs.get("destination", "")
            connections = kwargs.get("connections", [])
            travel_date = kwargs.get("travel_date", "")
            
            if not origin or not destination or not connections or not travel_date:
                return json.dumps({
                    "error": "Missing required parameters: origin, destination, connections, and travel_date"
                })
            
            result = tool.analyze_multi_city_route_weather(origin, destination, connections, travel_date)
            return json.dumps(result, indent=2)
        
        else:
            return json.dumps({
                "error": f"Unknown analysis type: {analysis_type}. Supported types: 'flight_weather', 'route_weather', 'multi_city_route_weather'"
            })
    
    except Exception as e:
        logger.error(f"Error in weather analysis: {str(e)}")
        return json.dumps({
            "error": f"Weather analysis failed: {str(e)}"
        })