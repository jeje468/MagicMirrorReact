import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env.local file');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface GeminiResponse {
  text: string;
  error?: string;
}

export async function sendToGemini(
  prompt: string,
  context?: string
): Promise<GeminiResponse> {
  if (!genAI) {
    return {
      text: '',
      error: 'Gemini API is not configured. Please add your API key to .env.local'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare the prompt with context
    const fullPrompt = context 
      ? `${context}\n\nUser command: ${prompt}`
      : prompt;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return { text };
  } catch (error: any) {
    console.error('Error communicating with Gemini:', error);
    return {
      text: '',
      error: error.message || 'Failed to communicate with Gemini API'
    };
  }
}
