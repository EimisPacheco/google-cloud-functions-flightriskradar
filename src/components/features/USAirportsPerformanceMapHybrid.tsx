import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';

// Google Maps API type declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>;
        Map: any;
        OverlayView: any;
        MapTypeId: any;
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

interface USAirportsPerformanceMapHybridProps {
  airports: AirportData[];
}

// Custom overlay class for donut charts
class DonutOverlay extends google.maps.OverlayView {
  private airport: AirportData;
  private div: HTMLDivElement | null = null;

  constructor(airport: AirportData) {
    super();
    this.airport = airport;
  }

  onAdd() {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    this.div.style.transform = 'translate(-40px, -40px)';
    this.div.style.width = '80px';
    this.div.style.height = '80px';
    this.div.style.cursor = 'pointer';
    
    // Create canvas for donut chart
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Calculate segments
      const onTimePercent = this.airport.onTimeRate;
      const cancelPercent = this.airport.cancellationRate;
      const delayPercent = 100 - onTimePercent - cancelPercent;
      
      const centerX = 40;
      const centerY = 40;
      const radius = 30;
      const innerRadius = 15;
      
      // Clear canvas
      ctx.clearRect(0, 0, 80, 80);
      
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
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.airport.code, centerX, centerY);
      
      // Add shadow for floating effect
      canvas.style.filter = 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4))';
    }
    
    this.div.appendChild(canvas);
    
    // Add click handler
    this.div.addEventListener('click', () => {
      alert(`${this.airport.name} (${this.airport.code})\n` +
            `✓ On-time: ${this.airport.onTimeRate}%\n` +
            `✗ Cancelled: ${this.airport.cancellationRate}%\n` +
            `⚡ Delayed: ${(100 - this.airport.onTimeRate - this.airport.cancellationRate).toFixed(1)}%\n` +
            `Daily Flights: ${this.airport.dailyFlights}`);
    });
    
    // Add hover effect
    this.div.addEventListener('mouseenter', () => {
      canvas.style.transform = 'scale(1.15)';
      canvas.style.transition = 'transform 0.2s';
    });
    this.div.addEventListener('mouseleave', () => {
      canvas.style.transform = 'scale(1)';
    });
    
    const panes = this.getPanes();
    panes?.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    const overlayProjection = this.getProjection();
    if (!overlayProjection || !this.div) return;
    
    const pos = overlayProjection.fromLatLngToDivPixel(
      new google.maps.LatLng(this.airport.latitude, this.airport.longitude)
    );
    
    if (pos) {
      this.div.style.left = pos.x + 'px';
      this.div.style.top = pos.y + 'px';
    }
  }

  onRemove() {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }
}

const USAirportsPerformanceMapHybrid: React.FC<USAirportsPerformanceMapHybridProps> = ({ airports }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<DonutOverlay[]>([]);
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

        // Import required libraries
        await window.google.maps.importLibrary("maps");
        await window.google.maps.importLibrary("marker");

        if (!containerRef.current) return;

        // Create the map with 3D-like satellite view
        const map = new window.google.maps.Map(containerRef.current, {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom: 4.5,
          mapTypeId: 'hybrid',
          tilt: 45,
          heading: 0,
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;

        // Wait for map to be ready
        await new Promise((resolve) => {
          google.maps.event.addListenerOnce(map, 'idle', resolve);
        });

        // Add custom overlays for each airport
        const newOverlays: DonutOverlay[] = [];
        
        for (const airport of airports) {
          if (airport.latitude && airport.longitude) {
            const overlay = new DonutOverlay(airport);
            overlay.setMap(map);
            newOverlays.push(overlay);
          }
        }

        overlaysRef.current = newOverlays;
        setIsLoading(false);
        
        console.log(`Successfully created ${newOverlays.length} donut overlays`);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      // Remove all overlays
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      overlaysRef.current = [];
      mapInstanceRef.current = null;
      initializeRef.current = false;
    };
  }, [airports]);

  return (
    <div className={`w-full rounded-lg overflow-hidden shadow-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          <TranslatedText text="US Airports Performance Overview (3D View)" targetLanguage={currentLanguage} />
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
          <TranslatedText text="Interactive donut charts showing real-time performance metrics" targetLanguage={currentLanguage} />
        </p>
      </div>

      {/* Map Container */}
      <div className="relative h-[600px]">
        {isLoading && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                <TranslatedText text="Loading US airports performance map..." targetLanguage={currentLanguage} />
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
                Make sure Google Maps API is properly loaded
              </p>
            </div>
          </div>
        )}
        
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default USAirportsPerformanceMapHybrid;