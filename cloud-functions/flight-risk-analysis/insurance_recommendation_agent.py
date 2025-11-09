"""
Insurance Recommendation Agent
Generates personalized, natural insurance recommendations based on flight risk analysis.
"""

import google.generativeai as genai
import os
from typing import Dict, Any, Optional

class InsuranceRecommendationAgent:
    def __init__(self):
        self.gemini_model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the Gemini model for insurance recommendations."""
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            print("❌ Insurance Recommendation Agent: No Google API key available")
            return
        
        genai.configure(api_key=api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
        print("🛡️ Insurance Recommendation Agent: Gemini model initialized")
    
    def generate_insurance_recommendation(self, flight_data: Dict[str, Any], risk_analysis: Dict[str, Any], weather_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a personalized insurance recommendation based on comprehensive flight analysis.
        
        Args:
            flight_data: Dictionary containing flight information from BigQuery/SerpAPI
            risk_analysis: Dictionary containing risk assessment from RiskAssessmentAgent
            weather_analysis: Dictionary containing weather analysis from WeatherIntelligenceAgent
            
        Returns:
            Dictionary with AI-generated insurance recommendation
        """
        if not self.gemini_model:
            print("❌ Insurance Recommendation Agent: Model not initialized")
            return self._get_fallback_recommendation(risk_analysis)
        
        try:
            print(f"🛡️ Insurance Agent: Starting recommendation generation...")
            
            # Build comprehensive context from all available data
            context = self._build_comprehensive_context(flight_data, risk_analysis, weather_analysis)
            
            print(f"🛡️ Insurance Agent: Context built ({len(context)} chars)")
            
            # Generate the recommendation based on overall risk assessment
            overall_risk_level = risk_analysis.get('risk_level', 'medium')
            overall_risk_score = risk_analysis.get('overall_risk_score', 50)
            
            # Determine recommendation type based on risk analysis
            if overall_risk_level == 'low' and overall_risk_score < 30:
                recommendation_type = 'skip_insurance'
            elif overall_risk_level == 'high' or overall_risk_score > 70:
                recommendation_type = 'strongly_recommend'
            else:
                recommendation_type = 'consider_insurance'
            
            # Generate natural language recommendation
            recommendation = self._generate_natural_recommendation(context, recommendation_type, overall_risk_score)
            
            print(f"🛡️ Insurance Agent: Recommendation generated ({len(recommendation)} chars)")
            print(f"🛡️ Insurance Agent: Type: {recommendation_type}, Risk Score: {overall_risk_score}")
            
            return {
                'success': True,
                'recommendation': recommendation,
                'recommendation_type': recommendation_type,
                'risk_level': overall_risk_level,
                'risk_score': overall_risk_score,
                'confidence': 'high'
            }
            
        except Exception as e:
            print(f"❌ Insurance Recommendation Agent: Error generating recommendation: {e}")
            return self._get_fallback_recommendation(risk_analysis)
    
    def _build_comprehensive_context(self, flight_data: Dict[str, Any], risk_analysis: Dict[str, Any], weather_analysis: Dict[str, Any]) -> str:
        """Build comprehensive context from all available flight analysis data."""
        
        context_parts = []
        
        # Basic flight information
        airline = flight_data.get('airline_name', flight_data.get('airline_code', 'Unknown'))
        flight_number = flight_data.get('flight_number', 'Unknown')
        context_parts.append(f"Flight: {airline} {flight_number}")
        
        # Route information
        origin_code = flight_data.get('origin_airport_code', flight_data.get('origin', 'Unknown'))
        destination_code = flight_data.get('destination_airport_code', flight_data.get('destination', 'Unknown'))
        context_parts.append(f"Route: {origin_code} → {destination_code}")
        
        # Flight date and timing
        if flight_data.get('date'):
            context_parts.append(f"Date: {flight_data['date']}")
        
        # Duration and connections - ENHANCED DETAIL
        if flight_data.get('duration_minutes'):
            hours = flight_data['duration_minutes'] // 60
            minutes = flight_data['duration_minutes'] % 60
            if hours > 0:
                context_parts.append(f"Total flight duration: {hours}h {minutes}m")
            else:
                context_parts.append(f"Total flight duration: {minutes}m")
        
        connections = flight_data.get('connections', [])
        if connections:
            context_parts.append(f"Flight type: {len(connections)}-stop flight with connections")
            
            # DETAILED CONNECTION ANALYSIS
            for i, conn in enumerate(connections):
                if isinstance(conn, dict):
                    airport = conn.get('airport', 'Unknown')
                    airport_name = conn.get('airport_name', 'Unknown Airport')
                    city = conn.get('city', 'Unknown City')
                    duration = conn.get('duration', '0h')
                    
                    # Extract minutes from duration string
                    if 'h' in duration and 'm' in duration:
                        parts = duration.replace('h', ':').replace('m', '').split(':')
                        total_minutes = int(parts[0]) * 60 + int(parts[1]) if len(parts) > 1 else int(parts[0]) * 60
                    elif 'h' in duration:
                        total_minutes = int(duration.replace('h', '')) * 60
                    elif 'm' in duration:
                        total_minutes = int(duration.replace('m', ''))
                    else:
                        total_minutes = 60  # Default
                    
                    connection_detail = f"Connection {i+1}: {airport} ({city}) - {duration} layover"
                    
                    # Add connection risk assessment
                    if total_minutes < 60:
                        connection_detail += " - TIGHT CONNECTION (high risk)"
                    elif total_minutes < 90:
                        connection_detail += " - Moderate connection time"
                    else:
                        connection_detail += " - Adequate connection time"
                    
                    context_parts.append(connection_detail)
                    
                    # Add layover airport specific analysis if available
                    layover_weather = weather_analysis.get('layover_weather_analysis', {}).get(airport, {})
                    if layover_weather:
                        weather_risk = layover_weather.get('weather_risk', {})
                        if weather_risk:
                            context_parts.append(f"  - {airport} weather risk: {weather_risk.get('risk_level', 'medium')} - {weather_risk.get('description', 'No description')}")
                    
                    layover_complexity = weather_analysis.get('layover_complexity_analysis', {}).get(airport, {})
                    if layover_complexity:
                        complexity = layover_complexity.get('complexity', {})
                        if complexity:
                            context_parts.append(f"  - {airport} complexity: {complexity.get('complexity', 'medium')} - {complexity.get('description', 'No description')}")
        else:
            context_parts.append("Flight type: Direct flight (no connections)")
        
        # DETAILED RISK ANALYSIS
        if isinstance(risk_analysis, dict):
            overall_risk_score = risk_analysis.get('overall_risk_score')
            if overall_risk_score is not None:
                context_parts.append(f"Overall risk score: {overall_risk_score}/100")
            
            risk_level = risk_analysis.get('risk_level')
            if risk_level:
                context_parts.append(f"Risk level: {risk_level}")
            
            # Historical performance - ENHANCED
            historical_perf = risk_analysis.get('historical_performance', {})
            if isinstance(historical_perf, dict):
                if historical_perf.get('cancellation_rate') is not None:
                    context_parts.append(f"Historical cancellation rate: {historical_perf['cancellation_rate']}%")
                if historical_perf.get('average_delay') is not None:
                    context_parts.append(f"Historical average delay: {historical_perf['average_delay']} minutes")
                if historical_perf.get('on_time_percentage') is not None:
                    context_parts.append(f"Historical on-time performance: {historical_perf['on_time_percentage']}%")
            
            # Key risk factors - ENHANCED
            key_risk_factors = risk_analysis.get('key_risk_factors', [])
            if key_risk_factors and isinstance(key_risk_factors, list):
                context_parts.append(f"Key risk factors identified: {len(key_risk_factors)}")
                for i, factor in enumerate(key_risk_factors[:5]):  # Show top 5 factors
                    context_parts.append(f"  - Risk factor {i+1}: {factor}")
            
            # Delay and cancellation probabilities
            delay_prob = risk_analysis.get('delay_probability')
            if delay_prob:
                context_parts.append(f"Delay probability: {delay_prob}")
            
            cancel_prob = risk_analysis.get('cancellation_probability')
            if cancel_prob:
                context_parts.append(f"Cancellation probability: {cancel_prob}")
        
        # DETAILED WEATHER ANALYSIS - ENHANCED
        if isinstance(weather_analysis, dict):
            # Origin airport weather - ENHANCED
            origin_weather = weather_analysis.get('origin_airport_analysis', {})
            if isinstance(origin_weather, dict):
                weather_risk = origin_weather.get('weather_risk', {})
                if weather_risk:
                    context_parts.append(f"Origin airport ({origin_code}) weather:")
                    context_parts.append(f"  - Weather risk level: {weather_risk.get('risk_level', 'medium')}")
                    if weather_risk.get('description'):
                        context_parts.append(f"  - Weather conditions: {weather_risk['description']}")
                    if weather_risk.get('temperature'):
                        context_parts.append(f"  - Temperature: {weather_risk['temperature']}")
                    if weather_risk.get('wind_speed'):
                        context_parts.append(f"  - Wind speed: {weather_risk['wind_speed']}")
                
                # Origin airport complexity
                airport_complexity = origin_weather.get('airport_complexity', {})
                if airport_complexity:
                    context_parts.append(f"Origin airport ({origin_code}) complexity:")
                    context_parts.append(f"  - Complexity level: {airport_complexity.get('complexity', 'medium')}")
                    if airport_complexity.get('description'):
                        context_parts.append(f"  - Complexity factors: {airport_complexity['description']}")
                    if airport_complexity.get('delay_impact'):
                        context_parts.append(f"  - Delay impact: {airport_complexity['delay_impact']}")
            
            # Destination airport weather - ENHANCED
            dest_weather = weather_analysis.get('destination_airport_analysis', {})
            if isinstance(dest_weather, dict):
                weather_risk = dest_weather.get('weather_risk', {})
                if weather_risk:
                    context_parts.append(f"Destination airport ({destination_code}) weather:")
                    context_parts.append(f"  - Weather risk level: {weather_risk.get('risk_level', 'medium')}")
                    if weather_risk.get('description'):
                        context_parts.append(f"  - Weather conditions: {weather_risk['description']}")
                    if weather_risk.get('temperature'):
                        context_parts.append(f"  - Temperature: {weather_risk['temperature']}")
                    if weather_risk.get('wind_speed'):
                        context_parts.append(f"  - Wind speed: {weather_risk['wind_speed']}")
                
                # Destination airport complexity
                airport_complexity = dest_weather.get('airport_complexity', {})
                if airport_complexity:
                    context_parts.append(f"Destination airport ({destination_code}) complexity:")
                    context_parts.append(f"  - Complexity level: {airport_complexity.get('complexity', 'medium')}")
                    if airport_complexity.get('description'):
                        context_parts.append(f"  - Complexity factors: {airport_complexity['description']}")
                    if airport_complexity.get('delay_impact'):
                        context_parts.append(f"  - Delay impact: {airport_complexity['delay_impact']}")
            
            # Connection weather - ENHANCED
            connection_weather = weather_analysis.get('layover_weather_analysis', {})
            if isinstance(connection_weather, dict) and connection_weather:
                context_parts.append("Connection airport weather analysis:")
                for airport, weather_data in connection_weather.items():
                    if isinstance(weather_data, dict):
                        weather_risk = weather_data.get('weather_risk', {})
                        if weather_risk:
                            context_parts.append(f"  - {airport}: {weather_risk.get('risk_level', 'medium')} risk - {weather_risk.get('description', 'No description')}")
            
            # Connection complexity - ENHANCED
            connection_complexity = weather_analysis.get('layover_complexity_analysis', {})
            if isinstance(connection_complexity, dict) and connection_complexity:
                context_parts.append("Connection airport complexity analysis:")
                for airport, complexity_data in connection_complexity.items():
                    if isinstance(complexity_data, dict):
                        complexity = complexity_data.get('complexity', {})
                        if complexity:
                            context_parts.append(f"  - {airport}: {complexity.get('complexity', 'medium')} complexity - {complexity.get('description', 'No description')}")
        
        # SEASONAL FACTORS - ENHANCED
        seasonal_factors = risk_analysis.get('seasonal_factors', [])
        if seasonal_factors and isinstance(seasonal_factors, list):
            context_parts.append(f"Seasonal risk factors: {len(seasonal_factors)} identified")
            for i, factor in enumerate(seasonal_factors):
                context_parts.append(f"  - Seasonal factor {i+1}: {factor}")
        
        # AIRCRAFT INFORMATION
        aircraft = flight_data.get('airplane_model') or flight_data.get('aircraft_type') or flight_data.get('aircraft')
        if aircraft:
            context_parts.append(f"Aircraft type: {aircraft}")
        
        # AIRLINE SPECIFIC INFORMATION
        if airline and airline != 'Unknown':
            context_parts.append(f"Operating airline: {airline}")
        
        # PRICE INFORMATION (if available)
        price = flight_data.get('price') or flight_data.get('cost')
        if price:
            context_parts.append(f"Flight cost: ${price}")
        
        return "\n".join(context_parts)
    
    def _generate_natural_recommendation(self, context: str, recommendation_type: str, risk_score: int) -> str:
        """Generate a natural, conversational insurance recommendation based on risk analysis."""
        
        print(f"🛡️ Insurance Agent: Generating {recommendation_type} recommendation...")
        
        # Tailor the prompt based on recommendation type
        if recommendation_type == 'skip_insurance':
            decision_guidance = "explain why travel insurance is NOT necessary for this low-risk flight and that they should save their money"
        elif recommendation_type == 'strongly_recommend':
            decision_guidance = "strongly recommend travel insurance due to the high-risk factors and explain why the cost is justified given the risks"
        else:  # consider_insurance
            decision_guidance = "suggest considering travel insurance due to moderate risk factors, presenting both the benefits and the cost consideration"
        
        prompt = f"""
        You are an experienced travel insurance advisor providing concise, honest advice. Based on this flight analysis, {decision_guidance}:

        FLIGHT ANALYSIS:
        {context}

        REQUIREMENTS:
        1. **KEEP IT CONCISE**: Write a brief, focused response (about 1/3 the length of a typical detailed analysis)
        2. **INCLUDE ALL KEY RISK FACTORS**: Mention specific connection times, weather conditions, airport complexity, and seasonal factors
        3. **BE SPECIFIC**: Reference exact data points (risk scores, weather conditions, connection durations)
        4. **EXPLAIN IMPACT**: Briefly explain how each risk factor could affect the trip
        5. **GIVE CLEAR RECOMMENDATION**: State your insurance recommendation with brief reasoning

        Risk score: {risk_score}/100 (0-30=low, 31-70=medium, 71-100=high)

        Write a concise, natural response that covers all important risk factors without being overly detailed.
        """
        
        try:
            print(f"🛡️ Insurance Agent: Calling Gemini model...")
            response = self.gemini_model.generate_content(prompt)
            recommendation = response.text.strip()
            
            print(f"🛡️ Insurance Agent: Raw response received ({len(recommendation)} chars)")
            
            # Clean up any markdown formatting
            recommendation = recommendation.replace('**', '').replace('*', '')
            
            # Remove any quotation marks at the start/end
            recommendation = recommendation.strip('"\'')
            
            print(f"🛡️ Insurance Agent: Final recommendation ready")
            return recommendation
            
        except Exception as e:
            print(f"❌ Insurance Recommendation Agent: Error generating content: {e}")
            return self._get_fallback_text(recommendation_type)
    
    def _get_fallback_recommendation(self, risk_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Provide a fallback recommendation if AI generation fails."""
        risk_level = risk_analysis.get('risk_level', 'medium') if isinstance(risk_analysis, dict) else 'medium'
        risk_score = risk_analysis.get('overall_risk_score', 50) if isinstance(risk_analysis, dict) else 50
        
        # Determine recommendation type for fallback
        if risk_level == 'low' and risk_score < 30:
            recommendation_type = 'skip_insurance'
        elif risk_level == 'high' or risk_score > 70:
            recommendation_type = 'strongly_recommend'
        else:
            recommendation_type = 'consider_insurance'
        
        return {
            'success': False,
            'recommendation': self._get_fallback_text(recommendation_type),
            'recommendation_type': recommendation_type,
            'risk_level': risk_level,
            'risk_score': risk_score,
            'confidence': 'low'
        }
    
    def _get_fallback_text(self, recommendation_type: str) -> str:
        """Get fallback text when AI generation fails."""
        if recommendation_type == 'skip_insurance':
            return (
                "Low-risk flight with minimal disruption probability. Travel insurance likely unnecessary - save the money for your trip."
            )
        elif recommendation_type == 'strongly_recommend':
            return (
                "High-risk factors present. Strongly recommend travel insurance for protection against delays, cancellations, and missed connections."
            )
        else:  # consider_insurance
            return (
                "Moderate risk factors suggest considering travel insurance. Provides peace of mind and protection against unexpected disruptions."
            )