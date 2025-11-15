// Custom Wake Word Model Loader
// Converts .ppn files to base64 for use with Porcupine

export async function loadCustomModel(ppnFilePath: string): Promise<string> {
  // For Vite/browser: place .ppn file in public/ folder
  // Access it like: /your-wake-word.ppn
  
  try {
    const response = await fetch(ppnFilePath);
    if (!response.ok) {
      throw new Error(`Failed to load model: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convert to base64
    let binary = '';
    bytes.forEach(byte => {
      binary += String.fromCharCode(byte);
    });
    
    return btoa(binary);
  } catch (error) {
    console.error('Error loading custom wake word model:', error);
    throw error;
  }
}

// Helper to load multiple custom models
export async function loadMultipleModels(
  models: { path: string; label: string; sensitivity?: number }[]
): Promise<{ publicPath: string; label: string; sensitivity?: number }[]> {
  // For publicPath, we don't need to fetch, just return the path
  return models.map(model => ({
    publicPath: model.path,
    label: model.label,
    sensitivity: model.sensitivity || 0.5
  }));
}
