
import { GoogleGenAI, Type } from "@google/genai";
import type { SFLPrompt } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Define a shared type for transcript entries to be used in services and components
export type TranscriptEntry = { speaker: 'user' | 'model' | 'system'; text: string };

export async function generateContent(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      topP: 0.95,
    },
  });
  return response.text;
}

export async function summarizeConversation(transcript: TranscriptEntry[]): Promise<string> {
    const formattedTranscript = transcript
        .map(entry => `${entry.speaker.charAt(0).toUpperCase() + entry.speaker.slice(1)}: ${entry.text}`)
        .join('\n');

    const prompt = `
You are a helpful assistant. Below is a transcript of a conversation between a user and an AI aimed at refining a prompt using a Systemic Functional Linguistics (SFL) framework.
Your task is to provide a concise summary of the key decisions and adjustments made to the prompt's Field, Tenor, and Mode components throughout the conversation.
Ignore conversational filler and focus only on the changes that were requested and applied.

CONVERSATION TRANSCRIPT:
---
${formattedTranscript}
---

Provide the summary as a well-formatted, bulleted list under the heading "Prompt Adjustments Summary".
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.2, // Lower temperature for more factual summary
        },
    });
    return response.text;
}


export async function analyzeTextForSFL(text: string): Promise<SFLPrompt> {
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
    try {
        const parsed = JSON.parse(jsonString);
        return parsed as SFLPrompt;
    } catch (e) {
        console.error("Failed to parse JSON from Gemini:", jsonString, e);
        throw new Error("The model returned a response that was not valid JSON. Please try refining your input text.");
    }
}
