import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneMockup } from './PhoneMockup';

const EnhancedHeroSection: React.FC = () => {
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
            TruWell AI™ helps you make smarter wellness choices by analyzing product ingredients through trusted AI and health data insights.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button 
            onClick={() => scrollToSection('download')}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <span className="mr-2">📱</span>
            Download Now
          </Button>
          <Button 
            onClick={() => scrollToSection('features')}
            variant="outline"
            className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 text-lg font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="mr-2">🔍</span>
            Explore Features
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-400">Download on the</div>
              <div className="font-bold">App Store</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm text-gray-400">Get it on</div>
              <div className="font-bold">Google Play</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Phone Mockup integrated into hero */}
      <div className="flex justify-center items-center relative z-10 -mt-8">
        <PhoneMockup />
      </div>
    </section>
  );
};

export { EnhancedHeroSection };