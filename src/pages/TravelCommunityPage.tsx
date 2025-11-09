import React, { useState, useEffect } from 'react';
import '../styles/shimmer.css';
import ShareModal from '../components/features/ShareModal';
import { 
  MessageCircle, 
  Plus, 
  Filter, 
  Search, 
  TrendingUp, 
  Users, 
  MapPin, 
  Clock,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bold,
  Italic,
  List,
  Link,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Star,
  Shield,
  HelpCircle,
  Loader2,
  CheckCircle,
  Info,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { NewPostModal } from '../components/features/NewPostModal';
import { RichTextDisplay } from '../components/features/RichTextDisplay';

interface Post {
  id: string;
  type: 'airport_status' | 'flight_review' | 'travel_tip' | 'alert' | 'question';
  title: string;
  content: string;
  author: string;
  authorReputation: number;
  timestamp: string;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  images: string[];
  hashtags: string[];
  location?: string;
  verified?: boolean;
  airline?: string;
  flightNumber?: string;
  rating?: number;
  tags?: string[];
  urgent?: boolean;
  isVerified?: boolean;
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Partial<Post>) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [postType, setPostType] = useState<Post['type'] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const postTypes = [
    {
      type: 'airport_status' as const,
      icon: MapPin,
      title: 'Airport Status Update',
      description: 'Share real-time airport conditions',
      color: 'blue'
    },
    {
      type: 'flight_review' as const,
      icon: Star,
      title: 'Flight Review',
      description: 'Rate your flight experience',
      color: 'yellow'
    },
    {
      type: 'travel_tip' as const,
      icon: Shield,
      title: 'Travel Tip',
      description: 'Share helpful travel advice',
      color: 'green'
    },
    {
      type: 'alert' as const,
      icon: AlertTriangle,
      title: 'Travel Alert',
      description: 'Report urgent travel issues',
      color: 'red'
    },
    {
      type: 'question' as const,
      icon: HelpCircle,
      title: 'Ask a Question',
      description: 'Get help from the community',
      color: 'purple'
    }
  ];

  const handleSubmit = () => {
    if (!postType || !title || !content) return;

    onSubmit({
      type: postType,
      title,
      content,
      images,
      hashtags: content.match(/#\w+/g) || [],
      timestamp: new Date().toISOString(),
      author: 'Current User',
      authorReputation: 450,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0
    });

    // Reset form
    setPostType(null);
    setTitle('');
    setContent('');
    setImages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
          isDarkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <TranslatedText text="Create New Post" targetLanguage={currentLanguage} />
              </h3>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {!postType ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.type}
                      onClick={() => setPostType(type.type)}
                      className={`p-6 rounded-xl border-2 transition-all ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 hover:border-blue-500' 
                          : 'bg-white border-gray-200 hover:border-blue-500'
                      }`}
                    >
                      <Icon className={`w-12 h-12 mx-auto mb-3 ${
                        type.color === 'blue' ? 'text-blue-500' :
                        type.color === 'yellow' ? 'text-yellow-500' :
                        type.color === 'green' ? 'text-green-500' :
                        type.color === 'red' ? 'text-red-500' :
                        'text-purple-500'
                      }`} />
                      <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <TranslatedText text={type.title} targetLanguage={currentLanguage} />
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        <TranslatedText text={type.description} targetLanguage={currentLanguage} />
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <TranslatedText text="Title" targetLanguage={currentLanguage} />
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter a descriptive title..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    <TranslatedText text="Content" targetLanguage={currentLanguage} />
                  </label>
                  <div className={`border rounded-lg ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
                    <div className={`flex items-center space-x-2 p-3 border-b ${
                      isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                        <Bold className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                        <Italic className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                        <List className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                        <Link className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className={`w-full px-4 py-3 focus:outline-none ${
                        isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'
                      }`}
                      rows={6}
                      placeholder="Share your experience, tips, or questions..."
                    />
                  </div>
                  <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    <TranslatedText text="Use hashtags to make your post more discoverable" targetLanguage={currentLanguage} />
                  </p>
                </div>
              </div>
            )}
          </div>

          {postType && (
            <div className={`px-6 py-4 border-t flex justify-between ${
              isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-gray-200 bg-gray-50'
            }`}>
              <button
                onClick={() => setPostType(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-slate-300 hover:bg-slate-600' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TranslatedText text="Back" targetLanguage={currentLanguage} />
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title || !content}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  title && content
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : isDarkMode
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <TranslatedText text="Post" targetLanguage={currentLanguage} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TravelCommunityPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    postTitle: string;
    postUrl: string;
    postType: string;
  }>({
    isOpen: false,
    postTitle: '',
    postUrl: '',
    postType: ''
  });

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Long TSA Lines at LAX Terminal 4',
      content: 'Heads up travelers! Currently experiencing 45+ minute wait times at security checkpoint in Terminal 4. If you have a morning flight, arrive at least 3 hours early. PreCheck line is also backed up. #LAX #TSADelay #TravelAlert',
      author: 'FrequentFlyerMike',
      authorReputation: 892,
      timestamp: '2024-01-23T08:30:00Z',
      likes: 145,
      dislikes: 3,
      comments: 32,
      shares: 87,
      images: [],
      hashtags: ['#LAX', '#TSADelay', '#TravelAlert'],
      location: 'LAX',
      verified: true
    },
    {
      id: '2',
      type: 'flight_review',
      title: 'Amazing Experience on Emirates A380 - DXB to JFK',
      content: 'Just completed my flight on Emirates A380 and I\'m blown away! The business class seat was like a private suite, the food was restaurant quality, and the entertainment system had hundreds of options. The shower spa at 40,000 feet was surreal! Service was impeccable throughout the 14-hour journey. Highly recommend! #Emirates #A380 #BusinessClass #FlightReview',
      author: 'LuxuryTraveler23',
      authorReputation: 567,
      timestamp: '2024-01-23T06:45:00Z',
      likes: 234,
      dislikes: 12,
      comments: 45,
      shares: 56,
      images: ['https://images.unsplash.com/photo-1540339832862-474599807836?w=800&h=400&fit=crop'],
      hashtags: ['#Emirates', '#A380', '#BusinessClass', '#FlightReview'],
      rating: 5,
      airline: 'Emirates',
      flightNumber: 'EK201',
      verified: false
    },
    {
      id: '3',
      type: 'travel_tip',
      title: 'Hidden Gem: Free Shower Facilities at Singapore Changi',
      content: 'Pro tip for long layovers at Singapore Changi! There are FREE shower facilities in Terminal 1 near the gardens (Level 3). No lounge access needed! Fresh towels provided, and they\'re open 24/7. Perfect for refreshing during those long connections. Also, don\'t miss the butterfly garden nearby! #Singapore #ChangiAirport #TravelTips #Layover',
      author: 'BackpackerSarah',
      authorReputation: 445,
      timestamp: '2024-01-23T05:20:00Z',
      likes: 342,
      dislikes: 5,
      comments: 67,
      shares: 125,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'],
      hashtags: ['#Singapore', '#ChangiAirport', '#TravelTips', '#Layover'],
      location: 'SIN',
      verified: false
    },
    {
      id: '4',
      type: 'question',
      title: 'First time flying with pet - Any advice?',
      content: 'I\'m flying from Seattle to Miami next month with my golden retriever. It\'s our first time flying together and I\'m nervous! She\'s 45 pounds so has to go in cargo. Any tips for making this easier for her? Which airlines are best for pets? Should I sedate her? Any advice appreciated! #PetTravel #FlyingWithPets #Help',
      author: 'DogMomKatie',
      authorReputation: 125,
      timestamp: '2024-01-23T04:15:00Z',
      likes: 89,
      dislikes: 0,
      comments: 76,
      shares: 23,
      images: [],
      hashtags: ['#PetTravel', '#FlyingWithPets', '#Help'],
      verified: false
    },
    {
      id: '5',
      type: 'airport_status',
      title: 'Newark Airport Terminal C - Major Improvements!',
      content: 'Just went through the newly renovated Terminal C at Newark and WOW! Brand new restaurants, charging stations everywhere, comfortable seating areas, and the bathrooms are actually clean! Gate areas are spacious with great views. This used to be my least favorite airport but not anymore. Well done! #EWR #AirportUpgrade #Newark',
      author: 'NYCCommuter',
      authorReputation: 678,
      timestamp: '2024-01-23T03:30:00Z',
      likes: 167,
      dislikes: 8,
      comments: 29,
      shares: 45,
      images: ['https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=800&h=400&fit=crop'],
      hashtags: ['#EWR', '#AirportUpgrade', '#Newark'],
      location: 'EWR',
      verified: true
    },
    {
      id: '6',
      type: 'alert',
      title: 'United Airlines System Outage - Nationwide Delays',
      content: 'URGENT: United Airlines experiencing system-wide technical issues. Multiple flights delayed or cancelled across the country. Check your flight status before heading to the airport. Customer service lines are overwhelmed. Consider rebooking through the app if possible. #United #FlightDelays #SystemOutage',
      author: 'AirportInsider',
      authorReputation: 1250,
      timestamp: '2024-01-23T02:00:00Z',
      likes: 423,
      dislikes: 2,
      comments: 156,
      shares: 289,
      images: [],
      hashtags: ['#United', '#FlightDelays', '#SystemOutage'],
      verified: true,
      urgent: true
    },
    {
      id: '7',
      type: 'travel_tip',
      title: 'Beat Jet Lag: My Proven Method',
      content: 'After years of international travel, here\'s what actually works for jet lag: 1) Start adjusting sleep 3 days before travel 2) Fast for 16 hours before landing 3) Stay hydrated, avoid alcohol 4) Get sunlight immediately upon arrival 5) No naps on arrival day! This method has never failed me on US-Asia routes. #JetLag #TravelTips #InternationalTravel',
      author: 'GlobalNomad88',
      authorReputation: 934,
      timestamp: '2024-01-23T01:00:00Z',
      likes: 567,
      dislikes: 23,
      comments: 98,
      shares: 234,
      images: [],
      hashtags: ['#JetLag', '#TravelTips', '#InternationalTravel'],
      verified: false
    },
    {
      id: '8',
      type: 'flight_review',
      title: 'Worst Flight Experience - American Airlines Basic Economy',
      content: 'Terrible experience on AA flight 2341 from Chicago to Dallas. Basic Economy is a scam - no carry on allowed (even though website wasn\'t clear), middle seat, no changes allowed, and they charge for WATER. Flight was also 2 hours delayed with no explanation. Never again. #AmericanAirlines #BasicEconomy #NeverAgain',
      author: 'DisappointedFlyer',
      authorReputation: 234,
      timestamp: '2024-01-22T23:30:00Z',
      likes: 178,
      dislikes: 45,
      comments: 89,
      shares: 34,
      images: [],
      hashtags: ['#AmericanAirlines', '#BasicEconomy', '#NeverAgain'],
      rating: 1,
      airline: 'American Airlines',
      flightNumber: 'AA2341',
      verified: false
    },
    {
      id: '9',
      type: 'airport_status',
      title: 'Denver Airport Food Court Update - Terminal B',
      content: 'New food options at DEN Terminal B! Shake Shack, local brewery, and healthy salad place just opened. Prices are airport-typical (expensive) but quality is good. Also spotted more charging stations near gates B30-B45. Terminal is less crowded than usual today. #DenverAirport #DEN #AirportFood',
      author: 'MileHighTraveler',
      authorReputation: 556,
      timestamp: '2024-01-22T22:15:00Z',
      likes: 123,
      dislikes: 7,
      comments: 34,
      shares: 28,
      images: ['https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=400&fit=crop'],
      hashtags: ['#DenverAirport', '#DEN', '#AirportFood'],
      location: 'DEN',
      verified: false
    },
    {
      id: '10',
      type: 'alert',
      title: 'Gate Change Alert - United Flight 847 at EWR',
      content: 'ATTENTION: United Flight 847 to San Francisco departing from Newark has changed gates from C71 to C93. That\'s a 15-minute walk! They only announced it at the gate, not on the app. Run! #united #gatechange #EWR',
      author: 'RunwayRunner',
      authorReputation: 445,
      timestamp: '2024-01-22T21:45:00Z',
      likes: 67,
      dislikes: 1,
      comments: 12,
      shares: 52,
      images: ['https://images.unsplash.com/photo-1515165562839-978bbcf18277?w=800&h=400&fit=crop'],
      hashtags: ['#EWR', '#united', '#gate-change', '#alert'],
      location: 'EWR',
      verified: true
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Posts', icon: MessageCircle },
    { id: 'airport_status', name: 'Airport Status', icon: MapPin },
    { id: 'flight_review', name: 'Flight Reviews', icon: Star },
    { id: 'travel_tip', name: 'Travel Tips', icon: Shield },
    { id: 'alert', name: 'Alerts', icon: AlertTriangle },
    { id: 'question', name: 'Questions', icon: HelpCircle }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.type === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getPostIcon = (type: Post['type']) => {
    switch (type) {
      case 'airport_status': return MapPin;
      case 'flight_review': return Star;
      case 'travel_tip': return Shield;
      case 'alert': return AlertTriangle;
      case 'question': return HelpCircle;
    }
  };

  const getPostColor = (type: Post['type']) => {
    switch (type) {
      case 'airport_status': return 'blue';
      case 'flight_review': return 'yellow';
      case 'travel_tip': return 'green';
      case 'alert': return 'red';
      case 'question': return 'purple';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540339832862-474599807836?w=1920&h=600&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="Travel Community" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              <TranslatedText 
                text="Connect with travelers, share experiences, and get real-time updates" 
                targetLanguage={currentLanguage} 
              />
            </p>
            <div className="flex items-center justify-center space-x-6 text-white/90">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">{posts.length}+</span>
                <span>Active Posts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">12.5k</span>
                <span>Members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className={`sticky top-0 z-20 border-b backdrop-blur-md ${
        isDarkMode 
          ? 'bg-slate-800/90 border-slate-700' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 space-y-4">
            {/* Search Bar with Create Button */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search posts, locations, hashtags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">
                  <TranslatedText text="Create Post" targetLanguage={currentLanguage} />
                </span>
              </button>
            </div>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Feed */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const Icon = getPostIcon(post.type);
              const color = getPostColor(post.type);
              
              return (
                <div
                  key={post.id}
                  className={`rounded-xl shadow-md overflow-hidden transition-all hover:shadow-xl ${
                    post.urgent
                      ? isDarkMode
                        ? 'bg-red-900/20 border-2 border-red-500/50'
                        : 'bg-red-50 border-2 border-red-300'
                      : isDarkMode 
                        ? 'bg-slate-800' 
                        : 'bg-white'
                  }`}
                >
                  {/* Post Header */}
                  <div className={`p-6 ${post.urgent ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${
                          color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                          color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
                          'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                            color === 'green' ? 'text-green-600 dark:text-green-400' :
                            color === 'red' ? 'text-red-600 dark:text-red-400' :
                            'text-purple-600 dark:text-purple-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {post.title}
                            </h3>
                            {post.verified && (
                              <CheckCircle className="w-5 h-5 text-blue-500" title="Verified Post" />
                            )}
                            {post.urgent && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                              {post.author}
                            </span>
                            <span className={`flex items-center space-x-1 ${
                              post.authorReputation > 500 
                                ? 'text-green-600 dark:text-green-400' 
                                : isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              <Star className="w-3 h-3" />
                              <span>{post.authorReputation}</span>
                            </span>
                            <span className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                              {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                            {post.location && (
                              <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                <MapPin className="w-3 h-3" />
                                <span>{post.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {/* Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4 grid grid-cols-1 gap-4">
                        {post.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="rounded-lg w-full object-cover max-h-96"
                          />
                        ))}
                      </div>
                    )}

                    {/* Rating (for flight reviews) */}
                    {post.type === 'flight_review' && post.rating && (
                      <div className="mb-4 flex items-center space-x-2">
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          Rating:
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < post.rating!
                                  ? 'text-yellow-400 fill-current'
                                  : isDarkMode ? 'text-slate-600' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {post.airline && (
                          <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            • {post.airline} {post.flightNumber}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {post.hashtags.map((tag, index) => (
                          <span
                            key={index}
                            className={`text-sm px-3 py-1 rounded-full ${
                              isDarkMode
                                ? 'bg-slate-700 text-blue-400'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className={`flex items-center justify-between pt-4 border-t ${
                      isDarkMode ? 'border-slate-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-green-400' : 'text-gray-600 hover:text-green-600'
                        }`}>
                          <ThumbsUp className="w-5 h-5" />
                          <span>{post.likes}</span>
                        </button>
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'
                        }`}>
                          <ThumbsDown className="w-5 h-5" />
                          <span>{post.dislikes}</span>
                        </button>
                        <button className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'
                        }`}>
                          <MessageCircle className="w-5 h-5" />
                          <span>{post.comments}</span>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const postTypeLabel = post.type === 'airport_status' ? 'Airport Status' :
                                             post.type === 'flight_review' ? 'Flight Review' :
                                             post.type === 'travel_tip' ? 'Travel Tip' :
                                             post.type === 'alert' ? 'Alert' : 'Question';
                          setShareModalData({
                            isOpen: true,
                            postTitle: post.title,
                            postUrl: `${window.location.origin}/community/post/${post.id}`,
                            postType: postTypeLabel
                          });
                        }}
                        className={`flex items-center space-x-2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
                        }`}
                      >
                        <Share2 className="w-5 h-5" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(newPost) => {
          console.log('New post:', newPost);
          setShowCreateModal(false);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData({ ...shareModalData, isOpen: false })}
        postTitle={shareModalData.postTitle}
        postUrl={shareModalData.postUrl}
        postType={shareModalData.postType}
      />
    </div>
  );
};