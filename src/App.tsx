import React, { useState } from 'react';
import { Clock } from './components/Clock';
import { Weather } from './components/Weather';
import { Calendar } from './components/Calendar';
import { News } from './components/News';
import { Greeting } from './components/Greeting';
import { VoiceControl } from './components/VoiceControl';
import { VideoCall } from './components/VideoCall';
import { ComputerVision } from './components/ComputerVision';

export default function App() {
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [greeting, setGreeting] = useState('Hey there sexy!');

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes('video call') || lowerCommand.includes('start call')) {
      setShowVideoCall(true);
    } else if (lowerCommand.includes('end call') || lowerCommand.includes('close call')) {
      setShowVideoCall(false);
    } else if (lowerCommand.includes('camera') || lowerCommand.includes('vision')) {
      setShowVision(!showVision);
    } else if (lowerCommand.includes('hello') || lowerCommand.includes('hi mirror')) {
      setGreeting('Hello! How can I help you?');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden">
      {/* Main Mirror Interface */}
      <div className="absolute inset-0 flex flex-col p-8">
        {/* Top Section */}
        <div className="flex justify-between items-start mb-8">
          {/* Left: Clock and Calendar */}
          <div className="flex flex-col gap-6">
            <Clock />
            <Calendar />
          </div>

          {/* Right: Weather */}
          <div>
            <Weather />
          </div>
        </div>

        {/* Center: Greeting */}
        <div className="flex-1 flex items-center justify-center">
          <Greeting message={greeting} />
        </div>

        {/* Bottom: News */}
        <div className="mt-auto">
          <News />
        </div>
      </div>

      {/* Voice Control */}
      <VoiceControl onCommand={handleVoiceCommand} />

      {/* Video Call Overlay */}
      {showVideoCall && (
        <VideoCall onClose={() => setShowVideoCall(false)} />
      )}

      {/* Computer Vision Panel */}
      {showVision && (
        <ComputerVision onClose={() => setShowVision(false)} />
      )}
    </div>
  );
}
