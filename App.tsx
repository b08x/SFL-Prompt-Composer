
import React, { useState, useEffect, useCallback } from 'react';
import { PromptComposer } from './components/PromptComposer';
import { GeneratedPromptView } from './components/GeneratedPromptView';
import { ResponseDisplay } from './components/ResponseDisplay';
import { generateContent } from './services/geminiService';
import type { SFLPrompt } from './types';
import { SFL_ICON } from './constants';

const App: React.FC = () => {
  const [promptComponents, setPromptComponents] = useState<SFLPrompt>({
    field: {
      topic: 'The impact of renewable energy on the global economy',
      taskVerb: 'Analyze',
      taskDescription: 'the key drivers, challenges, and future trends.',
      keyEntities: 'Solar, wind, geothermal energy, economic policies, developing nations',
      circumstances: 'Focus on the last decade (2015-2025).',
    },
    tenor: {
      persona: 'an expert energy analyst',
      audience: 'university students',
      tone: 'Formal and informative, but accessible',
      modality: 'State conclusions with high confidence, backed by evidence.',
    },
    mode: {
      format: 'A 500-word summary followed by a bulleted list of key takeaways.',
      structure: '1. Introduction, 2. Analysis of Drivers, 3. Challenges, 4. Future Trends, 5. Conclusion.',
      constraints: 'Avoid overly technical jargon. Ensure a logical flow between sections.',
    },
  });

  const [assembledPrompt, setAssembledPrompt] = useState<string>('');
  const [llmResponse, setLlmResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const assemble = () => {
      const { field, tenor, mode } = promptComponents;
      const prompt = `
### INSTRUCTION: Based on the context below, generate a response. ###

### SFL CONTEXT: FIELD (The "What") ###
- TOPIC: ${field.topic || 'Not specified'}
- TASK: ${field.taskVerb} ${field.taskDescription || ''}
- KEY ENTITIES TO CONSIDER: ${field.keyEntities || 'Not specified'}
- CIRCUMSTANCES & SCOPE: ${field.circumstances || 'Not specified'}

### SFL CONTEXT: TENOR (The "Who") ###
- YOUR PERSONA: You are ${tenor.persona || 'a helpful AI assistant'}.
- TARGET AUDIENCE: ${tenor.audience || 'a general audience'}.
- TONE & STYLE: ${tenor.tone || 'Neutral and informative'}.
- MODALITY / CONFIDENCE: ${tenor.modality || 'Express information factually.'}

### SFL CONTEXT: MODE (The "How") ###
- OUTPUT FORMAT: ${mode.format || 'A well-structured text.'}
- REQUIRED STRUCTURE: ${mode.structure || 'Standard paragraph format.'}
- CONSTRAINTS & RULES: ${mode.constraints || 'None.'}

---

BEGIN RESPONSE.
      `;
      setAssembledPrompt(prompt.trim());
    };
    assemble();
  }, [promptComponents]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLlmResponse('');
    try {
      const response = await generateContent(assembledPrompt);
      setLlmResponse(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [assembledPrompt]);

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-4">
            <span className="text-violet-400 w-12 h-12">{SFL_ICON}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
                SFL Prompt Composer
              </h1>
              <p className="text-slate-400 mt-1">
                Craft effective LLM prompts using Systemic Functional Linguistics.
              </p>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PromptComposer
            promptComponents={promptComponents}
            setPromptComponents={setPromptComponents}
          />
          <div className="space-y-8 flex flex-col">
            <GeneratedPromptView
              prompt={assembledPrompt}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
            <ResponseDisplay
              response={llmResponse}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
