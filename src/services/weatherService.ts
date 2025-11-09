interface WeatherData {
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  cloudiness: number;
  icon: string;
  timestamp: number;
}

interface WeatherError {
  error: string;
  message: string;
}

class WeatherService {
  private apiKey: string;
  private baseUrl: string = import.meta.env.VITE_OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheExpiry: number = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenWeather API key not found in environment variables');
    }
  }

  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(2)},${lon.toFixed(2)}`;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | WeatherError> {
    if (!this.apiKey) {
      return {
        error: 'API_KEY_MISSING',
        message: 'OpenWeather API key is not configured'
      };
    }

    // Check cache first
    const cacheKey = this.getCacheKey(lat, lon);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('🌤️ Returning cached weather data');
      return cached.data;
    }

    try {
      const url = `${this.baseUrl}/weather`;
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lon.toString(),
        appid: this.apiKey,
        units: 'imperial' // For Fahrenheit
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          return {
            error: 'INVALID_API_KEY',
            message: 'Invalid OpenWeather API key'
          };
        }
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        windDirection: data.wind.deg,
        pressure: data.main.pressure,
        visibility: data.visibility / 1609.34, // Convert meters to miles
        cloudiness: data.clouds.all,
        icon: data.weather[0].icon,
        timestamp: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return {
        error: 'FETCH_ERROR',
        message: 'Failed to fetch weather data'
      };
    }
  }

  async getWeatherByAirportCode(airportCode: string, coordinates: { lat: number; lon: number }): Promise<WeatherData | WeatherError> {
    return this.getCurrentWeather(coordinates.lat, coordinates.lon);
  }

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getWeatherEmoji(condition: string): string {
    const weatherEmojis: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Dust': '🌪️',
      'Sand': '🌪️',
      'Ash': '🌋',
      'Squall': '💨',
      'Tornado': '🌪️'
    };
    return weatherEmojis[condition] || '🌡️';
  }

  formatWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Method to check if weather might impact flights
  assessWeatherImpact(weather: WeatherData): {
    level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    factors: string[];
    message: string;
  } {
    const factors: string[] = [];
    let impactScore = 0;

    // Wind speed impact
    if (weather.windSpeed > 40) {
      factors.push('Very high winds');
      impactScore += 40;
    } else if (weather.windSpeed > 30) {
      factors.push('High winds');
      impactScore += 25;
    } else if (weather.windSpeed > 20) {
      factors.push('Moderate winds');
      impactScore += 10;
    }

    // Visibility impact
    if (weather.visibility < 0.5) {
      factors.push('Very low visibility');
      impactScore += 40;
    } else if (weather.visibility < 1) {
      factors.push('Low visibility');
      impactScore += 25;
    } else if (weather.visibility < 3) {
      factors.push('Reduced visibility');
      impactScore += 10;
    }

    // Weather condition impact
    if (['Thunderstorm', 'Tornado', 'Squall'].includes(weather.condition)) {
      factors.push('Severe weather conditions');
      impactScore += 50;
    } else if (['Snow', 'Rain'].includes(weather.condition)) {
      factors.push(`${weather.condition} conditions`);
      impactScore += 20;
    } else if (['Mist', 'Fog', 'Haze'].includes(weather.condition)) {
      factors.push('Poor visibility conditions');
      impactScore += 15;
    }

    // Determine impact level
    let level: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    let message: string;

    if (impactScore >= 50) {
      level = 'SEVERE';
      message = 'Severe weather conditions likely to cause significant delays or cancellations';
    } else if (impactScore >= 30) {
      level = 'HIGH';
      message = 'Weather conditions may cause delays';
    } else if (impactScore >= 15) {
      level = 'MODERATE';
      message = 'Minor weather-related delays possible';
    } else {
      level = 'LOW';
      message = 'Weather conditions favorable for flights';
    }

    return { level, factors, message };
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, WeatherError };