import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { sendToGemini } from '../services/gemini';
// import { speakText } from '../services/elevenlabs';

interface VoiceControlProps {
  onCommand: (command: string) => void;
  onGeminiResponse?: (response: string) => void;
}

export function VoiceControl({ onCommand, onGeminiResponse }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
          
          // Send to Gemini
          handleGeminiRequest(finalTranscript);
          
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

  const handleGeminiRequest = async (command: string) => {
    setIsProcessing(true);
    setGeminiResponse('');
    
    try {
      const context = 
      `You are an AI assistant for a smart mirror. 
      The user can control various features like weather, calendar, news, video calls, and computer vision. 
      Keep responses concise, friendly, and helpful. 
      If the user asks for information, provide brief but accurate answers. 
      If the command is unclear, ask for clarification.`;
      
      const result = await sendToGemini(command, context);
      
      if (result.error) {
        console.error('Gemini error:', result.error);
        setGeminiResponse('Sorry, I had trouble processing that.');
      } else {
        setGeminiResponse(result.text);
        if (onGeminiResponse) {
          onGeminiResponse(result.text);
        }
        
        // Speak the response using ElevenLabs
        // speakText(result.text);
        
        // Clear response after 10 seconds
        setTimeout(() => setGeminiResponse(''), 10000);
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setGeminiResponse('Sorry, something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

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
          <div className="font-medium text-blue-400 mb-1">You said:</div>
          "{transcript}"
        </div>
      )}
      
      {isProcessing && (
        <div className="mt-3 px-4 py-2 bg-gray-800 rounded-lg text-sm max-w-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse text-purple-400" />
          <span className="text-gray-400">Thinking...</span>
        </div>
      )}
      
      {geminiResponse && !isProcessing && (
        <div className="mt-3 px-4 py-2 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg text-sm max-w-md">
          <div className="flex items-center gap-2 font-medium text-purple-300 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Response:</span>
          </div>
          <div className="text-gray-200">{geminiResponse}</div>
        </div>
      )}
    </div>
  );
}
