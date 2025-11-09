import React, { useState } from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';

interface ReviewComment {
  id: string;
  text: string;
  sentiment: 'positive' | 'negative';
  originalUrl?: string;
}

interface ReviewCategory {
  name: string;
  positiveCount: number;
  negativeCount: number;
  positiveComments: ReviewComment[];
  negativeComments: ReviewComment[];
}

interface ReviewAnalysisProps {
  totalReviews: number;
  categories: ReviewCategory[];
}

export const ReviewAnalysis: React.FC<ReviewAnalysisProps> = ({ 
  totalReviews = 100, 
  categories = [] 
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Format category name by removing underscores and capitalizing
  const formatCategoryName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  // Handle comment click to go to original review
  const handleCommentClick = (comment: ReviewComment) => {
    if (comment.originalUrl) {
      window.open(comment.originalUrl, '_blank');
    }
  };

  // Get display comments (up to 10 total)
  const getDisplayComments = (category: ReviewCategory) => {
    const isExpanded = expandedCategories.has(category.name);
    const maxComments = isExpanded ? 10 : 3;
    
    const positiveComments = category.positiveComments.slice(0, Math.ceil(maxComments / 2));
    const negativeComments = category.negativeComments.slice(0, Math.floor(maxComments / 2));
    
    return { positiveComments, negativeComments };
  };

  return (
    <div className={`rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Top Highlights
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Key aspects mentioned in reviews
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          Analysis and summary based on {totalReviews} reviews | AI-powered
        </p>
      </div>

      {/* Categories */}
      <div className="p-4 space-y-4">
        {categories.map((category) => {
          const { positiveComments, negativeComments } = getDisplayComments(category);
          const hasMoreComments = (category.positiveComments.length + category.negativeComments.length) > 3;
          const isExpanded = expandedCategories.has(category.name);

          return (
            <div 
              key={category.name}
              className={`rounded-lg border ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-slate-200 bg-slate-50'}`}
            >
              {/* Category Header */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatCategoryName(category.name)}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {category.positiveCount > 0 && (
                      <span className="text-green-600 text-sm font-medium">
                        {category.positiveCount} positive
                      </span>
                    )}
                    {category.negativeCount > 0 && (
                      <span className="text-red-600 text-sm font-medium">
                        {category.negativeCount} negative
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Positive Comments */}
              {positiveComments.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center mb-2">
                    <ThumbsUp className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Positive:
                    </span>
                  </div>
                  <div className="space-y-2">
                    {positiveComments.map((comment) => (
                      <div 
                        key={comment.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          comment.originalUrl 
                            ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                            : ''
                        } ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}
                        onClick={() => handleCommentClick(comment)}
                        title={comment.originalUrl ? 'Click to view original review' : ''}
                      >
                        <div className="flex items-start">
                          <div className="w-1 h-full bg-blue-500 rounded mr-3 mt-1 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              "{comment.text}"
                            </p>
                            {comment.originalUrl && (
                              <div className="flex items-center mt-1">
                                <ExternalLink className="w-3 h-3 text-blue-500 mr-1" />
                                <span className="text-xs text-blue-500">View original</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative Comments */}
              {negativeComments.length > 0 && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center mb-2">
                    <ThumbsDown className="w-4 h-4 text-red-500 mr-2" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Negative:
                    </span>
                  </div>
                  <div className="space-y-2">
                    {negativeComments.map((comment) => (
                      <div 
                        key={comment.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          comment.originalUrl 
                            ? 'hover:bg-red-50 dark:hover:bg-red-900/20' 
                            : ''
                        } ${isDarkMode ? 'bg-slate-700' : 'bg-white'}`}
                        onClick={() => handleCommentClick(comment)}
                        title={comment.originalUrl ? 'Click to view original review' : ''}
                      >
                        <div className="flex items-start">
                          <div className="w-1 h-full bg-red-500 rounded mr-3 mt-1 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              "{comment.text}"
                            </p>
                            {comment.originalUrl && (
                              <div className="flex items-center mt-1">
                                <ExternalLink className="w-3 h-3 text-red-500 mr-1" />
                                <span className="text-xs text-red-500">View original</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand/Collapse Button */}
              {hasMoreComments && (
                <div className={`p-3 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className={`text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {isExpanded ? 'Show less' : `Show more (${category.positiveComments.length + category.negativeComments.length} total comments)`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 