
import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

// Initialize Gemini Client
// In a real app, ensure process.env.API_KEY is set.
// For this demo, we assume the environment is correctly configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Sanitize user input to prevent basic prompt injection.
 * Updated to strip newlines and control characters.
 */
const sanitizeInput = (input: string): string => {
  // Removes quotes, backslashes, curly braces, and newlines/carriage returns
  return input.replace(/["\\{}\n\r]/g, " ").trim();
};

/**
 * Generates a list of multiple choice questions based on subject, topic, level and count.
 */
export const generateQuestions = async (subject: string, count: number, difficulty: number, topic?: string, level?: string): Promise<Question[]> => {
  const cleanSubject = sanitizeInput(subject);
  const cleanTopic = topic ? sanitizeInput(topic) : '';
  const cleanLevel = level ? sanitizeInput(level) : '';

  try {
    // Enhanced prompt with hierarchical instructions
    const context = `
      Subject: "${cleanSubject}"
      ${cleanTopic ? `Specific Topic: "${cleanTopic}"` : ''}
      ${cleanLevel ? `Grade Level / Proficiency: "${cleanLevel}"` : 'Target Audience: Middle School'}
    `;

    const prompt = `SYSTEM: You are an educational assistant. You must ONLY generate JSON.
    TASK: Generate ${count} multiple choice questions based on the following context:
    ${context}
    
    Difficulty level: ${difficulty} (1=Easy, 5=Hard).
    Language: Turkish.
    Output Format: Pure JSON array.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The question text" },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 4 options" 
              },
              correctIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              explanation: { type: Type.STRING, description: "Short explanation of why the answer is correct" },
              difficulty: { type: Type.INTEGER }
            },
            required: ["text", "options", "correctIndex", "explanation", "difficulty"]
          }
        }
      }
    });

    if (!response.text) return [];

    const rawData = JSON.parse(response.text);
    
    // Map to our Question interface
    return rawData.map((q: any, index: number) => ({
      id: `gen_${Date.now()}_${index}`,
      subject: cleanSubject,
      topic: cleanTopic,
      level: cleanLevel,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      difficulty: q.difficulty
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback mock data in case of API failure or no key
    return [
      {
        id: 'fallback_1',
        subject: cleanSubject,
        text: `${cleanSubject} ${cleanTopic} konusunda örnek soru (API Hatası). 2 + 2 = ?`,
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
        explanation: 'Matematiksel bir gerçektir.',
        difficulty: 1
      }
    ];
  }
};

/**
 * Checks content for inappropriate text.
 * Returns true if safe, false if unsafe.
 */
export const moderateContent = async (text: string): Promise<{ safe: boolean; reason?: string }> => {
  const cleanText = sanitizeInput(text);
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Analyze the following Turkish text for bullying, profanity, hate speech, or sexually explicit content for a school environment app.
      Text: "${cleanText}"
      Return JSON: { "safe": boolean, "reason": string (optional) }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["safe"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { safe: true };
  } catch (error) {
    console.error("Moderation Error:", error);
    // Default to safe if API fails to avoid blocking users unnecessarily in demo
    return { safe: true };
  }
};

/**
 * Explains a specific question result in more detail.
 */
export const explainAnswer = async (question: string, answer: string, userWrongAnswer?: string): Promise<string> => {
  try {
    const prompt = `Explain simply (for a child) why "${answer}" is the correct answer for the question: "${question}". 
    ${userWrongAnswer ? `Also explain why "${userWrongAnswer}" is incorrect.` : ''}
    Keep it under 3 sentences. Language: Turkish.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Açıklama alınamadı.";
  } catch (error) {
    return "Yapay zeka şu an meşgul.";
  }
};
