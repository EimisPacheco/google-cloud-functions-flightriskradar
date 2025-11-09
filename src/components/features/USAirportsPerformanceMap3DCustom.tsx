import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';

// Google Maps 3D API type declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>;
        Map3DElement: any;
        Marker3DElement: any;
        AltitudeMode: any;
      };
    };
  }
}

interface AirportData {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  onTimeRate: number;
  cancellationRate: number;
  dailyFlights: number;
}

interface USAirportsPerformanceMap3DCustomProps {
  airports: AirportData[];
}

const USAirportsPerformanceMap3DCustom: React.FC<USAirportsPerformanceMap3DCustomProps> = ({ airports }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializeRef = useRef(false);

  // Function to create donut chart as data URL
  const createDonutChartDataURL = (airport: AirportData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    const centerX = 32;
    const centerY = 32;
    const radius = 24;
    const innerRadius = 12;

    // Calculate segments
    const onTimePercent = airport.onTimeRate;
    const cancelPercent = airport.cancellationRate;
    const delayPercent = 100 - onTimePercent - cancelPercent;

    // Clear canvas
    ctx.clearRect(0, 0, 64, 64);

    // Draw white background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();

    // Draw donut segments
    let currentAngle = -Math.PI / 2; // Start at top

    // On-time segment (green)
    const onTimeAngle = (onTimePercent / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + onTimeAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + onTimeAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = '#10b981';
    ctx.fill();
    currentAngle += onTimeAngle;

    // Delay segment (yellow)
    const delayAngle = (delayPercent / 100) * Math.PI * 2;
    if (delayAngle > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + delayAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + delayAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      currentAngle += delayAngle;
    }

    // Cancellation segment (red)
    const cancelAngle = (cancelPercent / 100) * Math.PI * 2;
    if (cancelAngle > 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + cancelAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + cancelAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // Draw center text
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(airport.code, centerX, centerY);

    return canvas.toDataURL();
  };

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializeRef.current) return;
    if (!airports || airports.length === 0) return;

    const initMap = async () => {
      try {
        initializeRef.current = true;
        setIsLoading(true);
        setError(null);

        if (!window.google?.maps) {
          throw new Error('Google Maps not loaded');
        }

        // Import required libraries
        const { Map3DElement, Marker3DElement, AltitudeMode } = 
          await window.google.maps.importLibrary("maps3d") as any;
        const { PinElement, AdvancedMarkerElement } = 
          await window.google.maps.importLibrary("marker") as any;

        if (!containerRef.current) return;

        // Create container wrapper
        const mapWrapper = document.createElement('div');
        mapWrapper.style.width = '100%';
        mapWrapper.style.height = '100%';
        mapWrapper.style.position = 'relative';
        
        // Clear container and add wrapper
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(mapWrapper);

        // Create 3D map
        const map3D = new Map3DElement({
          center: { lat: 39.8283, lng: -98.5795, altitude: 0 },
          tilt: 45,
          range: 4500000, // 4500km view
          mode: 'SATELLITE'
        });

        // Set explicit styling
        map3D.style.width = '100%';
        map3D.style.height = '100%';
        map3D.style.minHeight = '600px';
        map3D.style.display = 'block';

        mapWrapper.appendChild(map3D);
        mapInstanceRef.current = map3D;

        // Wait for map to be ready
        await new Promise((resolve) => {
          const checkReady = () => {
            if (map3D.isConnected) {
              setTimeout(resolve, 1500);
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });

        // Create markers with custom pins
        const newMarkers: any[] = [];
        
        for (const airport of airports) {
          if (airport.latitude && airport.longitude) {
            try {
              // Calculate performance for color
              const cancelPercent = airport.cancellationRate;
              const delayPercent = 100 - airport.onTimeRate - cancelPercent;
              
              // Determine background color based on performance
              let bgColor = '#10b981'; // green
              let borderColor = '#059669';
              if (cancelPercent > 10) {
                bgColor = '#ef4444'; // red
                borderColor = '#dc2626';
              } else if (delayPercent > 30) {
                bgColor = '#f59e0b'; // yellow
                borderColor = '#d97706';
              }

              // Create a pin element with donut chart image
              const donutDataURL = createDonutChartDataURL(airport);
              
              // Create custom pin with donut chart as background
              const pin = new PinElement({
                background: bgColor,
                borderColor: borderColor,
                glyphColor: 'white',
                glyph: new URL(donutDataURL),
                scale: 2.5
              });

              // Create 3D marker
              const marker = new Marker3DElement({
                position: { 
                  lat: airport.latitude, 
                  lng: airport.longitude,
                  altitude: 50000 // 50km altitude for floating effect
                },
                altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
                title: `${airport.name} (${airport.code})\nOn-time: ${airport.onTimeRate}%\nCancelled: ${airport.cancellationRate}%\nDelayed: ${delayPercent.toFixed(1)}%`
              });

              marker.appendChild(pin);
              map3D.appendChild(marker);

              // Add click handler
              marker.addEventListener('gmp-click', () => {
                alert(`${airport.name} (${airport.code})\n` +
                      `✓ On-time: ${airport.onTimeRate}%\n` +
                      `✗ Cancelled: ${airport.cancellationRate}%\n` +
                      `⚡ Delayed: ${delayPercent.toFixed(1)}%\n` +
                      `Daily Flights: ${airport.dailyFlights.toLocaleString()}`);
              });

              newMarkers.push(marker);
              
              console.log(`Created custom donut marker for ${airport.code}`);
            } catch (markerError) {
              console.error(`Failed to create marker for ${airport.code}:`, markerError);
            }
          }
        }

        markersRef.current = newMarkers;
        setIsLoading(false);
        
        console.log(`Successfully created ${newMarkers.length} custom markers out of ${airports.length} airports`);
      } catch (err) {
        console.error('3D Map initialization error:', err);
        setError('Failed to initialize 3D map: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      markersRef.current = [];
      mapInstanceRef.current = null;
      initializeRef.current = false;
    };
  }, [airports]);

  return (
    <div className={`w-full rounded-lg overflow-hidden shadow-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <TranslatedText text="US Airports Performance Overview (3D)" targetLanguage={currentLanguage} />
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              <TranslatedText text="Good Performance (>80% on-time)" targetLanguage={currentLanguage} />
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              <TranslatedText text="Moderate (>30% delays)" targetLanguage={currentLanguage} />
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              <TranslatedText text="Poor (>10% cancelled)" targetLanguage={currentLanguage} />
            </span>
          </div>
        </div>
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <TranslatedText text="Custom pins show airport performance as donut charts. Click for details" targetLanguage={currentLanguage} />
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-[600px]">
        {isLoading && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                <TranslatedText text="Loading 3D US airports map..." targetLanguage={currentLanguage} />
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {error}
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Make sure Google Maps 3D API is properly loaded
              </p>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default USAirportsPerformanceMap3DCustom;