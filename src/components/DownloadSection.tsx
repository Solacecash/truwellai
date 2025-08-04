import React from 'react';
import { Button } from '@/components/ui/button';
import { AppStoreButtons } from './AppStoreButtons';

const DownloadSection: React.FC = () => {
  return (
    <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-56 h-56 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent group cursor-pointer transition-all duration-500 hover:scale-105">
          <span className="group-hover:animate-pulse">Ready to Transform How You Shop?</span>
        </h2>
        <p className="text-xl text-gray-400 mb-8 hover:text-gray-300 transition-colors duration-300 cursor-pointer hover:scale-105 transform transition-transform">
          Join 50,000+ users making safer choices every day. Download TruWell AI™ and start scanning smarter today.
        </p>
        
        <div className="mb-8">
          <AppStoreButtons size="lg" className="justify-center" />
        </div>
        
        <div className="absolute top-20 right-20 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-60"></div>
        <div className="absolute bottom-20 left-20 w-3 h-3 bg-blue-400 rounded-full animate-ping delay-500 opacity-60"></div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="group">
            <div className="flex items-center gap-2 mb-4 group-hover:scale-105 transition-transform duration-300">
              <img 
                src="https://d64gsuwffb70l.cloudfront.net/684eac346bf8584cc343b385_1751408760980_1b937ced.png" 
                alt="TruWell AI Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">TruWell AI™</span>
            </div>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Empowering health decisions with AI-powered product safety analysis.</p>
          </div>
          
          <div className="group">
            <h3 className="text-green-400 font-bold mb-4 group-hover:text-green-300 transition-colors duration-300">Product</h3>
            <div className="space-y-2 text-gray-400">
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Features</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">How It Works</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Download</div>
            </div>
          </div>
          
          <div className="group">
            <h3 className="text-green-400 font-bold mb-4 group-hover:text-green-300 transition-colors duration-300">Company</h3>
            <div className="space-y-2 text-gray-400">
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">About Us</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Careers</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Press</div>
            </div>
          </div>
          
          <div className="group">
            <h3 className="text-green-400 font-bold mb-4 group-hover:text-green-300 transition-colors duration-300">Support</h3>
            <div className="space-y-2 text-gray-400">
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Help Center</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Contact</div>
              <div className="hover:text-green-400 cursor-pointer transition-colors duration-300 hover:translate-x-2 transform">Privacy</div>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-8 border-t border-white/10 text-gray-400 hover:text-gray-300 transition-colors duration-300">
          <p>&copy; 2025 TruWell AI™. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export { DownloadSection, Footer };