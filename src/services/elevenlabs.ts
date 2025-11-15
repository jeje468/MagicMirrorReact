const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
// const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // Default voice, you can change this
// const VOICE_ID = 'dhwafD61uVd8h85wAZSE';
const VOICE_ID = 'FGY2WhTYpPnrIDTdsKH5';

if (!ELEVENLABS_API_KEY) {
  console.warn('ElevenLabs API key not found. Please add VITE_ELEVENLABS_API_KEY to your .env.local file');
}

export async function speakText(text: string): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.error('ElevenLabs API key not configured');
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert response to blob
    const audioBlob = await response.blob();
    
    // Create audio URL and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Play the audio
    await audio.play();
    
    // Clean up URL after audio finishes
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
  } catch (error) {
    console.error('Error with ElevenLabs text-to-speech:', error);
  }
}

