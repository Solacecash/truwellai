import React, { useState, useEffect } from 'react';

interface StatCardProps {
  value: string;
  description: string;
  color: string;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, description, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState('0');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      animateValue();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animateValue = () => {
    if (value === '94%') {
      let current = 0;
      const target = 94;
      const increment = target / 30;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedValue('94%');
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current) + '%');
        }
      }, 50);
    } else if (value === '11M') {
      let current = 0;
      const target = 11;
      const increment = target / 20;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedValue('11M');
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current) + 'M');
        }
      }, 80);
    } else if (value === '59%') {
      let current = 0;
      const target = 59;
      const increment = target / 25;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedValue('59%');
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.floor(current) + '%');
        }
      }, 60);
    } else {
      setAnimatedValue(value);
    }
  };

  return (
    <div 
      className={`relative group transform transition-all duration-700 hover:scale-105 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } animate-float`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '3s'
      }}
    >
      {/* Illumination effect on hover */}
      <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
        isHovered 
          ? 'bg-gradient-to-br from-white/10 via-transparent to-white/5 shadow-2xl shadow-white/20' 
          : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50'
      } backdrop-blur-sm border border-white/10`}></div>
      
      {/* Floating particles on hover */}
      {isHovered && (
        <>
          <div className="absolute -top-2 -left-2 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-1 h-1 bg-white/40 rounded-full animate-ping delay-300"></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping delay-500"></div>
        </>
      )}
      
      <div className="relative z-10 p-6 text-center">
        <div className={`text-4xl font-black mb-3 transition-all duration-500 ${
          isHovered ? 'scale-110 drop-shadow-lg' : 'scale-100'
        } ${color}`}>
          {animatedValue}
        </div>
        <div className={`text-gray-400 text-sm leading-tight transition-all duration-300 ${
          isHovered ? 'text-gray-200' : 'text-gray-400'
        }`}>
          {description}
        </div>
      </div>
    </div>
  );
};

export { StatCard };