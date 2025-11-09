import React, { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';

interface RateExperienceProps {
  type: 'airline' | 'airport';
  entityCode: string;
  entityName: string;
  onSuccess?: () => void;
}

const RateExperience: React.FC<RateExperienceProps> = ({
  type,
  entityCode,
  entityName,
  onSuccess
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Cloud Function URLs - Update these after deployment
  const CLOUD_FUNCTION_URLS = {
    airline: 'https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/insert-airline-review',
    airport: 'https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/insert-airport-review'
  };

  // Log when component mounts
  useEffect(() => {
    console.log(`📝 RateExperience form opened for ${type}:`, {
      type: type,
      code: entityCode,
      name: entityName,
      cloudFunctionUrl: CLOUD_FUNCTION_URLS[type]
    });
  }, [type, entityCode, entityName]);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const handleStarHover = (value: number) => {
    setHoverRating(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setSubmitStatus({
        type: 'error',
        message: 'Please select a rating'
      });
      return;
    }

    if (feedback.trim().length < 10) {
      setSubmitStatus({
        type: 'error',
        message: 'Feedback must be at least 10 characters'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const payload = type === 'airline' ? {
        airline_code: entityCode,
        airline_name: entityName,
        review_text: feedback.trim(),
        rating: rating,
        reviewer_name: authorName.trim() || 'Anonymous'
      } : {
        iata_code: entityCode,
        airport_name: entityName,
        review_text: feedback.trim(),
        rating: rating,
        author_name: authorName.trim() || 'Anonymous'
      };

      console.log(`🚀 Submitting ${type} review to BigQuery:`, {
        type: type,
        code: entityCode,
        name: entityName,
        rating: rating,
        reviewer: authorName.trim() || 'Anonymous',
        url: CLOUD_FUNCTION_URLS[type]
      });

      const response = await fetch(CLOUD_FUNCTION_URLS[type], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log(`📡 ${type} review API response:`, {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok && data.success) {
        console.log(`✅ ${type.toUpperCase()} REVIEW SUCCESSFULLY INSERTED TO BIGQUERY:`, {
          type: type,
          code: entityCode,
          name: entityName,
          rating: rating,
          reviewer: authorName.trim() || 'Anonymous',
          reviewText: feedback.trim(),
          timestamp: new Date().toISOString(),
          table: type === 'airline'
            ? 'airline_data.airline_reviews'
            : 'airline_data.airport_places_data'
        });

        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your feedback!'
        });

        // Reset form
        setRating(0);
        setFeedback('');
        setAuthorName('');

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error(`❌ ${type} review insertion FAILED:`, {
          status: response.status,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error(`❌ Error submitting ${type} review:`, {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: entityCode,
        name: entityName
      });
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div
      className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 shadow-xl border border-slate-700"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-xl font-semibold text-white mb-2">Rate Your Experience</h3>
      <p className="text-slate-300 text-sm mb-6">
        How would you rate this {type === 'airline' ? 'airline' : 'airport'}?
      </p>

      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        {/* Star Rating */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleStarClick(value)}
                onMouseEnter={() => handleStarHover(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${value} stars`}
              >
                <Star
                  className={`w-10 h-10 ${
                    value <= displayRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-slate-600 text-slate-600'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-slate-300 text-sm">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </p>
          )}
        </div>

        {/* Feedback Text */}
        <div className="mb-4">
          <label htmlFor="feedback" className="block text-sm font-medium text-slate-300 mb-2">
            Share your feedback
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What was your experience like?"
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-slate-400 mt-1">
            {feedback.length}/1000 characters
          </p>
        </div>

        {/* Author Name (Optional) */}
        <div className="mb-6">
          <label htmlFor="authorName" className="block text-sm font-medium text-slate-300 mb-2">
            Your name (optional)
          </label>
          <input
            id="authorName"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Anonymous"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={100}
          />
        </div>

        {/* Submit Status */}
        {submitStatus.type && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              submitStatus.type === 'success'
                ? 'bg-green-900/50 text-green-200 border border-green-700'
                : 'bg-red-900/50 text-red-200 border border-red-700'
            }`}
          >
            {submitStatus.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0 || feedback.trim().length < 10}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RateExperience;
