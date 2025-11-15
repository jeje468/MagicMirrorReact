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

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: string;
}

export async function sendToGemini(
  prompt: string,
  context?: string,
  conversationHistory?: ConversationMessage[]
): Promise<GeminiResponse> {
  if (!genAI) {
    return {
      text: '',
      error: 'Gemini API is not configured. Please add your API key to .env.local'
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // If we have conversation history, use chat session
    if (conversationHistory && conversationHistory.length > 0) {
      console.log('🔄 Using chat session with', conversationHistory.length, 'history messages');
      const chat = model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }]
        })),
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      // Add system context as a reminder if provided
      const messageToSend = context 
        ? `${context}\n\nUser: ${prompt}`
        : prompt;

      const result = await chat.sendMessage(messageToSend);
      const response = await result.response;
      const text = response.text();

      return { text };
    } else {
      // First message or no history - use regular generation with context
      console.log('🆕 First message - no history yet');
      const fullPrompt = context 
        ? `${context}\n\nUser command: ${prompt}`
        : prompt;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return { text };
    }
  } catch (error: any) {
    console.error('Error communicating with Gemini:', error);
    return {
      text: '',
      error: error.message || 'Failed to communicate with Gemini API'
    };
  }
}
