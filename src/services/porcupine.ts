// Porcupine Wake Word Detection Service
// Requires: @picovoice/porcupine-web package

export interface PorcupineConfig {
  accessKey: string;
  keywords?: string[]; // Built-in keywords like 'hey google', 'alexa', 'jarvis', 'computer', etc.
  customModels?: { publicPath: string; label: string; sensitivity?: number }[]; // Custom .ppn models
  onWakeWord: (keywordIndex: number, label: string) => void;
  onError?: (error: Error) => void;
}

let porcupineWorker: any = null;
let isListening = false;

export async function initPorcupine(config: PorcupineConfig): Promise<void> {
  try {
    // Dynamic import to avoid bundling if not used
    const { PorcupineWorker } = await import('@picovoice/porcupine-web');
    
    if (config.customModels && config.customModels.length > 0) {
      const model = config.customModels[0]; // Use first model only
      
      porcupineWorker = await PorcupineWorker.create(
        config.accessKey,
        { publicPath: model.publicPath, label: model.label, sensitivity: model.sensitivity } as any,
        {},
        (detection: any) => {
          console.log(`Wake word "${model.label}" detected`);
          config.onWakeWord(0, model.label);
        }
      );
      
      console.log('Porcupine initialized with custom model:', model.label);
    } else if (config.keywords && config.keywords.length > 0) {
      porcupineWorker = await PorcupineWorker.create(
        config.accessKey,
        config.keywords[0] as any, // Cast to bypass type check for string
        {},
        (detection: any) => {
          console.log(`Wake word "${config.keywords![0]}" detected`);
          config.onWakeWord(0, config.keywords![0]);
        }
      );
      
      console.log('Porcupine initialized with keyword:', config.keywords[0]);
    } else {
      throw new Error('No wake words configured. Provide either keywords or customModels.');
    }
  } catch (error: any) {
    console.error('Failed to initialize Porcupine:', error);
    if (config.onError) {
      config.onError(error);
    }
    throw error;
  }
}

export async function startPorcupine(): Promise<void> {
  if (!porcupineWorker) {
    throw new Error('Porcupine not initialized. Call initPorcupine first.');
  }
  
  if (isListening) {
    console.warn('Porcupine is already listening');
    return;
  }

  try {
    await porcupineWorker.start();
    isListening = true;
    console.log('Porcupine started listening for wake words');
  } catch (error) {
    console.error('Failed to start Porcupine:', error);
    throw error;
  }
}

export async function stopPorcupine(): Promise<void> {
  if (!porcupineWorker) {
    return;
  }

  try {
    if (isListening) {
      await porcupineWorker.stop();
      isListening = false;
      console.log('Porcupine stopped listening');
    }
  } catch (error) {
    console.error('Failed to stop Porcupine:', error);
  }
}

export async function releasePorcupine(): Promise<void> {
  if (!porcupineWorker) {
    return;
  }

  try {
    await stopPorcupine();
    await porcupineWorker.release();
    porcupineWorker = null;
    console.log('Porcupine released');
  } catch (error) {
    console.error('Failed to release Porcupine:', error);
  }
}

export function isPorcupineListening(): boolean {
  return isListening;
}
