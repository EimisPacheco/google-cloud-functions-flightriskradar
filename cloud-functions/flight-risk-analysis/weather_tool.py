"""
Weather Intelligence Tool for Flight Risk Analysis
Integrates with SerpAPI weather search for real-time weather conditions
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

class WeatherIntelligenceTool:
    """Tool for weather-based flight risk assessment using OpenWeatherMap API and Google ADK agents"""
    
    def __init__(self):
        # Get OpenWeatherMap API key from environment variable, fallback to SERPAPI for compatibility
        self.openweather_key = os.getenv("OPENWEATHER_API_KEY")
        self.serpapi_key = os.getenv("SERPAPI_API_KEY")
        
        if self.openweather_key:
            print("🌤️ Using OpenWeatherMap API for weather data")
            self.base_url = os.getenv("OPENWEATHER_BASE_URL", "https://api.openweathermap.org/data/2.5/weather")
            self.forecast_url = os.getenv("OPENWEATHER_FORECAST_URL", "https://api.openweathermap.org/data/2.5/forecast")
        elif self.serpapi_key:
            print("🌤️ Using SerpAPI for weather data (fallback)")
            self.base_url = os.getenv("SERPAPI_BASE_URL", "https://serpapi.com/search.json")
            self.forecast_url = None
        else:
            raise ValueError("Either OPENWEATHER_API_KEY or SERPAPI_API_KEY environment variable is required")
        
        # OPTIMIZED: Add caching to avoid duplicate analysis
        self.weather_cache = {}
        self.airport_info_cache = {}
        
        # Initialize Google ADK Sub-Agents
        try:
            self.airport_complexity_agent = AirportComplexityAgent()
            self.weather_impact_agent = WeatherImpactAgent()
            print("🌤️ Weather Intelligence Tool: Google ADK agents initialized")
        except Exception as e:
            print(f"❌ Weather Intelligence Tool: Failed to initialize ADK agents: {e}")
            self.airport_complexity_agent = None
            self.weather_impact_agent = None
        
        # Initialize Gemini model for AI-powered analysis
        try:
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("🤖 Weather Intelligence Tool: Gemini AI model initialized")
        except Exception as e:
            print(f"❌ Weather Intelligence Tool: Failed to initialize Gemini model: {e}")
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
            "SJC": {"city": "San Jose", "state": "CA", "name": "San Jose International Airport", "country": "United States", "valid": True}
        }
    
    def _ai_get_airport_info(self, airport_code: str) -> Dict[str, Any]:
        """Get airport information using static mapping first, then AI fallback"""
        
        # PRIMARY: Check static mapping first for reliable results
        if airport_code.upper() in self._airport_mapping:
            airport_info = self._airport_mapping[airport_code.upper()]
            print(f"✅ Weather Tool: Using static airport info for {airport_code} → {airport_info['city']}, {airport_info['state']}")
            
            # Cache the static result for consistency
            self.airport_info_cache[airport_code] = airport_info
            return airport_info
        
        # Check cache for AI-generated results
        if airport_code in self.airport_info_cache:
            print(f"🚀 Weather Tool: Using cached airport info for {airport_code}")
            return self.airport_info_cache[airport_code]
        
        # FALLBACK: Use AI if not in static mapping
        if not self.gemini_model:
            return {"error": f"Airport {airport_code} not found in static mapping and AI lookup unavailable", "valid": False}
        
        print(f"🔍 Weather Tool: Falling back to AI lookup for {airport_code}")
        
        try:
            prompt = f"""
            Provide airport information for IATA code: {airport_code}
            
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
            
            Return only the JSON object.
            """
            
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
                print(f"🤖 Weather Tool: AI generated airport info for {airport_code}: {airport_info.get('city', 'Unknown')}, {airport_info.get('state', 'Unknown')}")
                
                return airport_info
            except json.JSONDecodeError as e:
                print(f"❌ Weather Tool: AI airport info JSON parsing failed for {airport_code}: {e}")
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
    
    def _format_date_for_query(self, date_str: str) -> str:
        """Format date for SerpAPI query using AI analysis"""
        try:
            if not self.gemini_model:
                # Fallback formatting
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                return date_obj.strftime("%B %d %Y")
            
            # AI-powered date formatting
            prompt = f"""
            Convert the date {date_str} to a natural language format suitable for weather search queries.
            
            Return the date in format like "July 10 2025" or "December 25 2024".
            Return only the formatted date, nothing else.
            """
            
            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"❌ AI date formatting failed: {e}")
            # Fallback
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                return date_obj.strftime("%B %d %Y")
            except:
                return date_str
    
    def _extract_weather_from_serpapi(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract weather information from SerpAPI response using AI analysis"""
        weather_info = {
            "conditions": "Unknown",
            "temperature": None,
            "precipitation": None,
            "humidity": None,
            "wind": None,
            "visibility": None,
            "risk_level": "medium"
        }
        
        try:
            # Check for structured weather data first
            if "weather_box" in response_data:
                weather_box = response_data["weather_box"]
                weather_info["conditions"] = weather_box.get("weather", "Unknown")
                weather_info["temperature"] = weather_box.get("temperature", None)
                weather_info["precipitation"] = weather_box.get("precipitation", None)
                weather_info["humidity"] = weather_box.get("humidity", None)
                weather_info["wind"] = weather_box.get("wind", None)
                
                if "forecast" in weather_box:
                    forecast = weather_box["forecast"]
                    if forecast and len(forecast) > 0:
                        weather_info["forecast"] = forecast
            
            # Use AI to extract weather from organic results if structured data not available
            if weather_info["conditions"] == "Unknown" and "organic_results" in response_data:
                weather_info["conditions"] = self._ai_parse_weather_from_search_results(response_data["organic_results"])
            
            # AI-powered risk assessment
            weather_info["risk_level"] = self._ai_assess_weather_risk_level(weather_info["conditions"])
            
        except Exception as e:
            logger.error(f"Error extracting weather from SerpAPI response: {str(e)}")
        
        return weather_info
    
    def _ai_parse_weather_from_search_results(self, organic_results: List[Dict[str, Any]]) -> str:
        """Parse weather conditions from search results using AI analysis"""
        if not self.gemini_model:
            return "AI weather parsing unavailable"
        
        try:
            # Extract relevant text from search results
            weather_text = []
            for result in organic_results:
                snippet = result.get("snippet", "")
                title = result.get("title", "")
                if any(word in snippet.lower() for word in ["weather", "temperature", "rain", "snow", "wind", "sunny", "cloudy"]):
                    weather_text.append(f"Title: {title}\nSnippet: {snippet}")
            
            if not weather_text:
                return "No weather information found"
            
            # AI analysis of weather information
            combined_text = "\n\n".join(weather_text[:3])  # Limit to first 3 relevant results
            prompt = f"""
            Analyze the following weather search results and extract the current weather conditions:
            
            {combined_text}
            
            Based on this information, provide a concise weather condition description (e.g., "Clear", "Rainy", "Snowy", "Thunderstorms", "Foggy", "Windy", "Cloudy").
            
            Return only the weather condition, nothing else.
            """
            
            response = self.gemini_model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"❌ AI weather parsing failed: {e}")
            return "AI weather parsing failed"
    
    def _ai_assess_weather_risk_level(self, conditions: str) -> str:
        """Assess flight risk level based on weather conditions using AI analysis"""
        if not self.gemini_model:
            return "medium"
        
        try:
            prompt = f"""
            Assess the flight risk level for the following weather conditions: {conditions}
            
            Consider factors like:
            - Flight safety and operational impact
            - Visibility and wind conditions
            - Precipitation and storm severity
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
                "data_source": "AI-Generated Seasonal Analysis"
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
        """
        Get seasonal weather patterns using AI analysis
        """
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
                import json
                patterns = json.loads(ai_response)
                return patterns
            except Exception as parse_error:
                print(f"❌ JSON parsing failed for seasonal patterns: {parse_error}")
                print(f"🔍 AI Response: {ai_response[:200]}...")
                # If JSON parsing fails, return error
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
                "data_source": "Real Weather API"
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
    
    def _get_openweather_data(self, airport: Dict[str, Any], travel_date: str) -> Dict[str, Any]:
        """Get weather data from OpenWeatherMap API"""
        try:
            # Get city from airport info
            city = airport.get('city', 'Unknown')
            state = airport.get('state', '')
            country = airport.get('country', 'US')
            
            # Format location for OpenWeatherMap API
            location = f"{city},{state},{country}" if state else f"{city},{country}"
            
            # Build OpenWeatherMap API request
            params = {
                'q': location,
                'appid': self.openweather_key,
                'units': 'imperial'  # Fahrenheit, mph
            }
            
            response = requests.get(self.base_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            # Extract relevant weather information
            main = data.get('main', {})
            weather = data.get('weather', [{}])[0]
            wind = data.get('wind', {})
            visibility = data.get('visibility', 0) / 1609.34  # Convert meters to miles
            
            # Format weather info similar to SerpAPI format
            conditions = weather.get('description', 'Unknown').title()
            temp = int(main.get('temp', 0))
            humidity = main.get('humidity', 0)
            wind_speed = wind.get('speed', 0)
            
            weather_info = {
                "conditions": conditions,
                "temperature": f"{temp}°F",
                "humidity": f"{humidity}%",
                "wind": f"{wind_speed} mph",
                "visibility": f"{visibility:.1f} miles" if visibility > 0 else "Unknown",
                "parsed_conditions": conditions,
                "risk_level": self._assess_openweather_risk(weather, main, wind, visibility)
            }
            
            return weather_info
            
        except Exception as e:
            print(f"❌ OpenWeatherMap request failed: {e}")
            return {"error": f"OpenWeatherMap request failed: {str(e)}"}
    
    def _assess_openweather_risk(self, weather: Dict, main: Dict, wind: Dict, visibility: float) -> str:
        """Assess flight risk based on OpenWeatherMap data"""
        weather_id = weather.get('id', 800)
        wind_speed = wind.get('speed', 0)
        temp = main.get('temp', 70)
        
        # Weather ID ranges from OpenWeatherMap:
        # 200-299: Thunderstorm, 300-399: Drizzle, 500-599: Rain
        # 600-699: Snow, 700-799: Atmosphere (fog, mist), 800-899: Clear/Clouds
        
        if weather_id < 300:  # Thunderstorms
            return "high"
        elif weather_id < 600:  # Rain/Drizzle
            return "medium"
        elif weather_id < 700:  # Snow
            return "high"
        elif weather_id < 800:  # Fog, mist, haze
            return "medium"
        elif wind_speed > 25:  # High winds
            return "high"
        elif wind_speed > 15:  # Moderate winds
            return "medium"
        elif temp < 32 or temp > 100:  # Extreme temperatures
            return "medium"
        elif visibility < 3:  # Low visibility
            return "high"
        elif visibility < 6:  # Reduced visibility
            return "medium"
        else:
            return "low"
    
    def get_weather_for_flight(self, airport_code: str, travel_date: str) -> Dict[str, Any]:
        """
        Get weather conditions for a specific airport and date with caching
        Only works for flights within the next 7 days
        
        Args:
            airport_code: IATA airport code
            travel_date: Travel date in YYYY-MM-DD format
            
        Returns:
            Dictionary with weather data and risk assessment
        """
        # OPTIMIZED: Check weather cache first
        cache_key = f"{airport_code}_{travel_date}"
        if cache_key in self.weather_cache:
            print(f"🚀 Weather Tool: Using cached weather data for {airport_code} on {travel_date}")
            return self.weather_cache[cache_key]
        
        # Get airport information using AI
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
            print(f"🚀 Weather Tool: Cached seasonal weather data for {airport_code} on {travel_date}")
            return result
        
        # Try real-time weather APIs with seasonal fallback
        weather_info = None
        api_failed = False
        api_failure_reason = ""
        
        # Try OpenWeatherMap first if available
        if self.openweather_key:
            print(f"🌤️ WEATHER ANALYSIS: Attempting REAL-TIME OpenWeatherMap analysis for {airport_code} on {travel_date} (within 7 days of today)")
            weather_info = self._get_openweather_data(airport, travel_date)
            if "error" in weather_info:
                api_failed = True
                api_failure_reason = f"OpenWeatherMap API failed: {weather_info['error']}"
                print(f"❌ WEATHER API FAILURE: {api_failure_reason}")
                print(f"🔄 WEATHER FALLBACK: Switching to seasonal analysis for {airport_code}")
                weather_info = None
        
        # Try SerpAPI as secondary option if OpenWeatherMap failed or not available
        if weather_info is None and self.serpapi_key:
            if not api_failed:  # Only log if this is the primary attempt, not a fallback
                print(f"🌤️ WEATHER ANALYSIS: Attempting REAL-TIME SerpAPI analysis for {airport_code} on {travel_date} (within 7 days of today)")
            formatted_date = self._format_date_for_query(travel_date)
            query = f"weather {airport.get('city', 'Unknown')} {airport.get('state', 'Unknown')} {formatted_date}"
            
            try:
                params = {
                    "q": query,
                    "api_key": self.serpapi_key
                }
                
                response = requests.get(self.base_url, params=params, timeout=15)
                response.raise_for_status()
                data = response.json()
                
                # Extract weather information
                weather_info = self._extract_weather_from_serpapi(data)
                if "error" in weather_info:
                    api_failed = True
                    api_failure_reason += f" | SerpAPI failed: {weather_info['error']}"
                    print(f"❌ WEATHER API FAILURE: SerpAPI failed: {weather_info['error']}")
                    print(f"🔄 WEATHER FALLBACK: Switching to seasonal analysis for {airport_code}")
                    weather_info = None
            except Exception as e:
                api_failed = True
                api_failure_reason += f" | SerpAPI request failed: {str(e)}"
                print(f"❌ WEATHER API FAILURE: SerpAPI request failed: {e}")
                print(f"🔄 WEATHER FALLBACK: Switching to seasonal analysis for {airport_code}")
                weather_info = None
        
        # If all weather APIs failed, fallback to seasonal analysis
        if weather_info is None:
            if not api_failed:
                api_failure_reason = "No weather API keys available"
                print(f"❌ WEATHER API FAILURE: {api_failure_reason}")
            
            print(f"🌦️ WEATHER FALLBACK ACTIVATED: Using seasonal analysis instead of real-time data for {airport_code}")
            print(f"🌦️ FALLBACK REASON: {api_failure_reason}")
            
            # Use seasonal analysis as fallback
            seasonal_result = self._get_seasonal_weather_analysis(airport_code, travel_date)
            seasonal_result["fallback_used"] = True
            seasonal_result["fallback_reason"] = api_failure_reason
            seasonal_result["data_source"] = f"Seasonal Analysis (Weather API Fallback)"
            
            # Cache and return seasonal result
            self.weather_cache[cache_key] = seasonal_result
            print(f"🚀 Weather Tool: Cached seasonal fallback data for {airport_code} on {travel_date}")
            return seasonal_result
        
        # Generate flight risk assessment for successful API weather data
        risk_assessment = self._ai_generate_flight_risk_assessment(weather_info, airport_code, travel_date)
        
        # Determine data source
        data_source = "OpenWeatherMap API" if self.openweather_key and not api_failed else "SerpAPI Weather Search"
        
        result = {
            "airport_code": airport_code,
            "airport_name": airport.get("name", "Unknown Airport"),
            "city": airport.get("city", "Unknown"),
            "state": airport.get("state", "Unknown"),
            "travel_date": travel_date,
            "weather_available": True,
            "timestamp": datetime.now().isoformat(),
            "weather_conditions": weather_info,
            "flight_risk_assessment": risk_assessment,
            "data_source": data_source,
            "fallback_used": False
        }
        
        # OPTIMIZED: Cache the result
        self.weather_cache[cache_key] = result
        print(f"🚀 Weather Tool: Cached real-time weather data for {airport_code} on {travel_date}")
        
        return result
    
    def _ai_generate_flight_risk_assessment(self, weather_info: Dict[str, Any], airport_code: str, travel_date: str) -> Dict[str, Any]:
        """Generate comprehensive flight risk assessment using AI"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            conditions = weather_info.get("conditions", "Unknown")
            risk_level = weather_info.get("risk_level", "medium")
            
            # Get airport info for more specific analysis
            airport = self._ai_get_airport_info(airport_code)
            if not airport.get("valid", False):
                city = "Unknown"
                state = "Unknown"
            else:
                city = airport.get("city", "Unknown")
                state = airport.get("state", "Unknown")
        
            # OPTIMIZED: Streamlined AI risk assessment with concise prompt
            prompt = f"""
            Risk assessment for {airport_code} ({city}, {state}) on {travel_date}:
            Weather: {conditions} (Risk: {risk_level})
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
            
            Consider seasonal factors and airport-specific conditions. Return only JSON.
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
                
                # Transform the assessment into the structure expected by the UI
                result = {
                    "weather_risk": {
                        "level": assessment.get("overall_risk_level", "medium"),
                        "description": assessment.get("weather_impact", "Weather analysis available"),
                        "risk_score": assessment.get("risk_score", 50),
                        "delay_probability": assessment.get("delay_probability", "Unknown"),
                        "cancellation_probability": assessment.get("cancellation_probability", "Unknown")
                    },
                    "airport_complexity": assessment.get("airport_complexity", {
                        "complexity": "unknown",
                        "description": "Airport complexity analysis unavailable",
                        "concerns": ["Analysis unavailable"]
                    }),
                    "risk_factors": assessment.get("risk_factors", []),
                    "recommendations": assessment.get("recommendations", []),
                    "data_source": "Real-time weather data from OpenWeatherMap API" if self.openweather_key else "Real-time weather data from SerpAPI"
                }
                
                # Cache the result
                self.weather_cache[cache_key] = result
                print(f"🚀 Weather Tool: Cached weather analysis for {airport_code} on {travel_date}")
                return result
            except json.JSONDecodeError:
                # If JSON parsing fails, return fallback with proper UI structure
                result = {
                    "weather_risk": {
                        "level": "medium",
                        "description": f"Weather analysis error for {conditions}. AI system unable to process weather data.",
                        "risk_score": 50,
                        "delay_probability": "Unable to calculate",
                        "cancellation_probability": "Unable to calculate"
                    },
                    "airport_complexity": {
                        "complexity": "unknown",
                        "description": f"AI complexity analysis failed for {airport_code}",
                        "concerns": ["AI analysis unavailable"]
                    },
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
                    "data_source": "Real-time weather data from OpenWeatherMap API" if self.openweather_key else "Real-time weather data from SerpAPI"
                }
                
                # Cache the fallback result
                self.weather_cache[cache_key] = result
                print(f"🚀 Weather Tool: Cached fallback weather data for {airport_code} on {travel_date}")
                return result
                
            except Exception as e:
                print(f"❌ AI flight risk assessment failed: {e}")
                result = {
                    "weather_risk": {
                        "level": "medium",
                        "description": f"AI weather impact analysis failed: {str(e)}",
                        "risk_score": 50,
                        "delay_probability": "Unable to calculate",
                        "cancellation_probability": "Unable to calculate"
                    },
                    "airport_complexity": {
                        "complexity": "unknown",
                        "description": f"AI complexity analysis failed: {str(e)}",
                        "concerns": ["AI system error"]
                    },
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
                    "data_source": "Real-time weather data from OpenWeatherMap API" if self.openweather_key else "Real-time weather data from SerpAPI",
                    "error": str(e)
                }
                
                # Cache the error result
                self.weather_cache[cache_key] = result
                print(f"🚀 Weather Tool: Cached error weather data for {airport_code} on {travel_date}")
                return result
                
        except Exception as e:
            return {"error": str(e)}

    def analyze_multi_city_route_weather(self, origin: str, destination: str, connections: List[Dict[str, str]], travel_date: str) -> Dict[str, Any]:
        """
        Analyze weather for multi-city route including all layover cities
        
        Args:
            origin: Origin airport code
            destination: Destination airport code  
            connections: List of connection airports with codes
            travel_date: Travel date in YYYY-MM-DD format
            
        Returns:
            Dictionary with weather analysis for each city
        """
        print(f"🌤️  Analyzing multi-city weather for {origin} → {destination} on {travel_date}")
        
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
                    layover_analysis = self.analyze_weather_conditions("airport", 
                                                                   airport_code=airport_code, 
                                                                   travel_date=travel_date)
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

    def _determine_weather_analysis_type(self, travel_date: str) -> str:
        """
        Determine if the weather analysis should be for a flight within 7 days or a seasonal analysis.
        """
        try:
            travel_datetime = datetime.strptime(travel_date, "%Y-%m-%d")
            today = datetime.now()
            days_ahead = (travel_datetime.date() - today.date()).days
            
            if days_ahead > 7:
                return "seasonal"
            else:
                return "real-time"
        except ValueError:
            return "real-time" # Default to real-time if date format is invalid

    def _ai_assess_layover_weather_risk(self, weather_data: Dict[str, Any], layover_duration: str) -> List[str]:
        """Assess specific risks for layover cities based on weather and connection time using AI"""
        if not self.gemini_model:
            return ["❌ AI layover risk assessment unavailable"]
        
        try:
            if not weather_data.get("weather_available", False):
                return ["Weather data unavailable for layover city"]
            
            # Get weather risk and conditions
            risk_assessment = weather_data.get("flight_risk_assessment", {})
            weather_risk = risk_assessment.get("overall_risk_level", "medium")
            analysis_type = weather_data.get("analysis_type", "real-time")
            
            # AI-powered layover risk assessment
            prompt = f"""
            Assess layover weather risks for a connection.
            
            Weather data: """ + json.dumps(weather_data) + """
            Layover duration: {layover_duration}
            Weather risk level: {weather_risk}
            Analysis type: {analysis_type}
            
            Generate 2-3 specific risk factors for this layover considering:
            - Weather conditions and their impact on connections
            - Layover duration and timing
            - Airport operations during weather events
            - Connection risk factors
            
            Return as JSON array of risk factor strings:
            ["risk factor 1", "risk factor 2", "risk factor 3"]
            
            Return only the JSON array.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Try to parse JSON response
            try:
                risk_factors = json.loads(ai_response)
                return risk_factors if isinstance(risk_factors, list) else [str(risk_factors)]
            except:
                return [f"❌ AI layover risk assessment failed - parsing error"]
                
        except Exception as e:
            print(f"❌ AI layover risk assessment failed: {e}")
            return [f"❌ AI layover risk assessment failed: {str(e)}"]

    def _ai_generate_multi_city_risk_assessment(self, origin_weather: Dict[str, Any], layover_weather: List[Dict[str, Any]], destination_weather: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive risk assessment for multi-city route using AI"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            # AI-powered multi-city route risk assessment
            prompt = f"""
            Generate a comprehensive risk assessment for a multi-city flight route.
            
            Origin weather: """ + json.dumps(origin_weather) + """
            Layover weather: """ + json.dumps(layover_weather) + """
            Destination weather: """ + json.dumps(destination_weather) + """
            
            Analyze:
            1. Overall route risk level (very_low, low, medium, high)
            2. Risk breakdown for each city
            3. Route-specific recommendations
            4. Weather summary
            5. Connection weather impact
            
            Format as JSON with these exact fields:
            {
                "overall_route_risk": "medium",
                "risk_breakdown": {
                    "origin_risk": "low",
                    "layover_risks": ["medium", "high"],
                    "destination_risk": "medium",
                    "highest_risk_city": "layover"
                },
                "route_recommendations": ["rec 1", "rec 2", "rec 3"],
                "weather_summary": "summary of weather across route",
                "cities_count": 4,
                "connection_weather_impact": "Medium"
            }
            
            Return only the JSON object.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Try to parse JSON response
            try:
                assessment = json.loads(ai_response)
                return assessment
            except:
                return {
                    "overall_route_risk": "medium",
                    "risk_breakdown": {
                        "origin_risk": "unknown",
                        "layover_risks": ["unknown"],
                        "destination_risk": "unknown",
                        "highest_risk_city": "unknown"
                    },
                    "route_recommendations": [
                        "❌ AI route risk assessment failed",
                        "Monitor weather at all cities",
                        "Check airline policies"
                    ],
                    "weather_summary": "❌ AI weather summary failed",
                    "cities_count": len(layover_weather) + 2,
                    "connection_weather_impact": "❌ AI impact assessment failed"
                }
                
        except Exception as e:
            print(f"❌ AI multi-city risk assessment failed: {e}")
            return {
                "overall_route_risk": "medium",
                "risk_breakdown": {
                    "origin_risk": "unknown",
                    "layover_risks": ["unknown"],
                    "destination_risk": "unknown",
                    "highest_risk_city": "unknown"
                },
                "route_recommendations": [
                    f"❌ AI route risk assessment failed: {str(e)}",
                    "System error in route analysis",
                    "Manual verification required"
                ],
                "weather_summary": f"❌ AI weather summary failed: {str(e)}",
                "cities_count": len(layover_weather) + 2,
                "connection_weather_impact": "❌ AI impact assessment failed",
                "error": str(e)
            }

# Main function for agent integration
def analyze_weather_conditions(analysis_type: str, **kwargs) -> str:
    """
    Main function for weather analysis integration with agents
    
    Args:
        analysis_type: Type of analysis ('flight_weather' or 'route_weather')
        **kwargs: Additional parameters based on analysis type
        
    Returns:
        JSON string with weather analysis results
    """
    tool = WeatherIntelligenceTool()
    
    try:
        if analysis_type == "flight_weather":
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
            
            # AI-powered route analysis
            route_analysis = tool._ai_analyze_route_risk(origin_weather, destination_weather)
            
            # Combine results for route analysis
            combined_analysis = {
                "route": f"{origin} → {destination}",
                "travel_date": travel_date,
                "origin_weather": origin_weather,
                "destination_weather": destination_weather,
                "route_risk_assessment": route_analysis
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

# Add the missing AI route analysis method
def _ai_analyze_route_risk(self, origin_weather: Dict[str, Any], destination_weather: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze overall route risk based on origin and destination weather using AI"""
    if not self.gemini_model:
        return {"error": "AI analysis unavailable"}
    
    try:
        # AI-powered route risk analysis
        prompt = f"""
        Analyze the overall flight route risk based on weather at origin and destination.
        
        Origin weather: """ + json.dumps(origin_weather) + """
        Destination weather: """ + json.dumps(destination_weather) + """
        
        Provide:
        1. Overall route risk level (very_low, low, medium, high)
        2. Risk levels for origin and destination
        3. Route-specific recommendations
        4. Weather summary
        
        Format as JSON with these exact fields:
        {
            "overall_route_risk": "medium",
            "origin_risk_level": "low",
            "destination_risk_level": "medium",
            "route_recommendations": ["rec 1", "rec 2", "rec 3"],
            "weather_summary": "Origin: low risk, Destination: medium risk"
        }
        
        Return only the JSON object.
        """
        
        response = self.gemini_model.generate_content(prompt)
        ai_response = response.text.strip()
        
        # Try to parse JSON response
        try:
            assessment = json.loads(ai_response)
            return assessment
        except json.JSONDecodeError:
            return {
                "overall_route_risk": "medium",
                "origin_risk_level": "unknown",
                "destination_risk_level": "unknown",
                "route_recommendations": [
                    "❌ AI route risk assessment failed",
                    "Monitor weather at both airports",
                    "Check airline policies"
                ],
                "weather_summary": "❌ AI weather summary failed"
            }
            
    except Exception as e:
        print(f"❌ AI route risk analysis failed: {e}")
        return {
            "overall_route_risk": "medium",
            "origin_risk_level": "unknown",
            "destination_risk_level": "unknown",
            "route_recommendations": [
                f"❌ AI route risk assessment failed: {str(e)}",
                "System error in route analysis",
                "Manual verification required"
            ],
            "weather_summary": f"❌ AI weather summary failed: {str(e)}",
            "error": str(e)
        }
