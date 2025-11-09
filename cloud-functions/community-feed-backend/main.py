import functions_framework
import json
import os
from datetime import datetime, timezone
import uuid
from google.cloud import bigquery
from google.cloud import language_v1
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize BigQuery client
client = bigquery.Client()

# Initialize Natural Language client for sentiment analysis
language_client = language_v1.LanguageServiceClient()

# Table references
COMMUNITY_FEED_TABLE = "crafty-cairn-469222-a8.airline_data.community_feed"
US_AIRPORTS_TABLE = "crafty-cairn-469222-a8.airline_data.us_airports"

def analyze_sentiment(text):
    """Analyze sentiment of text using Google Natural Language API"""
    try:
        document = language_v1.Document(content=text, type_=language_v1.Document.Type.PLAIN_TEXT)
        sentiment = language_client.analyze_sentiment(request={'document': document}).document_sentiment
        
        # Convert score to sentiment category
        if sentiment.score >= 0.1:
            return "positive"
        elif sentiment.score <= -0.1:
            return "negative"
        else:
            return "neutral"
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}")
        return "neutral"

def get_airport_info(airport_code):
    """Get airport information from us_airports table"""
    try:
        query = f"""
        SELECT name, municipality, region_name
        FROM `{US_AIRPORTS_TABLE}`
        WHERE iata_code = @airport_code
        LIMIT 1
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("airport_code", "STRING", airport_code),
            ]
        )
        
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if results:
            row = results[0]
            return {
                "name": row.name,
                "city": row.municipality,
                "state": row.region_name
            }
        return None
    except Exception as e:
        logger.error(f"Error getting airport info: {e}")
        return None

def create_post(data):
    """Create a new community post"""
    try:
        # Generate unique ID
        post_id = f"post_{str(uuid.uuid4())[:8]}"
        
        # Analyze sentiment
        sentiment = analyze_sentiment(data.get('content', ''))
        
        # Get airport info
        airport_code = data.get('airport_code')
        airport_info = get_airport_info(airport_code)
        
        # Prepare post data
        post_data = {
            'id': post_id,
            'user_id': data.get('user_id', f"user_{str(uuid.uuid4())[:8]}"),
            'username': data.get('username', 'Anonymous'),
            'airport_code': airport_code,
            'airport_name': airport_info.get('name', f"{airport_code} Airport") if airport_info else f"{airport_code} Airport",
            'post_type': data.get('post_type', 'status_update'),
            'category': data.get('category', 'general'),
            'content': data.get('content', ''),
            'sentiment': sentiment,
            'likes': 0,
            'replies': 0,
            'verified': data.get('verified', False),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'is_active': True
        }
        
        # Insert into BigQuery
        table_id = COMMUNITY_FEED_TABLE
        table = client.get_table(table_id)
        
        errors = client.insert_rows_json(table, [post_data])
        if errors:
            raise Exception(f"Error inserting data: {errors}")
        
        logger.info(f"Created post {post_id}")
        return {
            'success': True,
            'post_id': post_id,
            'post': post_data
        }
        
    except Exception as e:
        logger.error(f"Error creating post: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_posts(filters=None, limit=20, offset=0):
    """Get community posts with optional filtering"""
    try:
        # Build query
        query = f"""
        SELECT *
        FROM `{COMMUNITY_FEED_TABLE}`
        WHERE is_active = true
        """
        
        # Add filters
        if filters:
            if filters.get('airport_code'):
                query += f" AND airport_code = '{filters['airport_code']}'"
            if filters.get('category'):
                query += f" AND category = '{filters['category']}'"
            if filters.get('sentiment'):
                query += f" AND sentiment = '{filters['sentiment']}'"
            if filters.get('verified') is not None:
                query += f" AND verified = {filters['verified']}"
        
        # Add ordering and pagination
        query += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
        
        # Execute query
        query_job = client.query(query)
        results = list(query_job.result())
        
        # Convert to list of dictionaries
        posts = []
        for row in results:
            post = {
                'id': row.id,
                'user_id': row.user_id,
                'username': row.username,
                'airport_code': row.airport_code,
                'airport_name': row.airport_name,
                'post_type': row.post_type,
                'category': row.category,
                'content': row.content,
                'sentiment': row.sentiment,
                'likes': row.likes,
                'replies': row.replies,
                'verified': row.verified,
                'created_at': row.created_at.isoformat() if row.created_at else None,
                'updated_at': row.updated_at.isoformat() if row.updated_at else None,
                'is_active': row.is_active
            }
            posts.append(post)
        
        return {
            'success': True,
            'posts': posts,
            'count': len(posts)
        }
        
    except Exception as e:
        logger.error(f"Error getting posts: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def update_post(post_id, data):
    """Update an existing post"""
    try:
        # Check if post exists
        query = f"""
        SELECT id FROM `{COMMUNITY_FEED_TABLE}`
        WHERE id = @post_id AND is_active = true
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("post_id", "STRING", post_id),
            ]
        )
        
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if not results:
            return {
                'success': False,
                'error': 'Post not found'
            }
        
        # Analyze sentiment if content changed
        sentiment = None
        if 'content' in data:
            sentiment = analyze_sentiment(data['content'])
        
        # Build update query
        update_fields = []
        query_params = []
        
        if 'content' in data:
            update_fields.append("content = @content")
            query_params.append(bigquery.ScalarQueryParameter("content", "STRING", data['content']))
        
        if 'category' in data:
            update_fields.append("category = @category")
            query_params.append(bigquery.ScalarQueryParameter("category", "STRING", data['category']))
        
        if sentiment:
            update_fields.append("sentiment = @sentiment")
            query_params.append(bigquery.ScalarQueryParameter("sentiment", "STRING", sentiment))
        
        update_fields.append("updated_at = @updated_at")
        query_params.append(bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", datetime.now(timezone.utc)))
        
        query_params.append(bigquery.ScalarQueryParameter("post_id", "STRING", post_id))
        
        if update_fields:
            query = f"""
            UPDATE `{COMMUNITY_FEED_TABLE}`
            SET {', '.join(update_fields)}
            WHERE id = @post_id
            """
            
            job_config = bigquery.QueryJobConfig(query_parameters=query_params)
            client.query(query, job_config=job_config)
            
            logger.info(f"Updated post {post_id}")
            return {
                'success': True,
                'message': 'Post updated successfully'
            }
        
        return {
            'success': False,
            'error': 'No fields to update'
        }
        
    except Exception as e:
        logger.error(f"Error updating post: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def delete_post(post_id, user_id):
    """Soft delete a post (mark as inactive)"""
    try:
        # Check if post exists and belongs to user
        query = f"""
        SELECT id FROM `{COMMUNITY_FEED_TABLE}`
        WHERE id = @post_id AND user_id = @user_id AND is_active = true
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("post_id", "STRING", post_id),
                bigquery.ScalarQueryParameter("user_id", "STRING", user_id),
            ]
        )
        
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if not results:
            return {
                'success': False,
                'error': 'Post not found or unauthorized'
            }
        
        # Soft delete
        query = f"""
        UPDATE `{COMMUNITY_FEED_TABLE}`
        SET is_active = false, updated_at = @updated_at
        WHERE id = @post_id
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("post_id", "STRING", post_id),
                bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", datetime.now(timezone.utc)),
            ]
        )
        
        client.query(query, job_config=job_config)
        
        logger.info(f"Deleted post {post_id}")
        return {
            'success': True,
            'message': 'Post deleted successfully'
        }
        
    except Exception as e:
        logger.error(f"Error deleting post: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def like_post(post_id, user_id):
    """Like a post"""
    try:
        # Check if post exists
        query = f"""
        SELECT likes FROM `{COMMUNITY_FEED_TABLE}`
        WHERE id = @post_id AND is_active = true
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("post_id", "STRING", post_id),
            ]
        )
        
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if not results:
            return {
                'success': False,
                'error': 'Post not found'
            }
        
        current_likes = results[0].likes or 0
        
        # Update likes count
        query = f"""
        UPDATE `{COMMUNITY_FEED_TABLE}`
        SET likes = @likes, updated_at = @updated_at
        WHERE id = @post_id
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("post_id", "STRING", post_id),
                bigquery.ScalarQueryParameter("likes", "INTEGER", current_likes + 1),
                bigquery.ScalarQueryParameter("updated_at", "TIMESTAMP", datetime.now(timezone.utc)),
            ]
        )
        
        client.query(query, job_config=job_config)
        
        logger.info(f"Liked post {post_id}")
        return {
            'success': True,
            'likes': current_likes + 1
        }
        
    except Exception as e:
        logger.error(f"Error liking post: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_airports():
    """Get list of all US airports with their post counts"""
    try:
        # Get all airports from us_airports table with their post counts
        query = f"""
        WITH airport_posts AS (
            SELECT 
                airport_code,
                COUNT(*) as post_count,
                MAX(created_at) as last_post
            FROM `{COMMUNITY_FEED_TABLE}`
            WHERE is_active = true
            GROUP BY airport_code
        )
        SELECT 
            a.iata_code as code,
            a.name,
            a.municipality as city,
            a.region_name as state,
            COALESCE(ap.post_count, 0) as post_count,
            ap.last_post
        FROM `{US_AIRPORTS_TABLE}` a
        LEFT JOIN airport_posts ap ON a.iata_code = ap.airport_code
        WHERE a.type IN ('large_airport', 'medium_airport')
            AND a.iata_code IS NOT NULL
            AND a.iata_code != ''
            AND a.iso_country = 'US'
            AND a.scheduled_service = 'yes'
        ORDER BY 
            COALESCE(ap.post_count, 0) DESC,
            a.score DESC
        LIMIT 100
        """
        
        query_job = client.query(query)
        results = list(query_job.result())
        
        airports = []
        for row in results:
            airport = {
                'code': row.code,
                'name': f"{row.name} - {row.city}, {row.state}",
                'post_count': row.post_count,
                'last_post': row.last_post.isoformat() if row.last_post else None
            }
            airports.append(airport)
        
        return {
            'success': True,
            'airports': airports
        }
        
    except Exception as e:
        logger.error(f"Error getting airports: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_statistics():
    """Get community feed statistics"""
    try:
        query = f"""
        SELECT 
            COUNT(*) as total_posts,
            COUNT(DISTINCT airport_code) as active_airports,
            COUNT(DISTINCT user_id) as unique_users,
            AVG(likes) as avg_likes,
            COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_posts,
            COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_posts,
            COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_posts
        FROM `{COMMUNITY_FEED_TABLE}`
        WHERE is_active = true
        """
        
        query_job = client.query(query)
        results = list(query_job.result())
        
        if results:
            row = results[0]
            stats = {
                'total_posts': row.total_posts,
                'active_airports': row.active_airports,
                'unique_users': row.unique_users,
                'avg_likes': float(row.avg_likes) if row.avg_likes else 0,
                'sentiment_breakdown': {
                    'positive': row.positive_posts,
                    'negative': row.negative_posts,
                    'neutral': row.neutral_posts
                }
            }
            
            return {
                'success': True,
                'statistics': stats
            }
        
        return {
            'success': False,
            'error': 'No data available'
        }
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        return {
            'success': False,
            'error': str(e)
        }

@functions_framework.http
def community_feed_handler(request):
    """Main handler for Community Feed API"""
    # Set CORS headers
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }
    
    try:
        # Parse request
        if request.method == 'GET':
            # Handle GET requests
            if request.args.get('action') == 'posts':
                filters = {}
                if request.args.get('airport_code'):
                    filters['airport_code'] = request.args.get('airport_code')
                if request.args.get('category'):
                    filters['category'] = request.args.get('category')
                if request.args.get('sentiment'):
                    filters['sentiment'] = request.args.get('sentiment')
                if request.args.get('verified'):
                    filters['verified'] = request.args.get('verified').lower() == 'true'
                
                limit = int(request.args.get('limit', 20))
                offset = int(request.args.get('offset', 0))
                
                result = get_posts(filters, limit, offset)
                
            elif request.args.get('action') == 'airports':
                result = get_airports()
                
            elif request.args.get('action') == 'statistics':
                result = get_statistics()
                
            else:
                return (json.dumps({'error': 'Invalid action'}), 400, headers)
        
        elif request.method == 'POST':
            # Handle POST requests
            data = request.get_json()
            
            if request.args.get('action') == 'create':
                result = create_post(data)
                
            elif request.args.get('action') == 'like':
                post_id = data.get('post_id')
                user_id = data.get('user_id')
                result = like_post(post_id, user_id)
                
            else:
                return (json.dumps({'error': 'Invalid action'}), 400, headers)
        
        elif request.method == 'PUT':
            # Handle PUT requests
            data = request.get_json()
            post_id = request.args.get('post_id')
            
            if not post_id:
                return (json.dumps({'error': 'Post ID required'}), 400, headers)
            
            result = update_post(post_id, data)
        
        elif request.method == 'DELETE':
            # Handle DELETE requests
            post_id = request.args.get('post_id')
            user_id = request.args.get('user_id')
            
            if not post_id or not user_id:
                return (json.dumps({'error': 'Post ID and User ID required'}), 400, headers)
            
            result = delete_post(post_id, user_id)
        
        else:
            return (json.dumps({'error': 'Method not allowed'}), 405, headers)
        
        # Return response
        if result.get('success'):
            return (json.dumps(result), 200, headers)
        else:
            return (json.dumps(result), 400, headers)
    
    except Exception as e:
        logger.error(f"Error in community feed handler: {e}")
        return (json.dumps({'error': 'Internal server error'}), 500, headers) 