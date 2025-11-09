import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';
import { initializeGoogleMaps } from '../../utils/loadGoogleMaps';

// Google Maps 3D API type declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>;
        Map3DElement: any;
        Marker3DInteractiveElement: any;
        PopoverElement: any;
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

interface USAirportsPerformanceMap3DProps {
  airports: AirportData[];
}

const USAirportsPerformanceMap3D: React.FC<USAirportsPerformanceMap3DProps> = ({ airports }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializeRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializeRef.current) return;
    if (!airports || airports.length === 0) return;

    const initMap = async () => {
      try {
        initializeRef.current = true;
        setIsLoading(true);
        setError(null);

        // Load Google Maps if not already loaded
        await initializeGoogleMaps();

        if (!window.google?.maps) {
          throw new Error('Google Maps not loaded');
        }

        // Import 3D maps library
        const { Map3DElement, Marker3DInteractiveElement, PopoverElement } = 
          await window.google.maps.importLibrary("maps3d") as any;
        const { PinElement } = 
          await window.google.maps.importLibrary("marker") as any;

        if (!containerRef.current) return;

        // Create container wrapper to isolate 3D map from React
        const mapWrapper = document.createElement('div');
        mapWrapper.style.width = '100%';
        mapWrapper.style.height = '100%';
        mapWrapper.style.position = 'relative';
        
        // Clear container and add wrapper
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(mapWrapper);

        // Create 3D map centered on USA
        const map3D = new Map3DElement({
          center: { lat: 39.8283, lng: -98.5795, altitude: 0 },
          tilt: 45,
          range: 5000000, // 5000km view
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
              setTimeout(resolve, 1000); // Give it extra time to fully initialize
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });

        // Add markers for each airport
        const newMarkers: any[] = [];
        
        for (const airport of airports) {
          if (airport.latitude && airport.longitude) {
            try {
              // Calculate performance metrics
              const onTimePercent = airport.onTimeRate;
              const cancelPercent = airport.cancellationRate;
              const delayPercent = 100 - onTimePercent - cancelPercent;
              
              // Create popover with donut chart
              const popover = new PopoverElement({
                open: false,
              });
              
              // Create container for custom content
              const container = document.createElement('div');
              container.style.padding = '12px';
              container.style.minWidth = '200px';
              container.style.background = 'white';
              container.style.borderRadius = '12px';
              container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              
              // Extract city name for header
              const cityNameForHeader = airport.name.split(' International')[0].split(' Airport')[0];
              
              // City name as main header
              const cityHeader = document.createElement('div');
              cityHeader.style.fontSize = '18px';
              cityHeader.style.fontWeight = 'bold';
              cityHeader.style.marginBottom = '4px';
              cityHeader.style.color = '#1f2937';
              cityHeader.textContent = cityNameForHeader;
              container.appendChild(cityHeader);
              
              // Airport name and code as subheader
              const airportHeader = document.createElement('div');
              airportHeader.style.fontSize = '14px';
              airportHeader.style.color = '#6b7280';
              airportHeader.style.marginBottom = '12px';
              airportHeader.textContent = `${airport.name} (${airport.code})`;
              container.appendChild(airportHeader);
              
              // Create canvas for donut chart
              const canvas = document.createElement('canvas');
              canvas.width = 120;
              canvas.height = 120;
              canvas.style.display = 'block';
              canvas.style.margin = '0 auto 12px';
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                const centerX = 60;
                const centerY = 60;
                const radius = 45;
                const innerRadius = 25;
                
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
                ctx.strokeStyle = '#059669';
                ctx.lineWidth = 2;
                ctx.stroke();
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
                  ctx.strokeStyle = '#d97706';
                  ctx.lineWidth = 2;
                  ctx.stroke();
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
                  ctx.strokeStyle = '#dc2626';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                }
                
                // Draw center text with background
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(centerX, centerY, innerRadius - 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#1f2937';
                ctx.font = 'bold 18px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(airport.code, centerX, centerY);
              }
              
              container.appendChild(canvas);
              
              // Stats section
              const stats = document.createElement('div');
              stats.style.fontSize = '13px';
              stats.style.lineHeight = '1.6';
              stats.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 12px; height: 12px; background: #10b981; border-radius: 2px; margin-right: 8px;"></span>
                  <span style="color: #4b5563;">On-time: <strong style="color: #059669;">${onTimePercent}%</strong></span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 12px; height: 12px; background: #f59e0b; border-radius: 2px; margin-right: 8px;"></span>
                  <span style="color: #4b5563;">Delayed: <strong style="color: #d97706;">${delayPercent.toFixed(1)}%</strong></span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="display: inline-block; width: 12px; height: 12px; background: #ef4444; border-radius: 2px; margin-right: 8px;"></span>
                  <span style="color: #4b5563;">Cancelled: <strong style="color: #dc2626;">${cancelPercent}%</strong></span>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                  <span style="color: #6b7280;">Daily Flights: <strong style="color: #1f2937;">${airport.dailyFlights.toLocaleString()}</strong></span>
                </div>
              `;
              container.appendChild(stats);
              
              popover.appendChild(container);
              
              // Extract city name from airport name
              const cityName = airport.name.split(' International')[0].split(' Airport')[0];
              
              // Create blue pin with white lines and airport code
              const pin = new PinElement({
                background: '#3b82f6', // Blue background
                borderColor: '#ffffff', // White border
                glyphColor: '#ffffff', // White text
                glyph: airport.code, // Airport code in the middle
                scale: 1.5
              });
              
              // Create interactive 3D marker with city label
              const marker = new Marker3DInteractiveElement({
                position: { 
                  lat: airport.latitude, 
                  lng: airport.longitude
                },
                label: cityName, // City name displayed above the marker
                gmpPopoverTargetElement: popover
              });
              
              // Append pin to marker (3D markers only accept PinElement)
              marker.appendChild(pin);
              
              // Add click handler to open popover
              marker.addEventListener('gmp-click', () => {
                // Close all other popovers
                markersRef.current.forEach(({ popover: p }) => {
                  if (p !== popover) {
                    p.open = false;
                  }
                });
                // Toggle this popover
                popover.open = !popover.open;
              });
              
              map3D.appendChild(marker);
              map3D.appendChild(popover);
              
              newMarkers.push({ marker, popover });
              
              console.log(`Created 3D marker for ${airport.code}`);
            } catch (markerError) {
              console.error(`Failed to create marker for ${airport.code}:`, markerError);
            }
          }
        }

        markersRef.current = newMarkers;
        setIsLoading(false);
        
        console.log(`Successfully created ${newMarkers.length} 3D markers out of ${airports.length} airports`);
      } catch (err) {
        console.error('3D Map initialization error:', err);
        setError('Failed to initialize 3D map: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      // Simple cleanup - just clear the container
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
          <TranslatedText text="Click on any airport marker to view detailed performance metrics" targetLanguage={currentLanguage} />
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

export default USAirportsPerformanceMap3D;