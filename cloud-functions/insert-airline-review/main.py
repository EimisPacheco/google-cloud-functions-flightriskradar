"""
Insert Airline Review Cloud Function
Inserts new airline reviews into BigQuery
"""

from google.cloud import bigquery
from datetime import datetime
import functions_framework
from flask import jsonify
import os

# Initialize BigQuery client
bq_client = bigquery.Client()

PROJECT_ID = os.environ.get('GCP_PROJECT', 'crafty-cairn-469222-a8')
DATASET_ID = 'airline_data'
TABLE_ID = 'airline_reviews'

@functions_framework.http
def main(request):
    """
    HTTP Cloud Function to insert airline review into BigQuery

    Expected JSON payload:
    {
        "airline_code": "AA",
        "airline_name": "American Airlines",
        "review_text": "Great flight experience!",
        "rating": 4.5,
        "reviewer_name": "John Doe"
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
        required_fields = ['airline_code', 'airline_name', 'review_text', 'rating']
        missing_fields = [field for field in required_fields if field not in request_json]

        if missing_fields:
            return (jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400, headers)

        # Extract data from request
        airline_code = request_json['airline_code']
        airline_name = request_json['airline_name']
        review_text = request_json['review_text']
        rating = float(request_json['rating'])
        reviewer_name = request_json.get('reviewer_name', 'Anonymous')

        # Validate rating (1-5 scale)
        if rating < 1 or rating > 5:
            return (jsonify({'error': 'Rating must be between 1 and 5'}), 400, headers)

        # Validate review text length
        if len(review_text.strip()) < 10:
            return (jsonify({'error': 'Review text must be at least 10 characters'}), 400, headers)

        # Prepare row to insert
        current_datetime = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        row_to_insert = {
            'airline_code': airline_code,
            'airline_name': airline_name,
            'review_text': review_text.strip(),
            'rating': rating,
            'reviewer_name': reviewer_name,
            'review_date': current_datetime
        }

        # Insert into BigQuery
        table_ref = f"{PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
        table = bq_client.get_table(table_ref)

        errors = bq_client.insert_rows_json(table, [row_to_insert])

        if errors:
            print(f"❌ BigQuery insert errors: {errors}")
            return (jsonify({
                'error': 'Failed to insert review into BigQuery',
                'details': str(errors)
            }), 500, headers)

        print(f"✅ Successfully inserted review for {airline_name} ({airline_code})")

        return (jsonify({
            'success': True,
            'message': 'Review inserted successfully',
            'data': {
                'airline_code': airline_code,
                'airline_name': airline_name,
                'rating': rating,
                'review_date': current_datetime
            }
        }), 200, headers)

    except ValueError as e:
        return (jsonify({'error': f'Invalid data format: {str(e)}'}), 400, headers)
    except Exception as e:
        print(f"❌ Error inserting airline review: {e}")
        return (jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500, headers)
