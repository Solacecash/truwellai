import React, { useEffect, useState } from 'react';

interface CursorAnimationProps {
  children: React.ReactNode;
}

const CursorAnimation: React.FC<CursorAnimationProps> = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Add to trail
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }];
        return newTrail.slice(-8); // Keep only last 8 positions
      });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  // Clean up old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => prev.slice(1));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && (
        <>
          {/* Trail effect */}
          {trail.map((point, index) => (
            <div
              key={point.id}
              className="fixed pointer-events-none z-40 rounded-full bg-gradient-to-r from-green-400 to-blue-500 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out"
              style={{
                left: point.x,
                top: point.y,
                width: `${4 + index * 2}px`,
                height: `${4 + index * 2}px`,
                opacity: (index + 1) / trail.length * 0.3,
                animationDelay: `${index * 50}ms`
              }}
            />
          ))}
          
          {/* Main cursor */}
          <div
            className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ease-out"
            style={{
              left: mousePosition.x,
              top: mousePosition.y
            }}
          >
            {/* Outer ring */}
            <div className="w-8 h-8 border-2 border-green-400 rounded-full animate-ping opacity-60"></div>
            
            {/* Inner dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            
            {/* Sparkle effects */}
            <div className="absolute top-0 left-0 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="absolute top-1 right-0 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            <div className="absolute bottom-0 left-1 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
          </div>
        </>
      )}
    </div>
  );
};

export { CursorAnimation };