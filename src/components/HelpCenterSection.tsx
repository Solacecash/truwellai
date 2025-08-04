import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Book, Phone, Mail, X } from 'lucide-react';
import SupportWidget from './SupportWidget';

const faqContent = `📘 TruWell AI – Comprehensive FAQ

Welcome to the TruWell AI Help Center. Below you'll find answers to frequently asked questions about how TruWell AI works, how to get started, and how to maximize your wellness journey with us.

🔍 General Questions

1. What is TruWell AI?
TruWell AI is a health and wellness assistant powered by artificial intelligence. It scans product ingredients, assesses health risks, and provides personalized guidance based on your health profile.

2. How does TruWell AI work?
You scan a product's barcode or ingredients. TruWell AI analyzes them using real-time health data, medical research, and regulatory databases to deliver a personalized safety score and recommendations.

3. Is TruWell AI a replacement for a doctor?
No. TruWell AI provides insights and guidance but does not diagnose conditions or replace professional medical advice. Always consult your doctor for clinical decisions.

📲 Getting Started

4. How do I download the TruWell AI app?
The app will be available on the Apple App Store and Google Play Store. Join the waitlist to be the first to access it for free at launch.

5. How do I set up my health profile?
After creating an account, you'll be prompted to enter key health details like allergies, medications, pregnancy status, and chronic conditions. This ensures personalized protection.

6. Do I need a wearable or lab data to use TruWell?
No. While wearable and lab data can enhance personalization, the core features work without them.

⚙️ Features & Tools

7. What do the safety scores mean?
Each scanned product receives a traffic-light score:

✅ Safe – No known health risks for your profile

⚠️ Moderate – Contains ingredients with potential concerns

🔴 Avoid – Linked to high health risk or flagged for your condition

8. How does TruWell personalize results?
Your risk scores are tailored using your profile info (e.g., pregnancy, chronic illness) and matched against known ingredient side effects.

9. Can I find safer alternatives inside the app?
Yes. After scanning, tap "Find Alternatives" to explore cleaner, safer, or more affordable options with real-time purchase links.

10. What is the Expert Access feature?
This gives you one-tap consultations with dermatologists, toxicologists, and nutritionists for deeper insights based on your scan or health concern.

🛡️ Safety & Privacy

11. Is my health data safe?
Absolutely. TruWell AI is HIPAA and SOC-2 compliant. Your data is encrypted and auto-deleted after 72 hours.

12. Will TruWell share my data with third parties?
No. TruWell never sells or shares identifiable data without your explicit consent.

💳 Billing & Subscription

13. How much does TruWell AI cost?
TruWell will offer both free and premium plans. Premium plans unlock Expert Access, advanced analytics, and unlimited scans. Pricing will be revealed at launch.

14. How do I manage my subscription?
Use the "Billing" section in your app settings to upgrade, cancel, or view your plan details.

15. I joined the waitlist — what happens next?
You'll be notified via email when early access is available. You'll get to use the app for free before it opens to the public.

🆘 Troubleshooting & Support

16. My scan isn't working. What can I do?

Make sure your camera is enabled.

Try entering the product name or ingredients manually.

If issues persist, contact support or create a ticket.

17. The app flagged a product incorrectly. What now?
Please use the "Report Inaccuracy" button. Sophie (your AI assistant) will log the issue, and our clinical team will review it.

18. I'm experiencing a medical emergency — can TruWell help?
No. In emergencies, call 911 or your healthcare provider immediately. TruWell is not for urgent care.

Still have questions? Chat with Sophie, our virtual help agent, anytime in the app.

I am not a doctor. TruWell AI complements professional care.`;

const HelpCenterSection: React.FC = () => {
  const [showFAQ, setShowFAQ] = useState(false);

  const handleStartChat = () => {
    window.open('https://elevenlabs.io/app/talk-to?agent_id=agent_01jzjh9tvter2svabwafk1x4my', '_blank');
  };

  const handleCallNow = () => {
    window.open('https://elevenlabs.io/app/talk-to?agent_id=agent_01jzjh9tvter2svabwafk1x4my', '_blank');
  };

  const handleSendEmail = () => {
    window.open('mailto:hello@truwellai.xyz', '_blank');
  };

  const handleBrowseGuides = () => {
    setShowFAQ(true);
  };

  return (
    <section className="py-20 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Help Center & Support
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get the help you need, when you need it. Our comprehensive support system is here for you 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <CardTitle className="text-white">Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center mb-4">Chat with our AI assistant for instant help</p>
              <Button onClick={handleStartChat} className="w-full bg-blue-600 hover:bg-blue-700">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader className="text-center">
              <Book className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <CardTitle className="text-white">Knowledge Base</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center mb-4">Browse our comprehensive guides and FAQs</p>
              <Button onClick={handleBrowseGuides} className="w-full bg-green-600 hover:bg-green-700">Browse Guides</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader className="text-center">
              <Phone className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <CardTitle className="text-white">Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center mb-4">Speak directly with our support team</p>
              <Button onClick={handleCallNow} className="w-full bg-purple-600 hover:bg-purple-700">Call Now</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
            <CardHeader className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-pink-400" />
              <CardTitle className="text-white">Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center mb-4">Send us a detailed message</p>
              <Button onClick={handleSendEmail} className="w-full bg-pink-600 hover:bg-pink-700">Send Email</Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Modal */}
        {showFAQ && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white">TruWell AI FAQ</h3>
                <Button
                  onClick={() => setShowFAQ(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <pre className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {faqContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* AI Support Widget */}
        <SupportWidget />
      </div>
    </section>
  );
};

export default HelpCenterSection;