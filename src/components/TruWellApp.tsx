import React from 'react';
import { Navigation } from './Navigation';
import { EnhancedHeroSection } from './EnhancedHeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { AppShowcase } from './AppShowcase';
import { DownloadSection, Footer } from './DownloadSection';
import { PerfectForSection } from './PerfectForSection';
import { CursorAnimation } from './CursorAnimation';
import { DynamicBackground } from './DynamicBackground';
import HelpCenterSection from './HelpCenterSection';

const TruWellApp: React.FC = () => {
  return (
    <CursorAnimation>
      <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden relative">
        <DynamicBackground />
        <Navigation />
        <EnhancedHeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PerfectForSection />
        <AppShowcase />
        <HelpCenterSection />
        <DownloadSection />
        <Footer />
      </div>
    </CursorAnimation>
  );
};

export default TruWellApp;