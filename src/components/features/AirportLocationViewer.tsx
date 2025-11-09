/*
============================================================
CesiumJS Integration Starter (for Advanced 3D Overlays)
============================================================
- To support true 3D overlays (lines, markers, etc.) with Google Photorealistic 3D Tiles:
  1. Install CesiumJS: npm install cesium
  2. Get access to Google Photorealistic 3D Tiles (see Google Maps Platform docs)
  3. Use CesiumJS Viewer and add Google 3D Tiles as a tileset
  4. Use CesiumJS Polyline/Entity API to draw overlays
  5. See: https://js-3d-area-explorer-demo-dev-t6a6o7lkja-uc.a.run.app/ and https://cesium.com/platform/cesiumjs/
- This file currently supports 2D overlays in Google Maps JS API and a 3D mode message/fallback.
*/
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Building, Star, Cloud } from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { initializeGoogleMaps } from '../../utils/loadGoogleMaps';

interface AirportLocationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  airportCode: string;
  airportName: string;
  airportCity: string;
  complexity: string;
  description: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  homeLink?: string;
  wikipediaLink?: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
}

// Google Maps API type declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>;
        Map: any;
        Marker: any;
        MapTypeId: any;
        Size: any;
        Point: any;
        Polyline: any;
        // 3D Tiles specific types
        Map3DElement: any;
        Marker3DElement: any;
        Polyline3DInteractiveElement: any;
        MapMode: any;
        AltitudeMode: any;
      };
    };
  }
}

const AirportLocationViewer: React.FC<AirportLocationViewerProps> = ({
  isOpen,
  onClose,
  airportCode,
  airportName,
  airportCity,
  complexity,
  description,
  latitude,
  longitude,
  elevation,
  homeLink,
  wikipediaLink
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'3D' | '2D' | 'Info'>('3D');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [airportData, setAirportData] = useState<{ lat: number; lng: number; terminals?: Array<{name: string, lat: number, lng: number}> } | null>(null);

  // Get airport coordinates and terminal data with polygon boundaries
  const getAirportCoordinates = (code: string): { lat: number; lng: number; terminals?: Array<{name: string, lat: number, lng: number}>; polygon?: Array<{lat: number, lng: number}> } | null => {
    const airportData: { [key: string]: { lat: number; lng: number; terminals?: Array<{name: string, lat: number, lng: number}>; polygon?: Array<{lat: number, lng: number}> } } = {
      'ATL': {
        lat: 33.6407,
        lng: -84.4277,
        terminals: [
          { name: 'Terminal T', lat: 33.6407, lng: -84.4277 },
          { name: 'Terminal A', lat: 33.6409, lng: -84.4440 },
          { name: 'Terminal B', lat: 33.6409, lng: -84.4510 },
          { name: 'Terminal C', lat: 33.6409, lng: -84.4570 },
          { name: 'Terminal D', lat: 33.6409, lng: -84.4640 },
          { name: 'Terminal E', lat: 33.6409, lng: -84.4700 },
          { name: 'Terminal F', lat: 33.6409, lng: -84.4760 }
        ],
        // Polygon covering the entire ATL airport area (4,700 acres)
        polygon: [
          { lat: 33.6603, lng: -84.4513 },  // Northwest corner
          { lat: 33.6603, lng: -84.4041 },  // Northeast corner
          { lat: 33.6211, lng: -84.4041 },  // Southeast corner
          { lat: 33.6211, lng: -84.4513 },  // Southwest corner
          { lat: 33.6603, lng: -84.4513 }   // Close the polygon
        ]
      },
      'LAX': {
        lat: 33.9416,
        lng: -118.4085,
        terminals: [
          { name: 'Terminal 1', lat: 33.9425, lng: -118.4081 },
          { name: 'Terminal 2', lat: 33.9435, lng: -118.4102 },
          { name: 'Terminal 3', lat: 33.9446, lng: -118.4079 },
          { name: 'Terminal 4', lat: 33.9456, lng: -118.4019 },
          { name: 'Terminal 5', lat: 33.9437, lng: -118.4004 },
          { name: 'Terminal 6', lat: 33.9426, lng: -118.3992 },
          { name: 'Terminal 7', lat: 33.9416, lng: -118.3980 },
          { name: 'Terminal 8', lat: 33.9406, lng: -118.3968 },
          { name: 'TBIT', lat: 33.9431, lng: -118.4075 }
        ]
      },
      'JFK': {
        lat: 40.6413,
        lng: -73.7781,
        terminals: [
          { name: 'Terminal 1', lat: 40.6423, lng: -73.7881 },
          { name: 'Terminal 2', lat: 40.6444, lng: -73.7822 },
          { name: 'Terminal 4', lat: 40.6440, lng: -73.7825 },
          { name: 'Terminal 5', lat: 40.6450, lng: -73.7769 },
          { name: 'Terminal 7', lat: 40.6495, lng: -73.7769 },
          { name: 'Terminal 8', lat: 40.6486, lng: -73.7822 }
        ]
      },
      'SFO': {
        lat: 37.6213,
        lng: -122.3790,
        terminals: [
          { name: 'Terminal 1', lat: 37.6152, lng: -122.3899 },
          { name: 'Terminal 2', lat: 37.6139, lng: -122.3868 },
          { name: 'Terminal 3', lat: 37.6161, lng: -122.3917 },
          { name: 'International Terminal', lat: 37.6169, lng: -122.3925 }
        ],
        // Polygon covering the entire SFO airport area
        polygon: [
          { lat: 37.6283, lng: -122.4000 },  // Northwest corner
          { lat: 37.6283, lng: -122.3680 },  // Northeast corner
          { lat: 37.6080, lng: -122.3680 },  // Southeast corner
          { lat: 37.6080, lng: -122.4000 },  // Southwest corner
          { lat: 37.6283, lng: -122.4000 }   // Close the polygon
        ]
      },
      'ORD': {
        lat: 41.9786,
        lng: -87.9048,
        terminals: [
          { name: 'Terminal 1', lat: 41.9786, lng: -87.9048 },
          { name: 'Terminal 2', lat: 41.9796, lng: -87.9058 },
          { name: 'Terminal 3', lat: 41.9806, lng: -87.9068 },
          { name: 'Terminal 5', lat: 41.9816, lng: -87.9078 }
        ]
      },
      'DFW': {
        lat: 32.8968,
        lng: -97.0380,
        terminals: [
          { name: 'Terminal A', lat: 32.8968, lng: -97.0380 },
          { name: 'Terminal B', lat: 32.8978, lng: -97.0390 },
          { name: 'Terminal C', lat: 32.8988, lng: -97.0400 },
          { name: 'Terminal D', lat: 32.8998, lng: -97.0410 },
          { name: 'Terminal E', lat: 32.9008, lng: -97.0420 }
        ]
      },
      'MIA': {
        lat: 25.7932,
        lng: -80.2906,
        terminals: [
          { name: 'Terminal D', lat: 25.7932, lng: -80.2906 },
          { name: 'Terminal E', lat: 25.7942, lng: -80.2916 },
          { name: 'Terminal F', lat: 25.7952, lng: -80.2926 },
          { name: 'Terminal G', lat: 25.7962, lng: -80.2936 },
          { name: 'Terminal H', lat: 25.7972, lng: -80.2946 },
          { name: 'Terminal J', lat: 25.7982, lng: -80.2956 }
        ]
      },
      'LAS': {
        lat: 36.0840,
        lng: -115.1537,
        terminals: [
          { name: 'Terminal 1', lat: 36.0840, lng: -115.1537 },
          { name: 'Terminal 3', lat: 36.0850, lng: -115.1547 }
        ]
      },
      'SJC': {
        lat: 37.3639,
        lng: -121.9289,
        terminals: [
          { name: 'Terminal A', lat: 37.3663, lng: -121.9290 },
          { name: 'Terminal B', lat: 37.3639, lng: -121.9246 }
        ]
      },
      'DEN': {
        lat: 39.8561,
        lng: -104.6737,
        terminals: [
          { name: 'Terminal East', lat: 39.8561, lng: -104.6737 },
          { name: 'Terminal West', lat: 39.8571, lng: -104.6747 },
          { name: 'Concourse A', lat: 39.8581, lng: -104.6757 },
          { name: 'Concourse B', lat: 39.8591, lng: -104.6767 },
          { name: 'Concourse C', lat: 39.8601, lng: -104.6777 }
        ]
      },
      'CLT': {
        lat: 35.2144,
        lng: -80.9473,
        terminals: [
          { name: 'Terminal A', lat: 35.2144, lng: -80.9473 },
          { name: 'Terminal B', lat: 35.2154, lng: -80.9483 },
          { name: 'Terminal C', lat: 35.2164, lng: -80.9493 },
          { name: 'Terminal D', lat: 35.2174, lng: -80.9503 },
          { name: 'Terminal E', lat: 35.2184, lng: -80.9513 }
        ]
      },
      'PHX': {
        lat: 33.4342,
        lng: -112.0116,
        terminals: [
          { name: 'Terminal 2', lat: 33.4342, lng: -112.0116 },
          { name: 'Terminal 3', lat: 33.4352, lng: -112.0126 },
          { name: 'Terminal 4', lat: 33.4362, lng: -112.0136 }
        ]
      },
      'IAH': {
        lat: 29.9902,
        lng: -95.3368,
        terminals: [
          { name: 'Terminal A', lat: 29.9902, lng: -95.3368 },
          { name: 'Terminal B', lat: 29.9912, lng: -95.3378 },
          { name: 'Terminal C', lat: 29.9922, lng: -95.3388 },
          { name: 'Terminal D', lat: 29.9932, lng: -95.3398 },
          { name: 'Terminal E', lat: 29.9942, lng: -95.3408 }
        ]
      },
      'MCO': { lat: 28.4312, lng: -81.3081 },
      'EWR': { lat: 40.6895, lng: -74.1745 },
      'MSP': { lat: 44.8848, lng: -93.2223 },
      'DTW': { lat: 42.2162, lng: -83.3554 },
      'BOS': { lat: 42.3656, lng: -71.0096 },
      'PHL': { lat: 39.8729, lng: -75.2437 },
      'LGA': { lat: 40.7769, lng: -73.8740 },
      'FLL': { lat: 26.0742, lng: -80.1506 },
      'BWI': { lat: 39.1754, lng: -76.6682 },
      'IAD': { lat: 38.9531, lng: -77.4565 },
      'MDW': { lat: 41.7868, lng: -87.7522 },
      'DCA': { lat: 38.8512, lng: -77.0402 },
      'HNL': { lat: 21.3245, lng: -157.9251 },
      'PDX': { lat: 45.5898, lng: -122.5951 },
      'CLE': { lat: 41.4117, lng: -81.8498 },
      'PIT': { lat: 40.4915, lng: -80.2329 },
      'STL': { lat: 38.7487, lng: -90.3700 },
      'BNA': { lat: 36.1263, lng: -86.6774 },
      'RDU': { lat: 35.8801, lng: -78.7880 },
      'IND': { lat: 39.7169, lng: -86.2956 },
      'MCI': { lat: 39.2976, lng: -94.7139 },
      'AUS': { lat: 30.1975, lng: -97.6664 },
      'CVG': { lat: 39.0489, lng: -84.6678 },
      'JAX': { lat: 30.4941, lng: -81.6879 },
      'CHS': { lat: 32.8986, lng: -80.0405 },
      'RSW': { lat: 26.5362, lng: -81.7552 },
      'MSY': { lat: 29.9934, lng: -90.2580 },
      'SAT': { lat: 29.5337, lng: -98.4698 },
      'MKE': { lat: 42.9476, lng: -87.8966 },
      'PBI': { lat: 26.6832, lng: -80.0956 },
      'TUS': { lat: 32.1161, lng: -110.9410 },
      'ABQ': { lat: 35.0402, lng: -106.6091 },
      'BOI': { lat: 43.5644, lng: -116.2228 },
      'TUL': { lat: 36.1984, lng: -95.8881 },
      'OMA': { lat: 41.3025, lng: -95.8941 },
      'OKC': { lat: 35.3931, lng: -97.6007 },
      'BUF': { lat: 42.9405, lng: -78.7322 },
      'RIC': { lat: 37.5052, lng: -77.3197 },
      'GRR': { lat: 42.8808, lng: -85.5228 },
      'PNS': { lat: 30.4734, lng: -87.1866 },
      'BHM': { lat: 33.5629, lng: -86.7535 },
      'SYR': { lat: 43.1112, lng: -76.1063 },
      'ROC': { lat: 43.1189, lng: -77.6724 },
      'GSP': { lat: 34.8957, lng: -82.2189 },
      'DAY': { lat: 39.9024, lng: -84.2194 },
      'DSM': { lat: 41.5340, lng: -93.6631 },
      'CRW': { lat: 38.3731, lng: -81.5932 },
      'LEX': { lat: 38.0365, lng: -84.6059 },
      'LIT': { lat: 34.7294, lng: -92.2243 },
      'MEM': { lat: 35.0424, lng: -89.9767 },
      'PVD': { lat: 41.7242, lng: -71.4282 },
      'SDF': { lat: 38.1744, lng: -85.7360 },
      'XNA': { lat: 36.2819, lng: -94.3068 },
      'BTR': { lat: 30.5332, lng: -91.1496 },
      'ELP': { lat: 31.8073, lng: -106.3776 },
      'FSD': { lat: 43.5820, lng: -96.7419 },
      'GEG': { lat: 47.6199, lng: -117.5338 },
      'ICT': { lat: 37.6499, lng: -97.4331 },
      'JAN': { lat: 32.3112, lng: -90.0759 },
      'LBB': { lat: 33.6636, lng: -101.8228 },
      'MSN': { lat: 43.1399, lng: -89.3375 },
      'ORF': { lat: 36.8945, lng: -76.2012 },
      'PWM': { lat: 43.6462, lng: -70.3087 },
      'RNO': { lat: 39.4993, lng: -119.7681 },
      'SAV': { lat: 32.1276, lng: -81.2020 },
      'SGF': { lat: 37.2457, lng: -93.3886 },
      'SHV': { lat: 32.4466, lng: -93.8256 },
      'TLH': { lat: 30.3965, lng: -84.3503 },
      'TYS': { lat: 35.8109, lng: -83.9940 },
      'ALB': { lat: 42.7483, lng: -73.8017 },
      'AMA': { lat: 35.2194, lng: -101.7059 },
      'ANC': { lat: 61.1744, lng: -149.9963 },
      'BDL': { lat: 41.9389, lng: -72.6832 },
      'BIS': { lat: 46.7727, lng: -100.7460 },
      'BUR': { lat: 34.2006, lng: -118.3585 },
      'CAK': { lat: 40.9163, lng: -81.4425 },
      'CID': { lat: 41.8847, lng: -91.7108 },
      'COS': { lat: 38.8058, lng: -104.7008 },
      'DAL': { lat: 32.8471, lng: -96.8518 },
      'FAR': { lat: 46.9207, lng: -96.8158 },
      'FAT': { lat: 36.7762, lng: -119.7181 },
      'GJT': { lat: 39.1224, lng: -108.5267 },
      'GPT': { lat: 30.4073, lng: -89.0701 },
      'GRB': { lat: 44.4851, lng: -88.1296 },
      'GSO': { lat: 36.0978, lng: -79.9373 },
      'GYY': { lat: 41.6163, lng: -87.4128 },
      'HOU': { lat: 29.6454, lng: -95.2789 },
      'HPN': { lat: 41.0670, lng: -73.7076 },
      'HSV': { lat: 34.6372, lng: -86.7751 },
      'ISP': { lat: 40.7952, lng: -73.1002 },
      'LGB': { lat: 33.8177, lng: -118.1516 },
      'MAF': { lat: 31.9425, lng: -102.2019 },
      'MHT': { lat: 42.9326, lng: -71.4357 },
      'MOB': { lat: 30.6912, lng: -88.2428 },
      'MYR': { lat: 33.6797, lng: -78.9283 },
      'OAK': { lat: 37.7214, lng: -122.2208 },
      'OGG': { lat: 20.8986, lng: -156.4305 },
      'ONT': { lat: 34.0559, lng: -117.6011 },
      'PFN': { lat: 30.2121, lng: -85.6828 },
      'PIA': { lat: 40.6642, lng: -89.6933 },
      'PIE': { lat: 27.9106, lng: -82.6874 },
      'RFD': { lat: 42.1954, lng: -89.0972 },
      'ROA': { lat: 37.3255, lng: -79.9754 },
      'SBN': { lat: 41.7083, lng: -86.3173 },
      'SCE': { lat: 40.8493, lng: -77.8486 },
      'SNA': { lat: 33.6762, lng: -117.8677 },
      'SRQ': { lat: 27.3954, lng: -82.5544 },
      'SWF': { lat: 41.5041, lng: -74.1048 },
      'VPS': { lat: 30.4832, lng: -86.5254 }
    };

    return airportData[code] || null;
  };

  // Geocode airport by name using Google Geocoding API
  const geocodeAirportByName = async (airportName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log('🔍 Geocoding airport by name:', airportName);

      // Add "airport" to the search term for better results
      const searchTerm = `${airportName} airport`;

      // Use Google Geocoding API
      const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchTerm)}&key=${googleApiKey}`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Geocoding successful:', location);
        return { lat: location.lat, lng: location.lng };
      } else {
        console.warn('⚠️ Geocoding failed:', data.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  };

  // Get coordinates with fallback to geocoding
  const getCoordinates = async (input: string): Promise<{ lat: number; lng: number } | null> => {
    // First try: Use coordinates from props if available (from database)
    if (latitude && longitude) {
      console.log('📍 Using coordinates from database:', input, { lat: latitude, lng: longitude });
      return { lat: latitude, lng: longitude };
    }

    // Second try: Direct coordinate lookup (hardcoded fallback)
    const coords = getAirportCoordinates(input);
    if (coords) {
      console.log('📍 Found coordinates in hardcoded data for:', input);
      return coords;
    }

    // Fallback: Geocoding for unknown airports
    console.log('🔍 Airport not in database, trying geocoding for:', input);
    return await geocodeAirportByName(input);
  };

  // Get complexity color
  const getComplexityColor = (complexity: string): string => {
    switch (complexity.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Create terminal connection lines for 3D map
  // Calculate walking time between terminals based on distance
  const calculateWalkingTime = (lat1: number, lng1: number, lat2: number, lng2: number): string => {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Convert to meters

    // Estimate walking time (average walking speed: 1.4 m/s)
    const walkingTimeMinutes = Math.round((distance / 1.4) / 60);

    if (walkingTimeMinutes < 1) return '< 1m';
    if (walkingTimeMinutes < 60) return `${walkingTimeMinutes}m`;
    const hours = Math.floor(walkingTimeMinutes / 60);
    const minutes = walkingTimeMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  // Flying camera functionality
  const flyCameraToTerminal = async (mapElement: any, terminal: {name: string, lat: number, lng: number}, terminalNumber: number) => {
    try {
      // Use elevation from database if available, convert feet to meters (1 ft = 0.3048 m)
      const baseAltitude = elevation ? (elevation * 0.3048) + 300 : 300;

      const flyToCamera = {
        center: { lat: terminal.lat, lng: terminal.lng, altitude: baseAltitude },
        tilt: 55,
        range: 800,
        heading: 0
      };

      console.log(`🛫 Flying camera to Terminal ${terminalNumber}: ${terminal.name}`);

      // Fly to the terminal (ultra slow)
      await mapElement.flyCameraTo({
        endCamera: flyToCamera,
        durationMillis: 25000
      });

      // After reaching the terminal, fly around it (ultra slow)
      setTimeout(() => {
        mapElement.flyCameraAround({
          camera: flyToCamera,
          durationMillis: 40000,
          rounds: 2
        });
      }, 5000);

    } catch (error) {
      console.warn('⚠️ Flying camera error:', error);
    }
  };

  // Create airport polygon overlay
  const createAirportPolygon = async (mapElement: any, polygonCoords: Array<{lat: number, lng: number}>) => {
    try {
      console.log('🔷 Creating airport polygon overlay...');
      console.log('📍 Polygon coordinates:', polygonCoords);

      const { Polygon3DInteractiveElement, AltitudeMode } = await window.google.maps.importLibrary("maps3d") as any;

      // Create the polygon with semi-transparent red fill and blue stroke
      const polygonOptions = {
        strokeColor: "#ff0000ff", // Red with full opacity
        strokeWidth: 10,
        fillColor: "#ff000080", // Red with 50% transparency
        altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
        extruded: true, // Make it 3D
        drawsOccludedSegments: true,
      };

      const airportPolygon = new Polygon3DInteractiveElement(polygonOptions);

      // Add altitude to coordinates for 3D effect
      const coordinatesWithAltitude = polygonCoords.map(coord => ({
        lat: coord.lat,
        lng: coord.lng,
        altitude: 200 // 200 meters height for better visibility
      }));

      console.log('📏 Coordinates with altitude:', coordinatesWithAltitude);
      airportPolygon.outerCoordinates = coordinatesWithAltitude;

      // Add click event to change colors
      airportPolygon.addEventListener('gmp-click', (event: any) => {
        // Generate random colors on click
        const randomColor = () => Math.floor(Math.random() * 256);
        const r = randomColor();
        const g = randomColor();
        const b = randomColor();

        event.target.fillColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}80`;
        event.target.strokeColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}ff`;

        console.log('🎨 Polygon clicked! New colors applied');
      });

      mapElement.append(airportPolygon);
      console.log('✅ Airport polygon overlay created successfully');

    } catch (error) {
      console.warn('⚠️ Failed to create airport polygon:', error);
    }
  };

  // Auto-fly through all terminals
  const autoFlyThroughTerminals = async (mapElement: any, terminals: Array<{name: string, lat: number, lng: number}>) => {
    if (!terminals || terminals.length < 2) return;

    console.log('🛫 Starting auto-fly through terminals...');

    for (let i = 0; i < terminals.length; i++) {
      await flyCameraToTerminal(mapElement, terminals[i], i + 1);

      // Wait ultra long between terminals (except for the last one)
      if (i < terminals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
  };

  const createTerminalConnectionLines = async (mapElement: any, terminals: Array<{name: string, lat: number, lng: number}>, is3D: boolean = false) => {
    if (!terminals || terminals.length < 2) return;

    try {
      console.log('🔗 Creating terminal connection lines for:', terminals.length, 'terminals, 3D:', is3D);

              if (is3D) {
          // Import the required libraries for 3D maps
          const { Polyline3DInteractiveElement, AltitudeMode, Marker3DElement } = await window.google.maps.importLibrary("maps3d") as any;
          const { PinElement } = await window.google.maps.importLibrary("marker") as any;

        // Create red lines connecting all terminals
        for (let i = 0; i < terminals.length - 1; i++) {
          const currentTerminal = terminals[i];
          const nextTerminal = terminals[i + 1];

          // Use Polyline3DInteractiveElement for 3D maps as per Google documentation
          // Use elevation-adjusted altitude for lines
          const lineAltitude = elevation ? (elevation * 0.3048) + 150 : 150;

          const polyline = new Polyline3DInteractiveElement({
            coordinates: [
              { lat: currentTerminal.lat, lng: currentTerminal.lng, altitude: lineAltitude },
              { lat: nextTerminal.lat, lng: nextTerminal.lng, altitude: lineAltitude }
            ],
            strokeColor: '#ff4444',
            outerColor: '#ffffff',
            strokeWidth: 20,
            outerWidth: 1.0,
            altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
            drawsOccludedSegments: true, // Show the line through buildings
          });

          mapElement.append(polyline);

          // Calculate walking time between terminals
          const walkingTime = calculateWalkingTime(
            currentTerminal.lat, currentTerminal.lng,
            nextTerminal.lat, nextTerminal.lng
          );

          // Add a single red marker at each terminal with terminal number
          // Use elevation-adjusted altitude for markers
          const markerAltitude = elevation ? (elevation * 0.3048) + 80 : 80;

          const terminalMarker = new Marker3DElement({
            position: { lat: currentTerminal.lat, lng: currentTerminal.lng, altitude: markerAltitude },
            altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
            title: `${currentTerminal.name} - Terminal ${i + 1} - Walking time to next: ${walkingTime}`
          });

          const terminalPin = new PinElement({
            background: "#ff4444",
            borderColor: "#cc0000",
            glyphColor: "white",
            glyph: `${i + 1}`,
            scale: 1.5
          });

          terminalMarker.append(terminalPin);
          mapElement.append(terminalMarker);

          // Add click handler to fly to this terminal
          terminalMarker.addEventListener('gmp-click', () => {
            flyCameraToTerminal(mapElement, currentTerminal, i + 1);
          });

          console.log(`🔗 Connected Terminal ${i + 1} (${currentTerminal.name}) to Terminal ${i + 2} (${nextTerminal.name}) - Walking time: ${walkingTime}`);
        }

        // Connect last terminal back to first for complete loop
        if (terminals.length > 2) {
          const firstTerminal = terminals[0];
          const lastTerminal = terminals[terminals.length - 1];

          // Use elevation-adjusted altitude for closing line
          const lineAltitude = elevation ? (elevation * 0.3048) + 150 : 150;

          const polyline = new Polyline3DInteractiveElement({
            coordinates: [
              { lat: lastTerminal.lat, lng: lastTerminal.lng, altitude: lineAltitude },
              { lat: firstTerminal.lat, lng: firstTerminal.lng, altitude: lineAltitude }
            ],
            strokeColor: '#ff4444',
            outerColor: '#ffffff',
            strokeWidth: 20,
            outerWidth: 1.0,
            altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
            drawsOccludedSegments: true,
          });

          mapElement.append(polyline);

          // Calculate walking time for the last connection
          const walkingTime = calculateWalkingTime(
            lastTerminal.lat, lastTerminal.lng,
            firstTerminal.lat, firstTerminal.lng
          );

          console.log(`🔗 Connected Terminal ${terminals.length} (${lastTerminal.name}) back to Terminal 1 (${firstTerminal.name}) - Walking time: ${walkingTime}`);
        }
      } else {
        // Use regular polyline for 2D maps
        for (let i = 0; i < terminals.length - 1; i++) {
          const currentTerminal = terminals[i];
          const nextTerminal = terminals[i + 1];

          const polyline = new window.google.maps.Polyline({
            path: [
              { lat: currentTerminal.lat, lng: currentTerminal.lng },
              { lat: nextTerminal.lat, lng: nextTerminal.lng }
            ],
            strokeColor: '#ff4444',
            strokeOpacity: 1.0,
            strokeWeight: 8,
            map: mapElement
          });

          // Calculate walking time between terminals
          const walkingTime = calculateWalkingTime(
            currentTerminal.lat, currentTerminal.lng,
            nextTerminal.lat, nextTerminal.lng
          );



          console.log(`🔗 Connected Terminal ${i + 1} (${currentTerminal.name}) to Terminal ${i + 2} (${nextTerminal.name}) - Walking time: ${walkingTime}`);
        }

        // Add marker for the last terminal
        const lastTerminal = terminals[terminals.length - 1];
        const markerAltitude = elevation ? (elevation * 0.3048) + 80 : 80;
        const lastTerminalMarker = new Marker3DElement({
          position: { lat: lastTerminal.lat, lng: lastTerminal.lng, altitude: markerAltitude },
          altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
          title: `${lastTerminal.name} - Terminal ${terminals.length}`
        });

        const lastTerminalPin = new PinElement({
          background: "#ff4444",
          borderColor: "#cc0000",
          glyphColor: "white",
          glyph: `${terminals.length}`,
          scale: 1.5
        });

        lastTerminalMarker.append(lastTerminalPin);
        mapElement.appendChild(lastTerminalMarker);

        // Add click handler to fly to this terminal
        lastTerminalMarker.addEventListener('gmp-click', () => {
          flyCameraToTerminal(mapElement, lastTerminal, terminals.length);
        });

        // Connect last terminal back to first for complete loop
        if (terminals.length > 2) {
          const firstTerminal = terminals[0];
          const lineAltitude = elevation ? (elevation * 0.3048) + 150 : 150;

          const polyline = new Polyline3DInteractiveElement({
            coordinates: [
              { lat: lastTerminal.lat, lng: lastTerminal.lng, altitude: lineAltitude },
              { lat: firstTerminal.lat, lng: firstTerminal.lng, altitude: lineAltitude }
            ],
            strokeColor: '#ff4444',
            outerColor: '#ffffff',
            strokeWidth: 20,
            outerWidth: 1.0,
            altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
            drawsOccludedSegments: true,
          });

          mapElement.append(polyline);

          console.log(`🔗 Connected ${lastTerminal.name} back to ${firstTerminal.name}`);
        }
      }

      console.log('✅ Terminal connection lines created successfully');
    } catch (error) {
      console.warn('⚠️ Failed to create terminal connection lines:', error);
    }
  };

  // Fetch weather data for airport
  const fetchWeatherData = async (airportCode: string): Promise<void> => {
    try {
      setWeatherLoading(true);

      // Get coordinates for weather lookup
      const coords = await getCoordinates(airportCode);
      if (!coords) {
        console.warn('No coordinates found for weather lookup');
        return;
      }

      // Use OpenWeatherMap API - check if key is available
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (!apiKey || apiKey === 'your-api-key' || apiKey === 'your_openweather_api_key_here') {
        console.warn('OpenWeatherMap API key not configured');
        setWeather({
          temperature: 72,
          condition: 'clear sky',
          humidity: 45,
          windSpeed: 8,
          visibility: 10
        });
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        throw new Error('Weather data not available');
      }

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind?.speed || 0),
        visibility: Math.round((data.visibility || 0) / 1609.34) // Convert meters to miles
      });
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      // Provide fallback weather data instead of null
      setWeather({
        temperature: 72,
        condition: 'partly cloudy',
        humidity: 50,
        windSpeed: 5,
        visibility: 10
      });
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch weather data when modal opens
  useEffect(() => {
    if (isOpen && airportCode) {
      fetchWeatherData(airportCode);
    }
  }, [isOpen, airportCode]);

  // Initialize map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initializeMap = async () => {
      if (isInitializingRef.current) {
        console.log('🔄 Map initialization already in progress');
        return;
      }

      try {
        isInitializingRef.current = true;
        setIsLoading(true);
        setError(null);

        console.log('🔄 Starting Google Maps 3D Tiles initialization...');

        // Get coordinates using the new function that supports both database and geocoding
        const coordinateData = await getCoordinates(airportCode);
        if (!coordinateData) {
          console.error('❌ Could not find coordinates for airport:', airportCode);
          setError('Airport location not found');
          setMapType('Info');
          return;
        }

        // Get the full airport data including terminals
        const fullAirportData = getAirportCoordinates(airportCode) || coordinateData;
        const coords = { lat: fullAirportData.lat, lng: fullAirportData.lng };
        console.log('📍 Using coordinates:', coords);
        console.log('🏢 Terminal data available:', fullAirportData.terminals ? fullAirportData.terminals.length : 0, 'terminals');

        // Store airport data for UI display
        setAirportData(fullAirportData);

        // Initialize Google Maps (loads the script if not already loaded)
        try {
          console.log('🗺️ Initializing Google Maps...');
          await initializeGoogleMaps();
          console.log('✅ Google Maps initialized successfully');
        } catch (error) {
          console.error('❌ Failed to load Google Maps:', error);
          setError('Google Maps API not available');
          setMapType('Info');
          return;
        }

        // Try to import the maps3d library first
        try {
          const { Map3DElement, Marker3DElement, MapMode, AltitudeMode, Polyline3DInteractiveElement } = await window.google.maps.importLibrary("maps3d") as any;
          const { PinElement } = await window.google.maps.importLibrary("marker") as any;

          if (mapContainerRef.current && isMounted && !mapInstanceRef.current) {
            // Clear container
            mapContainerRef.current.innerHTML = '';

            // Create 3D map element using the proper API as per Google documentation
            // Use elevation from database if available, convert feet to meters
            const initialAltitude = elevation ? (elevation * 0.3048) + 300 : 300;

            // Adjust initial view for airports with polygons
            const hasPolygon = fullAirportData.polygon && fullAirportData.polygon.length > 0;
            const initialRange = hasPolygon ? 3000 : 1500; // Wider view for polygon airports
            const initialTilt = hasPolygon ? 60 : 45; // More tilt for better 3D view

            const map3DElement = new Map3DElement({
              center: { lat: coords.lat, lng: coords.lng, altitude: initialAltitude },
              range: initialRange,
              tilt: initialTilt,
              heading: 0,
              mode: MapMode.SATELLITE,
            });

            // Set explicit styling for the 3D map element
            map3DElement.style.width = '100%';
            map3DElement.style.height = '100%';
            map3DElement.style.minHeight = '400px';
            map3DElement.style.display = 'block';
            map3DElement.style.position = 'relative';
            map3DElement.style.zIndex = '1';

            // Store reference and append to container
            mapInstanceRef.current = map3DElement;
            mapContainerRef.current.appendChild(map3DElement);

            console.log('🗺️ 3D Map element created and appended:', map3DElement);
            console.log('🗺️ Map container dimensions:', mapContainerRef.current.offsetWidth, 'x', mapContainerRef.current.offsetHeight);

            // Wait for map to be ready with timeout
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Map initialization timeout'));
              }, 10000); // 10 second timeout

              const checkReady = () => {
                if (map3DElement.isConnected) {
                  clearTimeout(timeout);
                  console.log('✅ 3D Map element is connected and ready');
                  resolve(true);
                } else {
                  console.log('⏳ Waiting for 3D map to be ready...');
                  setTimeout(checkReady, 200);
                }
              };
              checkReady();
            });

            // Add airport marker after map is ready
            try {
              const pin = new PinElement({
                background: "#4285F4",
                borderColor: "#1967D2",
                glyphColor: "white",
                glyph: "✈️",
                scale: 2.0
              });

              const markerAltitude = elevation ? (elevation * 0.3048) + 150 : 150;
              const marker = new Marker3DElement({
                position: { lat: coords.lat, lng: coords.lng, altitude: markerAltitude },
                altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
                title: `${airportName} (${airportCode})`
              });

              marker.append(pin);
              map3DElement.append(marker);

              console.log('✅ Google Maps 3D Tiles initialized successfully');

              // Wait a bit for the map to fully initialize before adding overlays
              await new Promise(resolve => setTimeout(resolve, 1000));

                        // Add airport polygon overlay if available
          if (fullAirportData.polygon) {
            console.log('🔷 Airport has polygon data, creating overlay...');
            console.log('🔷 Polygon data:', fullAirportData.polygon);
            await createAirportPolygon(map3DElement, fullAirportData.polygon);
          } else {
            console.log('❌ No polygon data available for this airport');
          }

          // Add terminal connection lines if available
          if (fullAirportData.terminals && fullAirportData.terminals.length > 1) {
            console.log('🔗 Adding terminal connection lines...');
            await createTerminalConnectionLines(map3DElement, fullAirportData.terminals, true);

            // Add terminal markers for better visibility
            const { Marker3DElement, AltitudeMode } = await window.google.maps.importLibrary("maps3d") as any;
            const { PinElement } = await window.google.maps.importLibrary("marker") as any;

            for (let i = 0; i < fullAirportData.terminals.length; i++) {
              const terminal = fullAirportData.terminals[i];
              const terminalPin = new PinElement({
                background: '#ff4444',
                borderColor: '#cc0000',
                glyph: (i + 1).toString(),
                glyphColor: '#ffffff',
                scale: 1.5
              });

              const terminalMarker = new Marker3DElement({
                position: { lat: terminal.lat, lng: terminal.lng, altitude: elevation ? (elevation * 0.3048) + 100 : 100 },
                altitudeMode: AltitudeMode.RELATIVE_TO_GROUND
              });

              terminalMarker.append(terminalPin);
              map3DElement.append(terminalMarker);
              console.log(`✅ Added terminal marker ${i + 1} for ${terminal.name}`);
            }

            // Start auto-fly through terminals after a short delay
            setTimeout(() => {
              autoFlyThroughTerminals(map3DElement, fullAirportData.terminals);
            }, 2000);
          } else {
            console.log('❌ No terminal data available for this airport');
          }

              setMapType('3D');
            } catch (markerError) {
              console.warn('⚠️ Marker creation failed, but map loaded:', markerError);
              setMapType('3D');
            }
          }
        } catch (maps3dError) {
          console.warn('❌ 3D Maps not available, falling back to 2D map:', maps3dError);
          await initialize2DMap(coords, fullAirportData);
        }
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
        setMapType('Info');
      } finally {
        setIsLoading(false);
        isInitializingRef.current = false;
      }
    };

    const initialize2DMap = async (coords: { lat: number; lng: number }, airportData: any) => {
      try {
        console.log('🗺️ Initializing 2D map fallback...');

        // Import regular maps library
        const { Map } = await window.google.maps.importLibrary("maps") as any;
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as any;

        if (mapContainerRef.current && isMounted && !mapInstanceRef.current) {
          // Clear the container first
          mapContainerRef.current.innerHTML = '';

          // Create regular 2D map
          const map = new Map(mapContainerRef.current, {
            center: coords,
            zoom: 15,
            mapId: "DEMO_MAP_ID",
            mapTypeId: window.google.maps.MapTypeId.HYBRID,
            tilt: 45
          });

          mapInstanceRef.current = map;
          console.log('✅ 2D Map initialized successfully');

          // Add airport marker
          const pin = new PinElement({
            background: "#4285F4",
            borderColor: "#1967D2",
            glyphColor: "white",
            glyph: "✈️",
            scale: 1.5
          });

          const marker = new AdvancedMarkerElement({
            map: map,
            position: coords,
            content: pin.element,
            title: `${airportName} (${airportCode})`
          });

          marker.append(pin);

          // Add terminal connection lines for 2D map if available
          if (airportData.terminals && airportData.terminals.length > 1) {
            console.log('🔗 Adding terminal connection lines to 2D map...');
            await createTerminalConnectionLines(map, airportData.terminals, false);

            // Add red terminal markers with numbers for 2D map
            airportData.terminals.forEach((terminal: any, index: number) => {
              const terminalMarker = new window.google.maps.Marker({
                position: { lat: terminal.lat, lng: terminal.lng },
                map: map,
                title: `${terminal.name} - Terminal ${index + 1}`,
                icon: {
                  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#ff4444" stroke="#cc0000" stroke-width="2"/>
                      <text x="20" y="26" text-anchor="middle" font-family="Arial" font-size="14" font-weight="bold" fill="white">${index + 1}</text>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 20)
                }
              });
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize 2D map:', error);
        setError('Failed to load map');
        setMapType('Info');
      }
    };

    // Only try to initialize once
    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
      isInitializingRef.current = false;

      // Clean up map instance - the map container has NO React children now
      // so we can safely clear it without React reconciliation conflicts
      if (mapContainerRef.current) {
        try {
          // Clear all children (Google Maps custom elements)
          mapContainerRef.current.replaceChildren();
        } catch (error) {
          // Silently handle any cleanup errors - component is unmounting anyway
          console.debug('Map cleanup:', error);
        }
      }

      // Clear all references
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [isOpen, airportCode, airportName, airportCity, complexity, description, latitude, longitude, elevation, homeLink, wikipediaLink]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-lg shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <Building className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <div>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {airportName} ({airportCode})
              </h2>
              <div className="flex items-center space-x-2">
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {airportCity} {elevation && `• Elevation: ${elevation} ft`}
                </p>
                          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              4.2/5
            </span>
            <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              User Rating
            </span>
            {(airportData?.terminals && airportData.terminals.length > 1) || airportData?.polygon ? (
              <div className="flex items-center space-x-2">
                {airportData?.terminals && airportData.terminals.length > 1 && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    🔗 {airportData.terminals.length} Terminals Connected
                  </span>
                )}
                {airportData?.polygon && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}>
                    🔷 3D Area Overlay
                  </span>
                )}
                {airportData?.terminals && airportData.terminals.length > 1 && (
                  <button
                    onClick={() => {
                      if (mapInstanceRef.current && airportData.terminals) {
                        autoFlyThroughTerminals(mapInstanceRef.current, airportData.terminals);
                      }
                    }}
                    className={`text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                      isDarkMode
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    🛫 Auto-Fly
                  </button>
                )}
              </div>
            ) : null}
          </div>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-100 text-red-800'}`}>
              Complexity: <span className={getComplexityColor(complexity)}>{complexity.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <TranslatedText text="Airport Location" targetLanguage={currentLanguage} />
              </span>
            </div>
            {/* Weather Information */}
            {weather && !weatherLoading && (
              <div className="flex items-center space-x-2">
                <Cloud className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {weather.temperature}°F, {weather.condition}
                </span>
              </div>
            )}
            {weatherLoading && (
              <div className="flex items-center space-x-2">
                <Cloud className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} animate-pulse`} />
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Loading weather...
                </span>
              </div>
            )}
            <div className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800'}`}>
              Search: {airportCode}
            </div>
          </div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              FlightRiskRadar
            </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative" style={{ minHeight: '500px' }}>
          {/* Separate div for Google Maps - NOT managed by React */}
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ minHeight: '500px', height: '500px' }}
          />

          {/* Loading and error overlays - managed by React */}
          {isLoading && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'} pointer-events-none`}>
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                  <TranslatedText text="Loading 3D Tiles..." targetLanguage={currentLanguage} />
                </p>
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  🗺️ Loading Google Maps 3D Tiles View
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <TranslatedText text="Map Unavailable" targetLanguage={currentLanguage} />
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {error}
                </p>
                <button
                  onClick={() => setMapType('Info')}
                  className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                    <TranslatedText text="Show Airport Information" targetLanguage={currentLanguage} />
                  </button>
                </div>
              </div>
            )}

          {/* Fallback Airport Info */}
          {mapType === 'Info' && !isLoading && !error && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-6xl mb-4">✈️</div>
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {airportName} ({airportCode})
              </h3>
              <p className={`text-lg mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {airportCity}
              </p>
              <div className={`px-4 py-2 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800'}`}>
                <strong>Coordinates:</strong> {latitude && longitude ? `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` : 'Loading...'}
                {elevation && <> • <strong>Elevation:</strong> {elevation} ft</>}
              </div>
              <div className={`px-4 py-2 rounded-lg mb-4 ${isDarkMode ? 'bg-orange-900/20 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800'}`}>
                <strong>Complexity:</strong> {complexity.toUpperCase()}
              </div>
              <p className={`text-sm max-w-md ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <p className="mb-2">
              <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <TranslatedText text="Airport Description:" targetLanguage={currentLanguage} />
              </span>
            </p>
            <p className={`leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AirportLocationViewer;

