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

interface USAirportsPerformanceMap3DSVGProps {
  airports: AirportData[];
}

const USAirportsPerformanceMap3DSVG: React.FC<USAirportsPerformanceMap3DSVGProps> = ({ airports }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializeRef = useRef(false);

  // Function to create SVG donut chart
  const createDonutChartSVG = (airport: AirportData): string => {
    const onTimePercent = airport.onTimeRate;
    const cancelPercent = airport.cancellationRate;
    const delayPercent = 100 - onTimePercent - cancelPercent;

    const centerX = 32;
    const centerY = 32;
    const radius = 24;
    const innerRadius = 12;

    // Helper function to create path for arc
    const createArcPath = (startAngle: number, endAngle: number): string => {
      const startX = centerX + radius * Math.cos(startAngle);
      const startY = centerY + radius * Math.sin(startAngle);
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);
      const innerStartX = centerX + innerRadius * Math.cos(endAngle);
      const innerStartY = centerY + innerRadius * Math.sin(endAngle);
      const innerEndX = centerX + innerRadius * Math.cos(startAngle);
      const innerEndY = centerY + innerRadius * Math.sin(startAngle);
      
      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      
      return `M ${startX} ${startY} 
              A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
              L ${innerStartX} ${innerStartY}
              A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}
              Z`;
    };

    let currentAngle = -Math.PI / 2; // Start at top
    let paths = '';

    // On-time segment (green)
    const onTimeAngle = (onTimePercent / 100) * Math.PI * 2;
    if (onTimeAngle > 0) {
      paths += `<path d="${createArcPath(currentAngle, currentAngle + onTimeAngle)}" fill="#10b981" stroke="#059669" stroke-width="1"/>`;
      currentAngle += onTimeAngle;
    }

    // Delay segment (yellow)
    const delayAngle = (delayPercent / 100) * Math.PI * 2;
    if (delayAngle > 0) {
      paths += `<path d="${createArcPath(currentAngle, currentAngle + delayAngle)}" fill="#f59e0b" stroke="#d97706" stroke-width="1"/>`;
      currentAngle += delayAngle;
    }

    // Cancellation segment (red)
    const cancelAngle = (cancelPercent / 100) * Math.PI * 2;
    if (cancelAngle > 0) {
      paths += `<path d="${createArcPath(currentAngle, currentAngle + cancelAngle)}" fill="#ef4444" stroke="#dc2626" stroke-width="1"/>`;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="white"/>
        ${paths}
        <circle cx="32" cy="32" r="11" fill="white"/>
        <text x="32" y="32" text-anchor="middle" dominant-baseline="middle" 
              font-family="Arial" font-size="10" font-weight="bold" fill="#1f2937">
          ${airport.code}
        </text>
      </svg>
    `;

    return 'data:image/svg+xml;base64,' + btoa(svg);
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
        const { PinElement } = 
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

        // Create markers with SVG donut charts
        const newMarkers: any[] = [];
        
        for (const airport of airports) {
          if (airport.latitude && airport.longitude) {
            try {
              const delayPercent = 100 - airport.onTimeRate - airport.cancellationRate;
              
              // Create SVG donut chart
              const svgDataURL = createDonutChartSVG(airport);
              
              // Create a pin element with SVG donut chart as glyph
              const pin = new PinElement({
                background: 'transparent',
                borderColor: 'transparent',
                glyph: new URL(svgDataURL),
                scale: 2.0
              });

              // Create 3D marker
              const marker = new Marker3DElement({
                position: { 
                  lat: airport.latitude, 
                  lng: airport.longitude,
                  altitude: 40000 // 40km altitude for floating effect
                },
                altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
                title: `${airport.name} (${airport.code})`
              });

              marker.appendChild(pin);
              map3D.appendChild(marker);

              // Add click handler
              marker.addEventListener('gmp-click', () => {
                const popup = document.createElement('div');
                popup.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: white;
                  padding: 20px;
                  border-radius: 12px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                  z-index: 10000;
                  max-width: 300px;
                `;
                
                popup.innerHTML = `
                  <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">
                    ${airport.name} (${airport.code})
                  </h3>
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div style="width: 12px; height: 12px; background: #10b981; border-radius: 2px; margin-right: 8px;"></div>
                    <span style="color: #4b5563;">On-time: <strong style="color: #059669;">${airport.onTimeRate}%</strong></span>
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div style="width: 12px; height: 12px; background: #f59e0b; border-radius: 2px; margin-right: 8px;"></div>
                    <span style="color: #4b5563;">Delayed: <strong style="color: #d97706;">${delayPercent.toFixed(1)}%</strong></span>
                  </div>
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="width: 12px; height: 12px; background: #ef4444; border-radius: 2px; margin-right: 8px;"></div>
                    <span style="color: #4b5563;">Cancelled: <strong style="color: #dc2626;">${airport.cancellationRate}%</strong></span>
                  </div>
                  <div style="padding-top: 12px; border-top: 1px solid #e5e7eb; color: #6b7280;">
                    Daily Flights: <strong style="color: #1f2937;">${airport.dailyFlights.toLocaleString()}</strong>
                  </div>
                  <button onclick="this.parentElement.remove()" style="
                    margin-top: 16px;
                    padding: 8px 16px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    width: 100%;
                  ">Close</button>
                `;
                
                document.body.appendChild(popup);
              });

              newMarkers.push(marker);
              
              console.log(`Created SVG donut marker for ${airport.code}`);
            } catch (markerError) {
              console.error(`Failed to create marker for ${airport.code}:`, markerError);
            }
          }
        }

        markersRef.current = newMarkers;
        setIsLoading(false);
        
        console.log(`Successfully created ${newMarkers.length} SVG markers out of ${airports.length} airports`);
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
              <TranslatedText text="On-time" targetLanguage={currentLanguage} />
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              <TranslatedText text="Delays" targetLanguage={currentLanguage} />
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
              <TranslatedText text="Cancellations" targetLanguage={currentLanguage} />
            </span>
          </div>
        </div>
        <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <TranslatedText text="SVG donut charts floating at 40km altitude. Click for detailed statistics" targetLanguage={currentLanguage} />
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-[600px]">
        {isLoading && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                <TranslatedText text="Loading 3D US airports map with SVG donuts..." targetLanguage={currentLanguage} />
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

export default USAirportsPerformanceMap3DSVG;