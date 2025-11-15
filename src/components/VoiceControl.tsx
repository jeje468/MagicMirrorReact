import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceControlProps {
  onCommand: (command: string) => void;
}

export function VoiceControl({ onCommand }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          onCommand(finalTranscript);
          
          // Clear transcript after 3 seconds
          setTimeout(() => setTranscript(''), 3000);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onCommand]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      <button
        onClick={toggleListening}
        className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all ${
          isListening 
            ? 'bg-red-600/70 hover:bg-red-700/80 animate-pulse' 
            : 'bg-gray-800/50 hover:bg-gray-700/60'
        }`}
      >
        {isListening ? (
          <>
            <Mic className="w-5 h-5" />
            <span className="text-sm">Listening...</span>
          </>
        ) : (
          <>
            <MicOff className="w-5 h-5" />
            <span className="text-sm">Voice Assist</span>
          </>
        )}
      </button>
      
      {transcript && (
        <div className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm max-w-xs">
          "{transcript}"
        </div>
      )}
    </div>
  );
}
