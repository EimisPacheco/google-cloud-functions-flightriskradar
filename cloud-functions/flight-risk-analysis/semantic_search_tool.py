"""
Semantic Search Tool for ChatBot
Enables conversational queries across all airline and airport reviews
For AI Accelerate Hackathon - Elastic Challenge
"""

from elasticsearch import Elasticsearch
import google.generativeai as genai
import os
from typing import List, Dict, Any
import logging
import re

# Import BigQuery tool for dynamic airline/airport data
from bigquery_tool import get_all_airlines, get_all_airports

logger = logging.getLogger(__name__)

# Initialize clients
ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL')
ELASTICSEARCH_API_KEY = os.environ.get('ELASTICSEARCH_API_KEY')
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# Configure Gemini AI for embeddings
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info("✅ Semantic Search: Gemini AI configured")
else:
    logger.warning("⚠️ Semantic Search: Gemini AI not configured")

# Configure Elasticsearch
es = None
if ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY:
    try:
        es = Elasticsearch(
            ELASTICSEARCH_URL,
            api_key=ELASTICSEARCH_API_KEY,
            verify_certs=True
        )
        logger.info("✅ Semantic Search: Elasticsearch client initialized")
    except Exception as e:
        logger.error(f"❌ Semantic Search: Elasticsearch init failed: {e}")
        es = None
else:
    logger.warning("⚠️ Semantic Search: Elasticsearch not configured")


# Module-level cache for entity patterns
_entity_patterns_cache = None

def _build_entity_patterns():
    """Build entity patterns from BigQuery data (cached)"""
    global _entity_patterns_cache

    if _entity_patterns_cache is not None:
        return _entity_patterns_cache

    airlines = get_all_airlines()
    airports = get_all_airports()

    airline_patterns = []
    for airline in airlines:
        search_terms = airline.get('search_patterns', [])
        if search_terms:
            search_terms = [term for term in search_terms if term]
            if search_terms:
                pattern_str = '|'.join(re.escape(term) for term in search_terms)
                pattern = rf'\b({pattern_str})\b'
                # Use airline name for display (extract first word if multi-word)
                display_name = airline['name'].split()[0] if airline['name'] else airline['code']
                airline_patterns.append((pattern, airline['code'], display_name))

    airport_patterns = []
    for airport in airports:
        search_terms = airport.get('search_patterns', [])
        if search_terms:
            search_terms = [term for term in search_terms if term]
            if search_terms:
                pattern_str = '|'.join(re.escape(term) for term in search_terms)
                pattern = rf'\b({pattern_str})\b'
                # Use airport code for display
                display_name = airport['code']
                airport_patterns.append((pattern, airport['code'], display_name))

    _entity_patterns_cache = {
        'airline': airline_patterns,
        'airport': airport_patterns
    }

    logger.info(f"✅ Semantic Search: Built {len(airline_patterns)} airline and {len(airport_patterns)} airport patterns from BigQuery")
    return _entity_patterns_cache


def semantic_search_reviews(query: str, entity_type: str = 'airline', entity_code: str = None, limit: int = 10) -> List[Dict]:
    """
    Perform semantic search across reviews

    Args:
        query: Natural language query
        entity_type: 'airline' or 'airport'
        entity_code: Optional filter (e.g., 'DL', 'ORD')
        limit: Max results

    Returns:
        List of relevant reviews with scores
    """

    if not es:
        logger.error("Elasticsearch not available")
        return []

    try:
        # Generate embedding for query
        embedding_response = genai.embed_content(
            model="models/embedding-001",
            content=query,
            task_type="retrieval_query"
        )

        # Build Elasticsearch query
        index_name = f"{entity_type}_reviews"

        search_body = {
            "knn": {
                "field": "review_embedding",
                "query_vector": embedding_response["embedding"],
                "k": limit,
                "num_candidates": 200
            },
            "size": limit
        }

        # Add entity filter if specified
        if entity_code:
            code_field = "airline_code" if entity_type == "airline" else "iata_code"
            search_body["query"] = {
                "bool": {
                    "filter": [
                        {"term": {code_field: entity_code}}
                    ]
                }
            }

        # Execute search
        response = es.search(index=index_name, body=search_body)

        # Format results
        results = []
        max_score = response["hits"]["max_score"] if response["hits"]["max_score"] else 1

        for hit in response["hits"]["hits"]:
            results.append({
                "score": hit["_score"],
                "normalized_score": (hit["_score"] / max_score) * 100,
                "review": hit["_source"]
            })

        return results

    except Exception as e:
        logger.error(f"❌ Semantic search failed: {e}")
        return []


def answer_question_with_reviews(question: str, entity_type: str = 'airline', entity_code: str = None, limit: int = 10) -> str:
    """
    Answer a question using relevant customer reviews

    Args:
        question: User's question
        entity_type: 'airline' or 'airport'
        entity_code: Optional filter (e.g., 'DL', 'ATL')
        limit: Number of reviews to retrieve

    Returns:
        Natural language answer based on reviews
    """

    print(f"🔍 SEMANTIC SEARCH: Answering '{question}' for {entity_type} {entity_code or 'all'}")

    # Search for relevant reviews
    results = semantic_search_reviews(question, entity_type, entity_code, limit)

    if not results:
        entity_name = f"{entity_code} " if entity_code else ""
        return f"❌ **No Customer Reviews Found**\n\nI couldn't find customer reviews about {entity_name}{entity_type}s for your question.\n\n**Possible reasons:**\n- Reviews may not be indexed yet\n- The {entity_type} code may be incorrect\n- Elasticsearch connection issue"

    # Format response in natural, human-like way
    entity_name = results[0]["review"].get("airline_name" if entity_type == "airline" else "airport_name", entity_code or "")

    # Analyze sentiment from reviews
    positive_reviews = []
    negative_reviews = []
    neutral_reviews = []

    for result in results[:10]:
        review_text = result["review"].get("review_text", "").lower()

        # Simple sentiment detection
        negative_words = ['worst', 'terrible', 'awful', 'horrible', 'disappointing', 'poor', 'bad', 'ruined']
        positive_words = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'good', 'best', 'love']

        negative_count = sum(1 for word in negative_words if word in review_text)
        positive_count = sum(1 for word in positive_words if word in review_text)

        if negative_count > positive_count:
            negative_reviews.append(result["review"].get("review_text", ""))
        elif positive_count > negative_count:
            positive_reviews.append(result["review"].get("review_text", ""))
        else:
            neutral_reviews.append(result["review"].get("review_text", ""))

    # Build natural response
    response = f"Based on what customers are saying about {entity_name}, "

    if len(negative_reviews) > len(positive_reviews):
        response += "there seem to be quite a few complaints. "
    elif len(positive_reviews) > len(negative_reviews):
        response += "people are generally happy with their experience. "
    else:
        response += "opinions are mixed. "

    # Add specific feedback
    response += "Here's what travelers mentioned:\n\n"

    # Show negative feedback first if it exists
    if negative_reviews:
        response += "**Common complaints:**\n"
        for review in negative_reviews[:2]:
            response += f"- \"{review[:150]}{'...' if len(review) > 150 else ''}\"\n"
        response += "\n"

    # Then positive
    if positive_reviews:
        response += "**What people liked:**\n"
        for review in positive_reviews[:2]:
            response += f"- \"{review[:150]}{'...' if len(review) > 150 else ''}\"\n"
        response += "\n"

    # Then neutral/mixed
    if neutral_reviews:
        response += "**Mixed experiences:**\n"
        for review in neutral_reviews[:1]:
            response += f"- \"{review[:150]}{'...' if len(review) > 150 else ''}\"\n"

    return response


def compare_airlines_or_airports(question: str, entity_type: str = 'airline') -> str:
    """
    Compare two airlines or airports based on customer reviews

    Args:
        question: Comparison question (e.g., "Compare Delta vs United")
        entity_type: 'airline' or 'airport'

    Returns:
        Comparison summary
    """

    print(f"🔍 SEMANTIC SEARCH: Comparing {entity_type}s from question: '{question}'")

    # Get entity patterns from BigQuery (dynamic)
    entity_patterns = _build_entity_patterns()

    found_entities = []
    question_lower = question.lower()

    for pattern, code, name in entity_patterns.get(entity_type, []):
        if re.search(pattern, question_lower):
            found_entities.append((code, name))

    if len(found_entities) < 2:
        return f"❌ **Comparison Failed**\n\nI couldn't identify two {entity_type}s to compare in your question.\n\nPlease mention both {entity_type}s explicitly (e.g., 'Compare Delta vs United')"

    # Get reviews for both entities
    entity1_code, entity1_name = found_entities[0]
    entity2_code, entity2_name = found_entities[1]

    entity1_reviews = semantic_search_reviews(question, entity_type, entity1_code, limit=5)
    entity2_reviews = semantic_search_reviews(question, entity_type, entity2_code, limit=5)

    if not entity1_reviews or not entity2_reviews:
        return f"❌ **Comparison Failed**\n\nInsufficient customer reviews for comparison.\n\n- {entity1_name}: {len(entity1_reviews)} reviews\n- {entity2_name}: {len(entity2_reviews)} reviews"

    # Build natural comparison response
    response = f"Let me compare {entity1_name} and {entity2_name} based on customer feedback.\n\n"

    # Analyze sentiment for entity 1
    entity1_positive = sum(1 for r in entity1_reviews if any(word in r["review"].get("review_text", "").lower()
                           for word in ['great', 'excellent', 'good', 'love', 'best']))
    entity1_negative = sum(1 for r in entity1_reviews if any(word in r["review"].get("review_text", "").lower()
                           for word in ['worst', 'terrible', 'bad', 'poor', 'awful']))

    # Analyze sentiment for entity 2
    entity2_positive = sum(1 for r in entity2_reviews if any(word in r["review"].get("review_text", "").lower()
                           for word in ['great', 'excellent', 'good', 'love', 'best']))
    entity2_negative = sum(1 for r in entity2_reviews if any(word in r["review"].get("review_text", "").lower()
                           for word in ['worst', 'terrible', 'bad', 'poor', 'awful']))

    # Give overview comparison
    if entity1_positive > entity2_positive:
        response += f"**{entity1_name}** seems to get more positive feedback from customers, "
    elif entity2_positive > entity1_positive:
        response += f"**{entity2_name}** seems to get more positive feedback from customers, "
    else:
        response += f"Both airlines get similar feedback from customers, "

    if entity1_negative < entity2_negative:
        response += f"with fewer complaints compared to {entity2_name}.\n\n"
    elif entity2_negative < entity1_negative:
        response += f"with fewer complaints compared to {entity1_name}.\n\n"
    else:
        response += f"with similar numbers of complaints.\n\n"

    # Show what customers say about entity 1
    response += f"**About {entity1_name}:**\n"
    for result in entity1_reviews[:2]:
        review_text = result["review"].get("review_text", "")[:130]
        response += f"- \"{review_text}...\"\n"

    # Show what customers say about entity 2
    response += f"\n**About {entity2_name}:**\n"
    for result in entity2_reviews[:2]:
        review_text = result["review"].get("review_text", "")[:130]
        response += f"- \"{review_text}...\"\n"

    return response


def find_best_airlines_for_criteria(question: str, limit: int = 5) -> str:
    """
    Find best airlines based on specific criteria mentioned in question

    Args:
        question: Question about best airlines (e.g., "What's the best airline for service?")
        limit: Number of results

    Returns:
        Recommendations based on reviews
    """

    print(f"🔍 SEMANTIC SEARCH: Finding best airlines for: '{question}'")

    # Search across all airline reviews
    results = semantic_search_reviews(question, entity_type='airline', entity_code=None, limit=limit)

    if not results:
        return f"❌ **No Recommendations Found**\n\nI couldn't find customer reviews matching your criteria.\n\nTry rephrasing your question or asking about specific airlines."

    # Group by airline and get best rated
    airline_reviews = {}
    for result in results:
        review = result["review"]
        airline_code = review.get("airline_code")
        airline_name = review.get("airline_name")
        rating = review.get("overall_rating", 0)

        if airline_code not in airline_reviews:
            airline_reviews[airline_code] = {
                "name": airline_name,
                "reviews": [],
                "avg_rating": 0
            }

        airline_reviews[airline_code]["reviews"].append({
            "text": review.get("review_text", ""),
            "rating": rating,
            "score": result["score"]
        })

    # Calculate average ratings
    for airline_code, data in airline_reviews.items():
        ratings = [r["rating"] for r in data["reviews"] if isinstance(r["rating"], (int, float))]
        data["avg_rating"] = sum(ratings) / len(ratings) if ratings else 0

    # Sort by average rating
    sorted_airlines = sorted(airline_reviews.items(), key=lambda x: x[1]["avg_rating"], reverse=True)

    # Build natural response
    if len(sorted_airlines) == 0:
        return "I couldn't find enough customer reviews to make a recommendation."

    # Get top airline
    top_airline_code, top_airline_data = sorted_airlines[0]

    response = f"Based on customer reviews, **{top_airline_data['name']}** stands out"

    if len(sorted_airlines) > 1:
        second_airline = sorted_airlines[1][1]['name']
        response += f", followed by {second_airline}. "
    else:
        response += ". "

    response += "Here's what customers are saying:\n\n"

    # Show top reviews from best airlines
    for airline_code, data in sorted_airlines[:3]:
        response += f"**{data['name']}:**\n"
        for review in data["reviews"][:1]:
            response += f"- \"{review['text'][:130]}...\"\n"
        response += "\n"

    return response
