import React from 'react';
import { StatCard } from './FloatingStatsGrid';

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Background floating elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-r from-purple-500 to-green-400 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard
            value="94%"
            description="Products labeled 'natural' contain hidden allergens"
            color="text-red-400"
            delay={200}
          />
          <StatCard
            value="11M"
            description="Lives lost annually to diet-related diseases"
            color="text-orange-400"
            delay={400}
          />
          <StatCard
            value="59%"
            description="Truwell AI’s internal models are benchmarked against labeled clinical and regulatory datasets, achieving performance consistent with expert-level pattern recognition."
            color="text-green-400"
            delay={600}
          />
          <StatCard
            value="+60"
            description="NPS Score - Higher than 95% of healthcare apps"
            color="text-blue-400"
            delay={800}
          />
        </div>
      </div>
    </section>
  );
};

export { StatsSection };