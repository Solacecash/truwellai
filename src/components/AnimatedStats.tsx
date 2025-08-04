import React, { useState, useEffect } from 'react';

interface StatItemProps {
  value: string;
  description: string;
  color: string;
  delay: number;
}

const StatItem: React.FC<StatItemProps> = ({ value, description, color, delay }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState('0');

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
    <div className={`group transform transition-all duration-700 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <div className={`text-4xl font-black mb-2 group-hover:scale-110 transition-all duration-300 ${color} animate-pulse`}>
        {animatedValue}
      </div>
      <div className="text-gray-400 text-sm leading-tight">
        {description}
      </div>
    </div>
  );
};

export { StatItem };