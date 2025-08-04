import React from 'react';

const PerfectForSection: React.FC = () => {
  const targetAudiences = [
    {
      emoji: '👨‍👩‍👧‍👦',
      text: 'Parents with children who have allergies'
    },
    {
      emoji: '🤱',
      text: 'Pregnant and nursing mothers'
    },
    {
      emoji: '🏃‍♀️',
      text: 'Health-conscious millennials'
    },
    {
      emoji: '🌱',
      text: 'Eco-conscious shoppers'
    },
    {
      emoji: '⚕️',
      text: 'People with chronic conditions'
    },
    {
      emoji: '💚',
      text: 'Wellness enthusiasts'
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative overflow-hidden">
      <div className="text-center relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-white transition-all duration-500 hover:scale-105">
          <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            🎯 Perfect for:
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targetAudiences.map((audience, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 group cursor-pointer relative overflow-hidden animate-fadeInUp"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'both'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="text-4xl mb-3 group-hover:scale-110 transition-all duration-300 relative z-10">
                {audience.emoji}
              </div>
              <p className="text-gray-300 text-lg group-hover:text-white transition-colors duration-300 relative z-10">
                {audience.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { PerfectForSection };