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
  Loader2
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';

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
      title: 'Airport Status',
      description: 'Real-time airport conditions, wait times, gate changes',
      color: 'blue'
    },
    {
      type: 'flight_review' as const,
      icon: Star,
      title: 'Flight Review',
      description: 'Share your flight experience and rate the service',
      color: 'yellow'
    },
    {
      type: 'travel_tip' as const,
      icon: Shield,
      title: 'Travel Tip',
      description: 'Share helpful advice and travel wisdom',
      color: 'green'
    },
    {
      type: 'alert' as const,
      icon: AlertTriangle,
      title: 'Alert',
      description: 'Urgent information that other travelers need to know',
      color: 'red'
    },
    {
      type: 'question' as const,
      icon: HelpCircle,
      title: 'Question',
      description: 'Ask the community for help or recommendations',
      color: 'purple'
    }
  ];

  const handleSubmit = () => {
    if (postType && title && content) {
      onSubmit({
        type: postType,
        title,
        content,
        images
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-blue-600">
          <h2 className="text-2xl font-bold text-white">
            <TranslatedText text="Create New Post" targetLanguage={currentLanguage} />
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-blue-700 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 relative">
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          {/* Post Type Selection */}
          <div>
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <TranslatedText text="Post Type" targetLanguage={currentLanguage} /> *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = postType === type.type;
                return (
                  <button
                    key={type.type}
                    onClick={() => setPostType(type.type)}
                    className={`p-4 rounded-lg border-2 transition-all backdrop-blur-md hover:scale-105 transform ${
                      isSelected
                        ? isDarkMode
                          ? type.color === 'blue' ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20' :
                            type.color === 'yellow' ? 'border-yellow-400 bg-yellow-500/20 shadow-lg shadow-yellow-500/20' :
                            type.color === 'green' ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20' :
                            type.color === 'red' ? 'border-red-400 bg-red-500/20 shadow-lg shadow-red-500/20' :
                            'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                          : type.color === 'blue' ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/10' :
                            type.color === 'yellow' ? 'border-yellow-400 bg-yellow-500/10 shadow-lg shadow-yellow-500/10' :
                            type.color === 'green' ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-500/10' :
                            type.color === 'red' ? 'border-red-400 bg-red-500/10 shadow-lg shadow-red-500/10' :
                            'border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                        : isDarkMode
                          ? 'border-slate-600/50 hover:border-slate-500/50 bg-slate-700/30 hover:bg-slate-700/50'
                          : 'border-gray-200/50 hover:border-gray-300/50 bg-white/30 hover:bg-white/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm shadow-lg ${
                      type.color === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30' :
                      type.color === 'yellow' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-500/30' :
                      type.color === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30' :
                      type.color === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30' :
                      'bg-gradient-to-br from-purple-400 to-purple-600 shadow-purple-500/30'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {type.title}
                    </div>
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {type.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <TranslatedText text="Title" targetLanguage={currentLanguage} /> *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          {/* Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <TranslatedText text="Content" targetLanguage={currentLanguage} /> *
            </label>
            <div className={`border rounded-lg ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`}>
              {/* Editor Toolbar */}
              <div className={`flex items-center gap-2 p-3 border-b ${
                isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <button className={`p-2 rounded ${isDarkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                  <Bold className="w-4 h-4" />
                </button>
                <button className={`p-2 rounded ${isDarkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                  <Italic className="w-4 h-4" />
                </button>
                <button className={`p-2 rounded ${isDarkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                  <List className="w-4 h-4" />
                </button>
                <button className={`p-2 rounded ${isDarkMode ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-600'}`}>
                  <Link className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder='Share your experience, update, or question... Use **bold**, *italic*, • lists, and [links](url)'
                className={`w-full p-4 focus:outline-none resize-none ${
                  isDarkMode 
                    ? 'bg-slate-700 text-white placeholder-slate-400' 
                    : 'bg-white text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <TranslatedText text="Images" targetLanguage={currentLanguage} /> (0/5)
            </label>
            <button
              className={`flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                isDarkMode 
                  ? 'border-slate-600 hover:border-slate-500 text-slate-300' 
                  : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>Add Images</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 flex justify-between items-center p-6 border-t ${
          isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex gap-3">
            <button className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}>
              <TranslatedText text="Save Draft" targetLanguage={currentLanguage} />
            </button>
            <button className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-slate-400 hover:text-slate-300' 
                : 'text-gray-600 hover:text-gray-700'
            }`}>
              <TranslatedText text="Clear Draft" targetLanguage={currentLanguage} />
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <TranslatedText text="Cancel" targetLanguage={currentLanguage} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!postType || !title || !content}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TranslatedText text="Create Post" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunityFeedPage: React.FC = () => {
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
  
  // Sample posts data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      type: 'airport_status',
      title: 'JFK Terminal 4 - Security Wait Time',
      content: 'Currently 25-30 minute wait at security checkpoint. Lines are moving steadily. TSA PreCheck is much faster - only 5-10 minutes.',
      author: 'TravelerMike',
      authorReputation: 245,
      timestamp: '2 hours ago',
      likes: 18,
      dislikes: 2,
      comments: 5,
      shares: 3,
      images: ['https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&h=400&fit=crop'],
      hashtags: ['#security', '#wait-time', '#tsa-precheck'],
      location: 'JFK',
      verified: true
    },
    {
      id: '2',
      type: 'flight_review',
      title: 'Amazing experience on Delta DL450 JFK-LAX',
      content: 'Just landed after a smooth 5.5 hour flight. The crew was exceptional, especially during some turbulence over Colorado. In-flight entertainment worked perfectly, and the WiFi was surprisingly fast. Food was better than expected for economy.',
      author: 'SkyFrequent',
      authorReputation: 892,
      timestamp: '5 hours ago',
      likes: 45,
      dislikes: 3,
      comments: 12,
      shares: 8,
      images: ['https://images.unsplash.com/photo-1529074963764-98f45c47344b?w=800&h=400&fit=crop'],
      hashtags: ['#delta', '#review', '#jfk-lax'],
      verified: true
    },
    {
      id: '3',
      type: 'travel_tip',
      title: 'Hidden gem: Free shower facilities at LAX T5',
      content: 'Found out there are free shower facilities in Terminal 5 near gate 53. Perfect for those long layovers or red-eye arrivals. Bring your own towel though!',
      author: 'LAXExplorer',
      authorReputation: 156,
      timestamp: '1 day ago',
      likes: 234,
      dislikes: 5,
      comments: 28,
      shares: 45,
      images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=400&fit=crop'],
      hashtags: ['#LAX', '#travel-tip', '#shower', '#layover'],
      location: 'LAX'
    },
    {
      id: '4',
      type: 'alert',
      title: 'Gate change alert - All United flights Terminal B',
      content: 'Major gate changes happening right now at EWR Terminal B. United flights are being moved around due to equipment issues. Check monitors!',
      author: 'EWRSpotter',
      authorReputation: 423,
      timestamp: '30 minutes ago',
      likes: 89,
      dislikes: 1,
      comments: 15,
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
              <TranslatedText text="Community Feed" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Real-time updates from fellow travelers around the world" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Controls Section */}
      <section className={`sticky top-0 z-40 ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'} shadow-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search and Create */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                placeholder="Search posts, hashtags, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">
                <TranslatedText text="Create Post" targetLanguage={currentLanguage} />
              </span>
            </button>
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
                  className="relative group"
                  style={{
                    '--card-bg': isDarkMode ? '#1e293b' : '#ffffff'
                  } as React.CSSProperties}
                >
                  {/* Border glow effect */}
                  <div className="border-glow"></div>
                  
                  {/* Card content */}
                  <div className={`relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 ${
                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                  }`}>
                  {/* Post Image Section */}
                  {post.images.length > 0 && (
                    <div className="relative overflow-hidden">
                      <img
                        src={post.images[0]}
                        alt={`${post.title}`}
                        className="w-full h-64 object-cover"
                      />
                      {/* Post Type Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2 ${
                        color === 'blue' ? 'bg-blue-500/90 text-white' :
                        color === 'yellow' ? 'bg-yellow-500/90 text-white' :
                        color === 'green' ? 'bg-green-500/90 text-white' :
                        color === 'red' ? 'bg-red-500/90 text-white' :
                        'bg-purple-500/90 text-white'
                      }`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {post.type === 'airport_status' ? 'Airport Status' :
                           post.type === 'flight_review' ? 'Flight Review' :
                           post.type === 'travel_tip' ? 'Travel Tip' :
                           post.type === 'alert' ? 'Alert' : 'Question'}
                        </span>
                      </div>
                      {/* Image count indicator if multiple images */}
                      {post.images.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          1/{post.images.length}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Post Header */}
                  <div className={`p-6 ${
                    isDarkMode ? 'bg-slate-800' : 'bg-white'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                        }`}>
                          <Users className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {post.author}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {post.authorReputation} pts
                            </span>
                            {post.verified && (
                              <span className="text-blue-500" title="Verified">✓</span>
                            )}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {post.location && (
                              <>
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {post.location} • 
                              </>
                            )}
                            {post.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {post.title}
                    </h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {post.content}
                    </p>


                    {/* Hashtags */}
                    {post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-sm px-2 py-1 rounded ${
                              isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className={`flex items-center justify-between pt-4 border-t ${
                      isDarkMode ? 'border-slate-700' : 'border-slate-200'
                    }`}>
                      <div className="flex items-center gap-4">
                        <button className={`flex items-center gap-2 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}>
                          <ThumbsUp className="w-5 h-5" />
                          <span>{post.likes}</span>
                        </button>
                        <button className={`flex items-center gap-2 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}>
                          <ThumbsDown className="w-5 h-5" />
                          <span>{post.dislikes}</span>
                        </button>
                        <button className={`flex items-center gap-2 ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
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
                        className={`flex items-center gap-2 ${
                        isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}>
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                      </button>
                    </div>
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

export default CommunityFeedPage;