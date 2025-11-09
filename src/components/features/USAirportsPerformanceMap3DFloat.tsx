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
        Polyline3DElement: any;
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

interface USAirportsPerformanceMap3DFloatProps {
  airports: AirportData[];
}

// Custom element for floating donut charts
class FloatingDonutElement extends HTMLElement {
  private airport: AirportData;
  private canvas: HTMLCanvasElement;

  constructor(airport: AirportData) {
    super();
    this.airport = airport;
    this.style.position = 'absolute';
    this.style.width = '100px';
    this.style.height = '100px';
    this.style.pointerEvents = 'auto';
    this.style.cursor = 'pointer';
    this.style.transition = 'transform 0.3s ease';
    this.style.zIndex = '1000';
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 100;
    this.canvas.height = 100;
    this.appendChild(this.canvas);
    
    this.drawDonut();
    this.setupEventListeners();
  }

  private drawDonut() {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const centerX = 50;
    const centerY = 50;
    const radius = 35;
    const innerRadius = 18;

    // Clear canvas
    ctx.clearRect(0, 0, 100, 100);

    // Calculate segments
    const onTimePercent = this.airport.onTimeRate;
    const cancelPercent = this.airport.cancellationRate;
    const delayPercent = 100 - onTimePercent - cancelPercent;

    // Add shadow for floating effect
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Draw white background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

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
    ctx.lineWidth = 1.5;
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
      ctx.lineWidth = 1.5;
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
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw center text
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.airport.code, centerX, centerY);

    // Add percentage text below
    ctx.font = '10px Arial';
    ctx.fillStyle = '#059669';
    ctx.fillText(`${onTimePercent}%`, centerX, centerY + radius + 12);
  }

  private setupEventListeners() {
    this.addEventListener('mouseenter', () => {
      this.style.transform = 'scale(1.3) translateY(-10px)';
      this.style.zIndex = '2000';
      
      // Show tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'airport-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.bottom = '110%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.background = 'rgba(31, 41, 55, 0.95)';
      tooltip.style.color = 'white';
      tooltip.style.padding = '8px 12px';
      tooltip.style.borderRadius = '6px';
      tooltip.style.fontSize = '12px';
      tooltip.style.whiteSpace = 'nowrap';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.zIndex = '3000';
      tooltip.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${this.airport.name}</div>
        <div>✓ On-time: ${this.airport.onTimeRate}%</div>
        <div>⚡ Delayed: ${(100 - this.airport.onTimeRate - this.airport.cancellationRate).toFixed(1)}%</div>
        <div>✗ Cancelled: ${this.airport.cancellationRate}%</div>
      `;
      this.appendChild(tooltip);
    });

    this.addEventListener('mouseleave', () => {
      this.style.transform = 'scale(1)';
      this.style.zIndex = '1000';
      const tooltip = this.querySelector('.airport-tooltip');
      if (tooltip) tooltip.remove();
    });

    this.addEventListener('click', () => {
      const delayPercent = 100 - this.airport.onTimeRate - this.airport.cancellationRate;
      alert(`${this.airport.name} (${this.airport.code})\n` +
            `✓ On-time: ${this.airport.onTimeRate}%\n` +
            `⚡ Delayed: ${delayPercent.toFixed(1)}%\n` +
            `✗ Cancelled: ${this.airport.cancellationRate}%\n` +
            `Daily Flights: ${this.airport.dailyFlights.toLocaleString()}`);
    });
  }
}

// Register custom element
if (!customElements.get('floating-donut')) {
  customElements.define('floating-donut', FloatingDonutElement);
}

const USAirportsPerformanceMap3DFloat: React.FC<USAirportsPerformanceMap3DFloatProps> = ({ airports }) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const donutsRef = useRef<FloatingDonutElement[]>([]);
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
        const { Map3DElement, Marker3DElement } = 
          await window.google.maps.importLibrary("maps3d") as any;

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
          tilt: 55,
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

        // Create invisible markers with floating donuts
        const newDonuts: FloatingDonutElement[] = [];
        
        for (const airport of airports) {
          if (airport.latitude && airport.longitude) {
            try {
              // Create invisible marker for position tracking
              const marker = new Marker3DElement({
                position: { 
                  lat: airport.latitude, 
                  lng: airport.longitude,
                  altitude: 50000 // 50km altitude for floating effect
                }
              });
              
              // Create floating donut element
              const donut = new FloatingDonutElement(airport);
              
              // Attach donut to marker
              marker.appendChild(donut);
              
              // Add to map
              map3D.appendChild(marker);
              
              newDonuts.push(donut);
              
              console.log(`Created floating donut for ${airport.code}`);
            } catch (markerError) {
              console.error(`Failed to create donut for ${airport.code}:`, markerError);
            }
          }
        }

        donutsRef.current = newDonuts;
        setIsLoading(false);
        
        console.log(`Successfully created ${newDonuts.length} floating donuts out of ${airports.length} airports`);
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
      donutsRef.current = [];
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
          <TranslatedText text="Floating donut charts show real-time performance at 50km altitude. Hover for details" targetLanguage={currentLanguage} />
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

export default USAirportsPerformanceMap3DFloat;