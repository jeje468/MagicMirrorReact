# Porcupine Wake Word Detection Setup

## Overview
Your VoiceControl component is now configured to use Picovoice Porcupine for always-on wake word detection. When a wake word like "Jarvis", "Computer", or "Hey Google" is detected, the voice assistant automatically activates for 10 seconds to listen for commands.

## Required Installation

### 1. Install Porcupine Web SDK
```cmd
npm install @picovoice/porcupine-web
```

### 2. Install Web Voice Processor (required dependency)
```cmd
npm install @picovoice/web-voice-processor
```

### 3. Get Picovoice Access Key
1. Go to [Picovoice Console](https://console.picovoice.ai/)
2. Sign up for a free account
3. Create a new AccessKey in the dashboard
4. Copy your AccessKey

### 4. Configure Environment Variable
Create or update `.env` file in your project root:
```
VITE_PICOVOICE_ACCESS_KEY=your_access_key_here
```

## Available Built-in Wake Words
Porcupine provides these built-in wake words (no training needed):
- `alexa`
- `americano`
- `blueberry`
- `bumblebee`
- `computer`
- `grapefruit`
- `grasshopper`
- `hey google`
- `hey siri`
- `jarvis`
- `ok google`
- `picovoice`
- `porcupine`
- `terminator`

Currently configured wake words: **`jarvis`**, **`computer`**, **`hey google`**

## How It Works

1. **Always Listening**: Porcupine runs continuously in the background using minimal CPU
2. **Wake Word Detection**: When one of the configured wake words is detected, the system:
   - Shows a purple "Wake word detected" indicator
   - Automatically starts Web Speech API for command recognition
   - Listens for 10 seconds (or until a command is spoken)
3. **Command Processing**: Recognized speech is sent to Gemini AI for processing
4. **Auto-Stop**: After 10 seconds of no speech, the assistant automatically stops listening

## Customization

### Change Wake Words
Edit `src/components/VoiceControl.tsx`, line ~67:
```typescript
keywords: ['jarvis', 'computer', 'hey google'], // Change these
```

### Adjust Listening Duration
Edit the timeout in `activateVoiceAssistant()`, line ~159:
```typescript
wakeWordTimeoutRef.current = setTimeout(() => {
  // ... stop listening
}, 10000); // Change from 10000ms (10 seconds) to desired duration
```

### Adjust Wake Word Sensitivity
Edit `src/services/porcupine.ts`, line ~22:
```typescript
config.keywords.map(kw => ({ builtin: kw, sensitivity: 0.5 })), // 0.0 to 1.0
```
- Lower values (0.2-0.4): fewer false positives, may miss some activations
- Higher values (0.6-0.8): more sensitive, may have false positives

## Browser Compatibility
- **Chrome/Edge**: Full support ✅
- **Firefox**: Web Speech API supported, Porcupine works ✅
- **Safari**: Limited support ⚠️

## Troubleshooting

### "Wake word detection not available"
- Check that `VITE_PICOVOICE_ACCESS_KEY` is set in `.env`
- Restart dev server after adding environment variables
- Verify access key is valid in Picovoice Console

### Microphone not working
- Allow microphone permissions in browser
- Check browser console for errors
- Ensure HTTPS or localhost (required for microphone access)

### High CPU usage
- Reduce number of wake words
- Increase sensitivity threshold to reduce processing

## Free Tier Limits
Picovoice free tier includes:
- 3 AccessKeys
- Unlimited wake word detections
- All built-in wake words
- Community support

For custom wake words or higher limits, upgrade to paid plan.

## Testing
1. Start the app: `npm run dev`
2. Allow microphone access when prompted
3. Say "Hey Computer" or "Jarvis" clearly
4. Watch for purple wake indicator
5. Speak your command within 10 seconds
6. Check console for detection logs

## Manual Button Override
The button still works for manual activation if wake word detection fails or is disabled.
