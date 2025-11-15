import React, { useState } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';
import JitsiMeetAPI from './JitsiMeetAPI';

interface VideoCallProps {
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}


export function VideoCall({ onClose }: VideoCallProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const toggleVideo = () => {
    setVideoEnabled(prev => !prev);
    if (window.JitsiMeetExternalAPI) {
      window.JitsiMeetExternalAPI.executeCommand('toggleVideo');
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
    if (window.JitsiMeetExternalAPI) {
      window.JitsiMeetExternalAPI.executeCommand('toggleAudio');
    }
  };

  const endCall = () => {
    if (window.JitsiMeetExternalAPI) {
      window.JitsiMeetExternalAPI.executeCommand('hangup');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={endCall}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Jitsi Meet Embed */}
        <div className="w-full h-full">
          <JitsiMeetAPI roomName="dfjuhdoecer848grfve48f8" />
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              videoEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              audioEnabled
                ? 'bg-gray-700 hover:bg-gray-600'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Phone className="w-6 h-6 rotate-135" />
          </button>
        </div>
      </div>
    </div>
  );
}
