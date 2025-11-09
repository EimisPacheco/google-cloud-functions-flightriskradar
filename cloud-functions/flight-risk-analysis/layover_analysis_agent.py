"""
Layover Analysis Agent - AI-Powered Connection Time Evaluation
Uses Google Gemini AI for comprehensive layover feasibility analysis
"""
import os
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any
import re
import google.generativeai as genai

class LayoverAnalysisAgent:
    """
    AI-powered layover time analysis agent using Google Gemini
    Evaluates connection feasibility and risk factors using AI intelligence
    """
    
    def __init__(self):
        # Initialize Gemini AI model
        try:
            api_key = os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY environment variable is required")
            
            genai.configure(api_key=api_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.0-flash')
            print("🔄 Layover Analysis Agent: AI model initialized")
        except Exception as e:
            print(f"❌ Layover Analysis Agent: Failed to initialize AI model: {e}")
            self.gemini_model = None

    def analyze_layover_feasibility(self, duration_str: str, airport_code: str, arrival_time: str = None, travel_date: str = None, weather_data: Dict = None, incoming_flight_often_delayed: bool = False) -> Dict[str, Any]:
        """
        Analyze if a layover duration is feasible at given airport
        Returns ONLY real analysis or error - NO FALLBACKS
        """
        print(f"🔄 Layover Analysis Agent: Analyzing {airport_code} layover ({duration_str})")
        
        try:
            # Parse duration
            duration_minutes = self._parse_duration_with_ai(duration_str)
            if duration_minutes is None:
                return {
                    'error': f'Unable to parse duration: {duration_str}',
                    'airport_code': airport_code,
                    'analysis_failed': True
                }
            
            # Determine connection type based on duration AND airport complexity
            # Get airport-specific minimum connection times
            major_international_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'NRT', 'ICN']
            large_hubs = ['IAH', 'DEN', 'CLT', 'MIA', 'LAS', 'SEA', 'SFO', 'BOS', 'IAD', 'MSP', 'DTW', 'PHL']
            
            # Airport-specific thresholds
            if airport_code in major_international_hubs:
                # Major International Hubs (90min/240min thresholds)
                tight_threshold = 90
                reasonable_threshold = 240
            elif airport_code in large_hubs:
                # Large Hubs (75min/180min thresholds)  
                tight_threshold = 75
                reasonable_threshold = 180
            else:
                # Medium/Small Airports (60min/120min thresholds)
                tight_threshold = 60
                reasonable_threshold = 120
            
            # Classify based on airport-specific thresholds
            if duration_minutes < tight_threshold:
                connection_type = "tight"
            elif duration_minutes < reasonable_threshold:
                connection_type = "standard" 
            else:
                connection_type = "plenty_of_time"
            
            # Get AI analysis - NO FALLBACKS
            if not self.gemini_model:
                return {
                    'error': 'AI analysis model not available',
                    'airport_code': airport_code,
                    'duration_minutes': duration_minutes,
                    'connection_type': connection_type,
                    'analysis_failed': True
                }
            
            ai_analysis = self._get_ai_layover_analysis(duration_str, airport_code, connection_type, arrival_time, travel_date, weather_data, incoming_flight_often_delayed)
            
            if 'error' in ai_analysis:
                return {
                    'error': ai_analysis['error'],
                    'airport_code': airport_code,
                    'duration_minutes': duration_minutes,
                    'connection_type': connection_type,
                    'analysis_failed': True
                }
            
            return {
                "duration_minutes": duration_minutes,
                "duration_formatted": duration_str,
                "airport_code": airport_code,
                "connection_type": connection_type,
                "ai_analysis": ai_analysis,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
                "data_source": "Real AI Analysis",
                "analysis_successful": True
            }
            
        except Exception as e:
            print(f"❌ Layover Analysis Agent: Analysis failed for {airport_code}: {e}")
            return {
                'error': f'Layover analysis failed: {str(e)}',
                'airport_code': airport_code,
                'analysis_failed': True
            }

    def _parse_duration_with_ai(self, duration_str: str) -> int:
        """Parse duration using fallback regex - AI parsing was unreliable"""
        try:
            import re
            
            duration_str = str(duration_str).strip().lower()
            
            # Handle "4h 38m" format
            if 'h' in duration_str and 'm' in duration_str:
                match = re.search(r'(\d+)h\s*(\d+)m', duration_str)
                if match:
                    hours = int(match.group(1))
                    minutes = int(match.group(2))
                    return hours * 60 + minutes
            
            # Handle "2h" format
            elif 'h' in duration_str:
                match = re.search(r'(\d+(?:\.\d+)?)h', duration_str)
                if match:
                    hours = float(match.group(1))
                    return int(hours * 60)
            
            # Handle "90m" format
            elif 'm' in duration_str:
                match = re.search(r'(\d+)m', duration_str)
                if match:
                    return int(match.group(1))
            
            # Handle "1:30" format
            elif ':' in duration_str:
                parts = duration_str.split(':')
                if len(parts) == 2:
                    hours = int(parts[0])
                    minutes = int(parts[1])
                    return hours * 60 + minutes
            
            # Handle plain numbers (assume minutes)
            else:
                number_match = re.search(r'(\d+)', duration_str)
                if number_match:
                    return int(number_match.group(1))
            
            print(f"❌ Could not parse duration: '{duration_str}'")
            return None
            
        except Exception as e:
            print(f"❌ Duration parsing failed for '{duration_str}': {e}")
            return None
    
    def _get_ai_layover_analysis(self, duration_str: str, airport_code: str, connection_type: str,
                                  arrival_time: str, travel_date: str, weather_data: Dict, incoming_flight_often_delayed: bool = False) -> Dict[str, Any]:
        """Comprehensive AI-powered layover analysis"""
        if not self.gemini_model:
            return {"error": "❌ AI layover analysis system unavailable"}
        
        try:
            # Parse duration for accurate assessment
            duration_minutes = self._parse_duration_with_ai(duration_str)
            
            # Define airport categories (same as in analyze_layover_feasibility)
            major_international_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'NRT', 'ICN']
            large_hubs = ['IAH', 'DEN', 'CLT', 'MIA', 'LAS', 'SEA', 'SFO', 'BOS', 'IAD', 'MSP', 'DTW', 'PHL']
            
            # Airport-specific thresholds
            if airport_code in major_international_hubs:
                tight_threshold = 90
                reasonable_threshold = 240
                airport_category = "Major International Hub"
            elif airport_code in large_hubs:
                tight_threshold = 75
                reasonable_threshold = 180
                airport_category = "Large Hub"
            else:
                tight_threshold = 60
                reasonable_threshold = 120
                airport_category = "Medium/Small Airport"
            
            # Build comprehensive context for AI analysis with airport-specific thresholds
            prompt = f"""
            Analyze the layover feasibility for the following connection:
            
            Airport: {airport_code}
            Layover Duration: {duration_str} ({duration_minutes} minutes)
            Connection Type: {connection_type}
            Airport Category: {airport_category}
            Tight Threshold: {tight_threshold} minutes
            Reasonable Threshold: {reasonable_threshold} minutes
            Arrival Time: {arrival_time}
            Travel Date: {travel_date}
            Weather Risk: {weather_data.get('risk_level', 'medium')}
            Airport Complexity: {weather_data.get('airport_complexity', 'medium')}
            Incoming Flight Often Delayed by 30+ Minutes: {"YES - CRITICAL FACTOR" if incoming_flight_often_delayed else "No"}
            
            CRITICAL: If the incoming flight is often delayed by 30+ minutes, this SIGNIFICANTLY increases connection risk.
            The effective connection time should be reduced by at least 30 minutes when assessing feasibility.
            
            AIRPORT-SPECIFIC TIME ASSESSMENT RULES:
            
            For MAJOR INTERNATIONAL HUBS (ATL, ORD, DFW, LAX, JFK):
            - Less than 90 minutes = "Tight Connection" (high risk)
            - 90-240 minutes (1.5-4 hours) = "Standard Connection" (medium risk)  
            - 240+ minutes (4+ hours) = "Plenty of Time" (low risk)
            
            For LARGE HUBS (IAH, DEN, CLT, MIA, LAS, SEA, SFO, BOS):
            - Less than 75 minutes = "Tight Connection" (high risk)
            - 75-180 minutes (1.25-3 hours) = "Standard Connection" (medium risk)
            - 180+ minutes (3+ hours) = "Plenty of Time" (low risk)
            
            For MEDIUM/SMALL AIRPORTS (all others):
            - Less than 60 minutes = "Tight Connection" (high risk)
            - 60-120 minutes (1-2 hours) = "Standard Connection" (medium risk)
            - 120+ minutes (2+ hours) = "Plenty of Time" (low risk)
            
            For the overall_feasibility field, use these EXACT phrases based on airport-specific thresholds:
            - Below tight threshold: "risky - tight connection"
            - Between tight and reasonable threshold: "feasible with caution"  
            - Above reasonable threshold: "plenty of time"
            
            Provide a comprehensive analysis including:
            1. Minimum connection time assessment for this airport and connection type
            2. Risk level evaluation (critical, high, medium, low, very_low)
            3. Risk score (0-100) based on duration thresholds
            4. Specific risk factors and concerns
            5. Contextual factors (weather, peak hours, seasonal, airport-specific)
            6. 5-8 specific actionable recommendations
            7. Overall feasibility assessment using EXACT phrases above
            
            Consider:
            - Airport-specific minimum connection times and layout complexity
            - Peak hour operations and congestion
            - Seasonal weather patterns and travel volumes
            - Historical delay patterns for this airport
            - Immigration/customs requirements for international connections
            - Terminal changes and transportation needs
            - Airline reliability and on-time performance
            
            Format as JSON with these exact fields:
            {{
                "minimum_connection_time": 90,
                "risk_level": "medium",
                "risk_score": 55,
                "overall_feasibility": "comfortable connection",
                "risk_factors": [
                    "Limited buffer above minimum connection time",
                    "Weather risk may cause additional delays",
                    "Peak hour arrival increases congestion"
                ],
                "contextual_analysis": {{
                    "weather_impact": "Moderate weather risk adds 10-15 minutes delay risk",
                    "peak_hour_analysis": "Arrival during moderate traffic period",
                    "seasonal_factors": "Standard travel season with typical volumes",
                    "airport_specific": "Airport has efficient layout but customs can be slow"
                }},
                "buffer_analysis": {{
                    "buffer_time_minutes": 30,
                    "buffer_adequacy": "minimal but acceptable",
                    "delay_tolerance": "Can handle 20-30 minute delays"
                }},
                "recommendations": [
                    "Monitor weather forecasts closely before travel",
                    "Check in online and get mobile boarding passes",
                    "Allow extra time for any terminal changes",
                    "Have airline contact info ready for rebooking",
                    "Consider travel insurance for tight connections"
                ]
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
            
            # Parse AI response
            try:
                analysis = json.loads(ai_response)
                return analysis
            except json.JSONDecodeError as e:
                print(f"❌ AI layover analysis JSON parsing failed: {e}")
                return {"error": "❌ AI layover analysis failed - invalid response format"}
                
        except Exception as e:
            print(f"❌ AI layover analysis failed: {e}")
            return {"error": "❌ AI layover analysis system unavailable"}
    
    # Helper method for generating AI-powered airport-specific insights
    def get_airport_connection_insights(self, airport_code: str) -> Dict[str, Any]:
        """Get AI-powered insights about connection procedures at specific airport"""
        if not self.gemini_model:
            return {"error": "AI analysis unavailable"}
        
        try:
            prompt = f"""
            Provide detailed connection insights for {airport_code} airport.
            
            Include information about:
            1. Terminal layout and connection procedures
            2. Typical minimum connection times
            3. Immigration and customs processes
            4. Transportation between terminals
            5. Common delay factors
            6. Peak congestion periods
            7. Airline-specific procedures
            8. Tips for efficient connections
            
            Format as JSON with specific, actionable information.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            try:
                insights = json.loads(ai_response)
                return insights
            except json.JSONDecodeError:
                return {
                    "airport_code": airport_code,
                    "insights": ai_response,
                    "note": "AI provided text response instead of JSON"
                }
                
        except Exception as e:
            print(f"❌ Airport insights generation failed: {e}")
            return {"error": f"Failed to generate insights for {airport_code}: {str(e)}"}
    
    # AI-powered layover optimization suggestions
    def suggest_optimal_layover_time(self, airport_code: str, connection_type: str,
                                   travel_date: str = None, weather_conditions: str = None) -> Dict[str, Any]:
        """AI-powered suggestions for optimal layover duration"""
        if not self.gemini_model:
            return {"error": "AI optimization unavailable"}
        
        try:
            prompt = f"""
            Suggest optimal layover duration for {airport_code} airport.
            
            Connection Type: {connection_type}
            Travel Date: {travel_date}
            Weather Conditions: {weather_conditions}
            
            Provide recommendations for:
            1. Minimum safe connection time
            2. Recommended comfortable connection time
            3. Factors that might require longer layovers
            4. Trade-offs between connection time and travel convenience
            
            Consider airport-specific factors, seasonal patterns, and typical operations.
            
            Return as JSON with specific time recommendations and reasoning.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            
            try:
                suggestions = json.loads(ai_response)
                return suggestions
            except json.JSONDecodeError:
                return {
                    "airport_code": airport_code,
                    "suggestions": ai_response,
                    "note": "AI provided text response instead of JSON"
                }
                
        except Exception as e:
            print(f"❌ Layover optimization failed: {e}")
            return {"error": f"Failed to optimize layover for {airport_code}: {str(e)}"}

    def analyze_batch_layover_feasibility(self, layover_data_list: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        OPTIMIZED: Batch process multiple layover feasibility analyses in a single AI call
        
        Args:
            layover_data_list: List of layover data dictionaries containing airport_code, duration, etc.
        
        Returns:
            Dictionary mapping airport_code to analysis results
        """
        
        if not layover_data_list:
            return {}
        
        print(f"🚀 Layover Analysis Agent: Processing {len(layover_data_list)} layovers in batch")
        # Debug: Show the input data
        for i, layover in enumerate(layover_data_list):
            print(f"🔍 DEBUG: Layover {i+1} - Airport: {layover.get('airport_code')}, Duration: {layover.get('duration_str')}")
        
        try:
            # Define airport categories for batch analysis
            major_international_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'JFK', 'LHR', 'CDG', 'FRA', 'NRT', 'ICN']
            large_hubs = ['IAH', 'DEN', 'CLT', 'MIA', 'LAS', 'SEA', 'SFO', 'BOS', 'IAD', 'MSP', 'DTW', 'PHL']
            
            # Prepare batch analysis prompt with airport-specific categorization
            layover_summaries = []
            for i, layover_data in enumerate(layover_data_list):
                airport_code = layover_data.get('airport_code', 'Unknown')
                duration_str = layover_data.get('duration_str', '1h')
                weather_risk = layover_data.get('weather_risk', 'medium')
                airport_complexity = layover_data.get('airport_complexity', 'medium')
                
                # Determine airport category and thresholds
                if airport_code in major_international_hubs:
                    tight_threshold = 90
                    reasonable_threshold = 240
                    airport_category = "Major International Hub"
                elif airport_code in large_hubs:
                    tight_threshold = 75
                    reasonable_threshold = 180
                    airport_category = "Large Hub"
                else:
                    tight_threshold = 60
                    reasonable_threshold = 120
                    airport_category = "Medium/Small Airport"
                
                layover_summaries.append(f"""
                Layover {i+1}:
                - Airport: {airport_code} ({airport_category})
                - Duration: {duration_str}
                - Tight Threshold: {tight_threshold} minutes
                - Reasonable Threshold: {reasonable_threshold} minutes
                - Weather Risk: {weather_risk}
                - Airport Complexity: {airport_complexity}
                - Arrival Time: {layover_data.get('arrival_time', 'Unknown')}
                - Travel Date: {layover_data.get('travel_date', 'Unknown')}
                """)
            
            # Create comprehensive batch analysis prompt with airport-specific rules
            prompt = f"""
            Analyze the following {len(layover_data_list)} layovers for flight connection feasibility using AIRPORT-SPECIFIC THRESHOLDS.
            
            LAYOVER DETAILS:
            {''.join(layover_summaries)}
            
            CRITICAL: Use these AIRPORT-SPECIFIC TIME ASSESSMENT RULES for risk classification:
            
            For MAJOR INTERNATIONAL HUBS (ATL, ORD, DFW, LAX, JFK):
            - Less than 90 minutes = HIGH RISK (risk_level: "high")
            - 90-240 minutes = MEDIUM RISK (risk_level: "medium") 
            - 240+ minutes = LOW RISK (risk_level: "low")
            
            For LARGE HUBS (IAH, DEN, CLT, MIA, LAS, SEA, SFO, BOS):
            - Less than 75 minutes = HIGH RISK (risk_level: "high")
            - 75-180 minutes = MEDIUM RISK (risk_level: "medium")
            - 180+ minutes = LOW RISK (risk_level: "low")
            
            For MEDIUM/SMALL AIRPORTS (all others):
            - Less than 60 minutes = HIGH RISK (risk_level: "high")
            - 60-120 minutes = MEDIUM RISK (risk_level: "medium")
            - 120+ minutes = LOW RISK (risk_level: "low")
            
            For each layover, provide:
            1. Risk level (low, medium, high) based on AIRPORT-SPECIFIC thresholds above
            2. Risk score (0-100)
            3. Overall feasibility assessment
            4. Minimum connection time needed (in minutes)
            5. Buffer analysis (adequate, tight, insufficient)
            6. Top 3 recommendations
            7. Top 3 risk factors
            8. Airport-specific connection assessment
            
            EXAMPLES:
            - 7h 25m at ATL (445 minutes > 240) = risk_level: "low"
            - 5h 5m at MIA (305 minutes > 180) = risk_level: "low"
            - 1h 30m at DFW (90 minutes = 90) = risk_level: "medium"
            
            Format the response as a JSON object with airport codes as keys:
            {{
                "AIRPORT_CODE_1": {{
                    "risk_level": "medium",
                    "risk_score": 60,
                    "overall_feasibility": "Feasible with monitoring",
                    "minimum_connection_time": 90,
                    "buffer_analysis": {{"buffer_adequacy": "adequate"}},
                    "recommendations": ["Monitor weather", "Allow extra time", "Check gate info"],
                    "risk_factors": ["Weather delays possible", "Tight connection time", "Terminal change required"],
                    "contextual_analysis": {{"airport_specific": "Airport-specific assessment"}}
                }},
                "AIRPORT_CODE_2": {{ ... }}
            }}
            
            Make each analysis specific to the actual airport and connection details.
            Return only the JSON object.
            """
            
            response = self.gemini_model.generate_content(prompt)
            ai_response = response.text.strip()
            
            # Clean up JSON formatting
            if ai_response.startswith('```json'):
                ai_response = ai_response[7:]
            if ai_response.endswith('```'):
                ai_response = ai_response[:-3]
            ai_response = ai_response.strip()
            
            # Parse JSON response
            try:
                batch_results = json.loads(ai_response)
                
                # Validate and return results
                if isinstance(batch_results, dict):
                    print(f"✅ Layover Analysis Agent: Batch analysis complete for {len(batch_results)} layovers")
                    print(f"🔍 DEBUG: Batch results keys: {list(batch_results.keys())}")
                    # Debug: Show first result
                    if batch_results:
                        first_key = list(batch_results.keys())[0]
                        print(f"🔍 DEBUG: Sample result for {first_key}: {batch_results[first_key]}")
                    return batch_results
                else:
                    print(f"❌ Layover Analysis Agent: Invalid batch response format")
                    return {}
                    
            except json.JSONDecodeError as e:
                print(f"❌ Layover Analysis Agent: JSON parsing failed: {e}")
                print(f"🔍 AI Response: {ai_response[:500]}...")
                return {}
                
        except Exception as e:
            print(f"❌ Layover Analysis Agent: Batch analysis failed: {e}")
            return {}
    
    def _create_fallback_batch_analysis(self, layover_data_list: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Create fallback analysis for batch processing if AI fails"""
        results = {}
        
        for layover_data in layover_data_list:
            airport_code = layover_data.get('airport_code', 'Unknown')
            duration_str = layover_data.get('duration_str', '1h')
            duration_minutes = self._fallback_parse_duration(duration_str)
            
            # Simple fallback analysis
            if duration_minutes >= 120:
                risk_level = "low"
                risk_score = 30
                feasibility = "Comfortable connection time"
            elif duration_minutes >= 60:
                risk_level = "medium"
                risk_score = 50
                feasibility = "Adequate connection time"
            else:
                risk_level = "high"
                risk_score = 75
                feasibility = "Tight connection time"
            
            results[airport_code] = {
                "risk_level": risk_level,
                "risk_score": risk_score,
                "overall_feasibility": feasibility,
                "minimum_connection_time": 60,
                "buffer_analysis": {"buffer_adequacy": "unknown"},
                "recommendations": ["Monitor flight status", "Allow extra time"],
                "risk_factors": ["Fallback analysis used"],
                "contextual_analysis": {"airport_specific": "Fallback analysis"}
            }
        
        return results 