import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const AppShowcase: React.FC = () => {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  
  const scanSteps = [
    { ingredient: 'Water', status: 'Safe', color: 'green' },
    { ingredient: 'Glycerin', status: 'Beneficial', color: 'blue' },
    { ingredient: 'Ceramide NP', status: 'Safe', color: 'green' },
    { ingredient: 'Fragrance', status: 'Monitor', color: 'orange' },
    { ingredient: 'Hyaluronic Acid', status: 'Beneficial', color: 'blue' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setScanProgress(0);
      setCurrentStep(0);
      
      // Simulate scanning progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setIsScanning(false);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      // Simulate ingredient detection
      scanSteps.forEach((_, index) => {
        setTimeout(() => {
          setCurrentStep(index + 1);
        }, 1500 + (index * 600));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-500/5 to-transparent">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-black mb-6 text-white">
            Live Product Scanning
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Experience real-time ingredient analysis with our advanced OCR technology. Simply point your camera at any product label and watch as TruWell AI instantly identifies ingredients.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Real-time OCR text recognition with 99.2% accuracy</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Instant ingredient identification and parsing</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span>
              <span className="text-gray-300">Live safety analysis in 0.3 seconds</span>
            </div>
          </div>
          
          <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-3 rounded-full">
            <span className="mr-2">📱</span>
            Experience Live Scanning
          </Button>
        </div>
        
        <div className="relative group">
          {/* Enhanced multi-layer glow effect */}
          <div className="absolute -inset-8 bg-gradient-to-r from-green-400/0 via-green-500/30 to-green-400/0 rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl animate-pulse"></div>
          <div className="absolute -inset-6 bg-gradient-to-r from-green-400/20 via-green-500/40 to-green-400/20 rounded-[55px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
          <div className="absolute -inset-4 bg-gradient-to-r from-green-400/30 via-green-500/50 to-green-400/30 rounded-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
          
          <div className="relative w-80 h-[640px] mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-[45px] p-2 shadow-2xl transform hover:scale-105 transition-all duration-500 group-hover:shadow-green-400/40">
            <div className="w-full h-full bg-black rounded-[37px] overflow-hidden relative group-hover:bg-gray-900 transition-colors duration-300">
              {/* Camera Controls */}
              <div className="absolute top-16 left-0 right-0 flex justify-between px-8 z-10">
                <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-black/80 group-hover:border-green-400/40 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  ⚙️
                </div>
                <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-black/80 group-hover:border-green-400/40 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  💡
                </div>
                <div className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-black/80 group-hover:border-green-400/40 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  🔄
                </div>
              </div>

              {/* Scan Frame */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-48 border-3 rounded-2xl transition-all duration-300 group-hover:border-green-400 group-hover:shadow-xl group-hover:shadow-green-400/50 ${
                isScanning ? 'border-green-400 shadow-lg shadow-green-400/50' : 'border-green-500'
              }`}>
                {/* Corner indicators */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-3 border-t-3 border-green-400 group-hover:border-green-300 transition-colors duration-300"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-3 border-t-3 border-green-400 group-hover:border-green-300 transition-colors duration-300"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-3 border-b-3 border-green-400 group-hover:border-green-300 transition-colors duration-300"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-3 border-b-3 border-green-400 group-hover:border-green-300 transition-colors duration-300"></div>
                
                {/* Product Label */}
                <div className="absolute inset-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-3 shadow-lg transform hover:scale-105 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-green-500/20">
                  <div className="text-green-700 font-bold text-sm mb-2 text-center">CeraVe Daily Moisturizer</div>
                  <div className="text-gray-800 text-xs leading-tight">
                    <div className="font-semibold mb-1">INGREDIENTS:</div>
                    <div className="space-y-1">
                      <div>Water, Glycerin, Caprylic/Capric</div>
                      <div>Triglyceride, Cetearyl Alcohol,</div>
                      <div>Ceramide NP, Ceramide AP,</div>
                      <div>Fragrance, Sodium Hyaluronate</div>
                    </div>
                  </div>
                </div>
                
                {/* Scanning beam */}
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"
                       style={{ 
                         animation: 'scanBeam 3s ease-in-out infinite',
                         top: `${(scanProgress / 100) * 100}%`
                       }}></div>
                )}
              </div>

              {/* Scan Progress */}
              <div className="absolute bottom-20 left-4 right-4 bg-black/85 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 group-hover:bg-black/90 group-hover:border-green-400/50 group-hover:shadow-xl group-hover:shadow-green-500/30 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:bg-green-300 transition-colors duration-300"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:bg-green-300 transition-colors duration-300" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:bg-green-300 transition-colors duration-300" style={{animationDelay: '0.4s'}}></div>
                  </div>
                  <div className="text-green-400 font-bold text-sm group-hover:text-green-300 group-hover:drop-shadow-sm transition-all duration-300">AI Analyzing Ingredients...</div>
                </div>
                
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3 group-hover:bg-white/20 transition-colors duration-300">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 group-hover:from-green-400 group-hover:to-green-300 group-hover:shadow-sm group-hover:shadow-green-400"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                
                <div className="space-y-2">
                  {scanSteps.slice(0, currentStep).map((step, index) => (
                    <div key={index} className="flex justify-between items-center animate-fadeIn">
                      <span className="text-gray-300 text-xs flex items-center gap-2">
                        <span>💧</span> {step.ingredient}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold transition-all duration-300 ${
                        step.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30 group-hover:bg-green-500/30 group-hover:shadow-sm group-hover:shadow-green-500/40' :
                        step.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 group-hover:bg-blue-500/30 group-hover:shadow-sm group-hover:shadow-blue-500/40' :
                        'bg-orange-500/20 text-orange-400 border border-orange-500/30 group-hover:bg-orange-500/30 group-hover:shadow-sm group-hover:shadow-orange-500/40'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scanBeam {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </section>
  );
};

export { AppShowcase };