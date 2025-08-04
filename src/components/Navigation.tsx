import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const Navigation: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-gray-900/95 backdrop-blur-xl shadow-lg shadow-green-500/10' 
        : 'bg-gray-900/90 backdrop-blur-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <img 
              src="https://d64gsuwffb70l.cloudfront.net/684eac346bf8584cc343b385_1751408760980_1b937ced.png" 
              alt="TruWell AI Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              TruWell AI™
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-300 hover:text-green-400 transition-colors duration-200 px-3 py-2 rounded-full hover:bg-green-500/10"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('features')}
              className="text-gray-300 hover:text-green-400 transition-colors duration-200 px-3 py-2 rounded-full hover:bg-green-500/10"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-300 hover:text-green-400 transition-colors duration-200 px-3 py-2 rounded-full hover:bg-green-500/10"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('download')}
              className="text-gray-300 hover:text-green-400 transition-colors duration-200 px-3 py-2 rounded-full hover:bg-green-500/10"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export { Navigation };