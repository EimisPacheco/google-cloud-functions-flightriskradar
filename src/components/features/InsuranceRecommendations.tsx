import React, { useState } from 'react';
import { Shield, DollarSign, Check } from 'lucide-react';
import { Flight } from '../../context/FlightContext';
import { InsuranceQuoteModal } from './InsuranceQuoteModal';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

interface InsuranceOption {
  id: string;
  provider: string;
  planName: string;
  price: number;
  rating: number;
  coverage: {
    tripCancellation: number;
    tripInterruption: number;
    baggage: number;
    medical: number;
    flightDelay: number;
  };
  highlights: string[];
  bestFor: string;
  color: string;
}

interface InsuranceRecommendationsProps {
  flight: Flight;
}

export const InsuranceRecommendations: React.FC<InsuranceRecommendationsProps> = ({ flight }) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceOption | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const getInsuranceOptions = (flight: Flight): InsuranceOption[] => {
    const basePrice = Math.round(flight.price * 0.06); // ~6% of trip cost
    const riskMultiplier = flight.riskLevel === 'high' ? 1.3 : flight.riskLevel === 'medium' ? 1.1 : 0.9;
    
    return [
      {
        id: '1',
        provider: 'Allianz Travel',
        planName: 'OneTrip Prime',
        price: Math.round(basePrice * riskMultiplier * 1.2),
        rating: 4.5,
        coverage: {
          tripCancellation: flight.price * 1.5,
          tripInterruption: flight.price * 2,
          baggage: 2500,
          medical: 50000,
          flightDelay: 800
        },
        highlights: [
          'Cancel for Any Reason (75% refund)',
          '24/7 Emergency Assistance',
          'Pre-existing Medical Coverage',
          'Rental Car Coverage'
        ],
        bestFor: 'Comprehensive Protection',
        color: 'border-blue-200 bg-blue-50'
      },
      {
        id: '2',
        provider: 'World Nomads',
        planName: 'Standard Plan',
        price: Math.round(basePrice * riskMultiplier),
        rating: 4.3,
        coverage: {
          tripCancellation: flight.price,
          tripInterruption: flight.price * 1.5,
          baggage: 1500,
          medical: 100000,
          flightDelay: 500
        },
        highlights: [
          'Strong Medical Coverage',
          'Adventure Sports Covered',
          'Flexible Trip Changes',
          'Good Value for Money'
        ],
        bestFor: 'Medical & Adventure Coverage',
        color: 'border-green-200 bg-green-50'
      },
      {
        id: '3',
        provider: 'Travelex',
        planName: 'Travel Basic',
        price: Math.round(basePrice * riskMultiplier * 0.8),
        rating: 4.1,
        coverage: {
          tripCancellation: flight.price * 0.8,
          tripInterruption: flight.price,
          baggage: 1000,
          medical: 25000,
          flightDelay: 300
        },
        highlights: [
          'Budget-Friendly Option',
          'Essential Coverage',
          'Quick Claims Process',
          'No Medical Exam Required'
        ],
        bestFor: 'Basic Protection',
        color: 'border-purple-200 bg-purple-50'
      }
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  const handleGetQuote = (option: InsuranceOption) => {
    setSelectedInsurance(option);
    setIsQuoteModalOpen(true);
  };

  const insuranceOptions = getInsuranceOptions(flight);

  return (
    <>
      <div className={`space-y-6 p-8 rounded-xl border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-slate-900/20' 
          : 'bg-white border-slate-200 shadow-lg'
      }`}>
        <div className="flex items-center space-x-4 mb-6">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Recommended Insurance Options" targetLanguage={currentLanguage} />
            </h3>
            <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText text="Based on your flight's risk profile" targetLanguage={currentLanguage} />
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {insuranceOptions.map((option, index) => (
            <div key={option.id} className={`relative p-6 rounded-lg border hover:shadow-lg transition-shadow ${
              isDarkMode 
                ? index === 0 
                  ? 'bg-blue-900/20 border-blue-700' 
                  : index === 1 
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-purple-900/20 border-purple-700'
                : index === 0
                  ? 'bg-blue-50 border-blue-200'
                  : index === 1
                    ? 'bg-green-50 border-green-200'
                    : 'bg-purple-50 border-purple-200'
            }`}>
              {index === 0 && (
                <div className="absolute -top-3 left-6 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                  <TranslatedText text="RECOMMENDED" targetLanguage={currentLanguage} />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{option.provider}</h4>
                  <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{option.planName}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex">{renderStars(option.rating)}</div>
                    <span className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>({option.rating})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.price)}</div>
                  <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text="per person" targetLanguage={currentLanguage} />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Trip Cancellation:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.coverage.tripCancellation)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Trip Interruption:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.coverage.tripInterruption)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Baggage Loss:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.coverage.baggage)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Medical Emergency:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.coverage.medical)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Flight Delay:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatCurrency(option.coverage.flightDelay)}</span>
                  </div>
                  <div className="text-base">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                      <TranslatedText text="Best for:" targetLanguage={currentLanguage} />
                    </span>
                    <span className={`font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <TranslatedText text={option.bestFor} targetLanguage={currentLanguage} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h5 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="Key Features:" targetLanguage={currentLanguage} />
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  {option.highlights.map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className={`flex items-center text-base ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <Check className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                      <TranslatedText text={highlight} targetLanguage={currentLanguage} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-base">
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                    <TranslatedText text="Coverage:" targetLanguage={currentLanguage} />
                  </span>
                  <span className={`font-semibold ml-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatCurrency(option.coverage.tripCancellation + option.coverage.tripInterruption + option.coverage.baggage + option.coverage.medical + option.coverage.flightDelay)}+ total
                  </span>
                </div>
                <button
                  onClick={() => handleGetQuote(option)}
                  className={`px-6 py-3 rounded-lg text-base font-semibold transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <TranslatedText text="Get Quote" targetLanguage={currentLanguage} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <TranslatedText 
            text="Prices are estimates. Final rates may vary based on age, trip details, and coverage options. We don't sell insurance or receive commissions - these are independent recommendations." 
            targetLanguage={currentLanguage} 
          />
        </p>
      </div>

      {/* Quote Modal */}
      {selectedInsurance && (
        <InsuranceQuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setSelectedInsurance(null);
          }}
          flight={flight}
          selectedInsurance={selectedInsurance}
        />
      )}
    </>
  );
};