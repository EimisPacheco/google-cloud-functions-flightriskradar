import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plane,
  Clock,
  Calendar,
  CreditCard,
  FileText,
  TrendingUp,
  Heart
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';

export const InsuranceGuidePage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string | null>(null);

  const insuranceTypes = [
    {
      id: 'trip-cancellation',
      icon: XCircle,
      title: 'Trip Cancellation Insurance',
      description: 'Protects against non-refundable trip costs if you need to cancel',
      coverage: [
        'Illness or injury preventing travel',
        'Death of family member',
        'Natural disasters',
        'Terrorist incidents',
        'Job loss or layoff'
      ],
      cost: '$50-200',
      whenToBuy: 'Within 14-21 days of booking',
      bestFor: 'Expensive trips, international travel, peak season'
    },
    {
      id: 'trip-interruption',
      icon: Clock,
      title: 'Trip Interruption Insurance',
      description: 'Covers additional costs if your trip is cut short',
      coverage: [
        'Emergency return home',
        'Additional transportation costs',
        'Accommodation expenses',
        'Lost prepaid activities',
        'Medical evacuation'
      ],
      cost: '$30-150',
      whenToBuy: 'At time of booking',
      bestFor: 'Long trips, international travel, remote destinations'
    },
    {
      id: 'medical',
      icon: Heart,
      title: 'Medical Insurance',
      description: 'Covers medical expenses while traveling',
      coverage: [
        'Emergency medical treatment',
        'Hospital stays',
        'Prescription medications',
        'Medical evacuation',
        'Dental emergencies'
      ],
      cost: '$20-100',
      whenToBuy: 'At time of booking',
      bestFor: 'International travel, remote destinations, pre-existing conditions'
    },
    {
      id: 'baggage',
      icon: FileText,
      title: 'Baggage Insurance',
      description: 'Protects against lost, damaged, or delayed luggage',
      coverage: [
        'Lost or stolen baggage',
        'Damaged items',
        'Delayed baggage expenses',
        'Essential item replacement',
        'Electronics protection'
      ],
      cost: '$10-50',
      whenToBuy: 'At time of booking',
      bestFor: 'Checked luggage, valuable items, long trips'
    },
    {
      id: 'flight-accident',
      icon: Plane,
      title: 'Flight Accident Insurance',
      description: 'Provides coverage in case of flight accidents',
      coverage: [
        'Accidental death benefits',
        'Dismemberment coverage',
        'Medical expenses',
        'Family assistance',
        'Legal expenses'
      ],
      cost: '$5-25',
      whenToBuy: 'At time of booking',
      bestFor: 'Frequent flyers, business travelers, peace of mind'
    }
  ];

  const whenToSkipInsurance = [
    {
      scenario: 'Domestic flights under $500',
      reason: 'Low financial risk, credit card may provide coverage',
      savings: '$50-100',
      icon: CheckCircle
    },
    {
      scenario: 'Flexible booking options',
      reason: 'Free cancellation policies reduce need for protection',
      savings: '$75-150',
      icon: CheckCircle
    },
    {
      scenario: 'Credit card already covers it',
      reason: 'Many premium cards include travel insurance',
      savings: '$100-200',
      icon: CheckCircle
    },
    {
      scenario: 'Very low-risk itinerary',
      reason: 'Direct flights, good weather, excellent airline',
      savings: '$50-150',
      icon: CheckCircle
    }
  ];

  const whenToBuyInsurance = [
    {
      scenario: 'International travel',
      reason: 'Medical costs can be extremely high abroad',
      cost: '$100-300',
      icon: AlertTriangle
    },
    {
      scenario: 'Expensive trips ($2000+)',
      reason: 'High financial risk if trip is cancelled',
      cost: '$150-400',
      icon: AlertTriangle
    },
    {
      scenario: 'Multiple connections',
      reason: 'Higher risk of delays and missed connections',
      cost: '$75-200',
      icon: AlertTriangle
    },
    {
      scenario: 'Peak travel season',
      reason: 'Higher cancellation rates and limited rebooking options',
      cost: '$100-250',
      icon: AlertTriangle
    },
    {
      scenario: 'Remote destinations',
      reason: 'Limited medical facilities and evacuation challenges',
      cost: '$150-350',
      icon: AlertTriangle
    }
  ];

  const insuranceTips = [
    {
      tip: 'Read the fine print',
      description: 'Understand exclusions, deductibles, and claim procedures',
      icon: FileText
    },
    {
      tip: 'Compare multiple providers',
      description: 'Different companies offer varying coverage and prices',
      icon: TrendingUp
    },
    {
      tip: 'Check your existing coverage',
      description: 'Credit cards, health insurance, and employer benefits may already cover you',
      icon: CreditCard
    },
    {
      tip: 'Buy early for better rates',
      description: 'Insurance purchased closer to departure is often more expensive',
      icon: Calendar
    },
    {
      tip: 'Consider your risk tolerance',
      description: 'Balance cost vs. peace of mind based on your financial situation',
      icon: Shield
    },
    {
      tip: 'Document everything',
      description: 'Keep receipts, photos, and records for potential claims',
      icon: FileText
    }
  ];

  const commonMistakes = [
    {
      mistake: 'Buying too much coverage',
      impact: 'Wasting money on unnecessary protection',
      solution: 'Assess your actual risk level and needs'
    },
    {
      mistake: 'Not reading exclusions',
      impact: 'Claims denied due to uncovered circumstances',
      solution: 'Carefully review policy terms and conditions'
    },
    {
      mistake: 'Waiting too long to buy',
      impact: 'Higher premiums or coverage unavailable',
      solution: 'Purchase within recommended timeframe'
    },
    {
      mistake: 'Assuming credit card covers everything',
      impact: 'Gaps in coverage when you need it most',
      solution: 'Verify exact coverage limits and terms'
    },
    {
      mistake: 'Not comparing policies',
      impact: 'Overpaying for inferior coverage',
      solution: 'Shop around and compare multiple options'
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
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="Travel Insurance Guide" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Make informed decisions about travel insurance. Learn when to buy, when to skip, and how to get the best coverage for your trip." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Insurance Types Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Types of Travel Insurance" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Understanding the different types of coverage available" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceTypes.map((insurance) => (
              <div
                key={insurance.id}
                className={`p-6 rounded-xl border shadow-md transition-all cursor-pointer ${
                  selectedInsuranceType === insurance.id
                    ? isDarkMode 
                      ? 'bg-green-900/20 border-green-600 shadow-lg shadow-green-900/20' 
                      : 'bg-green-50 border-green-300 shadow-lg'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedInsuranceType(selectedInsuranceType === insurance.id ? null : insurance.id)}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                    <insurance.icon className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {insurance.title}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {insurance.cost}
                    </span>
                  </div>
                </div>
                
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {insurance.description}
                </p>

                {selectedInsuranceType === insurance.id && (
                  <div className="space-y-3">
                    <div>
                      <h4 className={`font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Coverage:" targetLanguage={currentLanguage} />
                      </h4>
                      <ul className="space-y-1">
                        {insurance.coverage.map((item, index) => (
                          <li key={index} className={`text-sm flex items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <TranslatedText text="When to Buy:" targetLanguage={currentLanguage} />
                        </span>
                        <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                          {insurance.whenToBuy}
                        </p>
                      </div>
                      <div>
                        <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          <TranslatedText text="Best For:" targetLanguage={currentLanguage} />
                        </span>
                        <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                          {insurance.bestFor}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to Skip vs When to Buy */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* When to Skip */}
            <div>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                    <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="When to Skip Insurance" targetLanguage={currentLanguage} />
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <TranslatedText text="Save money when insurance isn't necessary" targetLanguage={currentLanguage} />
                </p>
              </div>

              <div className="space-y-4">
                {whenToSkipInsurance.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border shadow-md ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <item.icon className={`w-5 h-5 mt-0.5 mr-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {item.scenario}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.reason}
                        </p>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          <TranslatedText text="Save:" targetLanguage={currentLanguage} /> {item.savings}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When to Buy */}
            <div>
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-2 rounded-full ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                    <AlertTriangle className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="When to Buy Insurance" targetLanguage={currentLanguage} />
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <TranslatedText text="Protect yourself when risks are high" targetLanguage={currentLanguage} />
                </p>
              </div>

              <div className="space-y-4">
                {whenToBuyInsurance.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border shadow-md ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <item.icon className={`w-5 h-5 mt-0.5 mr-3 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {item.scenario}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {item.reason}
                        </p>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                          <TranslatedText text="Cost:" targetLanguage={currentLanguage} /> {item.cost}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance Tips */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Insurance Tips & Best Practices" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Smart strategies for getting the best coverage at the right price" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insuranceTips.map((tip, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <tip.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {tip.tip}
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Common Insurance Mistakes" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Avoid these common pitfalls when purchasing travel insurance" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid gap-4">
            {commonMistakes.map((mistake, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {mistake.mistake}
                    </h3>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="font-bold">
                        <TranslatedText text="Impact:" targetLanguage={currentLanguage} />
                      </span> {mistake.impact}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className="font-bold">
                        <TranslatedText text="Solution:" targetLanguage={currentLanguage} />
                      </span> {mistake.solution}
                    </p>
                  </div>
                  <XCircle className={`w-6 h-6 ml-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
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
            <TranslatedText text="Get Personalized Insurance Advice" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText 
              text="Use our AI-powered risk analysis to get personalized insurance recommendations for your specific trip." 
              targetLanguage={currentLanguage} 
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <TranslatedText text="Analyze My Trip" targetLanguage={currentLanguage} />
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              <TranslatedText text="Compare Insurance" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}; 