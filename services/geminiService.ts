
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Handles NLP for OortGo using Gemini 3 Flash.
 * Processes natural language prompts like "I want to go to the airport"
 * and extracts destination, vehicle preference, and intent.
 */
export const extractRideIntent = async (voiceText: string) => {
  // Always use a new instance and named parameter for apiKey as per guidelines.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract ride information from this user request: "${voiceText}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING, description: "Final destination name" },
            vehiclePreference: { type: Type.STRING, description: "One of: CAR, BIKE, AUTO, ANY" },
            isImmediate: { type: Type.BOOLEAN, description: "Whether the user wants to leave now" }
          },
          required: ["destination"]
        }
      }
    });

    // Access .text property directly (not a method) as per guidelines.
    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Intent Extraction Error:", error);
    return null;
  }
};
