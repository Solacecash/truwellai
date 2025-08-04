import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: '🤖',
    title: 'TruWell AI Wellness Companion',
    description: 'Your smart wellness support tool. Helps you track symptoms, explore evidence-based lifestyle tips (including nutrition suggestions), and learn from health-related patterns. For deeper concerns, we guide you to verified professionals based on your profile, and enquiries.'
  },
  {
    icon: '🎯',
    title: 'Hyper-Personalized Protection',
    description: 'Tailored risk scores based on your unique health profile, allergies, pregnancy status, and chronic conditions. Get alerts for ingredients others miss, like parabens for hormone-sensitive conditions.'
  },
  {
    icon: '🌍',
    title: 'Global Regulatory Intelligence',
    description: 'Real-time updates from FDA, EPA, EU, and WHO databases ensure you\'re always protected against emerging health threats. No more outdated static lists.'
  },
  {
    icon: '🚦',
    title: 'Color-Coded Safety Scores',
    description: 'Instantly understand product safety with our traffic light system: Safe ✅, Moderate ⚠️, or Avoid 🔴. Detailed breakdowns of carcinogens, allergens, and long-term risks included.'
  },
  {
    icon: '👥',
    title: 'Community-Driven Insights',
    description: 'Access verified reviews from over 1 million user scans. Get crowdsourced alerts like "87 reports of joint pain linked to NutriMax Energy Bar" tagged to specific health profiles.'
  },
  {
    icon: '💡',
    title: 'Smart Alternatives',
    description: 'Find safer, cheaper, or greener substitutes with price comparisons, ratings, and direct purchase links. Filter by budget, sustainability, and health priorities.'
  },
  {
    icon: '👨‍⚕️',
    title: 'Expert Access',
    description: 'One-click consultations with dermatologists, toxicologists, and nutritionists. Get professional medical advice tailored to your specific health concerns and product questions.'
  }
];

const FeaturesSection: React.FC = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (titleRef.current) observer.observe(titleRef.current);
    if (subtitleRef.current) observer.observe(subtitleRef.current);
    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 
            ref={titleRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 opacity-0 translate-y-8 transition-all duration-1000 ease-out relative group cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse"></span>
            <span className="relative bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-bounce hover:animate-pulse">
              <span className="inline-block hover:scale-110 transition-transform duration-300">Revolutionary</span>{' '}
              <span className="inline-block hover:scale-110 transition-transform duration-300 delay-100">AI-Powered</span>{' '}
              <span className="inline-block hover:scale-110 transition-transform duration-300 delay-200">Features</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse"></div>
          </h2>
          <p 
            ref={subtitleRef}
            className="text-xl text-gray-400 max-w-3xl mx-auto opacity-0 translate-y-8 transition-all duration-1000 ease-out delay-300 hover:text-gray-300 cursor-pointer"
          >
            TruWell AI™ uses advanced technology and user-provided health profiles to deliver personalized insights into product ingredients, leveraging trusted data sources and AI to support informed wellness choices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-700 transform hover:-translate-y-12 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/60 group cursor-pointer opacity-0 translate-y-8 hover:border-green-500/70 relative overflow-hidden hover:rotate-2"
              style={{
                transitionDelay: `${600 + index * 100}ms`
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardContent className="p-6 relative z-10">
                <div className="text-4xl mb-4 group-hover:scale-150 group-hover:animate-bounce transition-all duration-700 group-hover:drop-shadow-2xl filter group-hover:brightness-150">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-green-400 transition-all duration-500 group-hover:animate-pulse">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-500">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        .animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </section>
  );
};

export { FeaturesSection };