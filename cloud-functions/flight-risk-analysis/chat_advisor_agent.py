"""
Chat Advisor Agent - Google ADK Implementation
Orchestrates flight analysis by detecting intent and calling appropriate analysis functions
"""
import os
import re
import json
from datetime import datetime, timedelta, timezone
import google.generativeai as genai

# Import Google ADK - REAL IMPLEMENTATION ONLY
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
print("✅ Chat Advisor Agent: Using real Google ADK")

from typing import Dict, Any, List

# Simple Session Storage - Synchronous, No Breaking Changes
try:
    from simple_session_storage import add_to_session, get_session_stats, format_session_context
    SESSION_ENABLED = True
    print("✅ Simple Session Storage enabled")
except ImportError as e:
    SESSION_ENABLED = False
    print(f"⚠️ Session storage not available: {e}")

class ChatAdvisorAgent(Agent):
    """
    Google ADK Chat Advisor Agent that orchestrates flight analysis
    """
    
    def __init__(self):
        super().__init__(
            name="chat_advisor_agent",
            description="Flight analysis orchestrator that detects intent and calls appropriate analysis functions"
        )
        
        # Initialize Gemini AI
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        print("💬 Google ADK Chat Advisor Agent initialized")
    
    def provide_flight_advice(self, user_message: str, session_id: str = None) -> Dict[str, Any]:
        """
        Orchestrate flight analysis based on user message intent
        Now with optional session tracking for conversation memory
        """
        try:
            print(f"💬 CHAT ADVISOR: Analyzing user request: {user_message}")

            # Store user message in session (fire-and-forget, no blocking)
            if SESSION_ENABLED and session_id:
                try:
                    add_to_session(session_id, "user", user_message)
                    print(f"📋 SESSION: Stored user message in {session_id}")
                except Exception as e:
                    print(f"⚠️ SESSION: Failed to store user message: {e}")
            
            # Analyze the user's message to understand intent
            intent_analysis = self._analyze_intent_and_extract_data(user_message)
            print(f"🎯 CHAT ADVISOR: Detected intent: {intent_analysis['intent']}")
            
            # Route to appropriate analysis based on intent
            if intent_analysis['intent'] == 'route_analysis':
                print(f"🎯 CHAT ADVISOR: Routing to route analysis")
                result = self._orchestrate_route_analysis(intent_analysis)
            elif intent_analysis['intent'] == 'direct_flight_lookup':
                print(f"🎯 CHAT ADVISOR: Routing to direct flight analysis")
                result = self._orchestrate_direct_flight_analysis(intent_analysis)
            else:
                print(f"🎯 CHAT ADVISOR: Routing to conversational response for intent: {intent_analysis['intent']}")
                result = self._provide_conversational_response(user_message, intent_analysis)

            # Store bot response and add session stats (fire-and-forget)
            if SESSION_ENABLED and session_id:
                try:
                    response_text = result.get('response', '')
                    metadata = {
                        'intent': intent_analysis.get('intent'),
                        'success': result.get('success')
                    }
                    add_to_session(session_id, "assistant", response_text, metadata)
                    result['session_stats'] = get_session_stats(session_id)
                    print(f"📋 SESSION: Stored assistant response in {session_id}")
                except Exception as e:
                    print(f"⚠️ SESSION: Failed to store assistant response: {e}")

            # Debug info to diagnose session issues
            result['_debug_session'] = {
                'SESSION_ENABLED': SESSION_ENABLED,
                'session_id_provided': session_id is not None,
                'session_id_value': session_id
            }

            return result
                
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Analysis failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question about flight risks, insurance, or travel advice."
            }
    
    def _analyze_intent_and_extract_data(self, message: str) -> Dict[str, Any]:
        """
        Analyze user message to determine intent and extract relevant data
        """
        message_lower = message.lower()
        
        print(f"🔍 INTENT ANALYSIS: Processing message: '{message}'")
        print(f"🔍 INTENT ANALYSIS: Message lower: '{message_lower}'")
        
        # Pattern matching for different intents
        
        # 1. Route Analysis Intent: "flights from X to Y", "flights available", "search flights"
        route_patterns = [
            r'(?:what\s+)?flights?\s+(?:are\s+)?(?:available\s+)?from\s+([^to]+?)\s+to\s+([^on]+?)(?:\s+on\s+(.+?))?[?\s]*$',
            r'(?:what\s+)?flights?\s+(?:are\s+)?(?:available\s+)?(?:from\s+)?([^to]+?)\s+to\s+([^on]+?)(?:\s+on\s+(.+?))?[?\s]*$',
            r'search\s+flights?\s+from\s+([^to]+?)\s+to\s+([^on]+?)(?:\s+on\s+(.+?))?[?\s]*$',
            r'find\s+flights?\s+from\s+([^to]+?)\s+to\s+([^on]+?)(?:\s+on\s+(.+?))?[?\s]*$',
            r'(?:show\s+me\s+)?flights?\s+from\s+([^to]+?)\s+to\s+([^on]+?)(?:\s+on\s+(.+?))?[?\s]*$'
        ]
        
        for i, pattern in enumerate(route_patterns):
            print(f"🔍 INTENT ANALYSIS: Testing pattern {i+1}: {pattern}")
            match = re.search(pattern, message_lower)
            if match:
                print(f"✅ INTENT ANALYSIS: Pattern {i+1} matched! Groups: {match.groups()}")
                origin = match.group(1).strip()
                destination = match.group(2).strip()
                date = match.group(3).strip() if match.group(3) else None
                
                # Convert airport names to codes if needed
                origin_code = self._convert_to_airport_code(origin)
                destination_code = self._convert_to_airport_code(destination)
                
                print(f"🔍 INTENT ANALYSIS: Extracted - Origin: '{origin}' -> '{origin_code}', Destination: '{destination}' -> '{destination_code}', Date: '{date}'")
                
                return {
                    'intent': 'route_analysis',
                    'origin': origin_code,
                    'destination': destination_code,
                    'date': date,
                    'original_message': message
                }
            else:
                print(f"❌ INTENT ANALYSIS: Pattern {i+1} did not match")
        
        # 2. Direct Flight Lookup Intent: "insurance for [airline] flight [number]", "flight [airline][number]"
        direct_patterns = [
            # Pattern 1: "insurance for [airline] flight [flight_number]"
            r'(?:insurance|coverage)\s+for\s+(.+?)\s+flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(?:for|on)\s+(.+?))?[?\s]*$',
            # Pattern 2: "should i get insurance for [airline] flight [flight_number]"
            r'should\s+i\s+get\s+insurance\s+for\s+(.+?)\s+flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(?:for|on)\s+(.+?))?[?\s]*$',
            # Pattern 3: "[airline] flight [flight_number]"
            r'([a-zA-Z\s]+?)\s+flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(?:for|on)\s+(.+?))?[?\s]*$',
            # Pattern 4: "flight [flight_number]"
            r'flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(.+?))?[?\s]*$'
        ]
        
        for i, pattern in enumerate(direct_patterns):
            print(f"🔍 INTENT ANALYSIS: Testing direct pattern {i+1}: {pattern}")
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                print(f"✅ INTENT ANALYSIS: Direct pattern {i+1} matched! Groups: {match.groups()}")
                
                if i == 3:  # Pattern 4: "flight [flight_number]" - no airline mentioned
                    flight_number = match.group(1).strip()
                    airline = self._get_airline_from_flight_code(flight_number)
                    date = match.group(2).strip() if match.group(2) else None
                else:  # Patterns 1-3: airline mentioned
                    airline = match.group(1).strip()
                    flight_number = match.group(2).strip()
                    date = match.group(3).strip() if match.group(3) else None
                
                # ENHANCED: Validate and correct airline/flight number mismatch
                corrected_airline = self._validate_and_correct_airline(airline, flight_number)
                
                print(f"🔍 INTENT ANALYSIS: Extracted - Airline: '{airline}' -> '{corrected_airline}', Flight: '{flight_number}', Date: '{date}'")
                
                return {
                    'intent': 'direct_flight_lookup',
                    'airline': corrected_airline,
                    'flight_number': flight_number,
                    'date': date,
                    'original_message': message,
                    'airline_corrected': corrected_airline != airline
                }
            else:
                print(f"❌ INTENT ANALYSIS: Direct pattern {i+1} did not match")
        
        # 3. Insurance-specific questions
        if any(word in message_lower for word in ['insurance', 'should i get', 'coverage', 'protect']):
            return {
                'intent': 'insurance_advice',
                'original_message': message
            }
        
        # 4. General travel advice
        print(f"🔍 INTENT ANALYSIS: No patterns matched, defaulting to general_advice")
        return {
            'intent': 'general_advice',
            'original_message': message
        }
    
    def _convert_to_airport_code(self, city_or_airport: str) -> str:
        """Convert city names to airport codes using AI intelligence"""
        try:
            # If it's already an airport code (3-4 letters), return as-is
            if len(city_or_airport.strip()) <= 4 and city_or_airport.strip().isalpha():
                return city_or_airport.strip().upper()
            
            # Use AI to convert city names to airport codes
            prompt = f"""
            Convert the following city name or location to the most appropriate IATA airport code:
            Input: "{city_or_airport}"
            
            Rules:
            - Return only the 3-letter IATA airport code
            - For major cities with multiple airports, choose the main international airport
            - For ambiguous names, choose the most common airport
            - If it's already an airport code, return it as-is
            - If no valid airport exists, return "UNKNOWN"
            
            Examples:
            - "New York" → "JFK"
            - "San Francisco" → "SFO"
            - "Los Angeles" → "LAX"
            - "Chicago" → "ORD"
            - "LA" → "LAX"
            - "SF" → "SFO"
            - "NYC" → "JFK"
            
            Return only the airport code, nothing else.
            """
            
            response = self.model.generate_content(prompt)
            airport_code = response.text.strip().upper()
            
            # Validate the response
            if len(airport_code) == 3 and airport_code.isalpha() and airport_code != "UNKNOWN":
                return airport_code
            else:
                # If AI response is invalid, return original input as uppercase
                return city_or_airport.strip().upper()
                
        except Exception as e:
            print(f"❌ CHAT ADVISOR: AI airport code conversion failed: {e}")
            # Fallback: return original input as uppercase
            return city_or_airport.strip().upper()
    
    def _validate_and_correct_airline(self, airline_name: str, flight_number: str) -> str:
        """
        Validate airline name against flight number prefix and correct if needed
        """
        try:
            # Extract airline code from flight number
            flight_code = ''.join([c for c in flight_number if c.isalpha()]).upper()
            
            # Common airline mappings
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
            
            # If flight code matches known airline, use that
            if flight_code in airline_mappings:
                correct_airline = airline_mappings[flight_code]
                
                # Check if user's airline name is significantly different
                airline_lower = airline_name.lower()
                correct_lower = correct_airline.lower()
                
                # If user mentioned wrong airline, correct it
                if not any(word in airline_lower for word in correct_lower.split()):
                    print(f"🔄 CHAT ADVISOR: Correcting airline '{airline_name}' to '{correct_airline}' based on flight code '{flight_code}'")
                    return correct_airline
            
            # If no correction needed, return original
            return airline_name
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Airline validation failed: {e}")
            return airline_name
    
    def _get_airline_from_flight_code(self, flight_number: str) -> str:
        """
        Extract airline name from flight number code
        """
        try:
            # Extract airline code from flight number
            flight_code = ''.join([c for c in flight_number if c.isalpha()]).upper()
            
            # Common airline mappings
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
            
            return airline_mappings.get(flight_code, flight_code)
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Flight code extraction failed: {e}")
            return "Unknown Airline"
    
    def _get_airline_name_from_code(self, airline_code: str) -> str:
        """
        Get full airline name from airline code
        """
        try:
            # Common airline mappings
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
            
            # Return mapped airline name or the original code if not found
            return airline_mappings.get(airline_code.upper(), airline_code)
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Airline name mapping failed: {e}")
            return airline_code

    def _get_airline_code_from_name(self, airline_name: str) -> str:
        """
        Convert airline name back to airline code for BigQuery lookup
        """
        try:
            # Reverse mapping from airline names to codes
            name_to_code_mappings = {
                'American Airlines': 'AA',
                'Delta Air Lines': 'DL', 
                'United Airlines': 'UA',
                'Southwest Airlines': 'WN',
                'JetBlue Airways': 'B6',
                'Alaska Airlines': 'AS',
                'Spirit Airlines': 'NK',
                'Frontier Airlines': 'F9',
                'Allegiant Air': 'G4',
                'Sun Country Airlines': 'SY',
                'Air Canada': 'AC',
                'British Airways': 'BA',
                'Lufthansa': 'LH',
                'Air France': 'AF',
                'KLM': 'KL',
                'Emirates': 'EK',
                'Qatar Airways': 'QR',
                'Turkish Airlines': 'TK',
                'Singapore Airlines': 'SQ',
                'Cathay Pacific': 'CX',
                'Japan Airlines': 'JL',
                'All Nippon Airways': 'NH'
            }
            
            # Check if it's already a code (2-3 letters)
            if len(airline_name) <= 3 and airline_name.isalpha():
                return airline_name.upper()
            
            # Convert name to code
            airline_code = name_to_code_mappings.get(airline_name, airline_name)
            print(f"🔄 CHAT ADVISOR: Converted airline name '{airline_name}' to code '{airline_code}'")
            return airline_code
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Airline name to code conversion failed: {e}")
            return airline_name
    
    def _orchestrate_route_analysis(self, intent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrate route analysis by calling the actual analysis functions
        """
        try:
            print(f"🛫 CHAT ADVISOR: Orchestrating route analysis for {intent_data['origin']} -> {intent_data['destination']}")
            
            # Import the analysis function from main.py
            from main import _handle_route_analysis
            
            # Validate required parameters
            if not intent_data.get('date'):
                return {
                    'success': False,
                    'error': 'missing_date',
                    'orchestrator': {
                        'intent': 'route_analysis',
                        'reasoning': f"Date is required for route analysis"
                    },
                    'response': f"📅 **Date Required**\n\nI need a specific date to search for flights from {intent_data['origin']} to {intent_data['destination']}.\n\n**Please try again with a date like:**\n• \"What flights are available from {intent_data['origin']} to {intent_data['destination']} on July 16th 2025?\"\n• \"Show me flights from {intent_data['origin']} to {intent_data['destination']} for December 15th 2024\""
                }
            
            # Prepare parameters for route analysis
            params = {
                'origin': intent_data['origin'],
                'destination': intent_data['destination'],
                'date': intent_data['date'],  # Use provided date without fallback
                'trip_type': 'round_trip'
            }
            
            print(f"📊 CHAT ADVISOR: Calling _handle_route_analysis with params: {params}")
            
            # Call the actual route analysis function
            analysis_result = _handle_route_analysis(params)
            
            print(f"🔍 CHAT ADVISOR: Route analysis result: {analysis_result}")
            
            if analysis_result['success']:
                print(f"✅ CHAT ADVISOR: Route analysis successful, found {len(analysis_result.get('flights', []))} flights")
                
                # Return in the format expected by ChatBot.tsx
                return {
                    'success': True,
                    'orchestrator': {
                        'intent': 'route_analysis',
                        'reasoning': f"User requested flight options from {intent_data['origin']} to {intent_data['destination']} on {params['date']}"
                    },
                    'flights': analysis_result.get('flights', []),
                    'weather_analysis': analysis_result.get('weather_analysis', {}),
                    'route_info': {
                        'origin': intent_data['origin'],
                        'destination': intent_data['destination'],
                        'date': params['date']
                    },
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                print(f"❌ CHAT ADVISOR: Route analysis failed: {analysis_result.get('error', 'Unknown error')}")
                return {
                    'success': False,
                    'error': analysis_result.get('error', 'Route analysis failed'),
                    'orchestrator': {
                        'intent': 'route_analysis',
                        'reasoning': f"Failed to analyze route from {intent_data['origin']} to {intent_data['destination']}"
                    }
                }
                
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Route analysis orchestration failed: {e}")
            return {
                'success': False,
                'error': f'Route analysis orchestration failed: {str(e)}',
                'orchestrator': {
                    'intent': 'route_analysis',
                    'reasoning': f"Error orchestrating route analysis: {str(e)}"
                }
            }
    
    def _orchestrate_direct_flight_analysis(self, intent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Orchestrate direct flight analysis by calling the actual analysis functions
        """
        try:
            print(f"✈️ CHAT ADVISOR: Orchestrating direct flight analysis for {intent_data['airline']} {intent_data['flight_number']}")
            
            # Import the analysis function from main.py
            from main import _handle_direct_flight_analysis
            
            # FIXED: Convert airline name to airline code for BigQuery lookup
            airline_code = self._get_airline_code_from_name(intent_data['airline'])
            
            # Validate required parameters
            if not intent_data.get('date'):
                return {
                    'success': False,
                    'error': 'missing_date',
                    'orchestrator': {
                        'intent': 'direct_flight_lookup',
                        'reasoning': f"Date is required for flight analysis"
                    },
                    'response': f"📅 **Date Required**\n\nI need a specific date to analyze {intent_data['airline']} flight {intent_data['flight_number']}.\n\n**Please try again with a date like:**\n• \"Should I get insurance for {intent_data['airline']} flight {intent_data['flight_number']} on July 16th 2025?\"\n• \"Analyze {intent_data['airline']} {intent_data['flight_number']} for December 15th 2024\""
                }
            
            # Prepare parameters for direct flight analysis - Enhanced with both airline_name and airline_code
            params = {
                'airline': airline_code,  # Use airline code for backward compatibility
                'airline_name': intent_data['airline'],  # Original airline name from user
                'flight_number': intent_data['flight_number'],
                'date': intent_data['date']  # Use provided date without fallback
            }
            
            print(f"📊 CHAT ADVISOR: Calling _handle_direct_flight_analysis with params: {params}")
            print(f"🔄 CHAT ADVISOR: Converted '{intent_data['airline']}' to airline code '{airline_code}'")
            
            # Call the actual direct flight analysis function
            analysis_result = _handle_direct_flight_analysis(params)
            
            if analysis_result['success']:
                print(f"✅ CHAT ADVISOR: Direct flight analysis successful")
                
                # Return in the format expected by ChatBot.tsx
                return {
                    'success': True,
                    'orchestrator': {
                        'intent': 'direct_flight_lookup',
                        'reasoning': f"User requested analysis for {intent_data['airline']} flight {intent_data['flight_number']} on {params['date']}"
                    },
                    'flight_data': analysis_result.get('flight_data', {}),
                    'risk_analysis': analysis_result.get('risk_analysis', {}),
                    'weather_analysis': analysis_result.get('weather_analysis', {}),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                print(f"❌ CHAT ADVISOR: Direct flight analysis failed: {analysis_result.get('error', 'Unknown error')}")
                return {
                    'success': False,
                    'error': analysis_result.get('error', 'Direct flight analysis failed'),
                    'orchestrator': {
                        'intent': 'direct_flight_lookup',
                        'reasoning': f"Failed to analyze {intent_data['airline']} flight {intent_data['flight_number']}"
                    }
                }
                
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Direct flight analysis orchestration failed: {e}")
            return {
                'success': False,
                'error': f'Direct flight analysis orchestration failed: {str(e)}',
                'orchestrator': {
                    'intent': 'direct_flight_lookup',
                    'reasoning': f"Error orchestrating direct flight analysis: {str(e)}"
                }
            }
    
    def _provide_conversational_response(self, message: str, intent_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide conversational response for general questions
        """
        try:
            print(f"💬 CHAT ADVISOR: Providing conversational response for: {intent_data['intent']}")
            
            # Generate response based on intent
            if intent_data['intent'] == 'insurance_advice':
                response = self._generate_insurance_advice(message, intent_data)
            else:
                response = self._generate_general_advice(message)
            
            return {
                'success': True,
                'orchestrator': {
                    'intent': 'chat_conversation',
                    'reasoning': f"Providing conversational response for {intent_data['intent']}"
                },
                'response': response,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Conversational response failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question about flight risks, insurance, or travel advice."
            }
    
    def _generate_insurance_advice(self, message: str, intent_data: Dict[str, Any]) -> str:
        """Generate insurance advice, potentially with flight analysis if flight details are available"""
        
        # Check if message contains flight details that we can analyze
        flight_patterns = [
            r'insurance\s+for\s+(.+?)\s+flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(?:for|on)\s+(.+?))?',
            r'should\s+i\s+get\s+insurance\s+for\s+(.+?)\s+flight\s+([A-Z]{1,3}\d{1,4})(?:\s+(?:for|on)\s+(.+?))?'
        ]
        
        for pattern in flight_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                airline = match.group(1).strip()
                flight_number = match.group(2).strip()
                date = match.group(3).strip() if match.group(3) else None
                
                # Validate and correct airline
                corrected_airline = self._validate_and_correct_airline(airline, flight_number)
                
                # Try to get flight analysis for specific insurance advice
                try:
                    from main import _handle_direct_flight_analysis
                    
                    # FIXED: Convert airline name to airline code for BigQuery lookup
                    airline_code = self._get_airline_code_from_name(corrected_airline)
                    
                    # Validate required parameters
                    if not date:
                        return f"""📅 **Date Required for Insurance Analysis**

I need a specific date to analyze insurance options for {corrected_airline} flight {flight_number}.

**Please try again with a date like:**
• "Should I get insurance for {corrected_airline} flight {flight_number} on July 16th 2025?"
• "Insurance advice for {corrected_airline} {flight_number} December 15th 2024"

**Why date matters for insurance:**
• Flight risk varies by season and weather patterns
• Insurance pricing depends on travel dates
• Seasonal factors affect delay/cancellation probability"""
                    
                    params = {
                        'airline': airline_code,  # Use airline code for backward compatibility
                        'airline_name': corrected_airline,  # Original airline name from user
                        'flight_number': flight_number,
                        'date': date  # Use provided date without fallback
                    }
                    
                    print(f"📊 CHAT ADVISOR: Insurance analysis - calling with airline code '{airline_code}' for flight {flight_number}")
                    print(f"🔄 CHAT ADVISOR: Insurance analysis - using airline name '{corrected_airline}' for matching")
                    
                    analysis_result = _handle_direct_flight_analysis(params)
                    
                    if analysis_result['success']:
                        # Generate specific insurance advice based on flight analysis
                        # Use original airline name for display, but analysis was done with airline code
                        return self._generate_specific_insurance_advice(analysis_result, corrected_airline, flight_number, date)
                    else:
                        # Flight not found, provide general advice but mention the flight
                        return f"""❌ **Flight Not Found: {corrected_airline} {flight_number}**

I couldn't find this specific flight in our database. This could mean:
• The flight number might be incorrect
• The flight might be on a different date
• The flight might not be in our current dataset

**General Insurance Advice:**
For any flight, consider insurance if:
• ✈️ You have connecting flights (higher risk)
• 🌦️ You're traveling during storm season
• ⏱️ Connection times are tight (under 60 minutes)
• 💰 You have significant non-refundable expenses
• 🏥 You or travel companions have health concerns

**Next Steps:**
• Double-check the flight number and date
• Try asking: "What flights are available from [origin] to [destination] on [date]?"
• Contact the airline directly to verify flight details

Would you like me to help you search for flights on this route instead?"""
                    
                except Exception as e:
                    print(f"❌ CHAT ADVISOR: Flight analysis failed for insurance advice: {e}")
                    # Fall through to general advice
                    break
        
        # If no flight details or analysis failed, provide general advice
        return """⚠️ **AI agents temporarily unavailable. Fallback response:**

Based on your flight details, I'd recommend considering insurance if:

✈️ Your flight has multiple connections
🌦️ You're traveling during storm season
⏱️ Connection times are under 60 minutes
📊 Historical delay rates are above 20%

Would you like me to analyze a specific flight for you?"""
    
    def _generate_specific_insurance_advice(self, analysis_result: Dict, airline: str, flight_number: str, date: str) -> str:
        """Generate specific insurance advice based on flight analysis"""
        try:
            flight_data = analysis_result.get('flight_data', {})
            risk_analysis = analysis_result.get('risk_analysis', {})
            weather_analysis = analysis_result.get('weather_analysis', {})
            
            # Extract key risk factors
            risk_level = risk_analysis.get('risk_level', 'medium')
            risk_score = risk_analysis.get('overall_risk_score', 50)
            connections = flight_data.get('connections', [])
            delay_prob = risk_analysis.get('delay_probability', 'unknown')
            cancel_prob = risk_analysis.get('cancellation_probability', 'unknown')
            
            # Generate recommendation based on risk analysis
            if risk_level == 'high' or risk_score > 70:
                recommendation = "**🚨 STRONGLY RECOMMEND INSURANCE**"
                reasoning = "High risk factors detected"
            elif risk_level == 'medium' or risk_score > 40:
                recommendation = "**🤔 CONSIDER INSURANCE**"
                reasoning = "Moderate risk factors present"
            else:
                recommendation = "**✅ INSURANCE OPTIONAL**"
                reasoning = "Low risk factors detected"
            
            # Build response
            response = f"""## Insurance Analysis for {airline} {flight_number}

**Flight Details:**
• Date: {date or 'Not specified'}
• Route: {flight_data.get('origin_airport_code', 'Unknown')} → {flight_data.get('destination_airport_code', 'Unknown')}
• Connections: {len(connections)} stop(s)
• Risk Level: {risk_level.title()} ({risk_score}/100)

**Risk Assessment:**
• Delay Probability: {delay_prob}
• Cancellation Probability: {cancel_prob}

{recommendation}
*{reasoning}*

**Key Risk Factors:**
"""
            
            # Add risk factors if available
            key_factors = risk_analysis.get('key_risk_factors', [])
            for factor in key_factors[:4]:  # Show top 4 factors
                response += f"• {factor}\n"
            
            # Add connection analysis if applicable
            if connections:
                response += f"\n**Connection Analysis:**\n"
                for i, conn in enumerate(connections[:2]):  # Show first 2 connections
                    duration = conn.get('duration', 'Unknown')
                    airport = conn.get('airport', 'Unknown')
                    response += f"• Stop {i+1}: {airport} ({duration} layover)\n"
            
            # Add insurance considerations
            response += f"""
**Insurance Considerations:**
• **Trip Cost Protection:** Covers non-refundable expenses
• **Delay Coverage:** Usually covers delays 3+ hours
• **Connection Protection:** Important for {len(connections)}-stop flights
• **Weather Coverage:** Relevant given current weather conditions

**Alternatives to Consider:**
• Credit card travel insurance benefits
• Airline's rebooking policies for irregular operations
• Flexible ticket options

**Final Recommendation:** {recommendation.replace('**', '')}"""
            
            return response
            
        except Exception as e:
            print(f"❌ CHAT ADVISOR: Error generating specific insurance advice: {e}")
            return "Unable to generate specific insurance advice due to analysis error. Please try again."
    
    def _generate_general_advice(self, message: str) -> str:
        """Generate general travel advice"""
        return """I can help you with comprehensive flight analysis and travel advice:

**Flight Analysis Services:**
• 🔍 **Specific Flight Lookup** - Enter airline and flight number (e.g., "American Airlines AA411") for detailed risk analysis
• 🗺️ **Route Search** - Search "flights from [origin] to [destination] on [date]" for multiple options with risk scores
• 💰 **Insurance Recommendations** - Get personalized advice based on your flight's risk profile
• 🌦️ **Weather Impact Analysis** - Real-time weather conditions and delay predictions
• ⏱️ **Connection Analysis** - Layover feasibility and minimum connection time evaluation

**Examples of what you can ask:**
• "What flights are available from New York to San Francisco on July 12th?"
• "Should I get insurance for American Airlines flight AA411?"
• "Analyze Delta flight DL123 for weather risks"

**Key Risk Factors I Analyze:**
• Weather conditions at origin, destination, and layover airports
• Airport operational complexity and historical delays
• Airline reliability and aircraft type
• Connection time adequacy
• Seasonal travel patterns

What specific flight analysis can I help you with?""" 