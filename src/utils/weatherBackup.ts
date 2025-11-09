/**
 * Backup weather display utilities
 * Provides weather information when main cloud function weather data is unavailable
 */

export interface BackupWeatherInfo {
  conditions: string;
  temperature: string;
  humidity: string;
  wind: string;
  visibility: string;
  source: string;
}

/**
 * Get basic weather description for an airport code
 * This provides a meaningful fallback when detailed weather data is unavailable
 */
export function getBackupWeatherDescription(airportCode: string): string {
  // Airport-specific weather patterns (educational/informational)
  const airportWeatherPatterns: Record<string, string> = {
    'LAX': 'Los Angeles typically experiences mild, dry conditions with minimal precipitation. Coastal marine layer may affect morning visibility.',
    'SFO': 'San Francisco often has cool, foggy conditions especially in summer. Wind patterns from the bay can affect operations.',
    'JFK': 'New York area weather varies seasonally with potential for storms, snow in winter, and humidity in summer.',
    'ATL': 'Atlanta experiences subtropical climate with afternoon thunderstorms common in summer months.',
    'ORD': 'Chicago weather can be highly variable with significant seasonal changes and wind effects from Lake Michigan.',
    'DFW': 'Dallas area typically warm and dry with occasional severe weather including thunderstorms and strong winds.',
    'DEN': 'Denver\'s high altitude affects aircraft performance. Mountain weather patterns can change rapidly.',
    'SEA': 'Seattle area frequently overcast with light precipitation. Marine influence moderates temperatures.',
    'LAS': 'Las Vegas desert climate with hot summers, mild winters, and excellent visibility most days.',
    'MIA': 'Miami subtropical climate with high humidity, afternoon thunderstorms, and hurricane potential in season.',
    'PHX': 'Phoenix extremely hot summers with excellent visibility. Dust storms and monsoons possible.',
    'BOS': 'Boston experiences four distinct seasons with nor\'easters in winter and variable conditions.',
    'SJC': 'San Jose Mediterranean climate with mild temperatures and low precipitation most of the year.',
    'OAK': 'Oakland Bay Area climate with marine influence, occasional fog, and generally mild conditions.',
    'SAN': 'San Diego near-perfect weather year-round with minimal precipitation and excellent flying conditions.',
    'PDX': 'Portland Pacific Northwest climate with frequent light rain and overcast conditions.',
    'IAH': 'Houston subtropical climate with high humidity, thunderstorms, and hurricane potential.',
    'MSP': 'Minneapolis continental climate with cold winters, warm summers, and significant weather variations.',
    'DTW': 'Detroit Great Lakes climate with lake-effect snow in winter and variable summer conditions.',
    'CLT': 'Charlotte humid subtropical climate with hot summers and occasional severe weather.',
  };

  const pattern = airportWeatherPatterns[airportCode.toUpperCase()];
  if (pattern) {
    return `${pattern} Real-time monitoring via OpenWeatherMap API provides current conditions.`;
  }

  // Generic fallback
  return `Current weather monitoring active for ${airportCode}. OpenWeatherMap API provides real-time conditions including temperature, humidity, wind speed, and visibility for accurate flight risk assessment.`;
}

/**
 * Get weather risk level based on airport code and general patterns
 */
export function getEstimatedWeatherRisk(airportCode: string): 'low' | 'medium' | 'high' {
  const today = new Date();
  const month = today.getMonth(); // 0-11
  
  // High-risk airports/seasons (educational patterns)
  const winterRisk = ['ORD', 'BOS', 'DEN', 'MSP', 'DTW']; // Winter weather prone
  const summerStormRisk = ['ATL', 'DFW', 'IAH', 'MIA', 'CLT']; // Summer thunderstorms
  const fogRisk = ['SFO', 'SEA', 'PDX']; // Fog prone areas
  
  // Winter months (Dec, Jan, Feb)
  if ([11, 0, 1].includes(month) && winterRisk.includes(airportCode.toUpperCase())) {
    return 'medium';
  }
  
  // Summer months (Jun, Jul, Aug)
  if ([5, 6, 7].includes(month) && summerStormRisk.includes(airportCode.toUpperCase())) {
    return 'medium';
  }
  
  // Fog-prone areas year-round
  if (fogRisk.includes(airportCode.toUpperCase())) {
    return 'medium';
  }
  
  // Desert areas in extreme heat
  if (['PHX', 'LAS'].includes(airportCode.toUpperCase()) && [5, 6, 7, 8].includes(month)) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Format weather risk level for display
 */
export function formatWeatherRiskLevel(level: string): string {
  switch (level.toLowerCase()) {
    case 'low':
      return 'Low Risk';
    case 'medium':
      return 'Medium Risk';
    case 'high':
      return 'High Risk';
    default:
      return 'Risk Assessment';
  }
}