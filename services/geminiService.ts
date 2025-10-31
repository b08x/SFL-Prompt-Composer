
import { GoogleGenAI, Type } from "@google/genai";
import type { SFLPrompt, ValidationResult, TranscriptEntry, GenerateContentResult } from "../types";

export async function generateContent(prompt: string): Promise<GenerateContentResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .map(chunk => chunk.web)
    .filter((web): web is { uri: string; title: string } => !!(web && web.uri && web.title))
    .map(web => ({ uri: web.uri, title: web.title }));

  const uniqueSources: { uri: string; title: string }[] = Object.values(
    Object.fromEntries(sources.map(item => [item.uri, item]))
  );

  return {
    text: response.text,
    sources: uniqueSources,
  };
}

export async function validatePrompt(promptComponents: SFLPrompt): Promise<ValidationResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-pro';
    const validationPrompt = `
    Analyze the following SFL (Systemic Functional Linguistics) prompt components for coherence, clarity, and effectiveness.
    Provide a comprehensive validation assessment based on three grammar aspects:
    1.  **Functional Grammar:** How well do the components construct a clear meaning? Are the metafunctions (ideational, interpersonal, textual) aligned? Is the 'Field' well-defined?
    2.  **Generative Grammar:** Are the instructions syntactically sound and complete? Could they be misinterpreted by a Large Language Model? Is the structure logical?
    3.  **Pragmatic Grammar:** Is the prompt contextually appropriate for the desired outcome? Is the 'Tenor' (persona, audience) consistent with the 'Mode' (format) and 'Field' (topic)?

    Evaluate the components, provide an overall coherence score from 0 to 100 (where 100 is perfect), a brief qualitative assessment, and a list of specific issues with actionable suggestions.
    If there are no issues, return an empty issues array. Issues should be categorized by severity: 'error' (likely to cause major problems), 'warning' (may lead to suboptimal results), 'info' (minor suggestion for improvement).

    SFL Components:
    - Field: ${JSON.stringify(promptComponents.field)}
    - Tenor: ${JSON.stringify(promptComponents.tenor)}
    - Mode: ${JSON.stringify(promptComponents.mode)}
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.NUMBER, description: "Overall coherence score (0-100)." },
            assessment: { type: Type.STRING, description: "A brief, one-sentence qualitative assessment (e.g., 'Excellent alignment', 'Minor inconsistencies found')." },
            issues: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "A unique identifier for the issue, like 'F-1' or 'T-2'." },
                        component: { type: Type.STRING, description: "The SFL component this issue relates to ('Field', 'Tenor', 'Mode', or 'Cross-Component')." },
                        field: { type: Type.STRING, description: "Optional specific field within the component (e.g., 'topic', 'persona')." },
                        severity: { type: Type.STRING, description: "Severity level: 'error', 'warning', or 'info'." },
                        grammar: { type: Type.STRING, description: "The grammar aspect: 'Functional', 'Generative', or 'Pragmatic'." },
                        message: { type: Type.STRING, description: "A clear, concise message explaining the issue." },
                        suggestion: { type: Type.STRING, description: "An actionable suggestion for how to improve the prompt." },
                    },
                    required: ['id', 'component', 'severity', 'grammar', 'message', 'suggestion'],
                },
            },
        },
        required: ['score', 'assessment', 'issues'],
    };

    const response = await ai.models.generateContent({
        model,
        contents: validationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });
    
    try {
        const jsonResponse = JSON.parse(response.text);
        if (typeof jsonResponse.score !== 'number' || typeof jsonResponse.assessment !== 'string' || !Array.isArray(jsonResponse.issues)) {
             throw new Error("Invalid JSON structure received from validation API.");
        }
        return jsonResponse as ValidationResult;
    } catch (e) {
        console.error("Failed to parse validation response:", e, "Raw response:", response.text);
        throw new Error("Could not parse the validation response from the AI.");
    }
}


export async function analyzeTextForSFL(text: string): Promise<SFLPrompt> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-pro';
  const prompt = `
    Analyze the following text and extract its Systemic Functional Linguistics (SFL) components.
    Based on the text, infer the most likely Field, Tenor, and Mode.

    - **Field**: What is the text about? Identify the topic, the primary task or purpose (e.g., explaining, arguing), key entities, and any contextual circumstances.
    - **Tenor**: Who is involved? Infer the author's persona, the intended audience, the tone (e.g., formal, casual, academic), and the modality (certainty of claims).
    - **Mode**: How is the message organized? Describe the output format (e.g., article, report), its structure, and any implicit constraints.

    Return the analysis as a JSON object matching the SFLPrompt structure.

    TEXT TO ANALYZE:
    ---
    ${text}
    ---
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      field: {
        type: Type.OBJECT,
        properties: { topic: { type: Type.STRING }, taskVerb: { type: Type.STRING }, taskDescription: { type: Type.STRING }, keyEntities: { type: Type.STRING }, circumstances: { type: Type.STRING } },
        required: ['topic', 'taskVerb', 'taskDescription', 'keyEntities', 'circumstances'],
      },
      tenor: {
        type: Type.OBJECT,
        properties: { persona: { type: Type.STRING }, audience: { type: Type.STRING }, tone: { type: Type.STRING }, modality: { type: Type.STRING } },
        required: ['persona', 'audience', 'tone', 'modality'],
      },
      mode: {
        type: Type.OBJECT,
        properties: { format: { type: Type.STRING }, structure: { type: Type.STRING }, constraints: { type: Type.STRING } },
        required: ['format', 'structure', 'constraints'],
      },
    },
    required: ['field', 'tenor', 'mode'],
  };
  
  const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
      },
  });

  return JSON.parse(response.text) as SFLPrompt;
}

export async function summarizeConversation(transcript: TranscriptEntry[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-2.5-flash';
  const formattedTranscript = transcript
    .filter(entry => entry.speaker !== 'system')
    .map(entry => `${entry.speaker.toUpperCase()}: ${entry.text}`)
    .join('\n');

  const prompt = `
    The following is a transcript of a conversation between a user and an AI, where the user was refining an SFL prompt.
    The AI used a tool called 'updatePromptComponents' to make changes.

    Summarize the key changes made to the SFL prompt components during this conversation.
    Focus on what was altered (e.g., "The tone was changed from formal to persuasive") rather than the conversational filler.
    Present the summary as a concise, bulleted list in Markdown format.

    TRANSCRIPT:
    ---
    ${formattedTranscript}
    ---
  `;
  
  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text;
}
