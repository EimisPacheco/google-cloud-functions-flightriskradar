import React, { useState } from 'react';
import { ArrowLeft, Filter, SortDesc, Loader, Plane, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFlightContext, Flight } from '../context/FlightContext';
import { FlightCard } from '../components/features/FlightCard';
import { RiskInsights } from '../components/features/RiskInsights';
import { InsuranceRecommendations } from '../components/features/InsuranceRecommendations';
import { useDarkMode } from '../context/DarkModeContext';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';

export const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { searchParams, directFlightParams, flights, isLoading, searchType, selectFlight, error, clearError } = useFlightContext();
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [sortBy, setSortBy] = useState<'risk' | 'price' | 'duration'>('price');
  const [filterBy, setFilterBy] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);

  const handleFlightSelect = (flight: Flight) => {
    selectFlight(flight);
    // Toggle the expanded state
    if (expandedFlightId === flight.id) {
      setExpandedFlightId(null);
    } else {
      setExpandedFlightId(flight.id);
    }
  };

  const sortedAndFilteredFlights = flights
    .filter(flight => filterBy === 'all' || flight.riskLevel === filterBy)
    .sort((a, b) => {
      switch (sortBy) {
        case 'risk':
          return a.riskScore - b.riskScore;
        case 'price':
          return a.price - b.price;
        case 'duration':
          return parseInt(a.duration) - parseInt(b.duration);
        default:
          return 0;
      }
    });

  if (!searchParams && !directFlightParams) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    console.log('🔄 LOADING STATE IS TRUE - SHOWING ANIMATION');
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="relative">
            <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-200 rounded-full mx-auto animate-pulse"></div>
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <TranslatedText 
              text={searchType === 'direct' ? 'Analyzing Your Flight...' : 'Scanning Flight Risks...'} 
              targetLanguage={currentLanguage} 
            />
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText 
              text={searchType === 'direct' 
                ? 'Getting detailed risk analysis for your specific flight'
                : 'Analyzing thousands of data points to find the safest options'
              } 
              targetLanguage={currentLanguage} 
            />
          </p>
          <div className="mt-4 flex justify-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>
                <TranslatedText text="Back to Search" targetLanguage={currentLanguage} />
              </span>
            </button>
          </div>

          {/* Error Display */}
          <div className="max-w-2xl mx-auto">
            <div className={`border rounded-xl p-8 shadow-sm ${
              isDarkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="flex-grow">
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-red-200' : 'text-red-900'}`}>
                    <TranslatedText text="Flight Not Found" targetLanguage={currentLanguage} />
                  </h3>
                  <div className="mb-4">
                    {searchType === 'direct' && directFlightParams ? (
                      <p className={`mb-2 font-medium ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                        <TranslatedText text={`Flight ${directFlightParams.airline}${directFlightParams.flightNumber} on ${directFlightParams.date} not found in database`} targetLanguage={currentLanguage} />
                      </p>
                    ) : searchType === 'route' && searchParams ? (
                      <p className={`mb-2 font-medium ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                        <TranslatedText text={`No flights found for ${searchParams.origin} → ${searchParams.destination} on ${searchParams.departureDate}`} targetLanguage={currentLanguage} />
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        clearError();
                        navigate('/');
                      }}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>
                        <TranslatedText text="Try Another Flight" targetLanguage={currentLanguage} />
                      </span>
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className={`flex items-center justify-center space-x-2 px-6 py-3 border rounded-lg transition-colors font-medium ${
                        isDarkMode 
                          ? 'bg-slate-800 text-red-300 border-red-600 hover:bg-slate-700' 
                          : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>
                        <TranslatedText text="Back to Search" targetLanguage={currentLanguage} />
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Helpful Tips */}
            <div className={`mt-8 border rounded-xl p-6 ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                <TranslatedText text="Search Tips" targetLanguage={currentLanguage} />
              </h4>
              <ul className={`space-y-2 ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <TranslatedText text="Double-check the airline code (e.g., DL for Delta, AA for American)" targetLanguage={currentLanguage} />
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <TranslatedText text="Verify the flight number is correct" targetLanguage={currentLanguage} />
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <TranslatedText text="Make sure the departure date is in mm/dd/yyyy format" targetLanguage={currentLanguage} />
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>
                    <TranslatedText text="Our database contains flights from major airlines on popular routes" targetLanguage={currentLanguage} />
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getHeaderInfo = () => {
    if (searchType === 'direct' && directFlightParams) {
      return {
        title: `${directFlightParams.airline}${directFlightParams.flightNumber}`,
        subtitle: `${directFlightParams.date} • Direct Flight Analysis`
      };
    } else if (searchParams) {
      return {
        title: `${searchParams.origin} → ${searchParams.destination}`,
        subtitle: `${searchParams.departureDate} • ${searchParams.passengers} passenger${searchParams.passengers > 1 ? 's' : ''}`
      };
    }
    return { title: 'Flight Results', subtitle: '' };
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        {/* Header */}
      <div className={`mb-8 p-6 rounded-2xl border transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-slate-900/20' 
          : 'bg-white border-slate-200 shadow-lg'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 transition-colors ${isDarkMode ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>
                <TranslatedText text="Back to Search" targetLanguage={currentLanguage} />
              </span>
            </button>
            <div className={`h-6 w-px ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
            <div className="flex items-center space-x-3">
              {searchType === 'direct' ? (
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <Plane className="w-4 h-4 text-blue-600" />
                </div>
              ) : (
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{headerInfo.title}</h1>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                  <TranslatedText text={headerInfo.subtitle} targetLanguage={currentLanguage} />
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Filters and Sort - Only show for route searches with multiple flights */}
        {searchType === 'route' && flights.length > 1 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TranslatedText text="Filter:" targetLanguage={currentLanguage} />
                </span>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                  className={`px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'border-slate-600 bg-slate-800 text-white' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="all">
                    <TranslatedText text="All Risks" targetLanguage={currentLanguage} />
                  </option>
                  <option value="low">
                    <TranslatedText text="Low Risk Only" targetLanguage={currentLanguage} />
                  </option>
                  <option value="medium">
                    <TranslatedText text="Medium Risk Only" targetLanguage={currentLanguage} />
                  </option>
                  <option value="high">
                    <TranslatedText text="High Risk Only" targetLanguage={currentLanguage} />
                  </option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <SortDesc className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TranslatedText text="Sort by:" targetLanguage={currentLanguage} />
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'risk' | 'price' | 'duration')}
                  className={`px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'border-slate-600 bg-slate-800 text-white' 
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="risk">
                    <TranslatedText text="Risk Level" targetLanguage={currentLanguage} />
                  </option>
                  <option value="price">
                    <TranslatedText text="Price" targetLanguage={currentLanguage} />
                  </option>
                  <option value="duration">
                    <TranslatedText text="Duration" targetLanguage={currentLanguage} />
                  </option>
                </select>
              </div>
            </div>

            <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text={`${sortedAndFilteredFlights.length} of ${flights.length} flights shown`} 
                targetLanguage={currentLanguage} 
              />
            </div>
          </div>
        )}

        {/* Flight Results with Inline Risk Insights */}
        <div className="max-w-5xl mx-auto space-y-6">
          {sortedAndFilteredFlights.length === 0 ? (
            <div className="text-center py-12">
              <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                <TranslatedText text="No flights match your current filters." targetLanguage={currentLanguage} />
              </p>
              <button
                onClick={() => setFilterBy('all')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <TranslatedText text="Show All Flights" targetLanguage={currentLanguage} />
              </button>
            </div>
          ) : (
            sortedAndFilteredFlights.map((flight) => (
              <div key={flight.id} className="space-y-4">
                <FlightCard
                  flight={flight}
                  onSelect={handleFlightSelect}
                  isExpanded={expandedFlightId === flight.id}
                />
                {expandedFlightId === flight.id && (
                  <div className="ml-4 animate-in slide-in-from-top-2 duration-200">
                    <RiskInsights flight={flight} />
                    {flight.riskLevel === 'high' || flight.riskLevel === 'medium' ? (
                      <InsuranceRecommendations flight={flight} />
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Direct Flight Analysis Note */}
        {searchType === 'direct' && flights.length === 1 && (
          <div className="max-w-5xl mx-auto mt-8">
            <div className={`border rounded-lg p-6 ${
              isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <Plane className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                    <TranslatedText text="Direct Flight Analysis Complete" targetLanguage={currentLanguage} />
                  </h3>
                  <p className={`mb-4 ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>
                    <TranslatedText 
                      text={`We've analyzed your specific flight ${directFlightParams?.airline}${directFlightParams?.flightNumber} for ${directFlightParams?.date}. Click "View Details" above to see the complete risk breakdown and insurance recommendation.`} 
                      targetLanguage={currentLanguage} 
                    />
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    <TranslatedText 
                      text="Want to compare with other flights on the same route? Use our route search feature." 
                      targetLanguage={currentLanguage} 
                    />
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};