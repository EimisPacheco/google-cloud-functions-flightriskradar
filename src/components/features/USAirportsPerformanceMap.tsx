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
        Polygon3DElement: any;
        AltitudeMode: any;
        MapMode: any;
        WebGLOverlayView: any;
        CoordinateTransformer: any;
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

interface USAirportsPerformanceMapProps {
  airports: AirportData[];
}

const USAirportsPerformanceMap: React.FC<USAirportsPerformanceMapProps> = ({ airports }) => {
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

        if (!window.google?.maps) {
          throw new Error('Google Maps not loaded');
        }

        // Import 3D maps library
        const { Map3DElement, AltitudeMode, MapMode } = 
          await window.google.maps.importLibrary("maps3d") as any;
        const { WebGLOverlayView } = await window.google.maps.importLibrary("maps") as any;

        if (!containerRef.current) return;

        // Create container wrapper to isolate 3D map from React
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
          range: 5000000, // 5000km view
          tilt: 0,
          heading: 0,
          mode: MapMode.SATELLITE,
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

        // Create WebGL overlay for custom donut charts
        const overlay = new WebGLOverlayView();
        
        overlay.onAdd = () => {
          console.log('WebGL overlay added');
        };
        
        overlay.onContextRestored = ({gl}) => {
          // Clear the WebGL context
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        };
        
        overlay.onDraw = ({gl, transformer}) => {
          const container = overlay.getMap().getDiv();
          if (!container) return;
          
          // Create a container for HTML overlays if it doesn't exist
          let overlayContainer = container.querySelector('.custom-donut-overlays');
          if (!overlayContainer) {
            overlayContainer = document.createElement('div');
            overlayContainer.className = 'custom-donut-overlays';
            overlayContainer.style.position = 'absolute';
            overlayContainer.style.top = '0';
            overlayContainer.style.left = '0';
            overlayContainer.style.width = '100%';
            overlayContainer.style.height = '100%';
            overlayContainer.style.pointerEvents = 'none';
            overlayContainer.style.zIndex = '1000';
            container.appendChild(overlayContainer);
          }
          
          // Clear existing donuts
          overlayContainer.innerHTML = '';
          
          // Add donut charts for each airport
          for (const airport of airports) {
            if (airport.latitude && airport.longitude) {
              // Convert lat/lng to screen coordinates
              const matrix = transformer.fromLatLngAltitude({
                lat: airport.latitude,
                lng: airport.longitude,
                altitude: 30000
              });
              
              if (matrix) {
                const screenCoords = {
                  x: matrix[12],
                  y: matrix[13]
                };
                
                // Create donut chart element
                const donutContainer = document.createElement('div');
                donutContainer.style.position = 'absolute';
                donutContainer.style.transform = `translate(${screenCoords.x - 40}px, ${screenCoords.y - 40}px)`;
                donutContainer.style.width = '80px';
                donutContainer.style.height = '80px';
                donutContainer.style.pointerEvents = 'auto';
                donutContainer.style.cursor = 'pointer';
                
                // Create canvas for donut chart
                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Calculate segments
                  const onTimePercent = airport.onTimeRate;
                  const cancelPercent = airport.cancellationRate;
                  const delayPercent = 100 - onTimePercent - cancelPercent;
                  
                  const centerX = 40;
                  const centerY = 40;
                  const radius = 30;
                  const innerRadius = 15;
                  
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
                  
                  // Draw center text
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 14px Arial';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillText(airport.code, centerX, centerY);
                  
                  // Add shadow for floating effect
                  canvas.style.filter = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))';
                }
                
                donutContainer.appendChild(canvas);
                
                // Add click handler
                donutContainer.addEventListener('click', () => {
                  alert(`${airport.name} (${airport.code})\n` +
                        `✓ On-time: ${airport.onTimeRate}%\n` +
                        `✗ Cancelled: ${airport.cancellationRate}%\n` +
                        `⚡ Delayed: ${(100 - airport.onTimeRate - airport.cancellationRate).toFixed(1)}%\n` +
                        `Daily Flights: ${airport.dailyFlights}`);
                });
                
                // Add hover effect
                donutContainer.addEventListener('mouseenter', () => {
                  canvas.style.transform = 'scale(1.1)';
                  canvas.style.transition = 'transform 0.2s';
                });
                donutContainer.addEventListener('mouseleave', () => {
                  canvas.style.transform = 'scale(1)';
                });
                
                overlayContainer.appendChild(donutContainer);
              }
            }
          }
          
          // Request redraw on next frame
          overlay.requestRedraw();
        };
        
        overlay.setMap(map3D);
        
        // Store overlay reference
        mapInstanceRef.current = { map: map3D, overlay };
        
        setIsLoading(false);
        console.log(`Created WebGL overlay for ${airports.length} airports`);
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
      if (mapInstanceRef.current?.overlay) {
        mapInstanceRef.current.overlay.setMap(null);
      }
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
          <TranslatedText text="Note: Donut charts show on-time (green), delays (yellow), and cancellations (red)" targetLanguage={currentLanguage} />
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

export default USAirportsPerformanceMap;