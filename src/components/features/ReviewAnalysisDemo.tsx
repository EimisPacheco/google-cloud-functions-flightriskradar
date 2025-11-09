import React from 'react';
import { ReviewAnalysis } from './ReviewAnalysis';

// Sample data that matches the user's requirements
const sampleReviewData = {
  totalReviews: 100,
  categories: [
    {
      name: 'value_for_money',
      positiveCount: 8,
      negativeCount: 2,
      positiveComments: [
        {
          id: '1',
          text: 'Great value for money',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/1'
        },
        {
          id: '2',
          text: 'This was the best travel stay I\'ve ever had. It beat out all hotels and other airbnbs I\'ve ever been to.',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/2'
        },
        {
          id: '3',
          text: 'Excellent price for the quality and location',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/3'
        },
        {
          id: '4',
          text: 'Worth every penny, highly recommend',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/4'
        },
        {
          id: '5',
          text: 'Affordable luxury, great amenities',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/5'
        },
        {
          id: '6',
          text: 'Perfect balance of cost and comfort',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/6'
        },
        {
          id: '7',
          text: 'Budget-friendly without compromising quality',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/7'
        },
        {
          id: '8',
          text: 'Great deal for what you get',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/8'
        }
      ],
      negativeComments: [
        {
          id: '9',
          text: 'A bit expensive for the area',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/9'
        },
        {
          id: '10',
          text: 'Not worth the price tag',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/10'
        }
      ]
    },
    {
      name: 'accuracy_of_listing',
      positiveCount: 7,
      negativeCount: 3,
      positiveComments: [
        {
          id: '11',
          text: 'Place was exactly as described',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/11'
        },
        {
          id: '12',
          text: 'Everything was very clean and as described',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/12'
        },
        {
          id: '13',
          text: 'Photos accurately represent the property',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/13'
        },
        {
          id: '14',
          text: 'Description matched reality perfectly',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/14'
        },
        {
          id: '15',
          text: 'No surprises, everything as advertised',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/15'
        },
        {
          id: '16',
          text: 'Accurate listing, honest host',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/16'
        },
        {
          id: '17',
          text: 'What you see is what you get',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/17'
        }
      ],
      negativeComments: [
        {
          id: '18',
          text: 'Photos were misleading',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/18'
        },
        {
          id: '19',
          text: 'Not as described in the listing',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/19'
        },
        {
          id: '20',
          text: 'Disappointed with the accuracy',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/20'
        }
      ]
    },
    {
      name: 'check_in_process',
      positiveCount: 6,
      negativeCount: 1,
      positiveComments: [
        {
          id: '21',
          text: 'Check in and out was super easy',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/21'
        },
        {
          id: '22',
          text: 'Easy check in',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/22'
        },
        {
          id: '23',
          text: 'Smooth check-in process',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/23'
        },
        {
          id: '24',
          text: 'Host made check-in very convenient',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/24'
        },
        {
          id: '25',
          text: 'Quick and hassle-free check-in',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/25'
        },
        {
          id: '26',
          text: 'Excellent check-in instructions',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/26'
        }
      ],
      negativeComments: [
        {
          id: '27',
          text: 'Check-in was confusing and delayed',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/27'
        }
      ]
    },
    {
      name: 'noise_levels',
      positiveCount: 4,
      negativeCount: 4,
      positiveComments: [
        {
          id: '28',
          text: 'Very quiet and peaceful',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/28'
        },
        {
          id: '29',
          text: 'Perfect for a quiet getaway',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/29'
        },
        {
          id: '30',
          text: 'No noise issues at all',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/30'
        },
        {
          id: '31',
          text: 'Serene and quiet location',
          sentiment: 'positive' as const,
          originalUrl: 'https://example.com/review/31'
        }
      ],
      negativeComments: [
        {
          id: '32',
          text: 'Too noisy from street traffic',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/32'
        },
        {
          id: '33',
          text: 'Could hear neighbors clearly',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/33'
        },
        {
          id: '34',
          text: 'Construction noise during the day',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/34'
        },
        {
          id: '35',
          text: 'Loud air conditioning unit',
          sentiment: 'negative' as const,
          originalUrl: 'https://example.com/review/35'
        }
      ]
    }
  ]
};

export const ReviewAnalysisDemo: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Review Analysis Demo</h2>
      <ReviewAnalysis 
        totalReviews={sampleReviewData.totalReviews}
        categories={sampleReviewData.categories}
      />
    </div>
  );
}; 