"""
BigQuery Tool for Flight Risk Analysis
Integrates with the airline delay and cancellation dataset (2009-2018)
"""
from google.cloud import bigquery
from typing import Dict, List, Optional, Any
import pandas as pd
import json
from datetime import datetime, timedelta
import logging
import os

logger = logging.getLogger(__name__)

class BigQueryFlightTool:
    """Tool for querying flight delay and cancellation data from BigQuery"""
    
    def __init__(self):
        try:
            logger.info("🔄 INITIALIZING BIGQUERY CONNECTION...")
            self.client = bigquery.Client()
            self.dataset_id = "airline_data"  # Default dataset
            self.project_id = self.client.project
            # Available years: 2009-2018
            self.available_years = list(range(2009, 2019))
            logger.info("✅ BIGQUERY CONNECTION SUCCESSFUL - USING REAL HISTORICAL DATA")
            logger.info(f"📊 PROJECT: {self.project_id}")
            logger.info(f"📊 DATASET: {self.dataset_id}")
            logger.info(f"📅 AVAILABLE YEARS: {self.available_years}")
        except Exception as e:
            logger.error(f"❌ BIGQUERY CONNECTION FAILED: {str(e)} - NO DATA AVAILABLE")
            logger.error(f"🔍 ERROR DETAILS: {type(e).__name__}: {str(e)}")
            self.client = None
            self.dataset_id = None
            self.project_id = None
            self.available_years = []
    
    def get_flight_historical_performance(self, airline_code: str, flight_number: str, origin: str, destination: str, years: List[int] = None) -> Dict[str, Any]:
        """
        Get historical performance for a specific flight route (airline + origin + destination)
        
        Args:
            airline_code: Airline code (OP_CARRIER column)
            flight_number: Flight number (IGNORED - route-based analysis only)
            origin: Origin airport code (ORIGIN column)
            destination: Destination airport code (DEST column)
            years: List of years to analyze (default: [2016, 2017, 2018])
            
        Returns:
            Dictionary with historical route performance (aggregated across all flight numbers)
        """
        if not self.client:
            logger.error("❌ BigQuery connection not available")
            raise Exception("BigQuery connection required for historical analysis")

        logger.info(f"📊 ANALYZING ROUTE HISTORY: {airline_code} {origin} -> {destination} (ALL FLIGHT NUMBERS)")
        logger.info(f"🔄 DATA SOURCE: REAL HISTORICAL DATA (BigQuery)")
        
        if not years:
            years = [2016, 2017, 2018]
            logger.info(f"📅 Using default years: {years}")
        else:
            logger.info(f"📅 Analyzing years: {years}")
        
        # Build UNION query for multiple years
        table_queries = []
        for year in years:
            if year in self.available_years:
                table_name = f"`{self.project_id}.{self.dataset_id}.flights_{year}`"
                table_queries.append(f"SELECT * FROM {table_name}")
                logger.info(f"📋 Including table: flights_{year}")
        
        if not table_queries:
            logger.error(f"❌ No valid years found in range: {years}")
            return {"error": f"No valid years provided. Available: {self.available_years}"}
        
        union_query = " UNION ALL ".join(table_queries)
        
        # ROUTE-BASED QUERY: Analyze ALL flights for this airline + route combination
        query = f"""
        WITH combined_data AS (
            {union_query}
        )
        SELECT 
            OP_CARRIER as airline_code,
            ORIGIN as origin_airport,
            DEST as destination_airport,
            COUNT(*) as total_flights,
            COUNT(DISTINCT OP_CARRIER_FL_NUM) as unique_flight_numbers,
            COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights,
            COUNT(CASE WHEN DIVERTED = 1.0 THEN 1 END) as diverted_flights,
            ROUND(AVG(CASE WHEN DEP_DELAY IS NOT NULL AND DEP_DELAY >= 0 THEN DEP_DELAY ELSE 0 END), 1) as avg_departure_delay,
            ROUND(AVG(CASE WHEN ARR_DELAY IS NOT NULL AND ARR_DELAY >= 0 THEN ARR_DELAY ELSE 0 END), 1) as avg_arrival_delay,
            COUNT(CASE WHEN DEP_DELAY > 15 THEN 1 END) as delays_over_15min,
            COUNT(CASE WHEN DEP_DELAY > 60 THEN 1 END) as delays_over_1hour,
            ROUND(AVG(CASE WHEN CARRIER_DELAY IS NOT NULL AND CARRIER_DELAY > 0 THEN CARRIER_DELAY ELSE 0 END), 1) as avg_carrier_delay,
            ROUND(AVG(CASE WHEN WEATHER_DELAY IS NOT NULL AND WEATHER_DELAY > 0 THEN WEATHER_DELAY ELSE 0 END), 1) as avg_weather_delay,
            ROUND(AVG(CASE WHEN NAS_DELAY IS NOT NULL AND NAS_DELAY > 0 THEN NAS_DELAY ELSE 0 END), 1) as avg_nas_delay,
            ROUND(AVG(CASE WHEN SECURITY_DELAY IS NOT NULL AND SECURITY_DELAY > 0 THEN SECURITY_DELAY ELSE 0 END), 1) as avg_security_delay,
            ROUND(AVG(CASE WHEN LATE_AIRCRAFT_DELAY IS NOT NULL AND LATE_AIRCRAFT_DELAY > 0 THEN LATE_AIRCRAFT_DELAY ELSE 0 END), 1) as avg_late_aircraft_delay,
            -- Calculate On-Time Rate (flights with departure delay <= 15 minutes)
            COUNT(CASE WHEN DEP_DELAY IS NOT NULL AND DEP_DELAY <= 15 THEN 1 END) as on_time_flights,
            ROUND(AVG(CASE WHEN AIR_TIME IS NOT NULL AND AIR_TIME > 0 THEN AIR_TIME ELSE 0 END), 0) as avg_air_time,
            ROUND(AVG(CASE WHEN DISTANCE IS NOT NULL AND DISTANCE > 0 THEN DISTANCE ELSE 0 END), 0) as avg_distance,
            COUNT(CASE WHEN CANCELLATION_CODE = 'A' THEN 1 END) as airline_cancellations,
            COUNT(CASE WHEN CANCELLATION_CODE = 'B' THEN 1 END) as weather_cancellations,
            COUNT(CASE WHEN CANCELLATION_CODE = 'C' THEN 1 END) as nas_cancellations,
            COUNT(CASE WHEN CANCELLATION_CODE = 'D' THEN 1 END) as security_cancellations
        FROM combined_data
        WHERE OP_CARRIER = @airline_code 
        AND ORIGIN = @origin 
        AND DEST = @destination
        GROUP BY OP_CARRIER, ORIGIN, DEST
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("airline_code", "STRING", airline_code),
                bigquery.ScalarQueryParameter("origin", "STRING", origin),
                bigquery.ScalarQueryParameter("destination", "STRING", destination)
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            logger.info("🔄 Executing BigQuery job...")
            logger.info(f"📊 Query parameters: airline={airline_code}, route={origin}->{destination}")
            
            results = query_job.result()
            logger.info("✅ Query completed successfully")
            
            for row in results:
                total_flights = row.total_flights or 0
                cancelled_flights = row.cancelled_flights or 0
                
                if total_flights == 0:
                    logger.warning(f"⚠️ No historical data found for {airline_code} {origin}->{destination}")
                    # Continue processing even with 0 flights - return valid structure
                    continue
                
                performance_data = {
                    "flight_identifier": f"{airline_code} {origin}->{destination}",
                    "route": f"{origin} -> {destination}",
                    "years_analyzed": years,
                    "historical_summary": {
                        "total_flights": total_flights,
                        "data_reliability": "high" if total_flights >= 100 else "medium" if total_flights >= 50 else "low"
                    },
                    "cancellation_metrics": {
                        "cancellation_rate": round((cancelled_flights / total_flights) * 100, 1),
                        "total_cancellations": cancelled_flights,
                        "cancellation_breakdown": {
                            "airline_fault": row.airline_cancellations or 0,
                            "weather_related": row.weather_cancellations or 0,
                            "air_system": row.nas_cancellations or 0,
                            "security": row.security_cancellations or 0
                        }
                    },
                    "delay_metrics": {
                        "avg_departure_delay_minutes": row.avg_departure_delay or 0,
                        "avg_arrival_delay_minutes": row.avg_arrival_delay or 0,
                        "on_time_performance": round(((total_flights - (row.delays_over_15min or 0)) / total_flights) * 100, 1),
                        "severe_delay_rate": round(((row.delays_over_1hour or 0) / total_flights) * 100, 1),
                        "delay_breakdown": {
                            "carrier_delay": row.avg_carrier_delay or 0,
                            "weather_delay": row.avg_weather_delay or 0,
                            "nas_delay": row.avg_nas_delay or 0,
                            "security_delay": row.avg_security_delay or 0,
                            "late_aircraft_delay": row.avg_late_aircraft_delay or 0
                        }
                    },
                    "operational_metrics": {
                        "diversion_rate": round(((row.diverted_flights or 0) / total_flights) * 100, 2),
                        "avg_flight_time_minutes": row.avg_air_time or 0,
                        "avg_distance_miles": row.avg_distance or 0
                    },
                    "query_timestamp": datetime.now().isoformat()
                }
                
                logger.info(f"📈 Historical analysis complete for {airline_code} {origin}->{destination}")
                logger.info(f"✈️ Total flights analyzed: {total_flights}")
                logger.info(f"📊 Cancellation rate: {performance_data['cancellation_metrics']['cancellation_rate']}%")
                logger.info(f"⏰ Avg delay: {performance_data['delay_metrics']['avg_departure_delay_minutes']} minutes")
                
                return performance_data
            
            # No results found - but return valid empty structure
            logger.warning(f"⚠️ No historical data found for {airline_code} {origin}->{destination}")
            logger.error("🚨🚨🚨 NO HISTORICAL DATA FOUND IN BIGQUERY - THIS ROUTE WAS NEVER FLOWN 🚨🚨🚨")
            logger.error(f"🚨🚨🚨 AIRLINE: {airline_code}, ROUTE: {origin}->{destination} 🚨🚨🚨")
            return {
                "flight_identifier": f"{airline_code} {origin}->{destination}",
                "route": f"{origin} -> {destination}",
                "years_analyzed": years,
                "historical_summary": {
                    "total_flights": 0,
                    "data_reliability": "no_data"
                },
                "cancellation_metrics": {
                    "cancellation_rate": 0,
                    "total_cancellations": 0,
                    "cancellation_breakdown": {
                        "airline_fault": 0,
                        "weather_related": 0,
                        "air_system": 0,
                        "security": 0
                    }
                },
                "delay_metrics": {
                    "avg_departure_delay_minutes": 0,
                    "avg_arrival_delay_minutes": 0,
                    "on_time_performance": 100,
                    "severe_delay_rate": 0,
                    "delay_breakdown": {
                        "carrier_delay": 0,
                        "weather_delay": 0,
                        "nas_delay": 0,
                        "security_delay": 0,
                        "late_aircraft_delay": 0
                    }
                },
                "operational_metrics": {
                    "diversion_rate": 0,
                    "avg_flight_time_minutes": 0,
                    "avg_distance_miles": 0
                },
                "query_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error analyzing flight performance: {str(e)}")
            logger.error(f"🔍 Error type: {type(e).__name__}")
            # Re-raise the exception to be handled upstream
            raise
    
    def get_route_statistics(self, origin: str, destination: str, years: List[int] = None) -> Dict[str, Any]:
        """
        Get historical statistics for a specific route across all airlines
        
        Args:
            origin: Origin airport code (ORIGIN column)
            destination: Destination airport code (DEST column)
            years: List of years to analyze (default: [2016, 2017, 2018])
            
        Returns:
            Dictionary with route statistics
        """
        if not self.client:
            logger.error("❌ BigQuery connection not available")
            raise Exception("BigQuery connection required for route statistics")

        logger.info(f"📊 ANALYZING ROUTE: {origin} -> {destination}")
        logger.info(f"🔄 DATA SOURCE: REAL HISTORICAL DATA (BigQuery)")
        
        if not years:
            years = [2016, 2017, 2018]
            logger.info(f"📅 Using default years: {years}")
        else:
            logger.info(f"📅 Analyzing years: {years}")
        
        # Build UNION query
        table_queries = []
        for year in years:
            if year in self.available_years:
                table_name = f"`{self.project_id}.{self.dataset_id}.flights_{year}`"
                table_queries.append(f"SELECT * FROM {table_name}")
                logger.info(f"📋 Including table: flights_{year}")
        
        if not table_queries:
            logger.error(f"❌ No valid years found in range: {years}")
            return {"error": f"No valid years provided. Available: {self.available_years}"}
        
        union_query = " UNION ALL ".join(table_queries)
        
        query = f"""
        WITH combined_data AS (
            {union_query}
        )
        SELECT 
            OP_CARRIER as airline_code,
            ORIGIN as origin_airport,
            DEST as destination_airport,
            COUNT(*) as total_flights,
            COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights,
            COUNT(CASE WHEN DIVERTED = 1.0 THEN 1 END) as diverted_flights,
            ROUND(AVG(CASE WHEN DEP_DELAY IS NOT NULL THEN DEP_DELAY ELSE 0 END), 2) as avg_departure_delay,
            ROUND(AVG(CASE WHEN ARR_DELAY IS NOT NULL THEN ARR_DELAY ELSE 0 END), 2) as avg_arrival_delay,
            ROUND(STDDEV(CASE WHEN DEP_DELAY IS NOT NULL THEN DEP_DELAY ELSE 0 END), 2) as std_departure_delay,
            COUNT(CASE WHEN DEP_DELAY > 15 THEN 1 END) as delays_over_15min,
            COUNT(CASE WHEN DEP_DELAY > 60 THEN 1 END) as delays_over_1hour,
            ROUND(AVG(CASE WHEN CARRIER_DELAY IS NOT NULL THEN CARRIER_DELAY ELSE 0 END), 2) as avg_carrier_delay,
            ROUND(AVG(CASE WHEN WEATHER_DELAY IS NOT NULL THEN WEATHER_DELAY ELSE 0 END), 2) as avg_weather_delay,
            ROUND(AVG(CASE WHEN NAS_DELAY IS NOT NULL THEN NAS_DELAY ELSE 0 END), 2) as avg_nas_delay,
            ROUND(AVG(CASE WHEN SECURITY_DELAY IS NOT NULL THEN SECURITY_DELAY ELSE 0 END), 2) as avg_security_delay,
            ROUND(AVG(CASE WHEN LATE_AIRCRAFT_DELAY IS NOT NULL THEN LATE_AIRCRAFT_DELAY ELSE 0 END), 2) as avg_late_aircraft_delay,
            ROUND(AVG(CASE WHEN AIR_TIME IS NOT NULL THEN AIR_TIME ELSE 0 END), 0) as avg_air_time,
            ROUND(AVG(CASE WHEN DISTANCE IS NOT NULL THEN DISTANCE ELSE 0 END), 0) as avg_distance
        FROM combined_data
        WHERE ORIGIN = @origin 
        AND DEST = @destination
        GROUP BY OP_CARRIER, ORIGIN, DEST
        ORDER BY total_flights DESC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("origin", "STRING", origin),
                bigquery.ScalarQueryParameter("destination", "STRING", destination)
            ]
        )
        
        try:
            query_job = self.client.query(query, job_config=job_config)
            logger.info("🔄 Executing BigQuery job...")
            logger.info(f"📊 Query parameters: origin={origin}, destination={destination}")
            
            results = query_job.result()
            logger.info("✅ Query completed successfully")
            
            route_stats = []
            total_records = 0
            
            for row in results:
                total_records += 1
                stats = {
                    "airline": row.airline_code,
                    "total_flights": row.total_flights or 0,
                    "cancellation_rate": round((row.cancelled_flights or 0) / max(row.total_flights, 1) * 100, 2),
                    "diversion_rate": round((row.diverted_flights or 0) / max(row.total_flights, 1) * 100, 2),
                    "avg_departure_delay": row.avg_departure_delay or 0,
                    "avg_arrival_delay": row.avg_arrival_delay or 0,
                    "delay_variability": row.std_departure_delay or 0,
                    "severe_delay_rate": round((row.delays_over_1hour or 0) / max(row.total_flights, 1) * 100, 2),
                    "on_time_performance": round((1 - ((row.delays_over_15min or 0) / max(row.total_flights, 1))) * 100, 2),
                    "delay_breakdown": {
                        "carrier_delay": row.avg_carrier_delay or 0,
                        "weather_delay": row.avg_weather_delay or 0,
                        "nas_delay": row.avg_nas_delay or 0,
                        "security_delay": row.avg_security_delay or 0,
                        "late_aircraft_delay": row.avg_late_aircraft_delay or 0
                    },
                    "avg_air_time": row.avg_air_time or 0,
                    "avg_distance": row.avg_distance or 0
                }
                route_stats.append(stats)
            
            logger.info(f"📈 Processed {total_records} airline records")
            logger.info(f"✈️ Found data for {len(route_stats)} airlines on this route")
            
            response = {
                "route": f"{origin} -> {destination}",
                "years_analyzed": years,
                "airlines": route_stats,
                "query_date": datetime.now().isoformat()
            }
            
            logger.info("✅ Route analysis complete")
            logger.info(f"📊 Total flights analyzed: {sum(s['total_flights'] for s in route_stats)}")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error analyzing route: {str(e)}")
            logger.error(f"🔍 Error type: {type(e).__name__}")
            logger.error(f"📍 Error location: get_route_statistics")
            # Re-raise the exception to be handled upstream
            raise

    def _get_mock_flight_performance(self, airline_code: str, flight_number: str, origin: str, destination: str) -> Dict[str, Any]:
        """Return honest error when BigQuery is not available"""
        return {
            "flight_identifier": f"{airline_code}{flight_number}",
            "route": f"{origin} -> {destination}",
            "error": "Unable to retrieve historical flight data",
            "message": "BigQuery connection failed. Historical flight performance data is currently unavailable. Please try again later or contact support.",
            "data_available": False,
            "query_timestamp": datetime.now().isoformat()
        }

    def _get_mock_route_statistics(self, origin: str, destination: str) -> Dict[str, Any]:
        """Return honest error when BigQuery is not available"""
        return {
            "route": f"{origin} -> {destination}",
            "error": "Unable to retrieve route statistics",
            "message": "BigQuery connection failed. Historical route data is currently unavailable. Please try again later or contact support.",
            "data_available": False,
            "query_date": datetime.now().isoformat()
        }

    def get_airline_on_time_rate(self, airline_code: str, origin: str = None, destination: str = None, years: List[int] = None) -> Dict[str, Any]:
        """
        Calculate airline On-Time Rate based on historical data from BigQuery
        
        Args:
            airline_code: Airline code (e.g., 'AA', 'DL', 'UA')
            origin: Origin airport code (for route-specific analysis)
            destination: Destination airport code (for route-specific analysis)
            years: List of years to analyze (default: [2016, 2017, 2018])
            
        Returns:
            Dictionary with airline On-Time Rate and performance metrics (route-specific if origin/destination provided)
        """
        if not self.client:
            logger.error("❌ BigQuery connection not available")
            raise Exception("BigQuery connection required for airline On-Time Rate analysis")

        if not years:
            years = [2016, 2017, 2018]  # Last 3 years of available data
        
        logger.info(f"📊 CALCULATING AIRLINE ON-TIME RATE: {airline_code}")
        logger.info(f"🔄 DATA SOURCE: REAL HISTORICAL DATA (BigQuery)")
        logger.info(f"📅 ANALYZING YEARS: {years}")
        
        # Build UNION query for multiple years
        table_queries = []
        for year in years:
            if year in self.available_years:
                table_name = f"`{self.project_id}.{self.dataset_id}.flights_{year}`"
                table_queries.append(f"SELECT * FROM {table_name}")
                logger.info(f"📋 Including table: flights_{year}")
        
        if not table_queries:
            logger.error(f"❌ No valid years found in range: {years}")
            return {"error": f"No valid years provided. Available: {self.available_years}"}
        
        union_query = " UNION ALL ".join(table_queries)
        
        # ROUTE-SPECIFIC QUERY: Analyze flights for this airline on specific routes
        query = f"""
        WITH combined_data AS (
            {union_query}
        )
        SELECT 
            OP_CARRIER as airline_code,
            {f"ORIGIN as origin_airport, DEST as destination_airport," if origin and destination else ""}
            COUNT(*) as total_flights,
            COUNT(CASE WHEN CANCELLED = 1.0 THEN 1 END) as cancelled_flights,
            COUNT(CASE WHEN DIVERTED = 1.0 THEN 1 END) as diverted_flights,
            -- Calculate On-Time Rate (flights with departure delay <= 15 minutes)
            COUNT(CASE WHEN DEP_DELAY IS NOT NULL AND DEP_DELAY <= 15 THEN 1 END) as on_time_flights,
            COUNT(CASE WHEN DEP_DELAY IS NOT NULL AND DEP_DELAY > 15 THEN 1 END) as delayed_flights,
            ROUND(AVG(CASE WHEN DEP_DELAY IS NOT NULL AND DEP_DELAY >= 0 THEN DEP_DELAY ELSE 0 END), 1) as avg_departure_delay,
            ROUND(AVG(CASE WHEN ARR_DELAY IS NOT NULL AND ARR_DELAY >= 0 THEN ARR_DELAY ELSE 0 END), 1) as avg_arrival_delay,
            COUNT(CASE WHEN DEP_DELAY > 60 THEN 1 END) as severe_delays_over_1hour,
            COUNT(CASE WHEN DEP_DELAY > 120 THEN 1 END) as severe_delays_over_2hours,
            ROUND(AVG(CASE WHEN CARRIER_DELAY IS NOT NULL AND CARRIER_DELAY > 0 THEN CARRIER_DELAY ELSE 0 END), 1) as avg_carrier_delay,
            ROUND(AVG(CASE WHEN WEATHER_DELAY IS NOT NULL AND WEATHER_DELAY > 0 THEN WEATHER_DELAY ELSE 0 END), 1) as avg_weather_delay,
            ROUND(AVG(CASE WHEN NAS_DELAY IS NOT NULL AND NAS_DELAY > 0 THEN NAS_DELAY ELSE 0 END), 1) as avg_nas_delay,
            ROUND(AVG(CASE WHEN SECURITY_DELAY IS NOT NULL AND SECURITY_DELAY > 0 THEN SECURITY_DELAY ELSE 0 END), 1) as avg_security_delay,
            ROUND(AVG(CASE WHEN LATE_AIRCRAFT_DELAY IS NOT NULL AND LATE_AIRCRAFT_DELAY > 0 THEN LATE_AIRCRAFT_DELAY ELSE 0 END), 1) as avg_late_aircraft_delay
        FROM combined_data
        WHERE OP_CARRIER = '{airline_code}'
        {f"AND ORIGIN = '{origin}' AND DEST = '{destination}'" if origin and destination else ""}
        GROUP BY OP_CARRIER{", ORIGIN, DEST" if origin and destination else ""}
        ORDER BY total_flights DESC
        """
        
        try:
            logger.info(f"🔍 EXECUTING QUERY FOR AIRLINE: {airline_code}")
            query_job = self.client.query(query)
            results = query_job.result()
            
            if not results:
                logger.warning(f"⚠️ No data found for airline: {airline_code}")
                return {
                    "airline_code": airline_code,
                    "years_analyzed": years,
                    "error": f"No historical data found for airline {airline_code}",
                    "query_timestamp": datetime.now().isoformat()
                }
            
            row = list(results)[0]
            
            # Calculate On-Time Rate percentage
            total_flights = row.total_flights
            on_time_flights = row.on_time_flights
            on_time_rate = round((on_time_flights / total_flights) * 100, 1) if total_flights > 0 else 0.0
            
            # Calculate other metrics
            cancellation_rate = round((row.cancelled_flights / total_flights) * 100, 2) if total_flights > 0 else 0.0
            diversion_rate = round((row.diverted_flights / total_flights) * 100, 2) if total_flights > 0 else 0.0
            delay_rate = round((row.delayed_flights / total_flights) * 100, 2) if total_flights > 0 else 0.0
            severe_delay_rate = round((row.severe_delays_over_1hour / total_flights) * 100, 2) if total_flights > 0 else 0.0
            
            response = {
                "airline_code": airline_code,
                "years_analyzed": years,
                "total_flights_analyzed": total_flights,
                "on_time_rate": on_time_rate,
                "performance_metrics": {
                    "cancellation_rate": cancellation_rate,
                    "diversion_rate": diversion_rate,
                    "delay_rate": delay_rate,
                    "severe_delay_rate": severe_delay_rate,
                    "avg_departure_delay_minutes": row.avg_departure_delay,
                    "avg_arrival_delay_minutes": row.avg_arrival_delay
                },
                "delay_breakdown": {
                    "carrier_delay": row.avg_carrier_delay,
                    "weather_delay": row.avg_weather_delay,
                    "nas_delay": row.avg_nas_delay,
                    "security_delay": row.avg_security_delay,
                    "late_aircraft_delay": row.avg_late_aircraft_delay
                },
                "data_reliability": "real_historical_data",
                "query_timestamp": datetime.now().isoformat()
            }
            
            logger.info(f"✅ AIRLINE ON-TIME RATE CALCULATED: {airline_code} = {on_time_rate}%")
            logger.info(f"📊 Total flights analyzed: {total_flights}")
            logger.info(f"📊 On-time flights: {on_time_flights}")
            logger.info(f"📊 Cancellation rate: {cancellation_rate}%")
            logger.info(f"📊 Delay rate: {delay_rate}%")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Error calculating airline On-Time Rate: {str(e)}")
            logger.error(f"🔍 Error type: {type(e).__name__}")
            logger.error(f"📍 Error location: get_airline_on_time_rate")
            raise


# Tool function for integration
def get_flight_historical_data(airline_code: str, flight_number: str, origin: str, destination: str, years: List[int] = None) -> Dict[str, Any]:
    """
    Get historical flight performance data from BigQuery
    
    Args:
        airline_code: Airline code (e.g., 'DL')
        flight_number: Flight number (e.g., '1590')
        origin: Origin airport code (e.g., 'ATL')
        destination: Destination airport code (e.g., 'LAX')
        years: List of years to analyze (default: [2016, 2017, 2018])
        
    Returns:
        Dictionary with historical performance data
    """
    tool = BigQueryFlightTool()
    return tool.get_flight_historical_performance(airline_code, flight_number, origin, destination, years)


def get_route_historical_data(origin: str, destination: str, years: List[int] = None) -> Dict[str, Any]:
    """
    Get historical route performance data from BigQuery
    
    Args:
        origin: Origin airport code
        destination: Destination airport code
        years: List of years to analyze (default: [2016, 2017, 2018])
        
    Returns:
        Dictionary with route performance data
    """
    tool = BigQueryFlightTool()
    return tool.get_route_statistics(origin, destination, years)

def get_airline_on_time_rate(airline_code: str, origin: str = None, destination: str = None, years: List[int] = None) -> Dict[str, Any]:
    """
    Calculate airline On-Time Rate based on historical data from BigQuery
    
    Args:
        airline_code: Airline code (e.g., 'AA', 'DL', 'UA')
        origin: Origin airport code (for route-specific analysis)
        destination: Destination airport code (for route-specific analysis)
        years: List of years to analyze (default: [2016, 2017, 2018])
        
    Returns:
        Dictionary with airline On-Time Rate and performance metrics (route-specific if origin/destination provided)
    """
    if not years:
        years = [2016, 2017, 2018]  # Last 3 years of available data
    
    tool = BigQueryFlightTool()
    return tool.get_airline_on_time_rate(airline_code, origin, destination, years) 
# Cache for airline and airport mappings
_airline_cache = None
_airport_cache = None

def get_all_airlines() -> List[Dict[str, str]]:
    """
    Get all airlines from BigQuery airline_reviews table
    Returns list of dicts with airline_code, airline_name, and common_names
    """
    global _airline_cache
    
    if _airline_cache is not None:
        return _airline_cache
    
    try:
        client = bigquery.Client()
        query = """
        SELECT DISTINCT 
            airline_code,
            airline_name
        FROM `airline_data.airline_reviews`
        WHERE airline_code IS NOT NULL AND airline_name IS NOT NULL
        ORDER BY airline_code
        """
        
        results = client.query(query).result()
        
        airlines = []
        for row in results:
            airlines.append({
                'code': row.airline_code,
                'name': row.airline_name,
                # Generate common search patterns
                'search_patterns': [
                    row.airline_name.lower(),
                    row.airline_code.lower(),
                    # Extract first word (e.g., "Delta" from "Delta Air Lines")
                    row.airline_name.split()[0].lower() if row.airline_name else ''
                ]
            })
        
        _airline_cache = airlines
        logger.info(f"✅ Loaded {len(airlines)} airlines from BigQuery")
        return airlines
        
    except Exception as e:
        logger.error(f"❌ Failed to fetch airlines from BigQuery: {e}")
        # Return empty list - no hardcoded fallback
        return []

def get_all_airports() -> List[Dict[str, str]]:
    """
    Get all major airports from BigQuery us_airports table
    Returns list of dicts with iata_code, airport_name, city
    """
    global _airport_cache
    
    if _airport_cache is not None:
        return _airport_cache
    
    try:
        client = bigquery.Client()
        # Get major commercial airports (exclude small heliports)
        query = """
        SELECT DISTINCT 
            iata_code,
            name as airport_name
        FROM `airline_data.us_airports`
        WHERE iata_code IS NOT NULL 
            AND iata_code != ''
            AND name NOT LIKE '%Heliport%'
            AND name NOT LIKE '%Army%'
            AND name NOT LIKE '%Air Force%'
        ORDER BY iata_code
        LIMIT 200
        """
        
        results = client.query(query).result()
        
        airports = []
        for row in results:
            airports.append({
                'code': row.iata_code,
                'name': row.airport_name,
                # Generate common search patterns
                'search_patterns': [
                    row.iata_code.lower(),
                    row.airport_name.lower() if row.airport_name else '',
                    # Extract city/location from name
                ]
            })
        
        _airport_cache = airports
        logger.info(f"✅ Loaded {len(airports)} airports from BigQuery")
        return airports
        
    except Exception as e:
        logger.error(f"❌ Failed to fetch airports from BigQuery: {e}")
        # Return empty list - no hardcoded fallback
        return []
