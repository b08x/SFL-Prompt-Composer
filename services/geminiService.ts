
import { GoogleGenAI, Type } from "@google/genai";
import type { SFLPrompt } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function generateContent(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof Error) {
        return `Error from Gemini API: ${error.message}`;
    }
    return "An unknown error occurred while contacting the Gemini API.";
  }
}

export async function analyzeTextForSFL(text: string): Promise<SFLPrompt> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following document and generate the corresponding SFL components in the requested JSON format. You are an expert in Systemic Functional Linguistics. Infer sensible defaults where information is not explicit. Ensure all fields in the JSON schema are populated with meaningful suggestions based on the text.\n\nDOCUMENT:\n"""\n${text}\n"""`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    field: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING, description: 'The main subject matter of the text.' },
                        taskVerb: { type: Type.STRING, description: 'The primary action or goal implied by the text (e.g., Analyze, Summarize, Create).' },
                        taskDescription: { type: Type.STRING, description: 'A brief description of what the task entails.' },
                        keyEntities: { type: Type.STRING, description: 'Comma-separated list of key people, places, concepts, or things discussed.' },
                        circumstances: { type: Type.STRING, description: 'The context, scope, or specific conditions mentioned (e.g., time period, location).' },
                      },
                      required: ['topic', 'taskVerb', 'taskDescription', 'keyEntities', 'circumstances'],
                    },
                    tenor: {
                      type: Type.OBJECT,
                      properties: {
                        persona: { type: Type.STRING, description: 'The implied persona or voice of the author (e.g., an expert, a teacher, a journalist).' },
                        audience: { type: Type.STRING, description: 'The intended audience for the text (e.g., general public, specialists, students).' },
                        tone: { type: Type.STRING, description: 'The overall tone and style of the writing (e.g., Formal, Informal, Persuasive, Objective).' },
                        modality: { type: Type.STRING, description: 'The level of certainty or confidence expressed (e.g., high confidence, speculative).' },
                      },
                      required: ['persona', 'audience', 'tone', 'modality'],
                    },
                    mode: {
                      type: Type.OBJECT,
                      properties: {
                        format: { type: Type.STRING, description: 'The format of the text (e.g., academic paper, blog post, report).' },
                        structure: { type: Type.STRING, description: 'The organizational structure of the text (e.g., Introduction, Body, Conclusion; chronological order).' },
                        constraints: { type: Type.STRING, description: 'Any explicit or implicit rules or constraints (e.g., word count, specific terminology to use/avoid).' },
                      },
                      required: ['format', 'structure', 'constraints'],
                    },
                  },
                  required: ['field', 'tenor', 'mode'],
                },
            },
        });
        
        const jsonString = response.text;
        const parsed = JSON.parse(jsonString);
        return parsed as SFLPrompt;
    } catch (error) {
        console.error("Error analyzing text for SFL:", error);
        if (error instanceof Error) {
            throw new Error(`Error from Gemini API during analysis: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the text.");
    }
}
