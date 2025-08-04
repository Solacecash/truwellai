import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: 1,
    icon: '📱',
    title: 'Scan & Capture',
    description: 'Point your camera at any product label or scan the barcode. Our advanced OCR technology instantly captures and processes ingredient information with clinical precision.',
    action: 'Try Scanning'
  },
  {
    number: 2,
    icon: '🧠',
    title: 'AI Analysis',
    description: 'Our proprietary AI, trained on medical journals and regulatory databases, analyzes ingredients against your personal health profile in seconds. Get personalized risk assessments others miss.',
    action: 'See AI in Action'
  },
  {
    number: 3,
    icon: '✅',
    title: 'Choose Better',
    description: 'Receive color-coded safety scores, detailed risk breakdowns, and smart alternatives. Make informed decisions with confidence, backed by community insights and expert recommendations.',
    action: 'Explore Results'
  }
];

const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const handleStepClick = (stepNumber: number) => {
    setActiveStep(activeStep === stepNumber ? null : stepNumber);
  };

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-green-500/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4 relative group cursor-pointer transition-all duration-500 hover:scale-105">
            <span className="bg-gradient-to-r from-blue-600 via-green-500 to-green-600 bg-clip-text text-transparent animate-gradient-x group-hover:animate-pulse">
              ⚡ How TruWell AI™ Works 🚀
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-green-500/20 to-green-600/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto hover:text-gray-300 transition-colors duration-300">
            Three simple steps to transform your shopping experience and protect your health
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting lines */}
          <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-1 bg-gradient-to-r from-green-500 to-blue-500 transform -translate-y-1/2 animate-pulse" />
          <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-1 bg-gradient-to-r from-green-500 to-blue-500 transform -translate-y-1/2 animate-pulse" />
          
          {steps.map((step, index) => (
            <Card 
              key={step.number}
              className={`relative bg-white/5 backdrop-blur-md border-2 transition-all duration-500 cursor-pointer transform hover:-translate-y-4 hover:scale-105 group ${
                activeStep === step.number 
                  ? 'border-green-500 bg-green-500/20 shadow-2xl shadow-green-500/30' 
                  : 'border-white/10 hover:border-green-500/50'
              }`}
              onClick={() => handleStepClick(step.number)}
            >
              <CardContent className="p-8 text-center relative overflow-hidden">
                {/* Background glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 transition-opacity duration-500 ${
                  activeStep === step.number ? 'opacity-100' : 'group-hover:opacity-50'
                }`} />
                
                {/* Step number */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-2xl font-black text-white shadow-lg transition-all duration-300 ${
                  activeStep === step.number ? 'scale-110 animate-pulse' : 'hover:scale-105 group-hover:animate-bounce'
                }`}>
                  {step.number}
                </div>
                
                {/* Step icon */}
                <div className={`text-5xl mb-4 transition-all duration-300 ${
                  activeStep === step.number ? 'scale-110 animate-bounce' : 'hover:scale-110 group-hover:animate-pulse'
                }`}>
                  {step.icon}
                </div>
                
                {/* Step content */}
                <h3 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                  activeStep === step.number ? 'text-green-400' : 'text-white hover:text-green-400 group-hover:text-green-300'
                }`}>
                  {step.title}
                </h3>
                
                <p className="text-gray-400 mb-6 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {step.description}
                </p>
                
                {/* Action button */}
                <Button 
                  className={`transition-all duration-300 ${
                    activeStep === step.number 
                      ? 'bg-green-500 hover:bg-green-600 text-white scale-105' 
                      : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500 hover:text-white group-hover:scale-105'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Action: ${step.action}`);
                  }}
                >
                  {step.action}
                </Button>
                
                {/* Connecting arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-2xl text-green-500 animate-pulse group-hover:animate-bounce">
                    →
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { HowItWorksSection };