import functions_framework
from google.cloud import bigquery
import json
import os
from datetime import datetime, timedelta
import logging
from airport_status import AirportStatusService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@functions_framework.http
def airport_performance_analysis(request):
    """
    Cloud Function for real airport performance analysis using BigQuery
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
        # Get request data
        request_json = request.get_json(silent=True)
        airport_code = request_json.get('airport_code') if request_json else None
        request_type = request_json.get('type', 'performance') if request_json else 'performance'
        
        logger.info(f"LOGS START - {datetime.now()}")
        logger.info(f"Airport Analysis Request - Type: {request_type}, Airport: {airport_code}")
        
        # Handle airport status requests
        if request_type == 'status':
            if not airport_code:
                return (json.dumps({
                    'success': False,
                    'error': 'Airport code is required for status requests'
                }), 400, headers)
            
            # Initialize BigQuery client to get airport details
            client = bigquery.Client()
            
            # Query airport details from us_airports table
            airport_query = f"""
            SELECT 
                iata_code,
                name,
                municipality,
                type,
                latitude_deg,
                longitude_deg,
                elevation_ft,
                home_link,
                wikipedia_link
            FROM `crafty-cairn-469222-a8.airline_data.us_airports`
            WHERE iata_code = '{airport_code}'
            LIMIT 1
            """
            
            airport_details = {}
            try:
                query_job = client.query(airport_query)
                results = query_job.result()
                for row in results:
                    airport_details[airport_code] = {
                        'iata_code': row.iata_code,
                        'name': row.name,
                        'municipality': row.municipality,
                        'type': row.type,
                        'latitude_deg': row.latitude_deg,
                        'longitude_deg': row.longitude_deg,
                        'elevation_ft': row.elevation_ft,
                        'home_link': row.home_link,
                        'wikipedia_link': row.wikipedia_link
                    }
            except Exception as e:
                logger.error(f"Error querying airport details: {str(e)}")
            
            status_service = AirportStatusService(airport_details)
            status_result = status_service.get_current_status(airport_code)
            
            # Add airport details to the response
            if status_result.get('success') and airport_details.get(airport_code):
                status_result['data']['airport_details'] = airport_details[airport_code]
            
            logger.info(f"Airport status retrieved for {airport_code}")
            return (json.dumps(status_result), 200, headers)
        
        # Initialize BigQuery client for performance analysis
        client = bigquery.Client()
        
        # Define the dataset and table
        dataset_id = 'airline_data'
        table_id = 'flight_data'
        
        # Base query for airport performance metrics - Using 3 years of data (2016, 2017, 2018)
        base_query = f"""
        WITH combined_data AS (
            SELECT * FROM `{dataset_id}.flights_2016`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2017`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2018`
        ),
        airport_info AS (
            SELECT 
                iata_code,
                name,
                municipality,
                type,
                latitude_deg,
                longitude_deg,
                elevation_ft,
                home_link,
                wikipedia_link
            FROM `crafty-cairn-469222-a8.airline_data.us_airports`
        )
        SELECT 
            cd.ORIGIN as airport_code,
            MAX(ai.name) as airport_name,
            MAX(ai.municipality) as city,
            MAX(ai.type) as airport_type,
            MAX(ai.latitude_deg) as latitude,
            MAX(ai.longitude_deg) as longitude,
            MAX(ai.elevation_ft) as elevation,
            MAX(ai.home_link) as home_link,
            MAX(ai.wikipedia_link) as wikipedia_link,
            COUNT(*) as total_departures,
            COUNT(CASE WHEN cd.DEP_DELAY > 0 THEN 1 END) as delayed_departures,
            COUNT(CASE WHEN cd.CANCELLED = 1.0 THEN 1 END) as cancelled_departures,
            COUNT(CASE WHEN cd.DIVERTED = 1.0 THEN 1 END) as diverted_departures,
            AVG(cd.DEP_DELAY) as avg_departure_delay,
            AVG(CASE WHEN cd.DEP_DELAY > 0 THEN cd.DEP_DELAY END) as avg_delay_when_delayed,
            COUNT(CASE WHEN cd.DEP_DELAY <= 15 THEN 1 END) as on_time_departures,
            COUNT(DISTINCT cd.OP_CARRIER) as unique_airlines,
            COUNT(DISTINCT cd.DEST) as unique_destinations
        FROM combined_data cd
        LEFT JOIN airport_info ai ON cd.ORIGIN = ai.iata_code
        """
        
        if airport_code:
            base_query += f" WHERE cd.ORIGIN = '{airport_code}'"
        
        base_query += """
        GROUP BY cd.ORIGIN
        ORDER BY total_departures DESC
        LIMIT 20
        """
        
        # Execute query
        query_job = client.query(base_query)
        results = query_job.result()
        
        # Process results
        airports_data = []
        for row in results:
            total_departures = row.total_departures
            on_time_rate = (row.on_time_departures / total_departures) * 100 if total_departures > 0 else 0
            cancellation_rate = (row.cancelled_departures / total_departures) * 100 if total_departures > 0 else 0
            delay_probability = (row.delayed_departures / total_departures) * 100 if total_departures > 0 else 0
            
            # Calculate complexity score based on airport type
            airport_type = row.airport_type
            if airport_type in ['small_airport', 'heliport']:
                complexity_score = 2.5  # Low complexity
                complexity_category = 'Low'
            elif airport_type == 'medium_airport':
                complexity_score = 5.0  # Medium complexity
                complexity_category = 'Medium'
            elif airport_type == 'large_airport':
                complexity_score = 8.5  # High complexity
                complexity_category = 'High'
            else:
                # Fallback to volume-based calculation if type is unknown
                complexity_score = min((total_departures / 1000) * 10, 10)
                if complexity_score >= 7:
                    complexity_category = 'High'
                elif complexity_score >= 4:
                    complexity_category = 'Medium'
                else:
                    complexity_category = 'Low'
            
            airport_data = {
                'code': row.airport_code,
                'name': row.airport_name,
                'city': row.city,
                'type': row.airport_type,
                'latitude': row.latitude,
                'longitude': row.longitude,
                'elevation': row.elevation,
                'home_link': row.home_link,
                'wikipedia_link': row.wikipedia_link,
                'total_departures': total_departures,
                'on_time_rate': round(on_time_rate, 1),
                'avg_delay': round(row.avg_departure_delay or 0, 1),
                'cancellation_rate': round(cancellation_rate, 2),
                'delay_probability': round(delay_probability, 1),
                'complexity_score': round(complexity_score, 1),
                'complexity_category': complexity_category,
                'delayed_departures': row.delayed_departures,
                'cancelled_departures': row.cancelled_departures,
                'diverted_departures': row.diverted_departures,
                'unique_airlines': row.unique_airlines,
                'unique_destinations': row.unique_destinations,
                'avg_delay_when_delayed': round(row.avg_delay_when_delayed or 0, 1)
            }
            airports_data.append(airport_data)
        
        # Get arrival performance data
        arrival_query = f"""
        WITH combined_data AS (
            SELECT * FROM `{dataset_id}.flights_2016`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2017`
            UNION ALL
            SELECT * FROM `{dataset_id}.flights_2018`
        )
        SELECT 
            DEST as airport_code,
            COUNT(*) as total_arrivals,
            COUNT(CASE WHEN ARR_DELAY > 0 THEN 1 END) as delayed_arrivals,
            COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_arrivals,
            AVG(ARR_DELAY) as avg_arrival_delay,
            COUNT(CASE WHEN ARR_DELAY <= 15 THEN 1 END) as on_time_arrivals
        FROM combined_data
        """
        
        if airport_code:
            arrival_query += f" WHERE DEST = '{airport_code}'"
        
        arrival_query += """
        GROUP BY DEST
        ORDER BY total_arrivals DESC
        LIMIT 20
        """
        
        arrival_job = client.query(arrival_query)
        arrival_results = arrival_job.result()
        
        # Merge arrival data with departure data
        arrival_data = {}
        for row in arrival_results:
            arrival_data[row.airport_code] = {
                'total_arrivals': row.total_arrivals,
                'delayed_arrivals': row.delayed_arrivals,
                'cancelled_arrivals': row.cancelled_arrivals,
                'avg_arrival_delay': round(row.avg_arrival_delay or 0, 1),
                'on_time_arrivals': row.on_time_arrivals
            }
        
        # Combine departure and arrival data
        for airport in airports_data:
            if airport['code'] in arrival_data:
                arrival = arrival_data[airport['code']]
                total_operations = airport['total_departures'] + arrival['total_arrivals']
                
                # Combined metrics
                airport['total_operations'] = total_operations
                airport['total_arrivals'] = arrival['total_arrivals']
                airport['delayed_arrivals'] = arrival['delayed_arrivals']
                airport['cancelled_arrivals'] = arrival['cancelled_arrivals']
                airport['avg_arrival_delay'] = arrival['avg_arrival_delay']
                
                # Combined on-time rate
                total_on_time = airport.get('on_time_departures', 0) + arrival.get('on_time_arrivals', 0)
                combined_on_time_rate = (total_on_time / total_operations) * 100 if total_operations > 0 else 0
                airport['combined_on_time_rate'] = round(combined_on_time_rate, 1)
        
        # Get airline performance at each airport
        airline_performance = {}
        for airport in airports_data[:10]:  # Top 10 airports
            airline_query = f"""
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
                COUNT(CASE WHEN DEP_DELAY > 0 THEN 1 END) as delayed_flights,
                AVG(DEP_DELAY) as avg_delay,
                COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights
            FROM combined_data
            WHERE ORIGIN = '{airport['code']}'
            GROUP BY OP_CARRIER
            HAVING total_flights >= 5
            ORDER BY total_flights DESC
            LIMIT 5
            """
            
            airline_job = client.query(airline_query)
            airline_results = airline_job.result()
            
            airlines = []
            for airline_row in airline_results:
                airline_delay_prob = (airline_row.delayed_flights / airline_row.total_flights) * 100 if airline_row.total_flights > 0 else 0
                airlines.append({
                    'airline_code': airline_row.airline_code,
                    'total_flights': airline_row.total_flights,
                    'avg_delay': round(airline_row.avg_delay or 0, 1),
                    'delay_probability': round(airline_delay_prob, 1),
                    'cancellation_rate': round((airline_row.cancelled_flights / airline_row.total_flights) * 100, 2) if airline_row.total_flights > 0 else 0
                })
            
            airline_performance[airport['code']] = airlines
        
        # Get performance trends (comparing different years)
        trend_query = f"""
        SELECT 
            ORIGIN as origin_airport,
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
        
        if airport_code:
            trend_query += f" WHERE ORIGIN = '{airport_code}'"
        
        trend_query += """
        GROUP BY ORIGIN, period
        ORDER BY ORIGIN, period
        """
        
        trend_job = client.query(trend_query)
        trend_results = trend_job.result()
        
        # Calculate trends
        trends = {}
        current_data = {}
        previous_data = {}
        
        for row in trend_results:
            if row.period == 'recent':
                current_data[row.origin_airport] = {
                    'total_flights': row.total_flights,
                    'delayed_flights': row.delayed_flights,
                    'avg_delay': row.avg_delay or 0
                }
            else:
                previous_data[row.origin_airport] = {
                    'total_flights': row.total_flights,
                    'delayed_flights': row.delayed_flights,
                    'avg_delay': row.avg_delay or 0
                }
        
        # Calculate percentage changes
        for airport_code in current_data:
            if airport_code in previous_data:
                current = current_data[airport_code]
                previous = previous_data[airport_code]
                
                delay_rate_current = (current['delayed_flights'] / current['total_flights']) * 100 if current['total_flights'] > 0 else 0
                delay_rate_previous = (previous['delayed_flights'] / previous['total_flights']) * 100 if previous['total_flights'] > 0 else 0
                
                if delay_rate_previous > 0:
                    delay_trend = ((delay_rate_current - delay_rate_previous) / delay_rate_previous) * 100
                else:
                    delay_trend = 0
                
                trends[airport_code] = {
                    'trend_percentage': round(delay_trend, 1),
                    'trend_direction': 'improving' if delay_trend < 0 else 'declining',
                    'current_delay_rate': round(delay_rate_current, 1),
                    'previous_delay_rate': round(delay_rate_previous, 1)
                }
        
        # Get detailed metrics for top airports
        detailed_metrics = {}
        for airport in airports_data[:5]:  # Top 5 airports
            detailed_query = f"""
            WITH combined_data AS (
                SELECT * FROM `{dataset_id}.flights_2016`
                UNION ALL
                SELECT * FROM `{dataset_id}.flights_2017`
                UNION ALL
                SELECT * FROM `{dataset_id}.flights_2018`
            )
            SELECT 
                COUNT(*) as total_flights,
                COUNT(CASE WHEN DEP_DELAY > 0 THEN 1 END) as delayed_departures,
                COUNT(CASE WHEN ARR_DELAY > 0 THEN 1 END) as delayed_arrivals,
                COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights,
                COUNT(CASE WHEN DIVERTED = 1.0 THEN 1 END) as diverted_flights
            FROM combined_data
            WHERE (ORIGIN = '{airport['code']}' OR DEST = '{airport['code']}')
            """
            
            detailed_job = client.query(detailed_query)
            detailed_results = detailed_job.result()
            
            for row in detailed_results:
                detailed_metrics[airport['code']] = {
                    'total_flights': row.total_flights,
                    'delayed_departures': row.delayed_departures,
                    'delayed_arrivals': row.delayed_arrivals,
                    'cancelled_flights': row.cancelled_flights,
                    'diverted_flights': row.diverted_flights
                }
        
        # Calculate airport rankings and benchmarks
        if airports_data:
            # Industry averages
            total_operations_industry = sum(airport.get('total_operations', airport['total_departures']) for airport in airports_data)
            avg_on_time_rate = sum(airport['on_time_rate'] for airport in airports_data) / len(airports_data)
            avg_delay = sum(airport['avg_delay'] for airport in airports_data) / len(airports_data)
            avg_complexity = sum(airport['complexity_score'] for airport in airports_data) / len(airports_data)
            
            # Performance rankings
            sorted_by_on_time = sorted(airports_data, key=lambda x: x['on_time_rate'], reverse=True)
            sorted_by_delay = sorted(airports_data, key=lambda x: x['avg_delay'])
            sorted_by_complexity = sorted(airports_data, key=lambda x: x['complexity_score'], reverse=True)
            
            # Performance categories and scores
            for airport in airports_data:
                # Performance category
                if airport['on_time_rate'] >= 85:
                    airport['performance_category'] = 'Excellent'
                elif airport['on_time_rate'] >= 75:
                    airport['performance_category'] = 'Good'
                elif airport['on_time_rate'] >= 65:
                    airport['performance_category'] = 'Fair'
                else:
                    airport['performance_category'] = 'Poor'
                
                # Complexity category
                if airport['complexity_score'] >= 8:
                    airport['complexity_category'] = 'Very High'
                elif airport['complexity_score'] >= 6:
                    airport['complexity_category'] = 'High'
                elif airport['complexity_score'] >= 4:
                    airport['complexity_category'] = 'Medium'
                else:
                    airport['complexity_category'] = 'Low'
                
                # Market share
                total_ops = airport.get('total_operations', airport['total_departures'])
                airport['market_share'] = round((total_ops / total_operations_industry) * 100, 2)
                
                # Efficiency score (0-100)
                on_time_score = min(airport['on_time_rate'], 100)
                delay_score = max(0, 100 - (airport['avg_delay'] * 2))
                complexity_efficiency = max(0, 100 - (airport['complexity_score'] * 5))
                airport['efficiency_score'] = round((on_time_score * 0.4 + delay_score * 0.3 + complexity_efficiency * 0.3), 1)
                
                # Risk assessment
                risk_factors = []
                if airport['on_time_rate'] < 75:
                    risk_factors.append('Low on-time performance')
                if airport['avg_delay'] > 15:
                    risk_factors.append('High average delays')
                if airport['cancellation_rate'] > 2:
                    risk_factors.append('High cancellation rate')
                if airport['complexity_score'] > 8:
                    risk_factors.append('Very high complexity')
                
                airport['risk_factors'] = risk_factors
                airport['risk_level'] = 'High' if len(risk_factors) >= 3 else 'Medium' if len(risk_factors) >= 2 else 'Low'
            
            # Industry benchmarks
            industry_benchmarks = {
                'total_operations': total_operations_industry,
                'avg_on_time_rate': round(avg_on_time_rate, 1),
                'avg_delay': round(avg_delay, 1),
                'avg_complexity': round(avg_complexity, 1),
                'top_performers': {
                    'on_time': [airport['code'] for airport in sorted_by_on_time[:3]],
                    'lowest_delay': [airport['code'] for airport in sorted_by_delay[:3]],
                    'highest_complexity': [airport['code'] for airport in sorted_by_complexity[:3]]
                }
            }
        else:
            industry_benchmarks = {}

        # Prepare response
        response_data = {
            'airports': airports_data,
            'airline_performance': airline_performance,
            'trends': trends,
            'detailed_metrics': detailed_metrics,
            'industry_benchmarks': industry_benchmarks,
            'analysis_date': datetime.now().isoformat(),
            'data_period': '2016-2018 (3 years of historical data)'
        }
        
        logger.info(f"Analysis completed successfully - {len(airports_data)} airports analyzed")
        logger.info(f"LOGS END - {datetime.now()}")
        
        return (json.dumps(response_data), 200, headers)
        
    except Exception as e:
        logger.error(f"Error in airport performance analysis: {str(e)}")
        error_response = {
            'error': 'Failed to analyze airport performance',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }
        return (json.dumps(error_response), 500, headers) 