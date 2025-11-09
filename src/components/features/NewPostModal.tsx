import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Star, 
  AlertTriangle, 
  Info, 
  MessageCircle,
  Tag,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link,
  Save,
  MapPin as LocationIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: CommunityPost) => void;
}

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
  isDraft?: boolean;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  
  const [postType, setPostType] = useState<string>('airport_status');
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [airline, setAirline] = useState<string>('');
  const [flightNumber, setFlightNumber] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const postTypes = [
    {
      id: 'airport_status',
      name: 'Airport Status',
      icon: <MapPin className="w-5 h-5" />,
      color: 'text-blue-500',
      description: 'Real-time airport conditions, wait times, gate changes'
    },
    {
      id: 'flight_review',
      name: 'Flight Review',
      icon: <Star className="w-5 h-5" />,
      color: 'text-yellow-500',
      description: 'Share your flight experience and rate the service'
    },
    {
      id: 'travel_tip',
      name: 'Travel Tip',
      icon: <Info className="w-5 h-5" />,
      color: 'text-green-500',
      description: 'Share helpful advice and travel wisdom'
    },
    {
      id: 'alert',
      name: 'Alert',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-500',
      description: 'Urgent information that other travelers need to know'
    },
    {
      id: 'question',
      name: 'Question',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'text-purple-500',
      description: 'Ask the community for help or recommendations'
    }
  ];

  const airports = [
    'JFK', 'LAX', 'ORD', 'MIA', 'SFO', 'ATL', 'DFW', 'DEN', 'CLT', 'LAS',
    'PHX', 'IAH', 'MCO', 'SEA', 'EWR', 'MSP', 'DTW', 'BOS', 'PHL', 'LGA'
  ];

  const airlines = [
    'Delta', 'American Airlines', 'United', 'Southwest', 'JetBlue',
    'Alaska Airlines', 'Spirit', 'Frontier', 'Allegiant', 'Hawaiian'
  ];

  // Auto-save functionality
  useEffect(() => {
    if (!isOpen) return;

    const autoSaveTimer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        saveDraft();
      }
    }, 3000); // Auto-save every 3 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [title, content, location, airline, flightNumber, rating, tags, isUrgent, images, isOpen]);

  // Load draft on modal open
  useEffect(() => {
    if (isOpen) {
      loadDraft();
    }
  }, [isOpen]);

  // Real-time validation
  useEffect(() => {
    const errors: string[] = [];
    
    if (title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }
    
    if (content.trim().length < 10) {
      errors.push('Content must be at least 10 characters');
    }
    
    if (!location.trim()) {
      errors.push('Location is required');
    }
    
    if (postType === 'flight_review' && !airline.trim()) {
      errors.push('Airline is required for flight reviews');
    }
    
    if (images.length > 5) {
      errors.push('Maximum 5 images allowed');
    }
    
    setValidationErrors(errors);
  }, [title, content, location, airline, postType, images]);

  const saveDraft = () => {
    const draft = {
      postType,
      title,
      content,
      location,
      airline,
      flightNumber,
      rating,
      tags,
      isUrgent,
      images,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('travelCommunityDraft', JSON.stringify(draft));
    setIsAutoSaving(true);
    setLastSaved(new Date());
    
    setTimeout(() => setIsAutoSaving(false), 1000);
  };

  const loadDraft = () => {
    const savedDraft = localStorage.getItem('travelCommunityDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setPostType(draft.postType || 'airport_status');
        setTitle(draft.title || '');
        setContent(draft.content || '');
        setLocation(draft.location || '');
        setAirline(draft.airline || '');
        setFlightNumber(draft.flightNumber || '');
        setRating(draft.rating || 5);
        setTags(draft.tags || []);
        setIsUrgent(draft.isUrgent || false);
        setImages(draft.images || []);
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('travelCommunityDraft');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert('Image size must be less than 5MB');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatText = (format: string) => {
    if (!contentRef.current) return;
    
    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'list':
        formattedText = `• ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // In a real app, you'd reverse geocode to find nearest airport
          // For now, we'll show a success message
          alert('Location detected! Please select your airport from the dropdown.');
        },
        () => {
          alert('Unable to detect location. Please select manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    // Show validation errors only when user tries to submit
    setShowValidationErrors(true);
    
    if (validationErrors.length > 0) {
      return;
    }

    const newPost = {
      id: Date.now().toString(),
      type: postType as 'airport_status' | 'flight_review' | 'travel_tip' | 'alert' | 'question',
      title: title.trim(),
      content: content.trim(),
      author: 'CurrentUser',
      authorReputation: 150,
      timestamp: 'Just now',
      location: location.trim(),
      airline: airline || undefined,
      flightNumber: flightNumber || undefined,
      rating: postType === 'flight_review' ? rating : undefined,
      likes: 0,
      dislikes: 0,
      comments: 0,
      isVerified: false,
      tags: tags,
      urgent: isUrgent,
      images: images.length > 0 ? images : undefined,
      isDraft: false
    };

    onSubmit(newPost);
    clearDraft();
    handleClose();
  };

  const handleClose = () => {
    setPostType('airport_status');
    setTitle('');
    setContent('');
    setLocation('');
    setAirline('');
    setFlightNumber('');
    setRating(5);
    setTags([]);
    setNewTag('');
    setIsUrgent(false);
    setImages([]);
    setValidationErrors([]);
    setShowValidationErrors(false);
    setIsAutoSaving(false);
    setLastSaved(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">
              <TranslatedText text="Create New Post" targetLanguage={currentLanguage} />
            </h2>
            {isAutoSaving && (
              <div className="flex items-center space-x-1 text-blue-200">
                <Save className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {lastSaved && !isAutoSaving && (
              <div className="flex items-center space-x-1 text-blue-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Validation Errors */}
          {showValidationErrors && validationErrors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-red-800 dark:text-red-200">
                  <TranslatedText text="Please fix the following issues:" targetLanguage={currentLanguage} />
                </h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Post Type Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Post Type" targetLanguage={currentLanguage} />
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setPostType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    postType === type.id
                      ? isDarkMode
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                        ? 'border-slate-600 hover:border-slate-500'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${type.color} bg-opacity-10`}>
                      {type.icon}
                    </div>
                    <div>
                      <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {type.name}
                      </h3>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Title" targetLanguage={currentLanguage} />
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Content with Rich Text Formatting */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Content" targetLanguage={currentLanguage} />
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            {/* Formatting Toolbar */}
            <div className={`flex items-center space-x-2 p-2 border rounded-t-lg ${
              isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-300'
            }`}>
              <button
                onClick={() => formatText('bold')}
                className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('italic')}
                className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('list')}
                className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
                title="List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('link')}
                className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600 ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
                title="Link"
              >
                <Link className="w-4 h-4" />
              </button>
            </div>
            
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience, update, or question... Use **bold**, *italic*, • lists, and [links](url)"
              rows={4}
              className={`w-full px-4 py-3 border rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
              }`}
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Images" targetLanguage={currentLanguage} />
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({images.length}/5)
              </span>
            </label>
            
            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 5}
              className={`flex items-center space-x-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                images.length >= 5
                  ? 'border-slate-300 text-slate-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-200'
                    : 'border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              <span>
                <TranslatedText text="Add Images" targetLanguage={currentLanguage} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Location with GPS Detection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <TranslatedText text="Location" targetLanguage={currentLanguage} />
                <span className="text-red-500 ml-1">*</span>
              </label>
              <button
                onClick={detectLocation}
                className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
                  isDarkMode
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <LocationIcon className="w-3 h-3" />
                <span>Detect</span>
              </button>
            </div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">Select airport or route...</option>
              {airports.map((airport) => (
                <option key={airport} value={airport}>{airport}</option>
              ))}
              <option value="JFK-LAX">JFK-LAX</option>
              <option value="LAX-SFO">LAX-SFO</option>
              <option value="ORD-ATL">ORD-ATL</option>
              <option value="MIA-JFK">MIA-JFK</option>
              <option value="SFO-LAX">SFO-LAX</option>
            </select>
          </div>

          {/* Airline and Flight Number (for flight reviews) */}
          {postType === 'flight_review' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="Airline" targetLanguage={currentLanguage} />
                </label>
                <select
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  <option value="">Select airline...</option>
                  {airlines.map((airline) => (
                    <option key={airline} value={airline}>{airline}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="Flight Number" targetLanguage={currentLanguage} />
                </label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g., DL1234"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Rating (for flight reviews) */}
          {postType === 'flight_review' && (
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <TranslatedText text="Rating" targetLanguage={currentLanguage} />
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 rounded transition-colors ${
                      star <= rating
                        ? 'text-yellow-500'
                        : isDarkMode
                          ? 'text-slate-600'
                          : 'text-slate-300'
                    }`}
                  >
                    <Star className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
                  </button>
                ))}
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {rating}/5
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <TranslatedText text="Tags" targetLanguage={currentLanguage} />
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1 ${
                    isDarkMode
                      ? 'bg-slate-700 text-slate-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag..."
                className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                }`}
              />
              <button
                onClick={handleAddTag}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-blue-500' : 'hover:bg-blue-700'
                }`}
              >
                <Tag className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Urgent Toggle (for alerts) */}
          {postType === 'alert' && (
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="Mark as Urgent" targetLanguage={currentLanguage} />
                </span>
              </label>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <TranslatedText text="Urgent posts will be highlighted and prioritized in the feed" targetLanguage={currentLanguage} />
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <button
              onClick={saveDraft}
              className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:bg-slate-700 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <TranslatedText text="Save Draft" targetLanguage={currentLanguage} />
            </button>
            <button
              onClick={clearDraft}
              className={`px-4 py-2 text-sm transition-colors ${
                isDarkMode
                  ? 'text-slate-400 hover:text-slate-300'
                  : 'text-slate-600 hover:text-slate-700'
              }`}
            >
              <TranslatedText text="Clear Draft" targetLanguage={currentLanguage} />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className={`px-6 py-3 border rounded-lg font-semibold transition-colors ${
                isDarkMode
                  ? 'border-slate-600 hover:bg-slate-700 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <TranslatedText text="Cancel" targetLanguage={currentLanguage} />
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-3 rounded-lg font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              <TranslatedText text="Create Post" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 