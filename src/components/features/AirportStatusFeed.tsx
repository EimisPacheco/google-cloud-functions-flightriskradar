import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Clock, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

interface StatusPost {
  id: string;
  user: string;
  timestamp: string;
  content: string;
  category: 'delay' | 'security' | 'weather' | 'construction' | 'general' | 'positive';
  sentiment: 'positive' | 'neutral' | 'negative';
  likes: number;
  replies: number;
  verified: boolean;
}

interface AirportStatusFeedProps {
  airportCode: string;
  airportName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AirportStatusFeed: React.FC<AirportStatusFeedProps> = ({
  airportCode,
  airportName,
  isOpen,
  onClose
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [posts, setPosts] = useState<StatusPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Mock data for airport status feed
  const mockPosts: StatusPost[] = [
    {
      id: '1',
      user: 'TravelerMike',
      timestamp: '2 hours ago',
      content: 'Security line is moving fast today! Took only 15 minutes to get through TSA. Much better than last week.',
      category: 'security',
      sentiment: 'positive',
      likes: 24,
      replies: 3,
      verified: true
    },
    {
      id: '2',
      user: 'FlightTracker',
      timestamp: '1 hour ago',
      content: 'Heavy delays on runway 2 due to weather conditions. Expect 30-45 minute delays for departures.',
      category: 'weather',
      sentiment: 'negative',
      likes: 18,
      replies: 7,
      verified: true
    },
    {
      id: '3',
      user: 'AirportInsider',
      timestamp: '45 minutes ago',
      content: 'Construction on Terminal B is progressing well. New food court opening next month!',
      category: 'construction',
      sentiment: 'positive',
      likes: 12,
      replies: 2,
      verified: false
    },
    {
      id: '4',
      user: 'FrequentFlyer',
      timestamp: '30 minutes ago',
      content: 'Just landed. Baggage claim was super quick - got my bags in under 10 minutes.',
      category: 'positive',
      sentiment: 'positive',
      likes: 8,
      replies: 1,
      verified: false
    },
    {
      id: '5',
      user: 'TravelPro',
      timestamp: '20 minutes ago',
      content: 'Long lines at check-in counters. Recommend arriving 2 hours before departure.',
      category: 'delay',
      sentiment: 'negative',
      likes: 15,
      replies: 4,
      verified: true
    },
    {
      id: '6',
      user: 'LocalGuide',
      timestamp: '15 minutes ago',
      content: 'Weather is clearing up! Delays should start reducing in the next hour.',
      category: 'weather',
      sentiment: 'positive',
      likes: 22,
      replies: 5,
      verified: true
    },
    {
      id: '7',
      user: 'BusinessTraveler',
      timestamp: '10 minutes ago',
      content: 'Lounge access is great here. Quiet space to work and good coffee.',
      category: 'general',
      sentiment: 'positive',
      likes: 6,
      replies: 0,
      verified: false
    },
    {
      id: '8',
      user: 'AirportUpdates',
      timestamp: '5 minutes ago',
      content: 'Minor technical issue with some boarding gates. Staff working to resolve quickly.',
      category: 'delay',
      sentiment: 'neutral',
      likes: 9,
      replies: 2,
      verified: true
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPosts(mockPosts);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, airportCode]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'delay':
        return <Clock className="w-4 h-4" />;
      case 'security':
        return <AlertTriangle className="w-4 h-4" />;
      case 'weather':
        return <TrendingUp className="w-4 h-4" />;
      case 'construction':
        return <CheckCircle className="w-4 h-4" />;
      case 'positive':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'delay':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      case 'security':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      case 'weather':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'construction':
        return isDarkMode ? 'text-orange-400' : 'text-orange-600';
      case 'positive':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      default:
        return isDarkMode ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'negative':
        return isDarkMode ? 'text-red-400' : 'text-red-600';
      default:
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    return post.category === filter;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    if (sortBy === 'popular') {
      return b.likes - a.likes;
    }
    return 0;
  });

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
            }`}>
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <TranslatedText text="Airport Current Status" targetLanguage={currentLanguage} />
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {airportName} ({airportCode}) - <TranslatedText text="Live Updates" targetLanguage={currentLanguage} />
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-slate-700 text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'hover:bg-slate-700 text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 border-b ${
          isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex flex-wrap gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="all">All Categories</option>
              <option value="delay">Delays</option>
              <option value="security">Security</option>
              <option value="weather">Weather</option>
              <option value="construction">Construction</option>
              <option value="positive">Positive Updates</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  <TranslatedText text="Loading airport status updates..." targetLanguage={currentLanguage} />
                </p>
              </div>
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <TranslatedText text="No status updates available" targetLanguage={currentLanguage} />
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-slate-750 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  } transition-colors`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-slate-600' : 'bg-slate-200'
                    }`}>
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {post.user}
                        </span>
                        {post.verified && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {post.timestamp}
                        </span>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                          isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                        }`}>
                          {getCategoryIcon(post.category)}
                          <span className={getCategoryColor(post.category)}>
                            {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {post.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs">
                        <button className={`flex items-center space-x-1 ${
                          isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                        }`}>
                          <span>👍</span>
                          <span>{post.likes}</span>
                        </button>
                        <button className={`flex items-center space-x-1 ${
                          isDarkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
                        }`}>
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.replies}</span>
                        </button>
                        <span className={getSentimentColor(post.sentiment)}>
                          {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${
          isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              <TranslatedText text="Last updated:" targetLanguage={currentLanguage} /> {new Date().toLocaleTimeString()}
            </span>
            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
              {sortedPosts.length} <TranslatedText text="updates" targetLanguage={currentLanguage} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirportStatusFeed; 