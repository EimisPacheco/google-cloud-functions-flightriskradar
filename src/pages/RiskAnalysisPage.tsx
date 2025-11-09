import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Cloud, 
  Wind, 
  Clock, 
  Plane, 
  MapPin, 
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Thermometer,
  Eye
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';

export const RiskAnalysisPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedRiskFactor, setSelectedRiskFactor] = useState<string | null>(null);

  const riskFactors = [
    {
      id: 'weather',
      icon: Cloud,
      title: 'Weather Conditions',
      description: 'Real-time and seasonal weather patterns affecting flight safety',
      factors: [
        'Thunderstorms and lightning',
        'Winter storms and snow',
        'Fog and reduced visibility',
        'High winds and turbulence',
        'Hurricanes and tropical storms'
      ],
      impact: 'High',
      mitigation: 'Monitor weather forecasts, consider flexible booking options'
    },
    {
      id: 'connections',
      icon: Clock,
      title: 'Connection Times',
      description: 'Layover duration and airport complexity affecting connection success',
      factors: [
        'Minimum connection time (MCT) requirements',
        'Airport size and terminal distance',
        'Customs and security processing',
        'Baggage transfer procedures',
        'Gate changes and delays'
      ],
      impact: 'Medium-High',
      mitigation: 'Allow extra time for connections, choose longer layovers'
    },
    {
      id: 'airline',
      icon: Plane,
      title: 'Airline Performance',
      description: 'Historical on-time performance and operational reliability',
      factors: [
        'On-time departure and arrival rates',
        'Cancellation frequency',
        'Aircraft maintenance records',
        'Pilot and crew availability',
        'Operational efficiency metrics'
      ],
      impact: 'Medium',
      mitigation: 'Research airline performance, consider alternative carriers'
    },
    {
      id: 'airport',
      icon: MapPin,
      title: 'Airport Complexity',
      description: 'Airport infrastructure and operational challenges',
      factors: [
        'Runway configuration and capacity',
        'Air traffic control efficiency',
        'Ground operations and de-icing',
        'Terminal congestion and delays',
        'Seasonal operational restrictions'
      ],
      impact: 'Medium',
      mitigation: 'Choose less congested airports when possible'
    },
    {
      id: 'seasonal',
      icon: Calendar,
      title: 'Seasonal Patterns',
      description: 'Time-based factors affecting flight reliability',
      factors: [
        'Holiday travel congestion',
        'Weather seasonality',
        'Peak travel periods',
        'Maintenance scheduling',
        'Staff availability patterns'
      ],
      impact: 'Medium',
      mitigation: 'Avoid peak travel times, book during off-peak seasons'
    }
  ];

  const riskLevels = [
    {
      level: 'Very Low Risk',
      icon: CheckCircle,
      color: isDarkMode ? 'text-green-400 bg-green-900/20 border-green-700' : 'text-green-600 bg-green-50 border-green-200',
      description: 'Direct flights with excellent conditions',
      probability: '< 2%',
      recommendation: 'No insurance needed'
    },
    {
      level: 'Low Risk',
      icon: CheckCircle,
      color: isDarkMode ? 'text-green-400 bg-green-900/20 border-green-700' : 'text-green-600 bg-green-50 border-green-200',
      description: 'Good conditions with minor concerns',
      probability: '2-5%',
      recommendation: 'Basic coverage optional'
    },
    {
      level: 'Medium Risk',
      icon: AlertTriangle,
      color: isDarkMode ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700' : 'text-yellow-600 bg-yellow-50 border-yellow-200',
      description: 'Some risk factors present',
      probability: '5-15%',
      recommendation: 'Consider standard insurance'
    },
    {
      level: 'High Risk',
      icon: XCircle,
      color: isDarkMode ? 'text-red-400 bg-red-900/20 border-red-700' : 'text-red-600 bg-red-50 border-red-200',
      description: 'Multiple risk factors combined',
      probability: '15-30%',
      recommendation: 'Comprehensive insurance recommended'
    },
    {
      level: 'Very High Risk',
      icon: XCircle,
      color: isDarkMode ? 'text-red-400 bg-red-900/20 border-red-700' : 'text-red-600 bg-red-50 border-red-200',
      description: 'Extreme conditions or multiple high-risk factors',
      probability: '> 30%',
      recommendation: 'Insurance strongly advised, consider alternatives'
    }
  ];

  const weatherRiskTypes = [
    {
      type: 'Thunderstorms',
      icon: Cloud,
      risk: 'High',
      impact: 'Delays, cancellations, turbulence',
      season: 'Spring/Summer',
      regions: 'Southeast, Midwest, Great Plains'
    },
    {
      type: 'Winter Storms',
      icon: Thermometer,
      risk: 'High',
      impact: 'Ground stops, de-icing delays',
      season: 'Winter',
      regions: 'Northeast, Midwest, Mountain states'
    },
    {
      type: 'Fog',
      icon: Eye,
      risk: 'Medium',
      impact: 'Reduced visibility, delays',
      season: 'Fall/Winter',
      regions: 'Coastal areas, valleys'
    },
    {
      type: 'High Winds',
      icon: Wind,
      risk: 'Medium-High',
      impact: 'Turbulence, landing difficulties',
      season: 'Year-round',
      regions: 'Mountain passes, coastal areas'
    },
    {
      type: 'Hurricanes',
      icon: Wind,
      risk: 'Very High',
      impact: 'Mass cancellations, airport closures',
      season: 'Summer/Fall',
      regions: 'Gulf Coast, East Coast'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="Flight Risk Analysis" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Understand the factors that affect your flight's reliability and learn how to assess and mitigate travel risks." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Risk Factors Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Key Risk Factors" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="These factors are analyzed to determine your flight's risk level" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riskFactors.map((factor) => (
              <div
                key={factor.id}
                className={`p-6 rounded-xl border shadow-md transition-all cursor-pointer ${
                  selectedRiskFactor === factor.id
                    ? isDarkMode 
                      ? 'bg-blue-900/20 border-blue-600 shadow-lg shadow-blue-900/20' 
                      : 'bg-blue-50 border-blue-300 shadow-lg'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedRiskFactor(selectedRiskFactor === factor.id ? null : factor.id)}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <factor.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {factor.title}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      factor.impact === 'High' 
                        ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                        : factor.impact === 'Medium-High'
                        ? isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-600'
                        : isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {factor.impact} Impact
                    </span>
                  </div>
                </div>
                
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {factor.description}
                </p>

                {selectedRiskFactor === factor.id && (
                  <div className="space-y-3">
                    <div>
                      <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Specific Factors:" targetLanguage={currentLanguage} />
                      </h4>
                      <ul className="space-y-1">
                        {factor.factors.map((item, index) => (
                          <li key={index} className={`text-sm flex items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <div className="w-1 h-1 rounded-full bg-blue-500 mr-2"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Mitigation:" targetLanguage={currentLanguage} />
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {factor.mitigation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Levels Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Risk Level Classification" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Understanding how we categorize and assess flight risks" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid gap-4">
            {riskLevels.map((level, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border ${level.color} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <level.icon className="w-6 h-6 mr-3" />
                    <div>
                      <h3 className="font-semibold">{level.level}</h3>
                      <p className="text-sm opacity-80">{level.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{level.probability}</div>
                    <div className="text-sm opacity-80">{level.recommendation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weather Risk Types */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Weather Risk Types" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Different weather conditions and their impact on flight operations" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weatherRiskTypes.map((weather, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${
                    weather.risk === 'High' || weather.risk === 'Very High'
                      ? isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                      : isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                  }`}>
                    <weather.icon className={`w-6 h-6 ${
                      weather.risk === 'High' || weather.risk === 'Very High'
                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                        : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {weather.type}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      weather.risk === 'High' || weather.risk === 'Very High'
                        ? isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                        : isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {weather.risk} Risk
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <TranslatedText text="Impact:" targetLanguage={currentLanguage} />
                    </span>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {weather.impact}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <TranslatedText text="Season:" targetLanguage={currentLanguage} />
                    </span>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {weather.season}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <TranslatedText text="Regions:" targetLanguage={currentLanguage} />
                    </span>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {weather.regions}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <TranslatedText text="Ready to Analyze Your Flight?" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText 
              text="Get a comprehensive risk assessment for your specific flight using our AI-powered analysis system." 
              targetLanguage={currentLanguage} 
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <TranslatedText text="Analyze My Flight" targetLanguage={currentLanguage} />
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              <TranslatedText text="Learn More" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}; 