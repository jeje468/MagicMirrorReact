import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { sendToGemini } from '../services/gemini';
import { initSimpleWakeWord, startSimpleWakeWord, stopSimpleWakeWord, releaseSimpleWakeWord, resetCommandMode } from '../services/simpleWakeWord';
// import { speakText } from '../services/elevenlabs';

interface VoiceControlProps {
  onCommand: (command: string) => void;
  onGeminiResponse?: (response: string) => void;
}

export function VoiceControl({ onCommand, onGeminiResponse }: VoiceControlProps) {
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wakeWordStatus, setWakeWordStatus] = useState<string>('Initializing...');
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const commandRecognitionRef = useRef<any>(null);

  const initializeRef = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initializeRef.current) return;
    initializeRef.current = true;

    // Setup Web Speech API for command listening (separate instance)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const commandRecognition = new SpeechRecognition();
      
      commandRecognition.continuous = false;
      commandRecognition.interimResults = true;
      commandRecognition.lang = 'en-US';

      commandRecognition.onresult = (event: any) => {
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
          
          // Clear wake word timeout since we got speech
          if (wakeWordTimeoutRef.current) {
            clearTimeout(wakeWordTimeoutRef.current);
          }
          
          // Send to Gemini and then reset
          handleGeminiRequest(finalTranscript).then(() => {
            // Reset wake word detection after command is processed
            setIsWakeWordActive(false);
            setTimeout(() => {
              console.log('Ready for next wake word...');
              resetCommandMode();
              // Resume wake word listening
              startSimpleWakeWord().catch(() => {});
            }, 500);
          });
          
          // Clear transcript after 3 seconds
          setTimeout(() => setTranscript(''), 3000);
        }
      };

      commandRecognition.onerror = (event: any) => {
        // Silently ignore 'aborted' errors - they're expected when stopping
        if (event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      setRecognition(commandRecognition);
      commandRecognitionRef.current = commandRecognition; // Store in ref for wake word callback
    }

    // Initialize simple wake word detector (uses its own recognition instance)
    console.log('Initializing wake word detection...');
    
    const wakeWordCallbacks = {
      onWakeWord: (word: string) => {
        console.log('✓ Wake word detected:', word);
        setIsWakeWordActive(true);
        setWakeWordStatus('Ready!');
        // Use a small delay to ensure recognition is set
        setTimeout(() => {
          const commandRecognition = commandRecognitionRef.current;
          if (commandRecognition) {
            console.log('Activating voice assistant after wake word...');
            // Pause wake word detection to avoid conflicts during command capture
            stopSimpleWakeWord().catch(() => {});

            try {
              commandRecognition.start();
              setIsListening(true);
              
              // Auto-stop after 2 seconds if no speech detected
              if (wakeWordTimeoutRef.current) {
                clearTimeout(wakeWordTimeoutRef.current);
              }
              wakeWordTimeoutRef.current = setTimeout(() => {
                console.log('2 second timeout - stopping listening');
                if (commandRecognition) {
                  commandRecognition.stop();
                }
                setIsListening(false);
                setIsWakeWordActive(false);
                resetCommandMode(); // Reset command mode immediately
                console.log('Returned to wake word mode');
                // Resume wake word detection after timeout
                setTimeout(() => {
                  startSimpleWakeWord().catch(() => {});
                }, 300);
              }, 2000); // Back to 2 seconds
            } catch (error) {
              console.error('Failed to start recognition after wake word:', error);
              setIsWakeWordActive(false);
              resetCommandMode();
              // Ensure wake word resumes on failure
              setTimeout(() => {
                startSimpleWakeWord().catch(() => {});
              }, 300);
            }
          } else {
            console.error('Command recognition not available');
            setIsWakeWordActive(false);
          }
        }, 100);
      },
      onError: (error: string) => {
        console.error('Wake word error:', error);
        setWakeWordStatus(`Error: ${error}`);
      }
    };
    
    initSimpleWakeWord({
      wakeWords: ['hey mirror', 'computer', 'jarvis', 'ok mirror'],
      sensitivity: 0.8,
      ...wakeWordCallbacks
    }).then(() => {
      console.log('Starting wake word detection...');
      return startSimpleWakeWord();
    }).then(() => {
      setWakeWordStatus('Listening for wake word...');
      console.log('Wake word detection active');
    }).catch((err) => {
      console.error('Failed to initialize wake word:', err);
      console.error('Error stack:', err.stack);
      setWakeWordStatus('Wake word detection unavailable');
    });

    return () => {
      releaseSimpleWakeWord();
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    };
  }, []);

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

  const activateVoiceAssistant = () => {
    if (!recognition) {
      console.error('Speech recognition not available');
      return;
    }

    // Start speech recognition for a limited time after wake word
    try {
      console.log('Starting speech recognition for commands...');
      recognition.start();
      setIsListening(true);
      
      // Auto-stop after 2 seconds if no speech detected
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
      wakeWordTimeoutRef.current = setTimeout(() => {
        console.log('2 second timeout - stopping listening');
        if (recognition && isListening) {
          recognition.stop();
        }
        setIsListening(false);
        setIsWakeWordActive(false);
        console.log('Returned to wake word mode');
      }, 2000);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsWakeWordActive(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      // Stop listening
      recognition.stop();
      setIsListening(false);
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    } else {
      // Start manual listening with same 2-second timeout
      try {
        console.log('Manual listening activated...');
        recognition.start();
        setIsListening(true);
        
        // Same 5-second timeout as wake word activation (increased from 2s)
        if (wakeWordTimeoutRef.current) {
          clearTimeout(wakeWordTimeoutRef.current);
        }
        wakeWordTimeoutRef.current = setTimeout(() => {
          console.log('5 second timeout - stopping manual listening');
          if (recognition && isListening) {
            recognition.stop();
          }
          setIsListening(false);
          console.log('Returned to wake word mode');
          // Ensure wake word detection restarts
          setTimeout(() => {
            resetCommandMode(); // Reset command mode
            startSimpleWakeWord().catch(err => {
              console.log('Wake word already running:', err.message);
            });
          }, 500);
        }, 5000); // Increased to 5 seconds
      } catch (error) {
        console.error('Failed to start manual recognition:', error);
      }
    }
  };

  return (
    <div className="fixed bottom-8 left-8 z-50">
      {/* Wake word indicator */}
      {isWakeWordActive && (
        <div className="mb-2 px-3 py-1 bg-purple-600/70 rounded-full text-xs flex items-center gap-2 animate-pulse">
          <Sparkles className="w-3 h-3" />
          <span>Wake word detected</span>
        </div>
      )}
      
      {/* Wake word status */}
      {wakeWordStatus !== 'Listening for wake word...' && (
        <div className="mb-2 px-3 py-1 bg-blue-600/50 rounded-full text-xs max-w-xs">
          {wakeWordStatus}
        </div>
      )}
      
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
            <span className="text-sm">Voice Assist (Wake word ready)</span>
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
