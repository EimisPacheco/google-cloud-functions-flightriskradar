"""
Insert Airport Review Cloud Function
Inserts new airport reviews into BigQuery
"""

from google.cloud import bigquery
from datetime import datetime
import functions_framework
from flask import jsonify
import os
import json

# Initialize BigQuery client
bq_client = bigquery.Client()

PROJECT_ID = os.environ.get('GCP_PROJECT', 'crafty-cairn-469222-a8')
DATASET_ID = 'airline_data'
TABLE_ID = 'airport_places_data'  # Correct table name

@functions_framework.http
def main(request):
    """
    HTTP Cloud Function to insert airport review into BigQuery

    Expected JSON payload:
    {
        "iata_code": "ATL",
        "airport_name": "Hartsfield-Jackson Atlanta International Airport",
        "review_text": "Great airport facilities!",
        "rating": 4.5,
        "author_name": "Jane Smith"
    }
    """

    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    # Only accept POST requests
    if request.method != 'POST':
        return (jsonify({'error': 'Only POST method is allowed'}), 405, headers)

    try:
        # Parse request JSON
        request_json = request.get_json(silent=True)

        if not request_json:
            return (jsonify({'error': 'No JSON data provided'}), 400, headers)

        # Validate required fields
        required_fields = ['iata_code', 'airport_name', 'review_text', 'rating']
        missing_fields = [field for field in required_fields if field not in request_json]

        if missing_fields:
            return (jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400, headers)

        # Extract data from request
        iata_code = request_json['iata_code']
        airport_name = request_json['airport_name']
        review_text = request_json['review_text']
        rating = float(request_json['rating'])
        author_name = request_json.get('author_name', 'Anonymous')

        # Validate rating (1-5 scale)
        if rating < 1 or rating > 5:
            return (jsonify({'error': 'Rating must be between 1 and 5'}), 400, headers)

        # Validate review text length
        if len(review_text.strip()) < 10:
            return (jsonify({'error': 'Review text must be at least 10 characters'}), 400, headers)

        # First, check if airport exists in the table
        check_query = f"""
        SELECT iata_code, reviews
        FROM `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
        WHERE iata_code = @iata_code
        LIMIT 1
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("iata_code", "STRING", iata_code)
            ]
        )

        query_job = bq_client.query(check_query, job_config=job_config)
        results = list(query_job.result())

        # Prepare new review object
        current_datetime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_review = {
            'author_name': author_name,
            'rating': rating,
            'relative_time': 'Just now',
            'text': review_text.strip(),
            'time': current_datetime
        }

        if results:
            # Airport exists - append review to existing reviews array
            existing_reviews = results[0]['reviews']

            # BigQuery JSON columns return as Python objects (list/dict), not strings
            if existing_reviews is None:
                existing_reviews = []
            elif not isinstance(existing_reviews, list):
                # If it's a dict or other type, wrap it in a list
                existing_reviews = [existing_reviews]

            # Append new review
            existing_reviews.append(new_review)

            # Update the row with new reviews array using JSON function
            # For JSON columns, we need to use PARSE_JSON to properly update
            update_query = f"""
            UPDATE `{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}`
            SET reviews = PARSE_JSON(@reviews)
            WHERE iata_code = @iata_code
            """

            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("iata_code", "STRING", iata_code),
                    bigquery.ScalarQueryParameter("reviews", "STRING", json.dumps(existing_reviews))
                ]
            )

            update_job = bq_client.query(update_query, job_config=job_config)
            update_job.result()  # Wait for query to complete

            print(f"✅ Successfully appended review to {airport_name} ({iata_code})")

        else:
            # Airport doesn't exist - insert new row
            # For JSON columns, pass the actual Python object (list), not a JSON string
            row_to_insert = {
                'iata_code': iata_code,
                'airport_name': airport_name,
                'reviews': [new_review]  # Pass as list, not JSON string
            }

            table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
            table = bq_client.get_table(table_ref)

            errors = bq_client.insert_rows_json(table, [row_to_insert])

            if errors:
                print(f"❌ BigQuery insert errors: {errors}")
                return (jsonify({
                    'error': 'Failed to insert review into BigQuery',
                    'details': str(errors)
                }), 500, headers)

            print(f"✅ Successfully inserted new airport and review for {airport_name} ({iata_code})")

        return (jsonify({
            'success': True,
            'message': 'Review inserted successfully',
            'data': {
                'iata_code': iata_code,
                'airport_name': airport_name,
                'rating': rating,
                'review_date': current_datetime
            }
        }), 200, headers)

    except ValueError as e:
        return (jsonify({'error': f'Invalid data format: {str(e)}'}), 400, headers)
    except Exception as e:
        print(f"❌ Error inserting airport review: {e}")
        return (jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500, headers)
