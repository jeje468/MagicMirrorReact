import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { sendToGemini } from '../services/gemini';
import { speakText } from '../services/elevenlabs';

interface AIResponse {
  message: string;
  task: string | null;
  parameters?: Record<string, any>;
}

interface VoiceControlProps {
  onCommand: (command: string) => void;
  onGeminiResponse?: (response: string) => void;
  onTaskExecute?: (task: string, parameters: Record<string, any>) => void;
}

export function VoiceControl({ onCommand, onGeminiResponse, onTaskExecute }: VoiceControlProps) {
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
      If the user requests something unrelated to the tasks, you should respond corresponding to the request, but return the task as null.
      
      IMPORTANT: You must respond with ONLY valid JSON. Do NOT use markdown code blocks or any formatting. Return raw JSON only.
      
      Required JSON format:
      {
        "message": "Your friendly response to the user",
        "task": "task_name or null",
        "parameters": {"param1": "value1", "param2": "value2"}
      }
      
      Available tasks:
      - "show_weather": Display weather (parameters: { "status": "true" or "false" depending on the request })
      - "show_calendar": Display calendar events (parameters: { "date": "YYYY-MM-DD" or "today" })
      - "show_news": Display news (parameters: { "category": "general|sports|technology|business" })
      - "start_video_call": Start a video call (parameters: { "contact": "contact name" })
      - "enable_computer_vision": Enable computer vision (parameters: { "mode": "face_detection|object_detection" })
      - "set_reminder": Set a reminder (parameters: { "message": "reminder text", "time": "HH:MM" })
      - null: For general conversation or when no action is needed
      
      Rules:
      - Keep the message concise, friendly, and helpful
      - Set task to null if the user is just chatting or asking questions
      - If parameters are not specified by the user, use reasonable defaults
      - If the command is unclear, set task to null and ask for clarification in the message
      
      Example responses:
      {"message": "Sure! I'll show you the weather for New York.", "task": "show_weather", "parameters": {"location": "New York"}}
      {"message": "The capital of France is Paris.", "task": null, "parameters": {}}
      {"message": "I'll set a reminder for you.", "task": "set_reminder", "parameters": {"message": "Meeting", "time": "14:00"}}`;
      
      const result = await sendToGemini(command, context);
      
      if (result.error) {
        console.error('Gemini error:', result.error);
        setGeminiResponse('Sorry, I had trouble processing that.');
      } else {
        try {
          // Remove markdown code blocks if present
          let cleanedText = result.text.trim();
          
          // Remove ```json ... ``` or ``` ... ``` wrapper
          if (cleanedText.startsWith('```')) {
            // Find the first newline after opening ```
            const firstNewline = cleanedText.indexOf('\n');
            // Find the closing ```
            const lastCodeFence = cleanedText.lastIndexOf('```');
            
            if (firstNewline !== -1 && lastCodeFence > firstNewline) {
              cleanedText = cleanedText.substring(firstNewline + 1, lastCodeFence).trim();
            }
          }
          
          // Parse the JSON response
          const aiResponse: AIResponse = JSON.parse(cleanedText);
          
          // Set the message for display and speech
          setGeminiResponse(aiResponse.message);
          
          if (onGeminiResponse) {
            onGeminiResponse(aiResponse.message);
          }
          
          // Execute task if present
          if (aiResponse.task && onTaskExecute) {
            onTaskExecute(aiResponse.task, aiResponse.parameters || {});
          }
          
          // Speak the response using ElevenLabs
          speakText(aiResponse.message);
          
          // Clear response after 10 seconds
          setTimeout(() => setGeminiResponse(''), 10000);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.log('Raw response:', result.text);
          // Fallback: treat as plain text
          setGeminiResponse(result.text);
          if (onGeminiResponse) {
            onGeminiResponse(result.text);
          }
          speakText(result.text);
          setTimeout(() => setGeminiResponse(''), 10000);
        }
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
            ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
            : 'bg-gray-800 hover:bg-gray-700'
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
            <span className="text-sm">Voice Control</span>
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
