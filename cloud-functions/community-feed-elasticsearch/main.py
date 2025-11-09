"""
Community Feed Search - Elasticsearch + Gemini Integration
AI Accelerate Hackathon - Elastic Challenge

Semantic search and discovery for community posts
"""

import functions_framework
from elasticsearch import Elasticsearch
import google.generativeai as genai
import json
import os
from typing import Dict, List, Any, Optional
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
    logger.warning("⚠️  Elasticsearch not configured")

ELASTICSEARCH_INDEX = "community_posts"


@functions_framework.http
def community_feed_elasticsearch(request):
    """
    Community Feed Search API with semantic search capabilities

    Endpoints:
    - POST /search - Semantic search with optional filters
    - POST /trending - Get trending topics/categories
    - POST /similar - Find similar posts
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
        data = request.get_json() or {}
        action = data.get('action', 'search')

        logger.info(f"Processing request - action: {action}")

        # Check if Elasticsearch is available
        if not es or not GOOGLE_API_KEY:
            logger.warning("Elasticsearch or Gemini not available")
            return (json.dumps({
                'success': False,
                'error': 'Search service not configured'
            }), 503, headers)

        # Route to appropriate handler
        if action == 'search':
            result = handle_search(data)
        elif action == 'trending':
            result = handle_trending(data)
        elif action == 'similar':
            result = handle_similar_posts(data)
        else:
            result = {
                'success': False,
                'error': f'Unknown action: {action}'
            }

        return (json.dumps(result), 200 if result.get('success') else 400, headers)

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return (json.dumps({
            'success': False,
            'error': str(e)
        }), 500, headers)


def handle_search(data: Dict) -> Dict:
    """
    Semantic search with filters

    Parameters:
    - query: Search query (required)
    - airport_code: Filter by airport (optional)
    - category: Filter by category (optional)
    - sentiment: Filter by sentiment (optional)
    - limit: Max results (default: 20)
    """

    query = data.get('query', '').strip()
    airport_code = data.get('airport_code')
    category = data.get('category')
    sentiment = data.get('sentiment')
    limit = data.get('limit', 20)

    if not query:
        return {
            'success': False,
            'error': 'query parameter required'
        }

    logger.info(f"Search: '{query}' airport={airport_code} category={category}")

    try:
        # Generate embedding for query
        embedding_response = genai.embed_content(
            model="models/embedding-001",
            content=query,
            task_type="retrieval_query"
        )

        # Build Elasticsearch query with filters
        search_body = {
            "knn": {
                "field": "content_embedding",
                "query_vector": embedding_response["embedding"],
                "k": limit,
                "num_candidates": min(500, limit * 10)
            },
            "size": limit
        }

        # Add filters if specified
        filters = []
        if airport_code:
            filters.append({"term": {"airport_code": airport_code.upper()}})
        if category:
            filters.append({"term": {"category": category.lower()}})
        if sentiment:
            filters.append({"term": {"sentiment": sentiment.lower()}})

        if filters:
            search_body["query"] = {
                "bool": {
                    "filter": filters
                }
            }

        # Execute search
        response = es.search(index=ELASTICSEARCH_INDEX, body=search_body)

        # Format results
        posts = []
        for hit in response["hits"]["hits"]:
            source = hit["_source"]
            posts.append({
                "post_id": source["post_id"],
                "username": source["username"],
                "airport_code": source["airport_code"],
                "airport_name": source["airport_name"],
                "category": source["category"],
                "content": source["content"],
                "sentiment": source["sentiment"],
                "likes": source["likes"],
                "replies": source["replies"],
                "verified": source["verified"],
                "created_at": source["created_at"],
                "relevance_score": hit["_score"]
            })

        logger.info(f"Found {len(posts)} posts")

        return {
            'success': True,
            'query': query,
            'total_results': len(posts),
            'posts': posts
        }

    except Exception as e:
        logger.error(f"Search error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def handle_trending(data: Dict) -> Dict:
    """
    Get trending topics and categories

    Parameters:
    - airport_code: Filter by airport (optional)
    - hours: Time window in hours (default: 24)
    """

    airport_code = data.get('airport_code')
    hours = data.get('hours', 24)

    logger.info(f"Trending: airport={airport_code} hours={hours}")

    try:
        # Build aggregation query
        agg_body = {
            "size": 0,
            "aggs": {
                "categories": {
                    "terms": {
                        "field": "category",
                        "size": 10
                    }
                },
                "airports": {
                    "terms": {
                        "field": "airport_code",
                        "size": 10
                    }
                },
                "sentiments": {
                    "terms": {
                        "field": "sentiment",
                        "size": 3
                    }
                },
                "top_posts": {
                    "top_hits": {
                        "sort": [{"likes": {"order": "desc"}}],
                        "size": 10
                    }
                }
            }
        }

        # Add airport filter if specified
        if airport_code:
            agg_body["query"] = {
                "term": {"airport_code": airport_code.upper()}
            }

        # Execute aggregation
        response = es.search(index=ELASTICSEARCH_INDEX, body=agg_body)

        # Format results
        categories = [
            {"name": bucket["key"], "count": bucket["doc_count"]}
            for bucket in response["aggregations"]["categories"]["buckets"]
        ]

        airports = [
            {"code": bucket["key"], "count": bucket["doc_count"]}
            for bucket in response["aggregations"]["airports"]["buckets"]
        ]

        sentiments = [
            {"sentiment": bucket["key"], "count": bucket["doc_count"]}
            for bucket in response["aggregations"]["sentiments"]["buckets"]
        ]

        top_posts = [
            {
                "post_id": hit["_source"]["post_id"],
                "content": hit["_source"]["content"],
                "airport_code": hit["_source"]["airport_code"],
                "category": hit["_source"]["category"],
                "likes": hit["_source"]["likes"]
            }
            for hit in response["aggregations"]["top_posts"]["hits"]["hits"]
        ]

        return {
            'success': True,
            'trending': {
                'categories': categories,
                'airports': airports,
                'sentiments': sentiments,
                'top_posts': top_posts
            }
        }

    except Exception as e:
        logger.error(f"Trending error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def handle_similar_posts(data: Dict) -> Dict:
    """
    Find posts similar to a given post

    Parameters:
    - post_id: ID of the post (required)
    - limit: Max results (default: 10)
    """

    post_id = data.get('post_id')
    limit = data.get('limit', 10)

    if not post_id:
        return {
            'success': False,
            'error': 'post_id parameter required'
        }

    logger.info(f"Similar posts for: {post_id}")

    try:
        # Get the original post
        original = es.get(index=ELASTICSEARCH_INDEX, id=post_id)

        if not original or "_source" not in original:
            return {
                'success': False,
                'error': 'Post not found'
            }

        # Use its embedding to find similar posts
        embedding = original["_source"]["content_embedding"]

        search_body = {
            "knn": {
                "field": "content_embedding",
                "query_vector": embedding,
                "k": limit + 1,  # +1 to account for the original post
                "num_candidates": min(500, (limit + 1) * 10)
            }
        }

        response = es.search(index=ELASTICSEARCH_INDEX, body=search_body)

        # Format results (exclude the original post)
        similar_posts = []
        for hit in response["hits"]["hits"]:
            if hit["_id"] == post_id:
                continue  # Skip original post

            source = hit["_source"]
            similar_posts.append({
                "post_id": source["post_id"],
                "username": source["username"],
                "airport_code": source["airport_code"],
                "category": source["category"],
                "content": source["content"],
                "sentiment": source["sentiment"],
                "likes": source["likes"],
                "similarity_score": hit["_score"]
            })

        # Limit to requested number
        similar_posts = similar_posts[:limit]

        return {
            'success': True,
            'original_post': {
                'post_id': original["_source"]["post_id"],
                'content': original["_source"]["content"]
            },
            'similar_posts': similar_posts,
            'total': len(similar_posts)
        }

    except Exception as e:
        logger.error(f"Similar posts error: {e}")
        return {
            'success': False,
            'error': str(e)
        }
