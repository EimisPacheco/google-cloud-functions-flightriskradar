import React, { useState } from 'react';
import { 
  MessageCircle, 
  MapPin, 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  AlertTriangle,
  Star,
  Users,
  Search,
  Plus,
  CheckCircle,
  Info,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  X
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { NewPostModal } from '../components/features/NewPostModal';
import { RichTextDisplay } from '../components/features/RichTextDisplay';

interface CommunityPost {
  id: string;
  type: 'airport_status' | 'flight_review' | 'travel_tip' | 'alert' | 'question';
  title: string;
  content: string;
  author: string;
  authorReputation: number;
  timestamp: string;
  location: string;
  airline?: string;
  flightNumber?: string;
  rating?: number;
  likes: number;
  dislikes: number;
  comments: number;
  isVerified: boolean;
  tags: string[];
  urgent?: boolean;
  images?: string[];
}



export const TravelCommunityPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedAirport, setSelectedAirport] = useState<string>('all');
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [showNewPost, setShowNewPost] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [sharePost, setSharePost] = useState<CommunityPost | null>(null);

  // Mock community posts
  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      type: 'airport_status',
      title: 'JFK Terminal 4 - Security Wait Time',
      content: 'Currently 25-30 minute wait at security checkpoint. Lines are moving steadily. TSA PreCheck is much faster - only 5-10 minutes.',
      author: 'TravelerMike',
      authorReputation: 245,
      timestamp: '2 hours ago',
      location: 'JFK',
      likes: 18,
      dislikes: 2,
      comments: 5,
      isVerified: true,
      tags: ['security', 'wait-time', 'tsa-precheck'],
      urgent: false,
      images: [
        'https://images.pexels.com/photos/3807755/pexels-photo-3807755.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3807756/pexels-photo-3807756.jpeg?auto=compress&cs=tinysrgb&w=800'
      ]
    },
    {
      id: '2',
      type: 'flight_review',
      title: 'Delta DL1234 JFK-LAX Experience',
      content: 'Excellent flight! On-time departure, friendly crew, and clean aircraft. Entertainment system worked perfectly. Food was surprisingly good for economy. Would definitely recommend this route.',
      author: 'SarahTravels',
      authorReputation: 189,
      timestamp: '4 hours ago',
      location: 'JFK-LAX',
      airline: 'Delta',
      flightNumber: 'DL1234',
      rating: 5,
      likes: 12,
      dislikes: 1,
      comments: 3,
      isVerified: false,
      tags: ['delta', 'on-time', 'good-service'],
      images: [
        'https://images.pexels.com/photos/3807757/pexels-photo-3807757.jpeg?auto=compress&cs=tinysrgb&w=800'
      ]
    },
    {
      id: '3',
      type: 'alert',
      title: 'LAX Terminal 3 - Gate Change Alert',
      content: 'URGENT: American Airlines flights from Terminal 3 are experiencing gate changes due to construction. Check your boarding pass and airport screens. Allow extra time for navigation.',
      author: 'AirportHelper',
      authorReputation: 567,
      timestamp: '1 hour ago',
      location: 'LAX',
      airline: 'American Airlines',
      likes: 45,
      dislikes: 3,
      comments: 12,
      isVerified: true,
      tags: ['gate-change', 'construction', 'urgent'],
      urgent: true,
      images: [
        'https://images.pexels.com/photos/3807758/pexels-photo-3807758.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3807759/pexels-photo-3807759.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3807760/pexels-photo-3807760.jpeg?auto=compress&cs=tinysrgb&w=800'
      ]
    },
    {
      id: '4',
      type: 'travel_tip',
      title: 'Best Time to Arrive at ORD',
      content: 'Pro tip: Arrive 2.5 hours before domestic flights at O\'Hare during peak hours (6-9 AM, 4-7 PM). During off-peak, 2 hours is sufficient. The international terminal is usually less crowded.',
      author: 'ChicagoFlyer',
      authorReputation: 312,
      timestamp: '6 hours ago',
      location: 'ORD',
      likes: 28,
      dislikes: 2,
      comments: 8,
      isVerified: false,
      tags: ['arrival-time', 'peak-hours', 'tips']
    },
    {
      id: '5',
      type: 'question',
      title: 'MIA to SFO - Best Airline Choice?',
      content: 'Planning a trip from Miami to San Francisco next month. Looking for recommendations on the best airline for this route. Priority is on-time performance and comfort. Any recent experiences?',
      author: 'MiamiTraveler',
      authorReputation: 78,
      timestamp: '8 hours ago',
      location: 'MIA-SFO',
      likes: 5,
      dislikes: 0,
      comments: 15,
      isVerified: false,
      tags: ['recommendation', 'airline-choice', 'route']
    }
  ];

  // Airport/crowd themed images for demo posts
  const airportImages = [
    'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?auto=format&fit=crop&w=800&q=80', // busy terminal
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // people walking in airport
    'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80', // crowd at gate
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', // check-in area
    'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=800&q=80', // security line
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', // another terminal
  ];

  const filteredPosts = communityPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || post.type === selectedFilter;
    const matchesAirport = selectedAirport === 'all' || post.location.includes(selectedAirport);
    
    return matchesSearch && matchesFilter && matchesAirport;
  });

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'airport_status': return <MapPin className="w-4 h-4" />;
      case 'flight_review': return <Star className="w-4 h-4" />;
      case 'travel_tip': return <Info className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'question': return <MessageCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'airport_status': return 'text-blue-500';
      case 'flight_review': return 'text-yellow-500';
      case 'travel_tip': return 'text-green-500';
      case 'alert': return 'text-red-500';
      case 'question': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 200) return 'text-green-500';
    if (reputation >= 100) return 'text-blue-500';
    if (reputation >= 50) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const handleNewPost = (newPost: CommunityPost) => {
    // In a real app, this would save to a database
    // For now, we'll just add it to the beginning of the posts array
    communityPosts.unshift(newPost);
    // Force a re-render by updating state
    setShowNewPost(false);
  };

  const handleShare = (post: CommunityPost) => {
    setSharePost(post);
    setShowShareModal(true);
  };

  const shareToSocial = (platform: string) => {
    if (!sharePost) return;
    
    const text = `${sharePost.title} - ${sharePost.content.substring(0, 100)}...`;
    const url = window.location.href;
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(`${text}\n\n${url}`);
        alert('Link copied to clipboard!');
        setShowShareModal(false);
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg')] bg-cover bg-center opacity-10"></div>
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
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Share experiences, get real-time updates, and connect with fellow travelers" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                placeholder="Search posts, airports, or airlines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">All Posts</option>
                <option value="airport_status">Airport Status</option>
                <option value="flight_review">Flight Reviews</option>
                <option value="travel_tip">Travel Tips</option>
                <option value="alert">Alerts</option>
                <option value="question">Questions</option>
              </select>
              
              <select
                value={selectedAirport}
                onChange={(e) => setSelectedAirport(e.target.value)}
                className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="all">All Airports</option>
                <option value="JFK">JFK</option>
                <option value="LAX">LAX</option>
                <option value="ORD">ORD</option>
                <option value="MIA">MIA</option>
                <option value="SFO">SFO</option>
              </select>

              <button
                onClick={() => setShowNewPost(true)}
                className={`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  isDarkMode ? 'hover:bg-blue-500' : 'hover:bg-blue-700'
                }`}
              >
                <Plus className="w-4 h-4" />
                <TranslatedText text="New Post" targetLanguage={currentLanguage} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Community Feed" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Real-time updates and experiences from fellow travelers" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className={`p-6 rounded-xl border shadow-md transition-all ${
                  post.urgent 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getPostTypeColor(post.type)} bg-opacity-10`}>
                      {getPostTypeIcon(post.type)}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {post.title}
                        {post.isVerified && (
                          <CheckCircle className="inline w-4 h-4 ml-2 text-green-500" />
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                          {post.author}
                        </span>
                        <span className={`font-medium ${getReputationColor(post.authorReputation)}`}>
                          {post.authorReputation} pts
                        </span>
                        <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                          • {post.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {post.urgent && (
                    <div className="flex items-center space-x-1 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">URGENT</span>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                <div className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <RichTextDisplay content={post.content} />
                </div>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="mb-4">
                    <div className={`grid grid-cols-1 ${Math.min(post.images?.length || 0, 2) > 1 ? 'md:grid-cols-2' : ''} gap-3`}>
                      {post.images?.slice(0, 2).map((image, index) => (
                        <div key={index} className="relative group overflow-hidden rounded-lg shadow-md">
                          <img
                            src={
                              // Replace all images for demo/static posts with airport images unless user-uploaded
                              (image.startsWith('/static/') || image.startsWith('/images/') || image.startsWith('placeholder') || image.startsWith('data:') || image.includes('pexels.com') || image.includes('loremflickr.com') || image.includes('dummyimage.com'))
                                ? airportImages[index % airportImages.length]
                                : image
                            }
                            alt={`Post image ${index + 1}`}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className={`hidden absolute inset-0 flex items-center justify-center ${
                            isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className="text-sm">Image unavailable</span>
                          </div>
                          {Math.min(post.images?.length || 0, 2) > 1 && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                              {index + 1}/{Math.min(post.images?.length || 0, 2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Details */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <MapPin className="w-4 h-4" />
                      <span>{post.location}</span>
                    </span>
                    {post.airline && (
                      <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Star className="w-4 h-4" />
                        <span>{post.airline}</span>
                      </span>
                    )}
                    {post.rating && (
                      <span className={`flex items-center space-x-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{post.rating}/5</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-full ${
                          isDarkMode 
                            ? 'bg-slate-700 text-slate-300' 
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-6">
                    <button className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-700 text-slate-300' 
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}>
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-sm">{post.likes}</span>
                    </button>
                    <button className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-700 text-slate-300' 
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}>
                      <ThumbsDown className="w-4 h-4" />
                      <span className="text-sm">{post.dislikes}</span>
                    </button>
                    <button 
                      onClick={() => setSelectedPost(selectedPost === post.id ? '' : post.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-slate-700 text-slate-300' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{post.comments}</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleShare(post)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-slate-700 text-slate-300' 
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>

                {/* Comments Section (Expandable) */}
                {selectedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      <TranslatedText text="Comments" targetLanguage={currentLanguage} />
                    </h4>
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            FrequentFlyer
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            2 hours ago
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Thanks for the update! This is really helpful for planning my trip tomorrow.
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                            TravelExpert
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            1 hour ago
                          </span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Can confirm this information is accurate. Just went through security myself.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <TranslatedText text="Join the Travel Community" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText
              text="Share your experiences, help fellow travelers, and stay informed about airport conditions."
              targetLanguage={currentLanguage}
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => setShowNewPost(true)}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <TranslatedText text="Share Your Experience" targetLanguage={currentLanguage} />
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

      {/* New Post Modal */}
      <NewPostModal
        isOpen={showNewPost}
        onClose={() => setShowNewPost(false)}
        onSubmit={handleNewPost}
      />

      {/* Share Modal */}
      {showShareModal && sharePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full`}>
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <TranslatedText text="Share Post" targetLanguage={currentLanguage} />
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Twitter</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                  <span>Facebook</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="flex items-center justify-center space-x-2 p-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                  <span>LinkedIn</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('copy')}
                  className="flex items-center justify-center space-x-2 p-4 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 