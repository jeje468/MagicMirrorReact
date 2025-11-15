// Simple Web Speech API-based Wake Word Detection
// No external dependencies - uses browser's native speech recognition

export interface SimpleWakeWordConfig {
  wakeWords: string[];
  sensitivity?: number; // 0.5 to 1.0, how much partial matching is allowed
  onWakeWord: (word: string) => void;
  onError?: (error: string) => void;
}

let recognitionInstance: any = null;
let isListening = false;
let currentConfig: SimpleWakeWordConfig | null = null;
let restartTimeout: any = null;
let lastWakeWordTime = 0;
let isCommandMode = false;

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

function matchesWakeWord(text: string, wakeWords: string[], sensitivity: number = 0.9): string | null {
  const normalized = normalizeText(text);
  
  for (const word of wakeWords) {
    const normalizedWord = normalizeText(word);
    
    // Exact match
    if (normalized === normalizedWord) {
      return word;
    }
    
    // Partial match (good for multi-word phrases)
    if (normalizedWord.includes(normalized) || normalized.includes(normalizedWord)) {
      // Check if it's a significant portion
      const ratio = Math.min(normalized.length, normalizedWord.length) / 
                    Math.max(normalized.length, normalizedWord.length);
      if (ratio >= sensitivity) {
        return word;
      }
    }
  }
  
  return null;
}

export async function initSimpleWakeWord(config: SimpleWakeWordConfig): Promise<void> {
  try {
    // Store config for auto-restart
    currentConfig = config;
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Web Speech API not supported in this browser');
    }
    
    // Don't reinitialize if already initialized
    if (recognitionInstance) {
      console.log('Wake word already initialized, skipping...');
      return;
    }
    
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    let interimTranscript = '';
    
    recognitionInstance.onstart = () => {
      console.log('Wake word detection started');
    };
    
    recognitionInstance.onresult = (event: any) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          console.log('[Wake Word] Heard:', transcript);
          
          // Check if any wake word matches
          const matched = matchesWakeWord(
            transcript, 
            config.wakeWords,
            config.sensitivity || 0.9
          );
          
          if (matched) {
            // Prevent multiple triggers within 3 seconds
            const now = Date.now();
            if (now - lastWakeWordTime < 3000) {
              console.log('Wake word ignored - too soon after last trigger');
              return;
            }
            
            // Don't trigger if already in command mode
            if (isCommandMode) {
              console.log('Wake word ignored - already in command mode');
              return;
            }
            
            lastWakeWordTime = now;
            isCommandMode = true;
            console.log(`✓ Wake word detected: "${matched}"`);
            config.onWakeWord(matched);
          }
        } else {
          interimTranscript += transcript;
        }
      }
    };
    
    recognitionInstance.onerror = (event: any) => {
      // Silently ignore 'aborted' errors - they're expected when stopping
      if (event.error !== 'aborted') {
        console.error('Wake word detection error:', event.error);
        if (config.onError) {
          config.onError(event.error);
        }
      }
    };
    
    recognitionInstance.onend = () => {
      console.log('Wake word detection stopped');
      isListening = false;

      // If we're in command mode, do NOT auto-restart. VoiceControl will resume later.
      if (isCommandMode) {
        console.log('Wake word paused during command mode; no auto-restart');
        return;
      }

      // Auto-restart after a short delay (unless explicitly released)
      if (currentConfig && recognitionInstance) {
        if (restartTimeout) {
          clearTimeout(restartTimeout);
        }
        restartTimeout = setTimeout(() => {
          console.log('Restarting wake word detection...');
          startSimpleWakeWord().catch(err => {
            console.error('Failed to restart wake word detection:', err);
          });
        }, 1000);
      }
    };
    
    console.log('Simple wake word detector initialized');
  } catch (error: any) {
    const message = error.message || 'Failed to initialize wake word detection';
    console.error('Init error:', message);
    console.error('Stack:', error.stack);
    if (config.onError) {
      config.onError(message);
    }
    throw error;
  }
}

export async function startSimpleWakeWord(): Promise<void> {
  if (!recognitionInstance) {
    throw new Error('Wake word not initialized. Call initSimpleWakeWord first.');
  }
  
  if (isListening) {
    console.warn('Wake word detection already running');
    return;
  }

  try {
    // Reset command mode when starting
    isCommandMode = false;
    recognitionInstance.start();
    isListening = true;
    console.log('Wake word detection started');
  } catch (error) {
    console.error('Failed to start wake word detection:', error);
  }
}export async function stopSimpleWakeWord(): Promise<void> {
  if (!recognitionInstance || !isListening) {
    return;
  }
  
  try {
    recognitionInstance.stop();
    isListening = false;
    console.log('Wake word detection stopped');
  } catch (error) {
    console.error('Failed to stop wake word detection:', error);
  }
}

export async function resetCommandMode(): Promise<void> {
  isCommandMode = false;
  console.log('Command mode reset - ready for next wake word');
}

export async function releaseSimpleWakeWord(): Promise<void> {
  if (recognitionInstance) {
    try {
      // Clear config to prevent auto-restart
      currentConfig = null;
      
      // Clear restart timeout
      if (restartTimeout) {
        clearTimeout(restartTimeout);
        restartTimeout = null;
      }
      
      await stopSimpleWakeWord();
      recognitionInstance.abort();
      recognitionInstance = null;
      console.log('Wake word detection released');
    } catch (error) {
      console.error('Error releasing wake word:', error);
    }
  }
}
