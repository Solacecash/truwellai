import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppStoreButtons } from './AppStoreButtons';

const HeroSection: React.FC = () => {
  const [titleIndex, setTitleIndex] = useState(0);
  const titleText = "Empower Your Health Decisions with TruWell AI™";
  const words = titleText.split(' ');

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex(prev => (prev + 1) % words.length);
    }, 300);

    return () => clearInterval(interval);
  }, [words.length]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex flex-col items-center justify-center pt-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 leading-tight">
            {words.map((word, index) => (
              <span
                key={index}
                className={`inline-block mr-3 transition-all duration-500 ${
                  index <= titleIndex
                    ? 'opacity-100 transform translate-y-0 bg-gradient-to-r from-green-400 via-blue-500 to-green-600 bg-clip-text text-transparent'
                    : 'opacity-50 transform translate-y-2 text-gray-400'
                } ${
                  word === 'TruWell' || word === 'AI™'
                    ? 'text-shadow-lg animate-pulse'
                    : ''
                }`}
              >
                {word}
              </span>
            ))}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 mb-6 max-w-4xl mx-auto">
            The Future of Product Safety Starts Here
          </p>
          <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Scan Well, Know Well, Choose Well. In a world where 94% of products labeled "natural" contain hidden allergens, 
            TruWell AI™ is your personalized health guardian powered by cutting-edge AI and clinical-grade accuracy.
          </p>
        </div>

        {/* Replaced the old buttons with App Store buttons */}
        <div className="mb-12">
          <AppStoreButtons size="lg" className="justify-center gap-6" />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => scrollToSection('features')}
            variant="outline"
            className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="mr-2">🔍</span>
            Explore Features
          </Button>
          <Button 
            onClick={() => scrollToSection('download')}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="mr-2">📱</span>
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export { HeroSection };