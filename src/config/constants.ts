// Configuration constants for the application
// All hardcoded values should be defined here

// Environment variable helper for React apps
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined') {
    // Browser environment - use import.meta.env for Vite
    const env = import.meta.env as Record<string, string>;
    return env[key] || defaultValue;
  }
  return defaultValue;
};

export const API_CONFIG = {
  // SerpAPI Configuration
  SERPAPI: {
    API_KEY: getEnvVar('VITE_SERPAPI_KEY'),
    BASE_URL: getEnvVar('VITE_SERPAPI_BASE_URL', 'https://serpapi.com/search.json'),
    DEFAULT_CURRENCY: 'USD',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_TRIP_TYPE: '2' // One-way
  },



  // Cloud Function Configuration
  CLOUD_FUNCTION: {
    BASE_URL: getEnvVar('VITE_CLOUD_FUNCTION_URL', ''),
    ENDPOINTS: {
      FLIGHT_RISK_ANALYSIS: '/'
    }
  },

  // Analytics functions (separate deployed services)
  ANALYTICS_FUNCTION: {
    BASE_URL: getEnvVar('VITE_ANALYTICS_BASE_URL', ''),
    AIRLINE_PERFORMANCE_URL: getEnvVar('VITE_AIRLINE_PERFORMANCE_URL', ''),
    AIRPORT_PERFORMANCE_URL: getEnvVar('VITE_AIRPORT_PERFORMANCE_URL', '')
  },

  // Community feed backend
  COMMUNITY_FEED: {
    BASE_URL: getEnvVar('VITE_COMMUNITY_FEED_URL', '')
  },

  // External APIs
  EXTERNAL_APIS: {
    OPENWEATHER: {
      API_KEY: getEnvVar('VITE_OPENWEATHER_API_KEY', ''),
      BASE_URL: getEnvVar('VITE_OPENWEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5')
    },
    GOOGLE: {
      MAPS_API_KEY: getEnvVar('VITE_GOOGLE_MAPS_API_KEY', '')
    }
  },

  // Assets and storage
  ASSETS: {
    AIRCRAFT_IMAGES_BASE_URL: getEnvVar('VITE_AIRCRAFT_IMAGES_BASE_URL', ''),
    AIRCRAFT_IMAGES_BUCKET: getEnvVar('VITE_AIRCRAFT_IMAGES_BUCKET', '')
  }
};

export const UI_CONFIG = {
  // Application Settings
  APP: {
    NAME: 'Flight Risk Radar',
    VERSION: '1.0.0',
    DESCRIPTION: 'AI-Powered Flight Risk Analysis and Insurance Recommendations'
  },

  // Default Values
  DEFAULTS: {
    RISK_SCORE_THRESHOLD: {
      LOW: 30,
      MEDIUM: 70,
      HIGH: 100
    },
    CURRENCY: 'USD',
    LANGUAGE: 'en',
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm'
  },

  // Image Placeholder Configuration
  IMAGES: {
    PLACEHOLDER_BASE_URL: 'https://picsum.photos',
    AIRPORT_IMAGE_SIZE: '400x200',
    FALLBACK_IMAGE: 'https://picsum.photos/400/200?random=1'
  }
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' }
];

export const RISK_LEVEL_CONFIG = {
  LOW: {
    color: '#10b981',
    backgroundColor: '#d1fae5',
    textColor: '#065f46',
    icon: '✅',
    label: 'Low Risk'
  },
  MEDIUM: {
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    textColor: '#92400e',
    icon: '⚠️',
    label: 'Medium Risk'
  },
  HIGH: {
    color: '#ef4444',
    backgroundColor: '#fee2e2',
    textColor: '#991b1b',
    icon: '🚨',
    label: 'High Risk'
  }
};

export const AIRLINE_CONFIG = {
  // Common airline codes and names
  CODES: {
    'AA': 'American Airlines',
    'DL': 'Delta Air Lines',
    'UA': 'United Airlines',
    'WN': 'Southwest Airlines',
    'B6': 'JetBlue Airways',
    'AS': 'Alaska Airlines',
    'NK': 'Spirit Airlines',
    'F9': 'Frontier Airlines',
    'G4': 'Allegiant Air',
    'SY': 'Sun Country Airlines',
    'HA': 'Hawaiian Airlines',
    'VX': 'Virgin America',
    'AC': 'Air Canada',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'IB': 'Iberia',
    'LX': 'Swiss International Air Lines',
    'OS': 'Austrian Airlines',
    'SN': 'Brussels Airlines',
    'TK': 'Turkish Airlines',
    'EK': 'Emirates',
    'QR': 'Qatar Airways',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'JL': 'Japan Airlines',
    'NH': 'All Nippon Airways',
    'KE': 'Korean Air',
    'OZ': 'Asiana Airlines'
  }
};

export const ENVIRONMENT_CONFIG = {
  IS_DEVELOPMENT: getEnvVar('NODE_ENV', 'development') === 'development',
  IS_PRODUCTION: getEnvVar('NODE_ENV', 'development') === 'production',
  IS_TEST: getEnvVar('NODE_ENV', 'development') === 'test',
  
  // Feature flags
  FEATURES: {
    ENABLE_TRANSLATION: getEnvVar('VITE_ENABLE_TRANSLATION', 'true') !== 'false',
    ENABLE_WEATHER_DATA: getEnvVar('VITE_ENABLE_WEATHER', 'true') !== 'false',
    ENABLE_INSURANCE_QUOTES: getEnvVar('VITE_ENABLE_INSURANCE', 'true') !== 'false',
    ENABLE_REAL_TIME_UPDATES: getEnvVar('VITE_ENABLE_REALTIME', 'true') !== 'false'
  }
}; 