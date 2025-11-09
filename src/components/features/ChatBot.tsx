import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Maximize2, Minimize2, Volume2, VolumeX, Settings, Mic, MicOff } from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { flightRiskAPI } from '../../services/api';
import { formatLayoverDuration } from '../../utils/timeUtils';
import voiceService from '../../services/voiceService';
import speechService from '../../services/speechService';
import { VoiceSettings } from './VoiceSettings';
import { AnimatedAirplane } from './AnimatedAirplane';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Loading animation component with 3 jumping dots
const LoadingDots: React.FC = () => {
  const { isDarkMode } = useDarkMode();
  return (
    <div className="flex space-x-1 justify-center items-center">
      <div className={`w-2 h-2 rounded-full animate-bounce-dots ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '0ms' }}></div>
      <div className={`w-2 h-2 rounded-full animate-bounce-dots ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '200ms' }}></div>
      <div className={`w-2 h-2 rounded-full animate-bounce-dots ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{ animationDelay: '400ms' }}></div>
    </div>
  );
};

export interface ChatBotRef {
  openChat: () => void;
  closeChat: () => void;
}

// Component to render formatted flight analysis text with markdown support
const FormattedFlightText: React.FC<{ text: string }> = ({ text }) => {
  const { isDarkMode } = useDarkMode();
  const lines = text.split('\n');
  
  // Function to process markdown bold syntax
  const processMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove the ** and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
  };
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-1" />;
        
        // Title line (contains flight number)
        if (line.includes('Flight') && line.includes('Analysis')) {
          return (
            <div key={index} className={`font-bold text-base ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              {processMarkdown(line)}
            </div>
          );
        }
        
        // Section headers - make them blue and uppercase
        if (line.includes('KEY RISK FACTORS:') || line.includes('MY RECOMMENDATIONS:') || line.includes('Route Analysis Results') || 
            line.includes('WEATHER ANALYSIS:') || line.includes('AIRPORT COMPLEXITY ANALYSIS:') || 
            line.includes('CONNECTION ANALYSIS:') || line.includes('INSURANCE RECOMMENDATION:') || line.includes('MY RECOMMENDATION:')) {
          return (
            <div key={index} className={`font-semibold mt-3 mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
              {processMarkdown(line)}
            </div>
          );
        }
        
        // Risk level and score
        if (line.includes('Risk Level:') || line.includes('Risk Score:')) {
          return (
            <div key={index} className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {processMarkdown(line)}
            </div>
          );
        }
        
        // Route and date info
        if (line.includes('Route:') || line.includes('Date:')) {
          return (
            <div key={index} className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              {processMarkdown(line)}
            </div>
          );
        }
        
        // Insurance recommendation
        if (line.includes('INSURANCE RECOMMENDATION:')) {
          return (
            <div key={index} className={`p-2 rounded text-sm mt-2 ${
              isDarkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-50 text-blue-800'
            }`}>
              {processMarkdown(line)}
            </div>
          );
        }
        
        // Regular lines
        return (
          <div key={index} className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>
            {processMarkdown(line)}
          </div>
        );
      })}
    </div>
  );
};

export const ChatBot = forwardRef<ChatBotRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your flight risk advisor powered by multi-agent AI! Ask me anything about flight risks, insurance decisions, or help finding safer flights!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentVoiceId, setCurrentVoiceId] = useState('HDA9tsk27wYi3uq0fPcK'); // Stuart - Professional & friendly Aussie voice
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();

  // Session Management: Generate unique session per chat window
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // User Management: Get or create persistent user ID
  const [userId] = useState<string>(() => {
    const stored = localStorage.getItem('flightRiskRadar_userId');
    if (stored) {
      console.log('🆔 Using existing user ID:', stored);
      return stored;
    }

    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('flightRiskRadar_userId', newUserId);
    console.log('🆔 Created new user ID:', newUserId);
    return newUserId;
  });

  // Log session info on mount
  React.useEffect(() => {
    console.log('💬 ChatBot initialized with session management');
    console.log('   Session ID:', sessionId);
    console.log('   User ID:', userId);
  }, [sessionId, userId]);

  // Set up voice playing state callback
  React.useEffect(() => {
    voiceService.setPlayingStateCallback(setIsVoicePlaying);

    return () => {
      voiceService.removePlayingStateCallback();
    };
  }, []);

  // Set up speech recognition
  React.useEffect(() => {
    if (speechService.isSupported()) {
      speechService.onStartCallback(() => setIsListening(true));
      speechService.onEndCallback(() => setIsListening(false));
      speechService.onResultCallback((result) => {
        if (result.isFinal) {
          setInputText(result.transcript);
          setInterimTranscript('');
        } else {
          setInterimTranscript(result.transcript);
        }
      });
      speechService.onErrorCallback((error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
        setInterimTranscript('');
      });
    }

    return () => {
      speechService.removeCallbacks();
    };
  }, []);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    openChat: () => setIsOpen(true),
    closeChat: () => setIsOpen(false)
  }));

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Call the real backend AI agents with intent detection (with session support)
      const response = await flightRiskAPI.sendChatMessageWithIntentDetection({
        message: messageText,
        session_id: sessionId,  // Session tracking for conversation context
        user_id: userId,        // User tracking for cross-session identification
        context: {} // Could include flight search context here
      });

      console.log('💬 Chat request sent with session:', sessionId, 'user:', userId);

      let botResponseText = '';
      
      // Handle different response types based on intent
      if (response.success && response.orchestrator?.intent === 'direct_flight_lookup') {
        // Direct flight lookup response
        const flightData = response.flight_data;
        const riskAnalysis = response.risk_analysis;
        
        // Extract clean date information
        let dateInfo = '';
        
        // Try to get date from flight data first
        if (flightData.date) {
          dateInfo = flightData.date;
        } else if (response.orchestrator.reasoning) {
          // Extract only the date part from reasoning, ignore system explanations
          const reasoning = response.orchestrator.reasoning;
          const dateMatch = reasoning.match(/(\w+ \d+(?:st|nd|rd|th)? \d{4})/);
          if (dateMatch) {
            dateInfo = dateMatch[1];
          } else {
            // Try different date formats
            const dateFormats = [
              /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
              /(\d{2}\/\d{2}\/\d{4})/,  // MM/DD/YYYY
              /(July \d+(?:st|nd|rd|th)? \d{4}|August \d+(?:st|nd|rd|th)? \d{4}|September \d+(?:st|nd|rd|th)? \d{4})/i  // Month DD, YYYY
            ];
            
            for (const format of dateFormats) {
              const match = reasoning.match(format);
              if (match) {
                dateInfo = match[1];
                break;
              }
            }
          }
        }
        
        // If still no date found, use a generic fallback
        if (!dateInfo) {
          dateInfo = 'Travel Date';
        }
        
        // Extract detailed weather and airport analysis
        const weatherAnalysis = response.weather_analysis || {};
        const originWeather = weatherAnalysis.origin_weather || {};
        const destinationWeather = weatherAnalysis.destination_weather || {};
        
        // Build comprehensive analysis text
        botResponseText = `✈️ ${flightData.airline_name} Flight ${flightData.flight_number} Analysis\n\n` +
          `🛫 Route: ${flightData.origin_airport_code} → ${flightData.destination_airport_code}\n` +
          `📅 Date: ${dateInfo}\n\n` +
          `⚠️ **Risk Level:** ${riskAnalysis.risk_level.toUpperCase()}\n` +
          `📊 **Risk Score:** ${riskAnalysis.overall_risk_score}/100\n`;
        
        // Add delay and cancellation probabilities if available
        if (riskAnalysis.delay_probability || riskAnalysis.cancellation_probability) {
          botResponseText += `⏰ **Delay Probability:** ${riskAnalysis.delay_probability || 'N/A'}\n`;
          botResponseText += `❌ **Cancellation Probability:** ${riskAnalysis.cancellation_probability || 'N/A'}\n`;
        }
        
        botResponseText += '\n';
        
        // Add weather analysis section
        if (originWeather.weather_conditions || destinationWeather.weather_conditions) {
          botResponseText += `🌤️ **WEATHER ANALYSIS:**\n\n`;
          
          if (originWeather.weather_conditions) {
            const originCity = originWeather.city || 'Unknown City';
            const originConditions = originWeather.weather_conditions.conditions || '❌ Weather data unavailable';
            const truncatedOriginConditions = originConditions.length > 120 ? 
              originConditions.substring(0, 120) + '...' : originConditions;
            botResponseText += `• **Origin (${flightData.origin_airport_code}, ${originCity}):**\n  ${truncatedOriginConditions}\n`;
          }
          
          if (destinationWeather.weather_conditions) {
            const destinationCity = destinationWeather.city || 'Unknown City';
            const destinationConditions = destinationWeather.weather_conditions.conditions || '❌ Weather data unavailable';
            const truncatedDestinationConditions = destinationConditions.length > 120 ? 
              destinationConditions.substring(0, 120) + '...' : destinationConditions;
            botResponseText += `• **Destination (${flightData.destination_airport_code}, ${destinationCity}):**\n  ${truncatedDestinationConditions}\n`;
          }
          
          // Add connection weather analysis
          if (flightData.connections && flightData.connections.length > 0) {
            for (const connection of flightData.connections) {
              if (connection.weather_risk) {
                const connectionCity = connection.city || 'Unknown City';
                // Truncate long weather descriptions
                const description = connection.weather_risk.description || '❌ Weather data unavailable';
                const truncatedDescription = description.length > 120 ? 
                  description.substring(0, 120) + '...' : description;
                botResponseText += `• **Connection (${connection.airport}, ${connectionCity}):**\n  ${truncatedDescription}\n`;
              }
            }
          }
          
          // Add weather risks if available
          if (originWeather.weather_risk || destinationWeather.weather_risk) {
            botResponseText += `• Weather Risks: `;
            const weatherRisks = [];
            if (originWeather.weather_risk?.risk_factors) {
              weatherRisks.push(...originWeather.weather_risk.risk_factors);
            }
            if (destinationWeather.weather_risk?.risk_factors) {
              weatherRisks.push(...destinationWeather.weather_risk.risk_factors);
            }
            if (weatherRisks.length > 0) {
              botResponseText += weatherRisks.join(', ') + '\n';
            } else {
              botResponseText += 'Minimal weather impact expected\n';
            }
          }
          
          botResponseText += '\n';
        }
        
        // Add airport complexity analysis (always show for origin and destination)
        botResponseText += `🏢 **AIRPORT COMPLEXITY ANALYSIS:**\n\n`;
        
        // Analyze origin airport - use weather data or flight data
        const originComplexityData = originWeather.airport_complexity || flightData.origin_analysis?.airport_complexity;
        if (originComplexityData) {
          const originComplexity = originComplexityData.complexity || '❌ Analysis failed';
          const originDescription = originComplexityData.description || '❌ Analysis failed';
          botResponseText += `• **Origin (${flightData.origin_airport_code}):** ${originComplexity} complexity\n  ${originDescription}\n`;
        } else {
          botResponseText += `• **Origin (${flightData.origin_airport_code}):** Analysis not available\n`;
        }
        
        // Analyze destination airport - use weather data or flight data
        const destComplexityData = destinationWeather.airport_complexity || flightData.destination_analysis?.airport_complexity;
        if (destComplexityData) {
          const destComplexity = destComplexityData.complexity || '❌ Analysis failed';
          const destDescription = destComplexityData.description || '❌ Analysis failed';
          botResponseText += `• **Destination (${flightData.destination_airport_code}):** ${destComplexity} complexity\n  ${destDescription}\n`;
        } else {
          botResponseText += `• **Destination (${flightData.destination_airport_code}):** Analysis not available\n`;
        }
        
        // Analyze connection airports if they exist
        if (flightData.connections && flightData.connections.length > 0) {
          for (const connection of flightData.connections) {
            if (connection.airport_complexity) {
              const connectionCity = connection.city || 'Unknown City';
              const connectionComplexity = connection.airport_complexity.complexity || '❌ Analysis failed';
              const connectionDescription = connection.airport_complexity.description || '❌ Analysis failed';
              botResponseText += `• **Connection (${connection.airport}, ${connectionCity}):** ${connectionComplexity} complexity\n  ${connectionDescription}\n`;
            }
          }
        }
        
        botResponseText += '\n';
        
        // Add connection analysis if available
        if (flightData.connections && flightData.connections.length > 0) {
          botResponseText += `⏱️ **CONNECTION ANALYSIS:**\n\n`;
          
          for (const connection of flightData.connections) {
            const connectionCity = connection.city || 'Unknown City';
            if (connection.layover_analysis) {
              botResponseText += `• **${connection.airport}, ${connectionCity}:** ${connection.layover_analysis.feasibility_risk || 'Medium'} risk connection (${formatLayoverDuration(connection.duration)})\n`;
              if (connection.layover_analysis.feasibility_description) {
                botResponseText += `  ${connection.layover_analysis.feasibility_description}\n`;
              }
            } else {
              botResponseText += `• **${connection.airport}, ${connectionCity}:** ${formatLayoverDuration(connection.duration)} connection\n`;
            }
          }
          
          botResponseText += '\n';
        }
        
        // Add detailed risk factors
        botResponseText += `🔍 **KEY RISK FACTORS:**\n${riskAnalysis.key_risk_factors.map((f: string) => `• ${f}`).join('\n')}\n\n`;
        
        // Add recommendations
        botResponseText += `💡 **MY RECOMMENDATIONS:**\n${riskAnalysis.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n`;
        
        // Add insurance recommendation
        botResponseText += `🛡️ **INSURANCE RECOMMENDATION:**\n` +
          `Based on the ${riskAnalysis.risk_level} risk level, ` +
          `${riskAnalysis.risk_level === 'high' ? 'I strongly recommend' : riskAnalysis.risk_level === 'medium' ? 'I recommend considering' : 'insurance may not be necessary, but you could consider'} travel insurance for this flight.`;
      } else if (response.success && response.orchestrator?.intent === 'route_analysis') {
        // Route analysis response
        const flights = response.flights || [];
        if (flights.length > 0) {
          const routeInfo = response.route_info || {};
          const weatherAnalysis = response.weather_analysis || {};
          
          // Extract only the main origin and destination airport codes (not layover codes)
          const originCode = routeInfo.origin.split(',')[0].trim();
          const destinationCode = routeInfo.destination.split(',')[0].trim();
          
          botResponseText = `✈️ **Flight Options: ${originCode} → ${destinationCode}**\n` +
            `📅 **Date: ${routeInfo.date}**\n\n` +
            `Found ${flights.length} flight options:\n\n` +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            flights.slice(0, 5).map((flight: Record<string, any>, index: number) => {
              const riskAnalysis = flight.risk_analysis || {};
              const connectionCount = flight.connections && flight.connections.length > 0 ? flight.connections.length : 0;
              const layoverText = connectionCount > 0 
                ? ` (${connectionCount} connection${connectionCount > 1 ? 's' : ''})`
                : ' (Direct)';
              
              // Get proper cancellation and delay rates from risk analysis
              const cancellationRate = riskAnalysis.historical_performance?.cancellation_rate || 'N/A';
              const delayRate = riskAnalysis.historical_performance?.average_delay || 'N/A';
              const delayProbability = riskAnalysis.delay_probability || 'N/A';
              
              return `**${index + 1}. ${flight.airline_name} ${flight.flight_number} - $${flight.price}**\n` +
                `   ⏱️ Duration: ${flight.duration}${layoverText}\n` +
                `   ⚠️ Risk: ${riskAnalysis.risk_level?.toUpperCase() || 'Unknown'} (${riskAnalysis.overall_risk_score || 0}/100)\n` +
                `   🛫 Departs: ${flight.departure_time}\n` +
                `   🛬 Arrives: ${flight.arrival_time}\n` +
                `   📊 Cancellation Rate: ${cancellationRate}\n` +
                `   ⏰ Delay Rate: ${delayRate}\n` +
                `   🚨 Delay Probability: ${delayProbability}\n`;
            }).join('\n') +
            `\n🌤️ **Weather Summary:**\n` +
            `• Origin (${originCode}): ${weatherAnalysis.origin_weather?.weather_conditions?.conditions || weatherAnalysis.weather_conditions?.conditions || 'N/A'}\n` +
            `• Destination (${destinationCode}): ${weatherAnalysis.destination_weather?.weather_conditions?.conditions || weatherAnalysis.weather_conditions?.conditions || 'N/A'}\n\n` +
            `💡 **MY RECOMMENDATION:**\n` +
            `Based on the analysis, I recommend considering travel insurance for flights with medium or high risk levels. The weather conditions show some precipitation at both airports, so allow extra time for potential delays.`;
        } else {
          botResponseText = `❌ No flights found for this route. Please check your airports and date.`;
        }
      } else if (response.success && response.orchestrator?.intent === 'chat_conversation') {
        // Chat conversation response
        botResponseText = response.response || 'I can help you with flight risk analysis!';
      } else if (response.response) {
        // Fallback to response field
        botResponseText = response.response;
      } else {
        // Error case
        botResponseText = `❌ ${response.error || 'Unable to process your request. Please try again.'}`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Speak the bot response if voice is enabled
      if (isVoiceEnabled && botResponseText) {
        const cleanText = voiceService.cleanTextForSpeech(botResponseText);
        await voiceService.queueSpeech(cleanText, currentVoiceId);
      }
      
      setIsLoading(false);
      
      // Update session ID if provided
      if (response.session_id !== sessionId) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('Chat API error:', error);
      // Fallback to local response if API fails
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ AI agents temporarily unavailable. Fallback response:\n\n${botResponse}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('insurance') || input.includes('should i get')) {
      return "Based on your flight details, I'd recommend considering insurance if:\n\n✈️ Your flight has multiple connections\n🌦️ You're traveling during storm season\n⏱️ Connection times are under 60 minutes\n📊 Historical delay rates are above 20%\n\nWould you like me to analyze a specific flight for you?";
    }
    
    if (input.includes('connection') || input.includes('layover')) {
      return "Connection time analysis is crucial! Here's what I consider:\n\n⏱️ Minimum recommended: 60+ minutes domestic, 90+ international\n🏃‍♂️ Terminal changes add 15-30 minutes\n📊 Average airport delay times\n🌦️ Weather patterns at connection hubs\n\nTell me your connection details and I'll assess the risk!";
    }
    
    if (input.includes('weather') || input.includes('storm') || input.includes('winter')) {
      return "Weather is a major risk factor! I analyze:\n\n❄️ Seasonal patterns (winter storms, summer thunderstorms)\n🌪️ Real-time weather forecasts\n📈 Historical weather delay data\n🛫 Airport-specific weather vulnerabilities\n\nWhich route and season are you concerned about?";
    }
    
    if (input.includes('cancel') || input.includes('delay')) {
      return "Flight disruptions depend on several factors:\n\n🛫 Airline reliability (varies by route)\n🌦️ Weather conditions\n✈️ Aircraft type and age\n🏢 Airport congestion\n📅 Day of week and time\n\nShare your flight details and I'll give you the real risk percentage!";
    }
    
    return "I can help you with:\n\n💰 Insurance recommendations\n📊 Flight risk analysis\n🔄 Connection assessments\n🌦️ Weather impact evaluation\n✈️ Alternative flight suggestions\n\nWhat specific question do you have about your travel plans?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      speechService.stopListening();
    } else {
      speechService.startListening();
    }
  };

  const handleVoiceInput = () => {
    if (!speechService.isSupported()) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    toggleVoiceInput();
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 rounded-lg shadow-2xl border flex flex-col z-50 overflow-hidden transition-all duration-300 ${
          isExpanded 
            ? 'w-[600px] h-[700px]' 
            : 'w-[420px] h-[500px]'
        } ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">
                  <TranslatedText text="Flight Risk Advisor" targetLanguage={currentLanguage} />
                </h3>
                <p className="text-xs text-blue-100">
                  <TranslatedText text="Online now" targetLanguage={currentLanguage} />
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Voice Toggle */}
              <button
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title={isVoiceEnabled ? "Disable Voice" : "Enable Voice"}
              >
                {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              {/* Voice Settings */}
              <button
                onClick={() => setShowVoiceSettings(true)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Voice Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-lg ${
                  isExpanded ? 'max-w-[480px]' : 'max-w-[280px]'
                } ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  {message.sender === 'bot' ? (
                    <FormattedFlightText text={message.text} />
                  ) : (
                    <div className="text-sm whitespace-pre-line">
                    <TranslatedText text={message.text} targetLanguage={currentLanguage} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading animation */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className={`p-3 rounded-lg ${
                  isExpanded ? 'max-w-[480px]' : 'max-w-[280px]'
                } ${
                  isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-800'
                }`}>
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            {/* Interim transcript display */}
            {interimTranscript && (
              <div className={`mb-2 p-2 rounded-lg text-sm italic ${
                isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                "{interimTranscript}"
              </div>
            )}
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about flight risks, insurance..."
                disabled={isLoading}
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'border-slate-300'
                }`}
              />
              
              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                disabled={isLoading || !speechService.isSupported()}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : isDarkMode
                    ? 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={speechService.isSupported() ? 'Voice Input' : 'Voice input not supported'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Settings Modal */}
      <VoiceSettings
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        onVoiceChange={setCurrentVoiceId}
        currentVoiceId={currentVoiceId}
        isVoiceEnabled={isVoiceEnabled}
        onVoiceToggle={setIsVoiceEnabled}
      />

      {/* Animated Airplane */}
      <AnimatedAirplane isPlaying={isVoicePlaying} />
    </>
  );
});

ChatBot.displayName = 'ChatBot';