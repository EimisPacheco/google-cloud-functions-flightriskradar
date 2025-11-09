import functions_framework
from google.cloud import bigquery
import json
import os
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@functions_framework.http
def airline_performance_analysis(request):
    """
    Cloud Function for real airline performance analysis using BigQuery
    """
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }

    # Handle preflight requests
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        # Initialize BigQuery client
        client = bigquery.Client()
        
        # Get request data
        request_json = request.get_json(silent=True)
        airline_code = request_json.get('airline_code') if request_json else None
        
        logger.info(f"LOGS START - {datetime.now()}")
        logger.info(f"Airline Performance Analysis Request - Airline: {airline_code}")
        
        # Define the dataset and table
        dataset_id = 'airline_data'
        table_id = 'flight_data'
        
        # Base query for airline performance metrics - Using 3 years of data (2016, 2017, 2018)
        base_query = f"""
        WITH combined_data AS (
            SELECT * FROM `{dataset_id}.flights_2016`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2017`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2018`
        )
        SELECT 
            OP_CARRIER as airline_code,
            COUNT(*) as total_flights,
            COUNT(CASE WHEN DEP_DELAY > 0 THEN 1 END) as delayed_departures,
            COUNT(CASE WHEN ARR_DELAY > 0 THEN 1 END) as delayed_arrivals,
            COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights,
            COUNT(CASE WHEN DIVERTED = 1.0 THEN 1 END) as diverted_flights,
            AVG(DEP_DELAY) as avg_departure_delay,
            AVG(ARR_DELAY) as avg_arrival_delay,
            AVG(CASE WHEN DEP_DELAY > 0 THEN DEP_DELAY END) as avg_delay_when_delayed,
            COUNT(CASE WHEN DEP_DELAY <= 15 THEN 1 END) as on_time_departures,
            COUNT(CASE WHEN ARR_DELAY <= 15 THEN 1 END) as on_time_arrivals
        FROM combined_data
        """
        
        if airline_code:
            base_query += f" WHERE OP_CARRIER = '{airline_code}'"
        
        base_query += """
        GROUP BY OP_CARRIER
        ORDER BY total_flights DESC
        LIMIT 20
        """
        
        # Execute query
        query_job = client.query(base_query)
        results = query_job.result()
        
        # Process results
        airlines_data = []
        for row in results:
            total_flights = row.total_flights
            on_time_rate = ((row.on_time_departures + row.on_time_arrivals) / (total_flights * 2)) * 100 if total_flights > 0 else 0
            cancellation_rate = (row.cancelled_flights / total_flights) * 100 if total_flights > 0 else 0
            delay_probability = ((row.delayed_departures + row.delayed_arrivals) / (total_flights * 2)) * 100 if total_flights > 0 else 0
            
            airline_data = {
                'code': row.airline_code,
                'name': row.airline_code,  # Using code as name since we don't have airline names
                'total_flights': total_flights,
                'on_time_rate': round(on_time_rate, 1),
                'avg_delay': round(row.avg_departure_delay or 0, 1),
                'cancellation_rate': round(cancellation_rate, 2),
                'delay_probability': round(delay_probability, 1),
                'delayed_departures': row.delayed_departures,
                'delayed_arrivals': row.delayed_arrivals,
                'cancelled_flights': row.cancelled_flights,
                'diverted_flights': row.diverted_flights,
                'avg_departure_delay': round(row.avg_departure_delay or 0, 1),
                'avg_arrival_delay': round(row.avg_arrival_delay or 0, 1)
            }
            airlines_data.append(airline_data)
        
        # Get route-specific data for top airlines
        route_data = {}
        for airline in airlines_data[:5]:  # Top 5 airlines
            route_query = f"""
            WITH combined_data AS (
                SELECT * FROM `{dataset_id}.flights_2016`
                UNION ALL
                SELECT * FROM `{dataset_id}.flights_2017`
                UNION ALL
                SELECT * FROM `{dataset_id}.flights_2018`
            )
            SELECT 
                ORIGIN as origin_airport,
                DEST as destination_airport,
                COUNT(*) as total_flights,
                COUNT(CASE WHEN DEP_DELAY > 0 THEN 1 END) as delayed_flights,
                AVG(DEP_DELAY) as avg_delay,
                COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights
            FROM combined_data
            WHERE OP_CARRIER = '{airline['code']}'
            GROUP BY ORIGIN, DEST
            HAVING total_flights >= 10
            ORDER BY total_flights DESC
            LIMIT 10
            """
            
            route_job = client.query(route_query)
            route_results = route_job.result()
            
            routes = []
            for route_row in route_results:
                route_delay_prob = (route_row.delayed_flights / route_row.total_flights) * 100 if route_row.total_flights > 0 else 0
                routes.append({
                    'route': f"{route_row.origin_airport}-{route_row.destination_airport}",
                    'total_flights': route_row.total_flights,
                    'avg_delay': round(route_row.avg_delay or 0, 1),
                    'delay_probability': round(route_delay_prob, 1),
                    'cancellation_rate': round((route_row.cancelled_flights / route_row.total_flights) * 100, 2) if route_row.total_flights > 0 else 0
                })
            
            route_data[airline['code']] = routes
        
        # Get performance trends (comparing different years)
        trend_query = f"""
        SELECT 
            OP_CARRIER as airline_code,
            '2016-2018' as period,
            COUNT(*) as total_flights,
            COUNT(CASE WHEN DEP_DELAY > 0 THEN 1 END) as delayed_flights,
            AVG(DEP_DELAY) as avg_delay
        FROM (
            SELECT * FROM `{dataset_id}.flights_2016`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2017`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2018`
        )
        """
        
        if airline_code:
            trend_query += f" WHERE OP_CARRIER = '{airline_code}'"
        
        trend_query += """
        GROUP BY OP_CARRIER, period
        ORDER BY OP_CARRIER, period
        """
        
        trend_job = client.query(trend_query)
        trend_results = trend_job.result()
        
        # Calculate trends
        trends = {}
        current_data = {}
        previous_data = {}
        
        for row in trend_results:
            if row.period == 'recent':
                current_data[row.airline_code] = {
                    'total_flights': row.total_flights,
                    'delayed_flights': row.delayed_flights,
                    'avg_delay': row.avg_delay or 0
                }
            else:
                previous_data[row.airline_code] = {
                    'total_flights': row.total_flights,
                    'delayed_flights': row.delayed_flights,
                    'avg_delay': row.avg_delay or 0
                }
        
        # Calculate percentage changes
        for airline_code in current_data:
            if airline_code in previous_data:
                current = current_data[airline_code]
                previous = previous_data[airline_code]
                
                delay_rate_current = (current['delayed_flights'] / current['total_flights']) * 100 if current['total_flights'] > 0 else 0
                delay_rate_previous = (previous['delayed_flights'] / previous['total_flights']) * 100 if previous['total_flights'] > 0 else 0
                
                if delay_rate_previous > 0:
                    delay_trend = ((delay_rate_current - delay_rate_previous) / delay_rate_previous) * 100
                else:
                    delay_trend = 0
                
                trends[airline_code] = {
                    'trend_percentage': round(delay_trend, 1),
                    'trend_direction': 'improving' if delay_trend < 0 else 'declining',
                    'current_delay_rate': round(delay_rate_current, 1),
                    'previous_delay_rate': round(delay_rate_previous, 1)
                }
        
        # Calculate industry benchmarks and rankings
        if airlines_data:
            # Industry averages
            total_flights_industry = sum(airline['total_flights'] for airline in airlines_data)
            avg_on_time_rate = sum(airline['on_time_rate'] for airline in airlines_data) / len(airlines_data)
            avg_delay = sum(airline['avg_delay'] for airline in airlines_data) / len(airlines_data)
            avg_cancellation_rate = sum(airline['cancellation_rate'] for airline in airlines_data) / len(airlines_data)
            
            # Performance rankings
            sorted_by_on_time = sorted(airlines_data, key=lambda x: x['on_time_rate'], reverse=True)
            sorted_by_delay = sorted(airlines_data, key=lambda x: x['avg_delay'])
            sorted_by_cancellation = sorted(airlines_data, key=lambda x: x['cancellation_rate'])
            
            # Performance categories
            for airline in airlines_data:
                # On-time performance category
                if airline['on_time_rate'] >= 85:
                    airline['performance_category'] = 'Excellent'
                elif airline['on_time_rate'] >= 75:
                    airline['performance_category'] = 'Good'
                elif airline['on_time_rate'] >= 65:
                    airline['performance_category'] = 'Fair'
                else:
                    airline['performance_category'] = 'Poor'
                
                # Delay performance category
                if airline['avg_delay'] <= 5:
                    airline['delay_category'] = 'Excellent'
                elif airline['avg_delay'] <= 10:
                    airline['delay_category'] = 'Good'
                elif airline['avg_delay'] <= 15:
                    airline['delay_category'] = 'Fair'
                else:
                    airline['delay_category'] = 'Poor'
                
                # Market share
                airline['market_share'] = round((airline['total_flights'] / total_flights_industry) * 100, 2)
                
                # Performance score (0-100)
                on_time_score = min(airline['on_time_rate'], 100)
                delay_score = max(0, 100 - (airline['avg_delay'] * 2))
                cancellation_score = max(0, 100 - (airline['cancellation_rate'] * 10))
                airline['performance_score'] = round((on_time_score * 0.5 + delay_score * 0.3 + cancellation_score * 0.2), 1)
            
            # Industry benchmarks
            industry_benchmarks = {
                'total_flights': total_flights_industry,
                'avg_on_time_rate': round(avg_on_time_rate, 1),
                'avg_delay': round(avg_delay, 1),
                'avg_cancellation_rate': round(avg_cancellation_rate, 2),
                'top_performers': {
                    'on_time': [airline['code'] for airline in sorted_by_on_time[:3]],
                    'lowest_delay': [airline['code'] for airline in sorted_by_delay[:3]],
                    'lowest_cancellation': [airline['code'] for airline in sorted_by_cancellation[:3]]
                }
            }
        else:
            industry_benchmarks = {}

        # Prepare response
        response_data = {
            'airlines': airlines_data,
            'routes': route_data,
            'trends': trends,
            'industry_benchmarks': industry_benchmarks,
            'analysis_date': datetime.now().isoformat(),
            'data_period': '2016-2018 (3 years of historical data)'
        }
        
        logger.info(f"Analysis completed successfully - {len(airlines_data)} airlines analyzed")
        logger.info(f"LOGS END - {datetime.now()}")
        
        return (json.dumps(response_data), 200, headers)
        
    except Exception as e:
        logger.error(f"Error in airline performance analysis: {str(e)}")
        error_response = {
            'error': 'Failed to analyze airline performance',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }
        return (json.dumps(error_response), 500, headers) 