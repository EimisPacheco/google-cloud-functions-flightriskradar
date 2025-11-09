"""
Real-time Airport Status Module
Provides current operational status, delays, weather, and flight information
"""
import requests
import json
from datetime import datetime, timedelta
import os
from typing import Dict, List, Optional
import logging
import pytz

logger = logging.getLogger(__name__)

class AirportStatusService:
    def __init__(self, airport_details: Optional[Dict] = None):
        self.openweather_api_key = os.environ.get('OPENWEATHER_API_KEY')
        self.flightaware_api_key = os.environ.get('FLIGHTAWARE_API_KEY')
        self.aviationstack_api_key = os.environ.get('AVIATIONSTACK_API_KEY')
        self._cache = {}
        self._cache_duration = 300  # 5 minutes cache
        self.airport_details = airport_details or {}
        
    def get_current_status(self, airport_code: str) -> Dict:
        """Get comprehensive current status for an airport"""
        try:
            # Check cache first
            cache_key = f"status_{airport_code}"
            cached_data = self._get_from_cache(cache_key)
            if cached_data:
                logger.info(f"Returning cached status for {airport_code}")
                return cached_data
            
            status_data = {
                'airport_code': airport_code,
                'timestamp': datetime.now(pytz.UTC).isoformat(),
                'operational_status': self._get_operational_status(airport_code),
                'weather': self._get_current_weather(airport_code),
                'delays': self._get_current_delays(airport_code),
                'traffic': self._get_traffic_status(airport_code),
                'runway_status': self._get_runway_status(airport_code),
                'alerts': self._get_active_alerts(airport_code)
            }
            
            # Calculate overall status
            status_data['overall_status'] = self._calculate_overall_status(status_data)
            
            result = {
                'success': True,
                'data': status_data
            }
            
            # Cache the result
            self._add_to_cache(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting airport status for {airport_code}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'data': self._get_fallback_status(airport_code)
            }
    
    def _get_operational_status(self, airport_code: str) -> Dict:
        """Get current operational status"""
        try:
            # In a real implementation, this would call FAA API or similar
            # For now, we'll simulate based on time and known patterns
            current_hour = datetime.now().hour
            
            # Simulate different statuses based on time
            if 6 <= current_hour <= 22:
                status = "NORMAL"
                message = "Airport operating normally"
                capacity = 85 + (current_hour % 3) * 5
            elif 22 < current_hour or current_hour < 6:
                status = "REDUCED"
                message = "Reduced operations - Night hours"
                capacity = 45
            else:
                status = "NORMAL"
                message = "Airport operating normally"
                capacity = 80
            
            # Special cases for major airports
            major_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'DEN', 'JFK']
            if airport_code in major_hubs:
                capacity = min(capacity + 10, 95)
                
            return {
                'status': status,
                'message': message,
                'capacity_percentage': capacity,
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting operational status: {str(e)}")
            return {
                'status': 'UNKNOWN',
                'message': 'Unable to determine status',
                'capacity_percentage': 0,
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
    
    def _get_current_weather(self, airport_code: str) -> Dict:
        """Get current weather conditions"""
        try:
            if not self.openweather_api_key:
                return self._get_simulated_weather(airport_code)
            
            # Get airport coordinates (simplified - in production, use proper airport database)
            coordinates = self._get_airport_coordinates(airport_code)
            
            url = "http://api.openweathermap.org/data/2.5/weather"
            params = {
                'lat': coordinates['lat'],
                'lon': coordinates['lon'],
                'appid': self.openweather_api_key,
                'units': 'imperial'
            }
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                # Calculate weather impact on operations
                weather_impact = self._calculate_weather_impact(data)
                
                return {
                    'conditions': data['weather'][0]['main'],
                    'description': data['weather'][0]['description'],
                    'temperature': f"{data['main']['temp']}°F",
                    'visibility': data.get('visibility', 10000) / 1609.34,  # Convert to miles
                    'wind_speed': f"{data['wind']['speed']} mph",
                    'wind_direction': data['wind'].get('deg', 0),
                    'humidity': f"{data['main']['humidity']}%",
                    'pressure': f"{data['main']['pressure']} mb",
                    'impact': weather_impact,
                    'last_update': datetime.now(pytz.UTC).isoformat()
                }
            else:
                return self._get_simulated_weather(airport_code)
                
        except Exception as e:
            logger.error(f"Error getting weather: {str(e)}")
            return self._get_simulated_weather(airport_code)
    
    def _get_current_delays(self, airport_code: str) -> Dict:
        """Get current delay information"""
        try:
            # Simulate delay data based on time and airport
            current_hour = datetime.now().hour
            base_delay = 0
            
            # Rush hours have more delays
            if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:
                base_delay = 15
            elif 10 <= current_hour <= 16:
                base_delay = 5
            else:
                base_delay = 0
            
            # Major hubs have additional delays
            major_hubs = ['ATL', 'ORD', 'DFW', 'LAX', 'DEN', 'JFK']
            if airport_code in major_hubs:
                base_delay += 10
            
            # Random variation
            import random
            variation = random.randint(-5, 10)
            avg_delay = max(0, base_delay + variation)
            
            delayed_flights = int(avg_delay * 2.5) if avg_delay > 0 else 0
            
            return {
                'average_departure_delay': avg_delay,
                'average_arrival_delay': avg_delay - 3 if avg_delay > 3 else 0,
                'delayed_departures': delayed_flights,
                'delayed_arrivals': int(delayed_flights * 0.8),
                'cancellations': max(0, delayed_flights // 20),
                'delay_reasons': self._get_delay_reasons(avg_delay),
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting delays: {str(e)}")
            return {
                'average_departure_delay': 0,
                'average_arrival_delay': 0,
                'delayed_departures': 0,
                'delayed_arrivals': 0,
                'cancellations': 0,
                'delay_reasons': [],
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
    
    def _get_traffic_status(self, airport_code: str) -> Dict:
        """Get current traffic status"""
        try:
            current_hour = datetime.now().hour
            
            # Simulate traffic patterns
            if 6 <= current_hour <= 10:
                period = "Morning Rush"
                volume = "HIGH"
                scheduled_departures = 45 + (airport_code in ['ATL', 'ORD', 'DFW']) * 20
                scheduled_arrivals = 35 + (airport_code in ['ATL', 'ORD', 'DFW']) * 15
            elif 16 <= current_hour <= 20:
                period = "Evening Rush"
                volume = "HIGH"
                scheduled_departures = 40 + (airport_code in ['ATL', 'ORD', 'DFW']) * 18
                scheduled_arrivals = 42 + (airport_code in ['ATL', 'ORD', 'DFW']) * 17
            elif 10 < current_hour < 16:
                period = "Midday"
                volume = "MODERATE"
                scheduled_departures = 25 + (airport_code in ['ATL', 'ORD', 'DFW']) * 10
                scheduled_arrivals = 23 + (airport_code in ['ATL', 'ORD', 'DFW']) * 10
            else:
                period = "Off-Peak"
                volume = "LOW"
                scheduled_departures = 10 + (airport_code in ['ATL', 'ORD', 'DFW']) * 5
                scheduled_arrivals = 8 + (airport_code in ['ATL', 'ORD', 'DFW']) * 5
            
            return {
                'current_period': period,
                'traffic_volume': volume,
                'scheduled_departures_next_hour': scheduled_departures,
                'scheduled_arrivals_next_hour': scheduled_arrivals,
                'active_flights': scheduled_departures + scheduled_arrivals,
                'ground_traffic': self._get_ground_traffic_status(volume),
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting traffic status: {str(e)}")
            return {
                'current_period': 'Unknown',
                'traffic_volume': 'UNKNOWN',
                'scheduled_departures_next_hour': 0,
                'scheduled_arrivals_next_hour': 0,
                'active_flights': 0,
                'ground_traffic': 'UNKNOWN',
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
    
    def _get_runway_status(self, airport_code: str) -> Dict:
        """Get runway status information"""
        try:
            # Simulate runway data
            major_airports = {
                'ATL': {'total': 5, 'active': 5, 'configuration': 'East Flow'},
                'ORD': {'total': 8, 'active': 6, 'configuration': 'West Flow'},
                'DFW': {'total': 7, 'active': 7, 'configuration': 'South Flow'},
                'LAX': {'total': 4, 'active': 4, 'configuration': 'West Flow'},
                'DEN': {'total': 6, 'active': 5, 'configuration': 'North Flow'},
                'JFK': {'total': 4, 'active': 3, 'configuration': 'Southeast Flow'}
            }
            
            if airport_code in major_airports:
                runway_info = major_airports[airport_code]
            else:
                # Default for other airports
                runway_info = {
                    'total': 2,
                    'active': 2,
                    'configuration': 'Standard'
                }
            
            return {
                'total_runways': runway_info['total'],
                'active_runways': runway_info['active'],
                'configuration': runway_info['configuration'],
                'efficiency': round((runway_info['active'] / runway_info['total']) * 100, 1),
                'maintenance': runway_info['total'] - runway_info['active'],
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting runway status: {str(e)}")
            return {
                'total_runways': 0,
                'active_runways': 0,
                'configuration': 'Unknown',
                'efficiency': 0,
                'maintenance': 0,
                'last_update': datetime.now(pytz.UTC).isoformat()
            }
    
    def _get_active_alerts(self, airport_code: str) -> List[Dict]:
        """Get active alerts and advisories"""
        alerts = []
        
        try:
            # Check weather conditions for alerts
            weather = self._get_current_weather(airport_code)
            if weather.get('impact', {}).get('level') == 'HIGH':
                alerts.append({
                    'type': 'WEATHER',
                    'severity': 'HIGH',
                    'title': 'Weather Advisory',
                    'description': f"Current weather conditions may impact operations: {weather.get('description', 'Unknown')}",
                    'issued': datetime.now(pytz.UTC).isoformat()
                })
            
            # Check delays
            delays = self._get_current_delays(airport_code)
            if delays.get('average_departure_delay', 0) > 30:
                alerts.append({
                    'type': 'DELAY',
                    'severity': 'MEDIUM',
                    'title': 'Significant Delays',
                    'description': f"Average departure delays of {delays['average_departure_delay']} minutes",
                    'issued': datetime.now(pytz.UTC).isoformat()
                })
            
            # Check traffic
            traffic = self._get_traffic_status(airport_code)
            if traffic.get('traffic_volume') == 'HIGH' and delays.get('average_departure_delay', 0) > 15:
                alerts.append({
                    'type': 'CONGESTION',
                    'severity': 'MEDIUM',
                    'title': 'High Traffic Volume',
                    'description': f"High traffic during {traffic['current_period']} may cause additional delays",
                    'issued': datetime.now(pytz.UTC).isoformat()
                })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting alerts: {str(e)}")
            return []
    
    def _calculate_overall_status(self, status_data: Dict) -> Dict:
        """Calculate overall airport status based on all factors"""
        try:
            score = 100
            factors = []
            
            # Operational status impact
            op_status = status_data.get('operational_status', {})
            if op_status.get('status') == 'REDUCED':
                score -= 20
                factors.append('Reduced operations')
            elif op_status.get('status') == 'CLOSED':
                score -= 80
                factors.append('Airport closed')
            
            # Weather impact
            weather = status_data.get('weather', {})
            weather_impact = weather.get('impact', {})
            if weather_impact.get('level') == 'HIGH':
                score -= 30
                factors.append('Severe weather conditions')
            elif weather_impact.get('level') == 'MEDIUM':
                score -= 15
                factors.append('Moderate weather impact')
            
            # Delay impact
            delays = status_data.get('delays', {})
            avg_delay = delays.get('average_departure_delay', 0)
            if avg_delay > 45:
                score -= 25
                factors.append('Significant delays')
            elif avg_delay > 30:
                score -= 15
                factors.append('Moderate delays')
            elif avg_delay > 15:
                score -= 10
                factors.append('Minor delays')
            
            # Traffic impact
            traffic = status_data.get('traffic', {})
            if traffic.get('traffic_volume') == 'HIGH':
                score -= 10
                factors.append('High traffic volume')
            
            # Runway efficiency
            runway = status_data.get('runway_status', {})
            if runway.get('efficiency', 100) < 75:
                score -= 15
                factors.append('Reduced runway capacity')
            
            # Determine status level
            score = max(0, score)
            if score >= 85:
                level = 'EXCELLENT'
                color = 'green'
                description = 'Airport operating smoothly'
            elif score >= 70:
                level = 'GOOD'
                color = 'blue'
                description = 'Normal operations with minor issues'
            elif score >= 50:
                level = 'FAIR'
                color = 'yellow'
                description = 'Some operational challenges'
            elif score >= 30:
                level = 'POOR'
                color = 'orange'
                description = 'Significant operational issues'
            else:
                level = 'CRITICAL'
                color = 'red'
                description = 'Severe operational disruptions'
            
            return {
                'score': score,
                'level': level,
                'color': color,
                'description': description,
                'factors': factors
            }
            
        except Exception as e:
            logger.error(f"Error calculating overall status: {str(e)}")
            return {
                'score': 50,
                'level': 'UNKNOWN',
                'color': 'gray',
                'description': 'Unable to determine status',
                'factors': []
            }
    
    def _get_simulated_weather(self, airport_code: str) -> Dict:
        """Get simulated weather data as fallback"""
        import random
        
        conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Fog']
        condition = random.choice(conditions)
        
        weather_impact = {
            'Clear': {'level': 'NONE', 'delay_factor': 0},
            'Partly Cloudy': {'level': 'NONE', 'delay_factor': 0},
            'Cloudy': {'level': 'LOW', 'delay_factor': 5},
            'Light Rain': {'level': 'MEDIUM', 'delay_factor': 15},
            'Fog': {'level': 'HIGH', 'delay_factor': 30}
        }
        
        return {
            'conditions': condition,
            'description': condition.lower(),
            'temperature': f"{random.randint(50, 85)}°F",
            'visibility': 10 if condition != 'Fog' else 0.5,
            'wind_speed': f"{random.randint(5, 20)} mph",
            'wind_direction': random.randint(0, 360),
            'humidity': f"{random.randint(40, 80)}%",
            'pressure': f"{random.randint(1010, 1030)} mb",
            'impact': weather_impact[condition],
            'last_update': datetime.now(pytz.UTC).isoformat()
        }
    
    def _calculate_weather_impact(self, weather_data: Dict) -> Dict:
        """Calculate weather impact on operations"""
        impact_score = 0
        factors = []
        
        # Visibility impact
        visibility = weather_data.get('visibility', 10000) / 1609.34  # to miles
        if visibility < 1:
            impact_score += 40
            factors.append('Very low visibility')
        elif visibility < 3:
            impact_score += 20
            factors.append('Low visibility')
        
        # Wind impact
        wind_speed = weather_data.get('wind', {}).get('speed', 0)
        if wind_speed > 35:
            impact_score += 30
            factors.append('High winds')
        elif wind_speed > 25:
            impact_score += 15
            factors.append('Moderate winds')
        
        # Weather condition impact
        condition = weather_data.get('weather', [{}])[0].get('main', '')
        if condition in ['Thunderstorm', 'Snow']:
            impact_score += 40
            factors.append(f'{condition} conditions')
        elif condition in ['Rain', 'Drizzle']:
            impact_score += 20
            factors.append(f'{condition} conditions')
        elif condition == 'Fog':
            impact_score += 30
            factors.append('Foggy conditions')
        
        # Determine impact level
        if impact_score >= 50:
            level = 'HIGH'
            delay_factor = 30
        elif impact_score >= 30:
            level = 'MEDIUM'
            delay_factor = 15
        elif impact_score >= 15:
            level = 'LOW'
            delay_factor = 5
        else:
            level = 'NONE'
            delay_factor = 0
        
        return {
            'level': level,
            'score': impact_score,
            'delay_factor': delay_factor,
            'factors': factors
        }
    
    def _get_delay_reasons(self, avg_delay: int) -> List[Dict]:
        """Get reasons for delays"""
        reasons = []
        
        if avg_delay > 0:
            if avg_delay > 30:
                reasons.append({
                    'reason': 'Air Traffic Control',
                    'percentage': 35,
                    'impact': 'HIGH'
                })
                reasons.append({
                    'reason': 'Weather',
                    'percentage': 30,
                    'impact': 'HIGH'
                })
            elif avg_delay > 15:
                reasons.append({
                    'reason': 'Late Aircraft Arrival',
                    'percentage': 40,
                    'impact': 'MEDIUM'
                })
                reasons.append({
                    'reason': 'Air Traffic Control',
                    'percentage': 25,
                    'impact': 'MEDIUM'
                })
            else:
                reasons.append({
                    'reason': 'Late Aircraft Arrival',
                    'percentage': 50,
                    'impact': 'LOW'
                })
                reasons.append({
                    'reason': 'Ground Operations',
                    'percentage': 30,
                    'impact': 'LOW'
                })
        
        return reasons
    
    def _get_ground_traffic_status(self, volume: str) -> str:
        """Get ground traffic status based on volume"""
        status_map = {
            'HIGH': 'CONGESTED',
            'MODERATE': 'BUSY',
            'LOW': 'LIGHT',
            'UNKNOWN': 'UNKNOWN'
        }
        return status_map.get(volume, 'UNKNOWN')
    
    def _get_airport_coordinates(self, airport_code: str) -> Dict:
        """Get airport coordinates from airport details"""
        if airport_code in self.airport_details:
            details = self.airport_details[airport_code]
            return {
                'lat': details.get('latitude_deg', 0),
                'lon': details.get('longitude_deg', 0)
            }
        # Default if not found
        return {'lat': 0, 'lon': 0}
    
    def _get_fallback_status(self, airport_code: str) -> Dict:
        """Get fallback status when main service fails"""
        return {
            'airport_code': airport_code,
            'timestamp': datetime.now(pytz.UTC).isoformat(),
            'operational_status': {
                'status': 'UNKNOWN',
                'message': 'Status information temporarily unavailable',
                'capacity_percentage': 0,
                'last_update': datetime.now(pytz.UTC).isoformat()
            },
            'weather': self._get_simulated_weather(airport_code),
            'delays': {
                'average_departure_delay': 0,
                'average_arrival_delay': 0,
                'delayed_departures': 0,
                'delayed_arrivals': 0,
                'cancellations': 0,
                'delay_reasons': [],
                'last_update': datetime.now(pytz.UTC).isoformat()
            },
            'traffic': {
                'current_period': 'Unknown',
                'traffic_volume': 'UNKNOWN',
                'scheduled_departures_next_hour': 0,
                'scheduled_arrivals_next_hour': 0,
                'active_flights': 0,
                'ground_traffic': 'UNKNOWN',
                'last_update': datetime.now(pytz.UTC).isoformat()
            },
            'runway_status': {
                'total_runways': 0,
                'active_runways': 0,
                'configuration': 'Unknown',
                'efficiency': 0,
                'maintenance': 0,
                'last_update': datetime.now(pytz.UTC).isoformat()
            },
            'alerts': [],
            'overall_status': {
                'score': 50,
                'level': 'UNKNOWN',
                'color': 'gray',
                'description': 'Unable to determine status',
                'factors': []
            }
        }
    
    def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Get data from cache if not expired"""
        if key in self._cache:
            cached_item = self._cache[key]
            if datetime.now() - cached_item['timestamp'] < timedelta(seconds=self._cache_duration):
                return cached_item['data']
            else:
                # Remove expired item
                del self._cache[key]
        return None
    
    def _add_to_cache(self, key: str, data: Dict):
        """Add data to cache with timestamp"""
        self._cache[key] = {
            'timestamp': datetime.now(),
            'data': data
        }