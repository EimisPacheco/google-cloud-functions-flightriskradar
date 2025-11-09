import React, { useState, useEffect, useRef } from 'react';
import { useDarkMode } from '../../context/DarkModeContext';

interface AnimatedAirplaneProps {
  isPlaying: boolean;
}

export const AnimatedAirplane: React.FC<AnimatedAirplaneProps> = ({ isPlaying }) => {
  const { isDarkMode } = useDarkMode();
  const [trails, setTrails] = useState<Array<{ x: number; y: number; opacity: number; size: number }>>([]);
  const positionRef = useRef({ x: 100, y: window.innerHeight / 2 });
  const velocityRef = useRef({ vx: 2, vy: 0 });
  const angleRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      setTrails([]);
      positionRef.current = { x: 100, y: window.innerHeight / 2 };
      velocityRef.current = { vx: 2, vy: 0 };
      angleRef.current = 0;
      return;
    }

    let animationId: number;
    let time = 0;
    
    // Movement parameters
    let targetX = window.innerWidth - 100;
    let targetY = window.innerHeight / 2;
    let movementPhase = 0;
    let waveOffset = 0;
    let circleAngle = 0;
    let circleCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let lastPhaseChange = 0;

    const animate = () => {
      time += 16; // Consistent 60fps timing
      
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const position = positionRef.current;
      const velocity = velocityRef.current;

      // Change movement pattern every 4-8 seconds
      if (time - lastPhaseChange > 4000 + Math.random() * 4000) {
        movementPhase = Math.floor(Math.random() * 6);
        lastPhaseChange = time;
        
        // Reset pattern-specific parameters
        if (movementPhase === 2) { // Circle pattern
          circleCenter = {
            x: 200 + Math.random() * (screenWidth - 400),
            y: 200 + Math.random() * (screenHeight - 400)
          };
          circleAngle = Math.atan2(position.y - circleCenter.y, position.x - circleCenter.x);
        }
        waveOffset = 0;
      }

      // Calculate target based on movement pattern
      switch (movementPhase) {
        case 0: // Horizontal sweep
          if (position.x < 150) {
            targetX = screenWidth - 100;
            targetY = 100 + Math.random() * (screenHeight - 200);
          } else if (position.x > screenWidth - 150) {
            targetX = 100;
            targetY = 100 + Math.random() * (screenHeight - 200);
          }
          break;
          
        case 1: // Vertical sweep
          if (position.y < 150) {
            targetY = screenHeight - 100;
            targetX = 100 + Math.random() * (screenWidth - 200);
          } else if (position.y > screenHeight - 150) {
            targetY = 100;
            targetX = 100 + Math.random() * (screenWidth - 200);
          }
          break;
          
        case 2: // Circle
          const radius = 150 + Math.sin(time * 0.0003) * 50;
          circleAngle += 0.015; // Slower rotation
          targetX = circleCenter.x + Math.cos(circleAngle) * radius;
          targetY = circleCenter.y + Math.sin(circleAngle) * radius;
          break;
          
        case 3: // Diagonal sweep
          if (position.x < 150 && position.y < 150) {
            targetX = screenWidth - 100;
            targetY = screenHeight - 100;
          } else if (position.x > screenWidth - 150 && position.y > screenHeight - 150) {
            targetX = 100;
            targetY = 100;
          } else if (position.x < 150 && position.y > screenHeight - 150) {
            targetX = screenWidth - 100;
            targetY = 100;
          } else if (position.x > screenWidth - 150 && position.y < 150) {
            targetX = 100;
            targetY = screenHeight - 100;
          }
          break;
          
        case 4: // Wave pattern
          waveOffset += 0.015;
          if (position.x < 150) {
            targetX = screenWidth - 100;
          } else if (position.x > screenWidth - 150) {
            targetX = 100;
          }
          targetY = screenHeight / 2 + Math.sin(waveOffset + position.x * 0.003) * (screenHeight / 3);
          break;
          
        case 5: // Random points
          if (Math.abs(position.x - targetX) < 100 && Math.abs(position.y - targetY) < 100) {
            targetX = 100 + Math.random() * (screenWidth - 200);
            targetY = 100 + Math.random() * (screenHeight - 200);
          }
          break;
      }

      // Calculate direction to target
      const dx = targetX - position.x;
      const dy = targetY - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // FIXED: Constant speed, no acceleration
      const MAX_SPEED = 2.5;
      if (distance > 20) {
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Smooth velocity changes with fixed speed
        velocity.vx = velocity.vx * 0.92 + dirX * MAX_SPEED * 0.08;
        velocity.vy = velocity.vy * 0.92 + dirY * MAX_SPEED * 0.08;
        
        // Limit maximum velocity
        const currentSpeed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
        if (currentSpeed > MAX_SPEED) {
          velocity.vx = (velocity.vx / currentSpeed) * MAX_SPEED;
          velocity.vy = (velocity.vy / currentSpeed) * MAX_SPEED;
        }
      }
      
      // Update position
      position.x += velocity.vx;
      position.y += velocity.vy;
      
      // Keep within bounds
      if (position.x < 50) {
        position.x = 50;
        velocity.vx = Math.abs(velocity.vx) * 0.8;
      } else if (position.x > screenWidth - 50) {
        position.x = screenWidth - 50;
        velocity.vx = -Math.abs(velocity.vx) * 0.8;
      }
      
      if (position.y < 50) {
        position.y = 50;
        velocity.vy = Math.abs(velocity.vy) * 0.8;
      } else if (position.y > screenHeight - 50) {
        position.y = screenHeight - 50;
        velocity.vy = -Math.abs(velocity.vy) * 0.8;
      }
      
      // Calculate rotation based on velocity
      angleRef.current = Math.atan2(velocity.vy, velocity.vx) * 180 / Math.PI;

      // Update trails with controlled generation
      setTrails(prevTrails => {
        const newTrails = [...prevTrails];
        
        // Add new trail particle less frequently
        if (time % 32 === 0) { // Every other frame
          for (let i = 0; i < 2; i++) {
            const offset = i * 3;
            const angle = (angleRef.current - 90) * Math.PI / 180;
            newTrails.push({
              x: position.x - Math.cos(angle) * offset,
              y: position.y - Math.sin(angle) * offset,
              opacity: 0.8,
              size: Math.random() * 4 + 2
            });
          }
        }
        
        // Update existing trails
        return newTrails
          .map(trail => ({
            ...trail,
            opacity: trail.opacity - 0.02,
            size: trail.size * 0.98
          }))
          .filter(trail => trail.opacity > 0)
          .slice(-80); // Limit trail count
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPlaying]);

  if (!isPlaying) return null;

  const position = positionRef.current;
  const angle = angleRef.current;

  return (
    <>
      {/* Full screen container */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        {/* Trails with various effects */}
        {trails.map((trail, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              left: `${trail.x}px`,
              top: `${trail.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Multi-colored trail particles */}
            <div
              className={`rounded-full ${
                index % 3 === 0 
                  ? (isDarkMode ? 'bg-blue-400' : 'bg-blue-500')
                  : index % 3 === 1
                  ? (isDarkMode ? 'bg-purple-400' : 'bg-purple-500')
                  : (isDarkMode ? 'bg-cyan-400' : 'bg-cyan-500')
              }`}
              style={{
                width: `${trail.size}px`,
                height: `${trail.size}px`,
                opacity: trail.opacity,
                filter: 'blur(1px)',
                boxShadow: `0 0 ${trail.size}px currentColor`
              }}
            />
          </div>
        ))}

        {/* The airplane */}
        <div
          className="absolute"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          }}
        >
          {/* Glowing effect */}
          <div className="absolute inset-0 -m-8">
            <div className={`w-36 h-36 rounded-full animate-pulse ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-400/20'
            } blur-xl`} />
          </div>

          {/* Enhanced airplane design (restored from previous version) */}
          <div className="relative">
            {/* Main body with gradient */}
            <div className={`w-24 h-8 rounded-full shadow-2xl border-2 relative overflow-hidden ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 border-blue-400' 
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 border-blue-300'
            }`}>
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
            
            {/* Enhanced nose */}
            <div className={`absolute -left-3 top-1/2 transform -translate-y-1/2 w-5 h-4 rounded-r-full border-2 border-l-0 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 border-blue-400' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500 border-blue-300'
            }`}>
              {/* Smile */}
              <div className="absolute top-1.5 left-1.5 w-2 h-1 border-b-2 border-white rounded-full"></div>
            </div>
            
            {/* Animated wings */}
            <div className={`absolute top-0 left-4 w-16 h-3 rounded-full transform -rotate-12 shadow-lg ${
              isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
            } animate-pulse`}>
              <div className="absolute -top-1 left-3 text-sm">✨</div>
            </div>
            <div className={`absolute bottom-0 left-4 w-16 h-3 rounded-full transform rotate-12 shadow-lg ${
              isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
            } animate-pulse`}>
              <div className="absolute -bottom-1 left-3 text-sm">✨</div>
            </div>
            
            {/* Animated tail */}
            <div className={`absolute top-0 right-3 w-8 h-1.5 rounded-full transform -rotate-6 ${
              isDarkMode ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-purple-400 to-pink-400'
            } animate-pulse`}></div>
            <div className={`absolute bottom-0 right-3 w-8 h-1.5 rounded-full transform rotate-6 ${
              isDarkMode ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-purple-400 to-pink-400'
            } animate-pulse`}></div>
            
            {/* Glowing tail fin */}
            <div className={`absolute top-0 right-4 w-1.5 h-5 rounded-full ${
              isDarkMode ? 'bg-gradient-to-b from-pink-400 to-purple-600' : 'bg-gradient-to-b from-pink-300 to-purple-500'
            } shadow-lg`}></div>
            
            {/* Animated windows */}
            {[5, 9, 13].map((pos, i) => (
              <div key={i} className={`absolute top-2 w-2.5 h-2.5 rounded-full border ${
                isDarkMode 
                  ? 'bg-cyan-400 border-cyan-300' 
                  : 'bg-cyan-300 border-cyan-400'
              } animate-pulse`} style={{ left: `${pos * 1.2}px`, animationDelay: `${i * 200}ms` }}>
                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full animate-ping"></div>
              </div>
            ))}
            
            {/* Spinning engine with glow */}
            <div className={`absolute top-1/2 left-3 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 border-orange-400' 
                : 'bg-gradient-to-r from-orange-400 to-red-400 border-orange-300'
            } animate-spin`}>
              <div className="absolute inset-0 rounded-full bg-white/30 animate-ping"></div>
            </div>
            
            {/* Multi-blade propeller */}
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
              <div className="relative w-2 h-12 animate-spin-fast">
                <div className={`absolute inset-0 rounded-full ${
                  isDarkMode ? 'bg-gradient-to-b from-slate-300 to-slate-500' : 'bg-gradient-to-b from-slate-400 to-slate-600'
                }`}></div>
                <div className={`absolute inset-0 rounded-full transform rotate-45 ${
                  isDarkMode ? 'bg-gradient-to-b from-slate-300 to-slate-500' : 'bg-gradient-to-b from-slate-400 to-slate-600'
                }`}></div>
                <div className={`absolute inset-0 rounded-full transform rotate-90 ${
                  isDarkMode ? 'bg-gradient-to-b from-slate-300 to-slate-500' : 'bg-gradient-to-b from-slate-400 to-slate-600'
                }`}></div>
              </div>
            </div>
            
            {/* Pulsing antenna */}
            <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-4 rounded-full ${
              isDarkMode ? 'bg-gradient-to-t from-blue-500 to-cyan-400' : 'bg-gradient-to-t from-blue-400 to-cyan-300'
            }`}>
              <div className={`absolute -top-1 -left-0.5 w-2 h-2 rounded-full ${
                isDarkMode ? 'bg-cyan-300' : 'bg-cyan-400'
              } animate-ping`}></div>
            </div>
          </div>

          {/* Enhanced contrail effect */}
          <div className="absolute -left-20 top-1/2 transform -translate-y-1/2">
            <div className="flex space-x-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="relative">
                  {/* Multiple sparkle layers */}
                  <div 
                    className={`text-lg absolute -top-2 animate-ping ${
                      i % 2 === 0 
                        ? (isDarkMode ? 'text-yellow-300' : 'text-yellow-400')
                        : (isDarkMode ? 'text-cyan-300' : 'text-cyan-400')
                    }`}
                    style={{ 
                      animationDelay: `${i * 100}ms`,
                      opacity: 0.9 - (i * 0.1)
                    }}
                  >
                    ✨
                  </div>
                  {/* Cloud puffs */}
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isDarkMode ? 'bg-blue-300/50' : 'bg-blue-400/50'
                    } blur-sm animate-pulse`}
                    style={{ 
                      animationDelay: `${i * 150}ms`,
                      opacity: 0.7 - (i * 0.08)
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent speech bubble (no background) */}
          <div 
            className={`absolute -top-20 left-1/2 transform -translate-x-1/2 text-sm font-bold whitespace-nowrap ${
              isDarkMode ? 'text-white' : 'text-slate-800'
            }`}
            style={{
              textShadow: isDarkMode 
                ? '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(59,130,246,0.6)' 
                : '0 2px 4px rgba(255,255,255,0.9), 0 0 10px rgba(59,130,246,0.4)'
            }}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-spin-slow">✈️</span>
              <span className="text-base">Stuart is speaking...</span>
              <span className="text-2xl animate-pulse">🌟</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-spin-fast {
          animation: spin-fast 0.2s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </>
  );
};