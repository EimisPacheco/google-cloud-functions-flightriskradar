import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, AlertTriangle, XCircle, DollarSign, Brain, Target, Search, Plane } from 'lucide-react';
import { FlightSearch } from '../components/features/FlightSearch';
import { DirectFlightLookup } from '../components/features/DirectFlightLookup';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';

interface HomePageProps {
  onOpenChat: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenChat }) => {
  const [searchMode, setSearchMode] = useState<'route' | 'direct'>('route');
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const features = [
    {
      icon: Brain,
      title: 'Stop the Upsell',
      description: 'Get unbiased, data-driven answers to "Do I really need this insurance?" based on your actual flight risk, not sales tactics'
    },
    {
      icon: Target,
      title: 'Personalized Analysis',
      description: 'Every flight is different. We analyze your specific route, timing, connections, and season to give you tailored advice'
    },
    {
      icon: DollarSign,
      title: 'Save Money Smartly',
      description: 'Know when to skip unnecessary insurance and when it\'s actually worth the investment for high-risk itineraries'
    }
  ];

  const exampleQuestions = [
    "Do I really need this travel insurance? Or are they just trying to upsell me?",
    "Should I get insurance for my layover in Chicago in December?",
    "Which flight has the lowest cancellation risk?",
    "Is a 45-minute connection in Atlanta too risky?",
    "What's the weather delay risk for Denver this season?"
  ];

  const riskLevels = [
    {
      level: 'Low Risk',
      icon: CheckCircle,
      color: isDarkMode ? 'text-green-400 bg-green-900/20 border-green-700' : 'text-green-600 bg-green-50 border-green-200',
      description: 'Direct flights, good weather, excellent airline performance',
      advice: 'Save your money - insurance not needed',
      percentage: '< 5% chance of issues'
    },
    {
      level: 'Medium Risk',
      icon: AlertTriangle,
      color: isDarkMode ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700' : 'text-yellow-600 bg-yellow-50 border-yellow-200',
      description: 'Tight connections, seasonal weather concerns, average delays',
      advice: 'Consider insurance for peace of mind',
      percentage: '5-20% chance of issues'
    },
    {
      level: 'High Risk',
      icon: XCircle,
      color: isDarkMode ? 'text-red-400 bg-red-900/20 border-red-700' : 'text-red-600 bg-red-50 border-red-200',
      description: 'Multiple stops, winter storms, poor airline track record',
      advice: 'Insurance strongly recommended',
      percentage: '> 20% chance of issues'
    }
  ];

  const insuranceScenarios = [
    {
      scenario: 'Direct Flight, Good Weather',
      risk: 'Low',
      recommendation: 'Skip Insurance',
      reasoning: 'Save $50-150. Your risk is minimal.',
      color: isDarkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
    },
    {
      scenario: 'Tight Connection, Storm Season',
      risk: 'High',
      recommendation: 'Get Insurance',
      reasoning: 'Worth $75-200 to protect $2,000+ trip.',
      color: isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
    },
    {
      scenario: 'International, Multiple Stops',
      risk: 'Medium-High',
      recommendation: 'Consider Premium Coverage',
      reasoning: 'Look beyond basic trip insurance.',
      color: isDarkMode ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-50 border-orange-200'
    }
  ];

  const flightRiskInsights = [
    {
      image: 'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
      title: 'Flight risk assessment',
      description: 'Understand your flight risk with precise data analysis.'
    },
    {
      image: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
      title: 'Insurance recommendation',
      description: 'Get tailored insurance advice based on your travel needs.'
    },
    {
      image: 'https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&fit=crop',
      title: 'Claims assistance',
      description: 'Receive expert help navigating your insurance claims process.'
    }
  ];

  const testimonials = [
    {
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Brandon Vega',
      affiliation: 'Globetrotter Inc.',
      text: 'Using FlightRiskRadar completely transformed how I approach travel insurance. I was always uncertain whether to purchase it or not, but their data-driven insights gave me clarity. Now, I know exactly when it\'s worth investing in coverage and when I can skip it. It\'s a game-changer for anyone who travels frequently. I can finally focus on enjoying my trips without worrying about unnecessary expenses.'
    },
    {
      image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Chris Wei',
      affiliation: 'TechSolutions LLC',
      text: 'I was overwhelmed by the options for travel insurance, and the upselling tactics made it even more confusing. Thankfully, I discovered FlightRiskRadar, and their straightforward analysis of my flight risk made all the difference. I now feel empowered to make informed decisions about my travel plans. Their unbiased approach is refreshing and truly helpful for travelers like me.'
    },
    {
      image: 'https://images.pexels.com/photos/2379006/pexels-photo-2379006.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Karen Weiss',
      affiliation: 'Marketing Innovations',
      text: 'As someone who rarely travels, I always struggled to understand if travel insurance was necessary. FlightRiskRadar provided me with the insights I needed to decide wisely. Their straightforward and user-friendly platform helped me evaluate my flight risks without any pressuring sales tactics. I\'m grateful for the peace of mind it brings me during my travels. It\'s a must-try for anyone unsure about travel insurance.'
    },
    {
      image: 'https://images.pexels.com/photos/2379007/pexels-photo-2379007.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Sarah Johnson',
      affiliation: 'Digital Nomad',
      text: 'As a frequent traveler, I was spending hundreds on unnecessary insurance. FlightRiskRadar showed me exactly when I needed coverage and when I could skip it. Their analysis is spot-on and has saved me over $500 this year alone. The peace of mind is priceless!'
    },
    {
      image: 'https://images.pexels.com/photos/2379008/pexels-photo-2379008.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Michael Chen',
      affiliation: 'Business Consultant',
      text: 'The AI-powered risk assessment is incredible. It considers weather, airline performance, and seasonal factors I never thought about. Now I make informed decisions instead of guessing. This tool should be mandatory for all travelers!'
    },
    {
      image: 'https://images.pexels.com/photos/2379009/pexels-photo-2379009.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Emma Rodriguez',
      affiliation: 'Travel Blogger',
      text: 'I was skeptical at first, but FlightRiskRadar\'s predictions have been incredibly accurate. It warned me about a high-risk connection that ended up being delayed. Thanks to their advice, I had the right insurance and was fully covered. Game changer!'
    },
    {
      image: 'https://images.pexels.com/photos/2379010/pexels-photo-2379010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'David Thompson',
      affiliation: 'Adventure Traveler',
      text: 'Finally, a tool that tells me the truth about travel insurance instead of trying to sell me something! The risk analysis is comprehensive and the recommendations are spot-on. I\'ve recommended it to all my travel buddies.'
    },
    {
      image: 'https://images.pexels.com/photos/2379011/pexels-photo-2379011.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop&crop=face',
      name: 'Lisa Park',
      affiliation: 'Corporate Travel Manager',
      text: 'Managing travel for our company was a nightmare until we found FlightRiskRadar. The bulk analysis feature helps us make smart insurance decisions for all our employees. It\'s saved us thousands in unnecessary premiums.'
    }
  ];

  // Simple testimonials display - no complex carousel logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialsPerView = 3;
  const maxIndex = Math.max(0, testimonials.length - testimonialsPerView);

  // Auto-scroll effect
  useEffect(() => {
    if (testimonials.length <= testimonialsPerView) return; // Don't auto-scroll if all testimonials fit
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        return nextIndex > maxIndex ? 0 : nextIndex;
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [maxIndex, testimonials.length]);

  // Debug logging
  console.log('🔍 Simple Testimonials Debug:', {
    testimonialsLength: testimonials.length,
    currentIndex,
    maxIndex,
    testimonialsPerView,
    visibleTestimonials: testimonials.slice(currentIndex, currentIndex + testimonialsPerView).map(t => t.name)
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Hero Section */}
      <div className={`relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-24 h-24 bg-white/10 rounded-2xl backdrop-blur-sm">
                <img 
                  src="/FlightRiskRadarApp.png" 
                  alt="FlightRiskRadar" 
                  className="w-18 h-18 object-contain"
                />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="FlightRiskRadar" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText text="Skip the stress. Scan your flight risk." targetLanguage={currentLanguage} />
            </p>
            <p className="text-2xl md:text-3xl font-semibold text-yellow-300 mb-8 max-w-4xl mx-auto">
              <TranslatedText text='"Do I really need this travel insurance? Or are they just trying to upsell me?"' targetLanguage={currentLanguage} />
            </p>
            <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto">
              <TranslatedText 
                text="Stop guessing about travel insurance. Get unbiased, data-driven answers based on your actual flight risk — not sales tactics. We'll tell you when to save your money and when insurance is actually worth it." 
                targetLanguage={currentLanguage} 
              />
            </p>
            
            {/* Chrome Extension CTA */}
            <div className="mb-12 max-w-2xl mx-auto">
              <div className={`inline-flex items-center space-x-3 px-6 py-4 rounded-xl backdrop-blur-sm border ${
                isDarkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white/20 border-white/30 text-white'
              }`}>
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-400 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-300 mb-1">
                    <TranslatedText text="NEW: Chrome Extension Available!" targetLanguage={currentLanguage} />
                  </p>
                  <p className="text-sm text-blue-100">
                    <TranslatedText text="Get instant flight risk analysis while browsing Google Flights" targetLanguage={currentLanguage} />
                  </p>
                </div>
                <a 
                  href="https://chrome.google.com/webstore/detail/flightriskradar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isDarkMode 
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' 
                      : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  <span>
                    <TranslatedText text="Install Extension" targetLanguage={currentLanguage} />
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Search Mode Toggle */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setSearchMode('route')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  searchMode === 'route'
                    ? isDarkMode 
                      ? 'bg-slate-800 text-blue-400 shadow-lg border border-slate-600' 
                      : 'bg-white text-blue-600 shadow-lg'
                    : isDarkMode 
                      ? 'bg-slate-700/50 text-slate-200 hover:bg-slate-700 border border-slate-600' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>
                  <TranslatedText text="Search by Route" targetLanguage={currentLanguage} />
                </span>
              </button>
              <button
                onClick={() => setSearchMode('direct')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  searchMode === 'direct'
                    ? isDarkMode 
                      ? 'bg-slate-800 text-blue-400 shadow-lg border border-slate-600' 
                      : 'bg-white text-blue-600 shadow-lg'
                    : isDarkMode 
                      ? 'bg-slate-700/50 text-slate-200 hover:bg-slate-700 border border-slate-600' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Plane className="w-5 h-5" />
                <span>
                  <TranslatedText text="Lookup Specific Flight" targetLanguage={currentLanguage} />
                </span>
              </button>
            </div>
          </div>

          {/* Search Forms */}
          <div className="max-w-4xl mx-auto">
            {searchMode === 'route' ? <FlightSearch /> : <DirectFlightLookup />}
          </div>
        </div>
      </div>

      {/* Insurance Decision Helper */}
      <section className={`py-16 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="How We Help You Decide on Insurance" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-3xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Every trip is different. We analyze your specific flight details to give you honest, personalized advice — not generic upselling." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {insuranceScenarios.map((scenario, index) => (
              <div key={index} className={`p-6 rounded-xl border-2 shadow-md ${scenario.color}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <TranslatedText text={scenario.scenario} targetLanguage={currentLanguage} />
                </h3>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text="Risk Level:" targetLanguage={currentLanguage} />
                  </span>
                  <span className={`font-bold ${
                    scenario.risk === 'Low' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : 
                    scenario.risk === 'High' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : 
                    (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                  }`}>
                    <TranslatedText text={scenario.risk} targetLanguage={currentLanguage} />
                  </span>
                </div>
                <div className="mb-3">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text="Our Advice:" targetLanguage={currentLanguage} />
                  </span>
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text={scenario.recommendation} targetLanguage={currentLanguage} />
                  </p>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TranslatedText text={scenario.reasoning} targetLanguage={currentLanguage} />
                </p>
              </div>
            ))}
          </div>

          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-lg p-8 border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <h3 className={`text-2xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="We Analyze Real Data, Not Fear" targetLanguage={currentLanguage} />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="✅ What We DO" targetLanguage={currentLanguage} />
                </h4>
                <ul className={`space-y-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span>
                      <TranslatedText text="Calculate actual risk percentages for your specific route" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span>
                      <TranslatedText text="Analyze historical weather patterns and airport performance" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span>
                      <TranslatedText text="Consider your connection times and seasonal factors" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <span>
                      <TranslatedText text="Tell you when to save money and skip unnecessary coverage" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="❌ What We DON'T Do" targetLanguage={currentLanguage} />
                </h4>
                <ul className={`space-y-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <li className="flex items-start space-x-3">
                    <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span>
                      <TranslatedText text="Use scare tactics or worst-case scenarios" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span>
                      <TranslatedText text="Recommend insurance for every single trip" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span>
                      <TranslatedText text="Sell insurance or get commissions from providers" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                    <span>
                      <TranslatedText text="Give generic advice that applies to everyone" targetLanguage={currentLanguage} />
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Level Guide */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="How We Assess Flight Risk" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Every flight gets a comprehensive risk score based on real data, not fear-mongering" targetLanguage={currentLanguage} />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {riskLevels.map((risk, index) => (
              <div key={index} className={`p-6 rounded-xl border-2 shadow-md ${risk.color}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <risk.icon className="w-8 h-8" />
                  <h3 className="text-xl font-semibold">
                    <TranslatedText text={risk.level} targetLanguage={currentLanguage} />
                  </h3>
                </div>
                <p className="text-lg font-bold mb-2">
                  <TranslatedText text={risk.percentage} targetLanguage={currentLanguage} />
                </p>
                <p className="text-sm mb-4 opacity-80">
                  <TranslatedText text={risk.description} targetLanguage={currentLanguage} />
                </p>
                <p className="font-medium">
                  <TranslatedText text={risk.advice} targetLanguage={currentLanguage} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Smart Travel Decisions, Powered by Data" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Stop falling for insurance upsells. Get personalized recommendations based on your actual flight risk." targetLanguage={currentLanguage} />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`${isDarkMode ? 'bg-slate-700' : 'bg-white'} p-8 rounded-xl shadow-md border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'} hover:shadow-lg transition-shadow`}>
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl mb-6 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <feature.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <TranslatedText text={feature.title} targetLanguage={currentLanguage} />
                </h3>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                  <TranslatedText text={feature.description} targetLanguage={currentLanguage} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Flight Risk Insights */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Flight Risk Insights" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Gain a deeper understanding of your flight risk with our comprehensive data and analysis." targetLanguage={currentLanguage} />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {flightRiskInsights.map((insight, index) => (
              <div key={index} className={`p-8 rounded-xl shadow-lg border ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                <img src={insight.image} alt={insight.title} className="w-full h-40 object-cover rounded-lg mb-6" />
                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  <TranslatedText text={insight.title} targetLanguage={currentLanguage} />
                </h3>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                  <TranslatedText text={insight.description} targetLanguage={currentLanguage} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Our Users Say */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="What Our Users Say" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Hear from real travelers who have used FlightRiskRadar to make informed decisions about their travel insurance." targetLanguage={currentLanguage} />
            </p>
          </div>

          {/* Simple Testimonials Display */}
          <div className="relative overflow-hidden">
            {/* Testimonials Container */}
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * 33.333}%)`
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div key={index} className="w-1/3 px-4 flex-shrink-0">
                  <div className={`p-8 rounded-2xl backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-blue-500/10 border-blue-400/30 shadow-2xl shadow-blue-500/20' 
                      : 'bg-blue-100/80 border-blue-200/50 shadow-2xl shadow-blue-500/10'
                  }`}>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                        isDarkMode ? 'border-white/30' : 'border-slate-200'
                      }`}>
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          <TranslatedText text={testimonial.name} targetLanguage={currentLanguage} />
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                          <TranslatedText text={testimonial.affiliation} targetLanguage={currentLanguage} />
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg italic leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      <TranslatedText text={testimonial.text} targetLanguage={currentLanguage} />
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: Math.ceil(testimonials.length / 3) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * 3)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    Math.floor(currentIndex / 3) === index
                      ? isDarkMode ? 'bg-white' : 'bg-slate-900'
                      : isDarkMode ? 'bg-white/30' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Chatbot Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Ask Our AI Anything About Flight Risks" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Get instant, honest answers to your travel concerns with our intelligent chatbot." targetLanguage={currentLanguage} />
            </p>
          </div>

          {/* Example Questions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {exampleQuestions.map((question, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border-slate-600 hover:bg-slate-700' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 shadow-lg'
                }`}
                onClick={() => onOpenChat()}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <p className={`text-left ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    <TranslatedText text={question} targetLanguage={currentLanguage} />
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className={`text-lg mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Ready to get personalized advice?" targetLanguage={currentLanguage} />
            </p>
            <button 
              onClick={onOpenChat}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              <span>
                <TranslatedText text="Start Chatting" targetLanguage={currentLanguage} />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <TranslatedText text="Stop Wasting Money on Unnecessary Insurance" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText text="Make data-driven decisions about your travel plans. Know your real risks before you fly." targetLanguage={currentLanguage} />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <TranslatedText text="Search Flights Now" targetLanguage={currentLanguage} />
            </button>
            <button 
              onClick={() => window.location.href = '/about'}
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              <TranslatedText text="Learn More" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};