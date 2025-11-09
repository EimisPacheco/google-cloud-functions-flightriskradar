"""
Weather Impact Analysis Agent - Google ADK Implementation
Analyzes weather impact on flight operations using AI instead of hardcoded conditions
"""
import os
import google.generativeai as genai

# Import Google ADK - REAL IMPLEMENTATION ONLY
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
print("✅ Weather Impact Agent: Using real Google ADK")

from typing import Dict, Any, List

class WeatherImpactAgent(Agent):
    """
    Google ADK Weather Impact Agent for real-time weather analysis
    """
    
    def __init__(self):
        super().__init__(
            name="weather_impact_agent",
            description="Analyzes weather impact on flight operations using Google Gemini AI"
        )
        
        # Initialize Gemini AI
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        print("🌤️ Google ADK Weather Impact Agent initialized")
    
    def analyze_weather_impact(self, weather_conditions: str, airport_code: str = None) -> str:
        """
        Analyze weather impact on flight operations using AI
        """
        try:
            print(f"🌤️ WEATHER IMPACT AGENT: Analyzing weather conditions: {weather_conditions}")
            
            # Create AI prompt for weather impact analysis
            prompt = f"""
            Analyze the impact of these weather conditions on flight operations: "{weather_conditions}"
            {f"at {airport_code} airport" if airport_code else ""}
            
            Provide a detailed but concise analysis (max 250 characters) explaining:
            1. How these weather conditions affect flight operations
            2. Specific operational challenges pilots and airports face
            3. Potential delays, safety concerns, or procedural changes
            4. Impact on takeoff, landing, and ground operations
            
            Consider factors like:
            - Visibility restrictions
            - Runway conditions
            - Aircraft performance limitations
            - Safety procedures and protocols
            - Ground operations impact
            
            IMPORTANT: Keep response under 250 characters and be descriptive but concise.
            Focus on specific aviation operational impacts.
            """
            
            # Get AI analysis
            response = self.model.generate_content(prompt)
            
            # Format and validate response
            impact_description = response.text.strip()[:250]
            
            print(f"✅ WEATHER IMPACT AGENT: Analysis complete")
            return impact_description
                
        except Exception as e:
            print(f"❌ WEATHER IMPACT AGENT: Analysis failed: {e}")
            return self._get_fallback_weather_impact_description(weather_conditions)
    
    def _get_fallback_weather_impact_description(self, conditions: str) -> str:
        """Fallback weather impact description when Google ADK agent fails"""
        try:
            # Generate AI-based weather impact description
            import google.generativeai as genai
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Convert conditions to string if it's a dict/object
            conditions_str = str(conditions) if not isinstance(conditions, str) else conditions
            
            impact_prompt = f"""
            Generate a specific weather impact description for these conditions: {conditions_str}
            Focus on real operational impacts on flight operations.
            Provide detailed analysis explaining how these conditions affect pilots, airports, and passengers.
            Keep it under 250 characters but be descriptive and informative.
            """
            
            response = model.generate_content(impact_prompt)
            ai_impact = response.text.strip()
            
            if ai_impact and len(ai_impact) < 250:
                return ai_impact
            else:
                return f"❌ AI weather impact analysis failed for conditions: {conditions_str}"
                
        except Exception as e:
            return f"❌ Weather impact analysis failed: {str(e)}"
    
    def analyze_multiple_weather_impacts(self, weather_conditions_list: List[Dict[str, str]]) -> List[str]:
        """
        Analyze multiple weather conditions efficiently
        """
        results = []
        
        for condition_data in weather_conditions_list:
            conditions = condition_data.get('conditions', '')
            airport_code = condition_data.get('airport_code')
            
            impact = self.analyze_weather_impact(conditions, airport_code)
            results.append(impact)
        
        return results
    
    def get_seasonal_weather_analysis(self, airport_code: str, season: str) -> str:
        """
        Get seasonal weather impact analysis for an airport
        """
        try:
            print(f"🌤️ WEATHER IMPACT AGENT: Analyzing seasonal weather for {airport_code} in {season}")
            
            prompt = f"""
            Analyze the typical {season} weather patterns and their impact on flight operations at {airport_code} airport.
            
            Provide a detailed but concise analysis (max 250 characters) explaining:
            1. Common weather challenges during {season}
            2. Seasonal operational impacts on flights
            3. Typical delay patterns and causes
            4. Specific procedures used during this season
            
            Focus on aviation-specific impacts and operational considerations.
            Keep response under 250 characters but be descriptive.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()[:250]
            
        except Exception as e:
            print(f"❌ WEATHER IMPACT AGENT: Seasonal analysis failed: {e}")
            return self._get_fallback_seasonal_weather_impact_description(f"{airport_code} in {season}")
    
    def _get_fallback_seasonal_weather_impact_description(self, conditions: str) -> str:
        """Fallback seasonal weather impact description when Google ADK agent fails"""
        try:
            # Generate AI-based seasonal weather impact description
            import google.generativeai as genai
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            # Convert conditions to string if it's a dict/object
            conditions_str = str(conditions) if not isinstance(conditions, str) else conditions
            
            seasonal_prompt = f"""
            Generate a specific seasonal weather impact description for: {conditions_str}
            Focus on seasonal patterns and regional weather challenges.
            Provide detailed analysis explaining seasonal operational impacts on flight operations.
            Keep it under 250 characters but be descriptive and informative.
            """
            
            response = model.generate_content(seasonal_prompt)
            ai_seasonal = response.text.strip()
            
            if ai_seasonal and len(ai_seasonal) < 250:
                return ai_seasonal
            else:
                return f"❌ AI seasonal weather analysis failed for conditions: {conditions_str}"
                
        except Exception as e:
            return f"❌ Seasonal weather analysis failed: {str(e)}" 