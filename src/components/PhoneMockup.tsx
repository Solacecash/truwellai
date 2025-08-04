import React, { useState, useEffect } from 'react';

const PhoneMockup: React.FC = () => {
  const [scanActive, setScanActive] = useState(false);
  const [safetyScore, setSafetyScore] = useState(92);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanActive(prev => !prev);
      setSafetyScore(prev => prev === 92 ? 87 : 92);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleScanClick = () => {
    setScanActive(true);
    setTimeout(() => setScanActive(false), 2000);
  };

  return (
    <div className="relative mx-auto mt-16 transform hover:scale-105 transition-all duration-500 group">
      {/* Glow effect on hover */}
      <div className="absolute -inset-4 bg-gradient-to-r from-green-400/0 via-green-500/30 to-green-400/0 rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
      <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 via-green-500/40 to-green-400/20 rounded-[55px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
      
      <div className="relative w-80 h-[640px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[45px] p-2 shadow-2xl shadow-green-500/20 group-hover:shadow-green-400/40 transition-all duration-500">
        <div className="w-full h-full bg-black rounded-[37px] overflow-hidden relative group-hover:bg-gray-900 transition-colors duration-300">
          {/* Status Bar */}
          <div className="flex justify-between items-center px-6 py-4 text-white text-sm">
            <div>9:41</div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 border border-white rounded-sm">
                <div className="w-3/4 h-full bg-green-500 rounded-sm group-hover:bg-green-400 transition-colors duration-300"></div>
              </div>
              <span>📶</span>
            </div>
          </div>

          {/* App Interface */}
          <div className="px-5 pb-5 h-full">
            {/* App Header */}
            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group-hover:bg-white/10 group-hover:border-green-500/30 transition-all duration-300">
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/684eac346bf8584cc343b385_1751408760980_1b937ced.png" 
                alt="TruWell AI Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <div className="text-green-400 font-bold group-hover:text-green-300 transition-colors duration-300">TruWell AI</div>
                <div className="text-gray-400 text-xs">Smart Health Scanner</div>
              </div>
              <button className="ml-auto p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300">
                ⚙️
              </button>
            </div>

            {/* Scan Area */}
            <div 
              className={`relative flex-1 bg-gradient-to-br from-green-500/10 to-green-700/5 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center mb-6 cursor-pointer transition-all duration-300 group-hover:from-green-400/20 group-hover:to-green-600/10 group-hover:border-green-400 ${
                scanActive ? 'border-green-400 bg-green-500/20' : 'border-green-500'
              }`}
              onClick={handleScanClick}
            >
              {scanActive && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" />
              )}
              
              <div className={`text-6xl mb-4 transition-transform duration-300 group-hover:scale-110 ${
                scanActive ? 'scale-110 animate-pulse' : ''
              }`}>
                📷
              </div>
              
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg mb-2 group-hover:text-green-300 transition-colors duration-300">
                  {scanActive ? 'Analyzing...' : 'Point camera at product'}
                </div>
                <div className="text-gray-400 text-sm">
                  {scanActive ? 'AI processing ingredients' : 'AI analysis in seconds'}
                </div>
                <div className="mt-3 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-xs group-hover:bg-green-500/20 group-hover:border-green-400/50 transition-all duration-300">
                  ✨ Smart OCR Active
                </div>
              </div>
            </div>

            {/* Safety Score */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500/20 to-green-700/10 rounded-2xl border border-green-500/30 group-hover:from-green-400/30 group-hover:to-green-600/20 group-hover:border-green-400/50 transition-all duration-300">
              <div className="text-3xl animate-spin-slow group-hover:animate-pulse">
                ✅
              </div>
              <div className="flex-1">
                <div className="text-green-400 font-bold text-lg group-hover:text-green-300 transition-colors duration-300">SAFE</div>
                <div className="text-gray-300 text-sm">Personalized for your profile</div>
                <div className="text-gray-400 text-xs mt-1">⭐ 4.8/5 Community Rating</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-2xl font-bold group-hover:text-green-300 transition-colors duration-300">{safetyScore}%</div>
                <div className="text-gray-400 text-xs">Safety Score</div>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="mt-4 p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors duration-300">
              <div className="text-white font-bold text-sm mb-3">Key Ingredients</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs">Vitamin E</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs group-hover:bg-green-500/30 transition-colors duration-300">Safe</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs">Aloe Vera</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs group-hover:bg-blue-500/30 transition-colors duration-300">Beneficial</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-xs">Fragrance</span>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs group-hover:bg-orange-500/30 transition-colors duration-300">Monitor</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export { PhoneMockup };