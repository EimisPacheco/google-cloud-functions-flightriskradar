import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
 
  TrendingUp, 
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';

interface ReviewHighlight {
  category: string;
  sentiment: 'positive' | 'negative';
  count: number;
  percentage?: number;
  reviews?: string[];
}

interface TopHighlight {
  aspect: string;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
}

interface SentimentData {
  entityName: string;
  entityType: 'airline' | 'airport';
  totalReviews: number;
  overallSentiment: 'positive' | 'negative' | 'mixed';
  sentimentScore: number;
  reviewIntelligence: string;
  pros: ReviewHighlight[];
  cons: ReviewHighlight[];
  topHighlights: TopHighlight[];
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspect: string;
  positiveReviews: string[];
  negativeReviews: string[];
  totalPositive: number;
  totalNegative: number;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  aspect,
  positiveReviews,
  negativeReviews,
  totalPositive,
  totalNegative
}) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();

  if (!isOpen) return null;

  const totalReviews = totalPositive + totalNegative;
  const positivePercentage = Math.round((totalPositive / totalReviews) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reviews mentioning "{aspect}"
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {totalReviews} customers mention "{aspect}" • 
                  <span className="text-green-600 dark:text-green-400 ml-2">{totalPositive} positive</span> • 
                  <span className="text-red-600 dark:text-red-400 ml-2">{totalNegative} negative</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sentiment Summary */}
          <div className={`px-6 py-4 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {totalPositive}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Positive
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {totalNegative}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Negative
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Overall sentiment
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {positivePercentage}% Positive
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {/* Positive Reviews */}
            {positiveReviews.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <ThumbsUp className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Positive mentions ({positiveReviews.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {positiveReviews.slice(0, 10).map((review, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-green-900/20 border-green-700/30' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        "{review}"
                      </p>
                    </div>
                  ))}
                  {positiveReviews.length > 10 && (
                    <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      + {positiveReviews.length - 10} more positive mentions
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Negative Reviews */}
            {negativeReviews.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <ThumbsDown className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Areas for improvement ({negativeReviews.length})
                  </h4>
                </div>
                <div className="space-y-3">
                  {negativeReviews.slice(0, 10).map((review, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-red-900/20 border-red-700/30' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        "{review}"
                      </p>
                    </div>
                  ))}
                  {negativeReviews.length > 10 && (
                    <p className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      + {negativeReviews.length - 10} more areas for improvement
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SentimentAnalysisProps {
  data: SentimentData;
  onClose: () => void;
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ data, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const [selectedAspect, setSelectedAspect] = useState<string | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  const handleAspectClick = (aspect: string) => {
    setSelectedAspect(aspect);
    setShowReviewsModal(true);
  };

  const getSelectedAspectData = () => {
    if (!selectedAspect) return null;
    return data.topHighlights.find(h => h.aspect === selectedAspect);
  };

  const getPositiveReviews = (aspect: string): string[] => {
    // Mock data for positive reviews - includes both airline and airport aspects
    const reviewsMap: { [key: string]: string[] } = {
      // Airline aspects
      'Cleanliness': [
        'The cabin was spotlessly clean and well-maintained throughout the flight',
        'Impressed by the cleanliness standards, especially during these times',
        'Very clean aircraft, bathrooms were maintained throughout the flight',
        'Exceptional cleanliness in all areas of the plane',
        'The crew kept everything clean and sanitized during the entire journey'
      ],
      'Customer Service': [
        'Flight attendants were incredibly helpful and friendly',
        'Outstanding service from check-in to arrival',
        'The crew went above and beyond to make sure we were comfortable',
        'Professional and courteous staff throughout the journey',
        'Excellent customer service, they really care about passengers'
      ],
      'On-Time Performance': [
        'Flight departed and arrived exactly on time',
        'Impressed with the punctuality, no delays at all',
        'Always on time with this airline, very reliable',
        'Perfect timing, arrived even a few minutes early',
        'Consistent on-time performance on all my flights'
      ],
      'Comfort': [
        'Seats were very comfortable with good legroom',
        'The new seats are amazing, very comfortable for long flights',
        'Plenty of space and comfortable seating arrangement',
        'Best seat comfort I\'ve experienced in economy class',
        'Very comfortable journey, seats recline nicely'
      ],
      'Value for Money': [
        'Great value for the price paid',
        'Excellent service for a very reasonable price',
        'Best value airline in this route',
        'Worth every penny, great overall experience',
        'Affordable prices without compromising on quality'
      ],
      // Airport aspects
      'Security Efficiency': [
        'TSA PreCheck line moved incredibly fast, only 5 minutes',
        'Security staff were professional and the process was smooth',
        'Best organized security I\'ve seen at any airport',
        'Clear signage and efficient security screening process',
        'Multiple lanes open, minimal wait time even during peak hours',
        'Security was surprisingly quick for such a busy airport'
      ],
      'Terminal Cleanliness': [
        'Spotlessly clean throughout the terminal',
        'Restrooms were immaculate and well-stocked',
        'Terminal was pristine, regular cleaning visible',
        'One of the cleanest airports I\'ve been to',
        'Impressed by how clean they keep such a busy terminal'
      ],
      'Shopping & Dining': [
        'Great variety of restaurants and shops',
        'Loved the local food options in Terminal B',
        'Duty-free shopping was excellent with good prices',
        'Plenty of healthy food options available',
        'Amazing selection of shops, found everything I needed'
      ],
      'Staff Helpfulness': [
        'Airport staff went out of their way to help with directions',
        'Information desk personnel were incredibly knowledgeable',
        'Staff helped me find my gate when I was lost',
        'Very helpful staff at check-in counters',
        'Ground staff were friendly and spoke multiple languages'
      ],
      'Transportation Access': [
        'Easy connection to city center via train',
        'Plenty of taxi and rideshare options available',
        'Rental car facility is conveniently located',
        'Public transport links are excellent',
        'Shuttle service to parking was frequent and efficient'
      ],
      'Gate Comfort': [
        'Plenty of seating at the gates',
        'Comfortable chairs with charging stations',
        'Gates have good amenities and space',
        'Nice waiting areas with good views of the tarmac',
        'Spacious gate areas, never felt crowded'
      ],
      'Check-in Process': [
        'Self-service kiosks made check-in a breeze',
        'Staff at check-in were efficient and friendly',
        'Online check-in worked perfectly',
        'Bag drop was quick and hassle-free',
        'Check-in process was smooth and well-organized'
      ],
      'Baggage Handling': [
        'Bags arrived quickly at carousel',
        'My luggage was handled with care',
        'Baggage claim was efficient and well-marked',
        'Priority baggage actually came out first',
        'Never had any issues with lost luggage here'
      ],
      'Immigration & Customs': [
        'Global Entry made immigration a 2-minute process',
        'Immigration officers were professional and quick',
        'Customs process was streamlined and efficient',
        'E-gates for passport control worked great',
        'Staff helped expedite families with children'
      ],
      'WiFi & Charging': [
        'Free WiFi throughout the terminal worked well',
        'Plenty of charging stations at every gate',
        'USB ports at most seats',
        'WiFi speed was surprisingly good for free service',
        'Charging lounges with comfortable seating'
      ]
    };
    return reviewsMap[aspect] || [];
  };

  const getNegativeReviews = (aspect: string): string[] => {
    // Mock data for negative reviews - includes both airline and airport aspects
    const reviewsMap: { [key: string]: string[] } = {
      // Airline aspects
      'Cleanliness': [
        'The tray table was sticky and hadn\'t been cleaned properly',
        'Bathroom was not clean by the end of the flight'
      ],
      'Customer Service': [
        'Staff seemed overwhelmed and not very helpful',
        'Poor communication during delay'
      ],
      'On-Time Performance': [
        'Flight was delayed by 2 hours with no proper explanation',
        'Consistent delays on this route'
      ],
      'Comfort': [
        'Seats are too cramped, very uncomfortable for long flights',
        'No legroom at all, very uncomfortable'
      ],
      'Value for Money': [
        'Too expensive for the service provided',
        'Hidden fees make it not worth the initial price'
      ],
      // Airport aspects
      'Security Efficiency': [
        'Security lines were extremely long, waited over an hour',
        'Not enough lanes open during peak times',
        'TSA agents were rude and unprofessional',
        'Confusing security procedures, no clear instructions'
      ],
      'Terminal Cleanliness': [
        'Bathrooms were dirty and poorly maintained',
        'Trash overflowing in gate areas',
        'Terminal floors were sticky and unclean'
      ],
      'Shopping & Dining': [
        'Very limited food options after security',
        'Prices are outrageously high',
        'Most restaurants were closed during my layover',
        'Poor quality food for the price'
      ],
      'Staff Helpfulness': [
        'Staff were unhelpful when I asked for directions',
        'No one at information desk spoke English',
        'Gate agents were rude and dismissive'
      ],
      'Transportation Access': [
        'Very expensive parking with no alternatives',
        'Public transport stops running too early',
        'Taxi queue was chaotic and unorganized',
        'Rental car shuttle took forever'
      ],
      'Gate Comfort': [
        'Not enough seating at gates',
        'Uncomfortable chairs with no padding',
        'Gates are overcrowded and noisy',
        'No charging stations near seats'
      ],
      'Check-in Process': [
        'Long lines at check-in counters',
        'Self-service kiosks were not working',
        'Staff at check-in were slow and inefficient',
        'Confusing check-in process'
      ],
      'Baggage Handling': [
        'Waited 45 minutes for bags to arrive',
        'My luggage was damaged',
        'Baggage carousel broke down',
        'Lost my bag and no one could help'
      ],
      'Immigration & Customs': [
        'Immigration lines were extremely long',
        'Not enough staff at passport control',
        'Customs process was confusing',
        'Officers were unfriendly and intimidating'
      ],
      'WiFi & Charging': [
        'WiFi didn\'t work at all',
        'Had to pay for WiFi and it was still slow',
        'Not enough charging stations',
        'Charging ports at seats were broken'
      ]
    };
    return reviewsMap[aspect] || [];
  };

  const aspectData = getSelectedAspectData();

  return (
    <div className={`rounded-xl shadow-lg overflow-hidden ${
      isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <TranslatedText text="Customer Sentiment Analysis" targetLanguage={currentLanguage} />
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Review Intelligence */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <TranslatedText text="Customers say" targetLanguage={currentLanguage} />
            </h3>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              {data.reviewIntelligence}
            </p>
          </div>
        </div>
      </div>

      {/* Top Review Highlights by Sentiment */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200 bg-white'}`}>
        <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <TranslatedText text="Top review highlights by sentiment" targetLanguage={currentLanguage} />
        </h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Excerpts from guest reviews, analyzed by AI sentiment
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pros */}
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <ThumbsUp className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                <TranslatedText text="Pros" targetLanguage={currentLanguage} />
              </h4>
            </div>
            <div className="space-y-4">
              {data.pros.map((pro, index) => (
                <div key={index}>
                  <div className="flex items-start space-x-2">
                    <span className={`text-lg leading-none ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>"</span>
                    <div className="flex-1">
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        <span className={`font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {pro.category}
                        </span>
                        {pro.reviews && pro.reviews[0] && (
                          <span className={`text-gray-500 text-xs ml-2`}>
                            (in {pro.count} reviews)
                          </span>
                        )}
                      </p>
                      {pro.reviews && pro.reviews[0] && (
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {pro.reviews[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cons */}
          <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <ThumbsDown className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                <TranslatedText text="Cons" targetLanguage={currentLanguage} />
              </h4>
            </div>
            <div className="space-y-4">
              {data.cons.map((con, index) => (
                <div key={index}>
                  <div className="flex items-start space-x-2">
                    <span className={`text-lg leading-none ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>"</span>
                    <div className="flex-1">
                      <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                          {con.category}
                        </span>
                        {con.reviews && con.reviews[0] && (
                          <span className={`text-gray-500 text-xs ml-2`}>
                            (in {con.count} reviews)
                          </span>
                        )}
                      </p>
                      {con.reviews && con.reviews[0] && (
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {con.reviews[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Highlights */}
      <div className={`p-6 ${isDarkMode ? '' : 'bg-slate-50/50'}`}>
        <div className="mb-4">
          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <TranslatedText text="Top Highlights" targetLanguage={currentLanguage} />
            <span className={`text-xs font-normal ml-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              (Click to see details)
            </span>
          </h3>
        </div>

        <div className="space-y-2">
          {data.topHighlights.map((highlight, index) => {
            const positivePercentage = Math.round((highlight.positiveCount / highlight.totalCount) * 100);
            const negativePercentage = Math.round((highlight.negativeCount / highlight.totalCount) * 100);
            
            return (
              <button
                key={index}
                onClick={() => handleAspectClick(highlight.aspect)}
                className={`w-full p-4 rounded-lg border transition-all hover:shadow-md ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' 
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {highlight.aspect}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {highlight.positiveCount} positive
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {highlight.negativeCount} negative
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reviews Modal */}
      {selectedAspect && aspectData && (
        <ReviewsModal
          isOpen={showReviewsModal}
          onClose={() => {
            setShowReviewsModal(false);
            setSelectedAspect(null);
          }}
          aspect={selectedAspect}
          positiveReviews={getPositiveReviews(selectedAspect)}
          negativeReviews={getNegativeReviews(selectedAspect)}
          totalPositive={aspectData.positiveCount}
          totalNegative={aspectData.negativeCount}
        />
      )}
    </div>
  );
};

// Mock data generator for airlines
export const generateAirlineSentimentData = (airlineName: string): SentimentData => {
  return {
    entityName: airlineName,
    entityType: 'airline',
    totalReviews: 2847,
    overallSentiment: 'positive',
    sentimentScore: 82,
    reviewIntelligence: `Passengers consistently praise the airline's exceptional on-time performance and professional cabin crew who provide attentive service throughout the flight. The modern fleet features comfortable seating with adequate legroom, and travelers appreciate the high cleanliness standards maintained across all aircraft. Many highlight the smooth check-in process and efficient boarding procedures, particularly praising the mobile app functionality and helpful ground staff. While some passengers mention limited food variety on longer routes and occasional delays during peak travel seasons, the overall experience is highly rated for reliability and customer care. Business travelers particularly value the consistent service quality and well-equipped lounges at major hubs.`,
    pros: [
      {
        category: 'Exceptional cleanliness',
        sentiment: 'positive',
        count: 47,
        reviews: ['Guests consistently praise the spotless condition and attention to detail']
      },
      {
        category: 'Professional crew',
        sentiment: 'positive',
        count: 42,
        reviews: ['Flight attendants are helpful, friendly, and provide excellent service throughout']
      },
      {
        category: 'Comfortable seating',
        sentiment: 'positive',
        count: 38,
        reviews: ['Seats offer good legroom and comfort even on long-haul flights']
      }
    ],
    cons: [
      {
        category: 'Occasional delays',
        sentiment: 'negative',
        count: 8,
        reviews: ['Some guests reported minor delays on certain routes']
      },
      {
        category: 'Limited food options',
        sentiment: 'negative',
        count: 5,
        reviews: ['Menu variety could be improved for dietary restrictions']
      },
      {
        category: 'WiFi connectivity',
        sentiment: 'negative',
        count: 4,
        reviews: ['In-flight WiFi can be slow or unreliable at times']
      }
    ],
    topHighlights: [
      { aspect: 'Cleanliness', positiveCount: 47, negativeCount: 3, totalCount: 50 },
      { aspect: 'Customer Service', positiveCount: 42, negativeCount: 2, totalCount: 44 },
      { aspect: 'On-Time Performance', positiveCount: 38, negativeCount: 8, totalCount: 46 },
      { aspect: 'Comfort', positiveCount: 35, negativeCount: 4, totalCount: 39 },
      { aspect: 'Value for Money', positiveCount: 29, negativeCount: 5, totalCount: 34 }
    ]
  };
};

// Mock data generator for airports
export const generateAirportSentimentData = (airportName: string): SentimentData => {
  // Generate varied data based on airport name
  const reviewCount = 1200 + Math.floor(Math.random() * 1000);
  const sentimentScore = 72 + Math.floor(Math.random() * 15);
  
  return {
    entityName: airportName,
    entityType: 'airport',
    totalReviews: reviewCount,
    overallSentiment: sentimentScore >= 80 ? 'positive' : sentimentScore >= 60 ? 'mixed' : 'negative',
    sentimentScore: sentimentScore,
    reviewIntelligence: `Travelers find the airport efficient for navigating security checkpoints, with most passengers reporting wait times under 15 minutes during off-peak hours and praising the professional TSA staff. The terminal features excellent shopping and dining options, including local cuisine favorites and well-known chains, though some note the prices are higher than expected. Passengers appreciate the clean facilities and abundant seating at gates, particularly the availability of charging stations throughout the terminal. The airport's transportation connections receive high marks, with easy access to rental cars, rideshare services, and public transit options. While some travelers mention long walks between terminals and occasional congestion during morning rush hours, the overall experience is enhanced by helpful staff who provide clear directions and the free WiFi that works reliably throughout the facility.`,
    pros: [
      {
        category: 'Efficient security',
        sentiment: 'positive',
        count: 52,
        reviews: ['Security lines move quickly with professional and courteous staff']
      },
      {
        category: 'Great shopping',
        sentiment: 'positive',
        count: 46,
        reviews: ['Wide variety of shops and duty-free options available']
      },
      {
        category: 'Clean facilities',
        sentiment: 'positive',
        count: 41,
        reviews: ['Airport is well-maintained with clean restrooms and waiting areas']
      },
      {
        category: 'Helpful staff',
        sentiment: 'positive',
        count: 38,
        reviews: ['Airport personnel are friendly and always willing to assist']
      }
    ],
    cons: [
      {
        category: 'Parking challenges',
        sentiment: 'negative',
        count: 12,
        reviews: ['Parking can be expensive and difficult to find during peak times']
      },
      {
        category: 'Long walks',
        sentiment: 'negative',
        count: 8,
        reviews: ['Some terminals require long walks between gates']
      },
      {
        category: 'Food prices',
        sentiment: 'negative',
        count: 6,
        reviews: ['Restaurant and cafe prices are quite high']
      },
      {
        category: 'WiFi connectivity',
        sentiment: 'negative',
        count: 5,
        reviews: ['Free WiFi is slow and unreliable in some areas']
      }
    ],
    topHighlights: [
      { aspect: 'Security Efficiency', positiveCount: 52, negativeCount: 4, totalCount: 56 },
      { aspect: 'Terminal Cleanliness', positiveCount: 41, negativeCount: 2, totalCount: 43 },
      { aspect: 'Shopping & Dining', positiveCount: 46, negativeCount: 6, totalCount: 52 },
      { aspect: 'Staff Helpfulness', positiveCount: 38, negativeCount: 3, totalCount: 41 },
      { aspect: 'Transportation Access', positiveCount: 28, negativeCount: 8, totalCount: 36 },
      { aspect: 'Gate Comfort', positiveCount: 24, negativeCount: 11, totalCount: 35 },
      { aspect: 'Check-in Process', positiveCount: 31, negativeCount: 5, totalCount: 36 },
      { aspect: 'Baggage Handling', positiveCount: 22, negativeCount: 9, totalCount: 31 },
      { aspect: 'Immigration & Customs', positiveCount: 19, negativeCount: 7, totalCount: 26 },
      { aspect: 'WiFi & Charging', positiveCount: 15, negativeCount: 12, totalCount: 27 }
    ]
  };
};