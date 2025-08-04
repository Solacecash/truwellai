import React, { useEffect } from 'react';

const AnimatedBackground: React.FC = () => {
  useEffect(() => {
    // Create floating particles
    const createParticles = () => {
      const particleCount = 15;
      const body = document.body;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        body.appendChild(particle);
      }
    };

    createParticles();

    return () => {
      // Cleanup particles
      document.querySelectorAll('.particle').forEach(p => p.remove());
    };
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 animate-gradient-shift">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-grid-pattern animate-float" />
        <div className="absolute top-0 left-0 w-[200%] h-[200%] bg-orbital-gradient animate-orbital-motion" />
      </div>
      
      {/* Floating background elements */}
      <div className="fixed top-[10%] left-[10%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-green-500/10 to-blue-600/10 animate-bg-float" />
      <div className="fixed top-[60%] right-[15%] w-[150px] h-[150px] rounded-full bg-gradient-to-br from-green-500/10 to-blue-600/10 animate-bg-float-delayed" />
      <div className="fixed bottom-[20%] left-[70%] w-[100px] h-[100px] rounded-full bg-gradient-to-br from-green-500/10 to-blue-600/10 animate-bg-float-delayed-2" />
      
      <style jsx>{`
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #4CAF50, #2E7D32);
          border-radius: 50%;
          animation: floatParticle 6s linear infinite;
        }
        
        @keyframes floatParticle {
          0% { transform: translateY(100vh) translateX(0px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) translateX(100px) rotate(360deg); opacity: 0; }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        
        @keyframes orbital-motion {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes bg-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
        }
        
        .animate-gradient-shift { animation: gradient-shift 8s ease infinite; }
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-orbital-motion { animation: orbital-motion 30s linear infinite; }
        .animate-bg-float { animation: bg-float 15s ease-in-out infinite; }
        .animate-bg-float-delayed { animation: bg-float 15s ease-in-out infinite; animation-delay: -5s; }
        .animate-bg-float-delayed-2 { animation: bg-float 15s ease-in-out infinite; animation-delay: -10s; }
        
        .bg-grid-pattern {
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23ffffff" stroke-width="0.1" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        }
        
        .bg-orbital-gradient {
          background: radial-gradient(circle at 25% 25%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 75% 75%, rgba(27, 54, 93, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 50% 50%, rgba(76, 175, 80, 0.05) 0%, transparent 70%);
        }
      `}</style>
    </>
  );
};

export { AnimatedBackground };