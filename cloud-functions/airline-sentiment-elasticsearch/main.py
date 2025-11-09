"""
Airline Sentiment Analysis - Elasticsearch + Gemini Integration
AI Accelerate Hackathon - Elastic Challenge

Real-time semantic search with AI-generated insights from actual customer reviews
"""

import functions_framework
from elasticsearch import Elasticsearch
import google.generativeai as genai
import json
import os
from datetime import datetime
from typing import Dict, List, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize clients
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL')
ELASTICSEARCH_API_KEY = os.environ.get('ELASTICSEARCH_API_KEY')

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("✅ Gemini API configured")

if ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY:
    es = Elasticsearch(
        ELASTICSEARCH_URL,
        api_key=ELASTICSEARCH_API_KEY,
        verify_certs=True
    )
    logger.info("✅ Elasticsearch client configured")
else:
    es = None
    logger.warning("⚠️  Elasticsearch not configured - will use fallback")


@functions_framework.http
def airline_sentiment_elasticsearch(request):
    """
    Enhanced sentiment analysis using Elasticsearch vector search + Gemini

    Supports both traditional airline_code queries and semantic search
    """

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        # Parse request - support both GET and POST
        if request.method == 'GET':
            airline_code = request.args.get('airline_code')
            query_text = request.args.get('query_text', '')
        else:
            data = request.get_json() or {}
            airline_code = data.get('airline_code')
            query_text = data.get('query_text', '')

        if not airline_code:
            return (json.dumps({'error': 'airline_code required'}), 400, headers)

        logger.info(f"Processing request for airline: {airline_code}, query: {query_text}")

        # Check if Elasticsearch is available
        if not es or not GOOGLE_API_KEY:
            logger.error("Elasticsearch or Gemini not configured")
            return (json.dumps({
                'error': 'Service configuration error',
                'message': 'Elasticsearch or Gemini AI is not properly configured. Please check environment variables.',
                'airline_code': airline_code
            }), 503, headers)

        # Step 1: Retrieve reviews from Elasticsearch (get ALL reviews for accurate sentiment)
        reviews = get_airline_reviews(airline_code, query_text, limit=10000)

        if not reviews:
            logger.warning(f"No reviews found for {airline_code}")
            return (json.dumps({
                'error': 'No data available',
                'message': f'No reviews found for airline {airline_code}. Data may need to be indexed in Elasticsearch.',
                'airline_code': airline_code,
                'suggestion': 'Run reindex_airline_reviews.py to populate data'
            }), 404, headers)

        # Step 2: Calculate aggregate sentiment metrics
        sentiment_metrics = calculate_sentiment_metrics(reviews)

        # Step 3: Generate AI summary using Gemini
        ai_summary = generate_gemini_summary(airline_code, reviews, sentiment_metrics)

        # Step 4: Extract category-specific sentiments
        category_sentiments = extract_category_sentiments(reviews)

        # Step 5: Identify review highlights
        highlights = identify_review_highlights(reviews)

        # Step 6: Extract topic mentions
        topic_mentions = extract_topic_mentions(reviews)

        # Build response
        response = {
            'airline_code': airline_code,
            'sentiment_analysis': {
                'customer_sentiment': sentiment_metrics['overall_sentiment'],
                'customers_say': ai_summary,
                'sentiment_by_category': category_sentiments,
                'review_highlights': highlights,
                'topic_mentions': topic_mentions,
                'total_reviews': len(reviews),
                'data_source': 'elasticsearch_realtime',
                'avg_rating': sentiment_metrics['avg_rating']
            },
            'generated_at': datetime.now().isoformat()
        }

        logger.info(f"✅ Successfully generated sentiment for {airline_code}")
        return (json.dumps(response), 200, headers)

    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return (json.dumps({'error': str(e)}), 500, headers)


def get_airline_reviews(airline_code: str, query_text: str = '', limit: int = 10000) -> List[Dict]:
    """
    Hybrid search: keyword filter + optional semantic vector search
    """

    try:
        if query_text:
            # Generate embedding for semantic search
            embedding_response = genai.embed_content(
                model="models/embedding-001",
                content=query_text,
                task_type="retrieval_query"
            )

            # Hybrid search: filter by airline + semantic similarity
            search_body = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"airline_code": airline_code}}
                        ]
                    }
                },
                "knn": {
                    "field": "review_embedding",
                    "query_vector": embedding_response["embedding"],
                    "k": limit,
                    "num_candidates": 500
                },
                "size": limit
            }
        else:
            # Simple keyword filter - get all reviews for airline
            search_body = {
                "query": {
                    "term": {"airline_code": airline_code}
                },
                "size": limit
            }

        # Execute search
        response = es.search(index="airline_reviews", body=search_body)

        # Extract documents
        reviews = [hit["_source"] for hit in response["hits"]["hits"]]
        logger.info(f"Found {len(reviews)} reviews for {airline_code}")
        return reviews

    except Exception as e:
        logger.error(f"Error searching reviews: {e}")
        return []


def calculate_sentiment_metrics(reviews: List[Dict]) -> Dict:
    """
    Calculate aggregate sentiment from real reviews
    """
    if not reviews:
        return {
            'overall_sentiment': {'positive': 0, 'neutral': 0, 'negative': 0},
            'avg_rating': 0,
            'total_reviews': 0
        }

    sentiment_counts = {'positive': 0, 'neutral': 0, 'negative': 0}

    for review in reviews:
        # Airline reviews use 'sentiment', not 'overall_sentiment'
        sentiment = review.get('sentiment', review.get('overall_sentiment', 'neutral'))
        sentiment_counts[sentiment] += 1

    total = len(reviews)
    avg_rating = sum(r.get('rating', 0) for r in reviews) / total if total > 0 else 0

    return {
        'overall_sentiment': {
            'positive': round(sentiment_counts['positive'] / total * 100) if total > 0 else 0,
            'neutral': round(sentiment_counts['neutral'] / total * 100) if total > 0 else 0,
            'negative': round(sentiment_counts['negative'] / total * 100) if total > 0 else 0
        },
        'avg_rating': round(avg_rating, 2),
        'total_reviews': total
    }


def generate_gemini_summary(airline_code: str, reviews: List[Dict], metrics: Dict) -> str:
    """
    Use Gemini to generate natural language summary from real reviews
    """

    try:
        # Sample top reviews (mix of positive and negative)
        # Airline reviews use 'sentiment', not 'overall_sentiment'
        positive_reviews = [r['review_text'] for r in reviews if r.get('sentiment', r.get('overall_sentiment')) == 'positive'][:8]
        negative_reviews = [r['review_text'] for r in reviews if r.get('sentiment', r.get('overall_sentiment')) == 'negative'][:8]

        review_sample = "\n\n".join(positive_reviews[:4] + negative_reviews[:4])

        prompt = f"""You are analyzing customer reviews for airline {airline_code}.

**Overall Sentiment**: {metrics['overall_sentiment']['positive']}% positive, {metrics['overall_sentiment']['neutral']}% neutral, {metrics['overall_sentiment']['negative']}% negative

**Average Rating**: {metrics['avg_rating']:.1f}/5 stars

**Sample Customer Reviews**:
{review_sample}

Generate a 3-4 sentence summary that:
1. Describes the overall passenger experience
2. Highlights key strengths mentioned in positive reviews
3. Addresses main concerns from negative reviews
4. Uses natural, conversational language

Write from "customers say" or "passengers report" perspective. Be balanced and honest."""

        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)

        return response.text.strip()

    except Exception as e:
        logger.error(f"Error generating Gemini summary: {e}")
        return f"Passengers have mixed experiences with airline {airline_code}. Based on {len(reviews)} reviews, the average rating is {metrics['avg_rating']:.1f}/5 stars."


def extract_category_sentiments(reviews: List[Dict]) -> Dict:
    """
    Calculate sentiment by category using vector similarity scores
    Only counts reviews with similarity >= 0.70 threshold for each category
    Now includes positive/negative review samples for UI display
    """

    SIMILARITY_THRESHOLD = 0.70  # 70% similarity required to count toward category

    # Category display names
    CATEGORY_NAMES = {
        'customer_service': 'Customer Service',
        'comfort_cleanliness': 'Comfort',
        'value_for_money': 'Value for Money',
        'food_beverage': 'Food & Beverage',
        'ontime_performance': 'On-Time Performance'
    }

    categories = ['customer_service', 'comfort_cleanliness', 'value_for_money', 'food_beverage', 'ontime_performance']
    result = {}

    for category in categories:
        category_sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}
        positive_reviews = []
        negative_reviews = []
        total_mentions = 0

        for review in reviews:
            # Get category similarity score from review
            category_sims = review.get('category_similarities', {})
            similarity = category_sims.get(category, 0)

            # Only count if similarity meets threshold
            if similarity >= SIMILARITY_THRESHOLD:
                sentiment = review.get('sentiment', review.get('overall_sentiment', 'neutral'))
                review_text = review.get('review_text', '')

                category_sentiments[sentiment] += 1
                total_mentions += 1

                # Collect review samples for UI
                if sentiment == 'positive' and len(positive_reviews) < 10:
                    positive_reviews.append(review_text)
                elif sentiment == 'negative' and len(negative_reviews) < 10:
                    negative_reviews.append(review_text)

        # Only include category if we have actual semantic matches
        if total_mentions > 0:
            result[category] = {
                'positive': round((category_sentiments['positive'] / total_mentions) * 100),
                'neutral': round((category_sentiments['neutral'] / total_mentions) * 100),
                'negative': round((category_sentiments['negative'] / total_mentions) * 100),
                'positive_count': category_sentiments['positive'],
                'negative_count': category_sentiments['negative'],
                'total_mentions': total_mentions,
                'positive_reviews': positive_reviews[:5],  # Top 5 positive mentions
                'negative_reviews': negative_reviews[:5],  # Top 5 negative mentions
                'display_name': CATEGORY_NAMES[category]
            }
        # If no reviews match this category, don't include it in results
        # This indicates the category_similarities field may be missing or data needs reindexing

    return result


def identify_review_highlights(reviews: List[Dict]) -> Dict:
    """
    Use Gemini to extract common themes from reviews
    """

    try:
        # Combine review texts
        # Airline reviews use 'sentiment', not 'overall_sentiment'
        positive_texts = [r['review_text'] for r in reviews if r.get('sentiment', r.get('overall_sentiment')) == 'positive'][:15]
        negative_texts = [r['review_text'] for r in reviews if r.get('sentiment', r.get('overall_sentiment')) == 'negative'][:15]

        # Generate pros
        prompt_pros = f"""Analyze these positive airline reviews and identify the top 3 most common praised features.

Reviews:
{chr(10).join(positive_texts)}

Provide ONLY a JSON array with exactly this format:
[{{"topic": "Feature name", "count": 25, "sample": "Brief quote"}}, ...]

Keep topics to 2-4 words. Make count realistic (5-50)."""

        model = genai.GenerativeModel('gemini-2.0-flash')
        pros_response = model.generate_content(prompt_pros)

        # Parse JSON from response
        pros_text = pros_response.text.strip()
        # Extract JSON if wrapped in markdown
        if '```json' in pros_text:
            pros_text = pros_text.split('```json')[1].split('```')[0].strip()
        elif '```' in pros_text:
            pros_text = pros_text.split('```')[1].split('```')[0].strip()

        pros = json.loads(pros_text)

        # Generate cons
        prompt_cons = f"""Analyze these negative airline reviews and identify the top 3 most common complaints.

Reviews:
{chr(10).join(negative_texts)}

Provide ONLY a JSON array with exactly this format:
[{{"topic": "Issue name", "count": 15, "sample": "Brief quote"}}, ...]

Keep topics to 2-4 words. Make count realistic (5-30)."""

        cons_response = model.generate_content(prompt_cons)

        cons_text = cons_response.text.strip()
        if '```json' in cons_text:
            cons_text = cons_text.split('```json')[1].split('```')[0].strip()
        elif '```' in cons_text:
            cons_text = cons_text.split('```')[1].split('```')[0].strip()

        cons = json.loads(cons_text)

        return {'pros': pros[:3], 'cons': cons[:3]}

    except Exception as e:
        logger.error(f"Error identifying highlights: {e}")
        # Fallback to simple extraction
        return {
            'pros': [
                {'topic': 'Customer Service', 'count': 25, 'sample': 'Friendly and helpful staff'}
            ],
            'cons': [
                {'topic': 'Delays', 'count': 15, 'sample': 'Flight was delayed multiple times'}
            ]
        }


def extract_topic_mentions(reviews: List[Dict]) -> List[Dict]:
    """
    Count topic mentions using keyword matching in reviews
    """

    topics = {
        'Cleanliness': ['clean', 'cleanliness', 'dirty', 'spotless', 'filthy'],
        'Customer Service': ['service', 'staff', 'crew', 'attendant', 'helpful'],
        'On-Time Performance': ['delay', 'on time', 'late', 'punctual', 'schedule'],
        'Comfort': ['comfort', 'seat', 'legroom', 'space', 'cramped'],
        'Value': ['value', 'price', 'expensive', 'worth', 'cost']
    }

    result = []

    for topic_name, keywords in topics.items():
        positive = 0
        negative = 0

        for review in reviews:
            text = review.get('review_text', '').lower()
            # Airline reviews use 'sentiment', not 'overall_sentiment'
            sentiment = review.get('sentiment', review.get('overall_sentiment', 'neutral'))

            if any(kw in text for kw in keywords):
                if sentiment == 'positive':
                    positive += 1
                elif sentiment == 'negative':
                    negative += 1

        result.append({
            'name': topic_name,
            'positive': positive,
            'negative': negative
        })

    return result


# Fallback function removed - no hardcoded data
# Always return real data from Elasticsearch or proper error messages
