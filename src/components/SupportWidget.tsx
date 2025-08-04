import React, { useEffect } from 'react';

const SupportWidget: React.FC = () => {
  useEffect(() => {
    // Load the ElevenLabs ConvAI widget script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-8">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg border border-blue-100 max-w-md w-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Need Help? Chat with Our AI Assistant
          </h3>
          <p className="text-gray-600">
            Get instant support and answers to your questions
          </p>
        </div>
        
        {/* ElevenLabs ConvAI Widget */}
        <div className="flex justify-center">
          <elevenlabs-convai agent-id="agent_01jzjh9tvter2svabwafk1x4my"></elevenlabs-convai>
        </div>
      </div>
    </div>
  );
};

export default SupportWidget;