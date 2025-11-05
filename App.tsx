
import React, { useState, useEffect, useCallback } from 'react';
import { PromptComposer } from './components/PromptComposer';
import { GeneratedPromptView } from './components/GeneratedPromptView';
import { ResponseDisplay } from './components/ResponseDisplay';
import { PromptWizardModal } from './components/PromptWizardModal';
import { HelpModal } from './components/HelpModal';
import { ValidationModal } from './components/ValidationModal';
import { UserInputModal } from './components/UserInputModal';
import { generateContent } from './services/geminiService';
import { getGeminiError } from './utils/errorHandler';
import type { SFLPrompt } from './types';
import { SFL_ICON, WIZARD_ICON, HELP_ICON, CONVERSATION_ICON } from './constants';
import { Button } from './components/ui/Button';
import { LiveConversation } from './components/LiveConversation';
import { usePromptValidator } from './hooks/usePromptValidator';

interface LlmResponse {
  text: string;
  sources: { uri: string; title: string }[];
}

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
  const [llmResponse, setLlmResponse] = useState<LlmResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isInputRequired, setIsInputRequired] = useState<boolean>(false);
  const [generationId, setGenerationId] = useState(0);
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [apiKeyHasFailed, setApiKeyHasFailed] = useState(false);
  const [apiKeyErrorDetails, setApiKeyErrorDetails] = useState<string | null>(null);
  const [latestContextForChat, setLatestContextForChat] = useState<{ prompt: string; response: string } | null>(null);


  const { validationResult, isLoading: isValidating } = usePromptValidator(promptComponents);

  useEffect(() => {
    const checkApiKey = async () => {
      if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
        setIsApiKeyReady(true);
      }
    };
    checkApiKey();
  }, []);

  // Update chat context whenever a new response is generated
  useEffect(() => {
    if (llmResponse) {
      setLatestContextForChat({ prompt: assembledPrompt, response: llmResponse.text });
    }
  }, [generationId, llmResponse, assembledPrompt]);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setApiKeyHasFailed(false);
      setApiKeyErrorDetails(null);
      setIsApiKeyReady(true);
    }
  };

  const handleApiKeyError = useCallback((message?: string) => {
    setApiKeyHasFailed(true);
    setApiKeyErrorDetails(message || 'An unknown error occurred.');
    setIsApiKeyReady(false);
  }, []);


  useEffect(() => {
    const assemble = () => {
      const { field, tenor, mode } = promptComponents;
      let prompt = `
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
      `;

      if (isInputRequired) {
        prompt += `

### USER PROVIDED INPUT ###
{{USER_INPUT}}
`;
      }

      prompt += `
---

BEGIN RESPONSE.
      `;
      setAssembledPrompt(prompt.trim());
    };
    assemble();
  }, [promptComponents, isInputRequired]);
  
  const performGeneration = useCallback(async (finalPrompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateContent(finalPrompt);
      setLlmResponse(response);
      setGenerationId(id => id + 1);
    } catch (e) {
      console.error("Generation failed:", e);
      const errorMessage = getGeminiError(e);
      if (errorMessage.includes('API key')) {
        handleApiKeyError(e instanceof Error ? e.message : String(e));
      }
      setError(`Failed to generate response: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiKeyError]);

  const handleGenerate = useCallback(async () => {
    if (isInputRequired) {
      setIsInputModalOpen(true);
    } else {
      performGeneration(assembledPrompt);
    }
  }, [isInputRequired, assembledPrompt, performGeneration]);
  
  const handleGenerateWithInput = useCallback(async (userInput: string) => {
    setIsInputModalOpen(false);
    const finalPrompt = assembledPrompt.replace(/### USER PROVIDED INPUT ###\s*{{USER_INPUT}}/, `### USER PROVIDED INPUT ###\n${userInput}`);
    performGeneration(finalPrompt);
  }, [assembledPrompt, performGeneration]);

  const handleWizardComplete = (newComponents: SFLPrompt) => {
    setPromptComponents(newComponents);
    setIsWizardOpen(false);
  };
  
  const handlePromptUpdateFromConversation = useCallback((updates: Partial<SFLPrompt>) => {
    setPromptComponents(prev => ({
        field: { ...prev.field, ...updates.field },
        tenor: { ...prev.tenor, ...updates.tenor },
        mode: { ...prev.mode, ...updates.mode },
    }));
  }, []);
  
  if (!isApiKeyReady && (window as any).aistudio) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-lg text-center">
          <div className="mx-auto w-12 h-12 text-violet-400 mb-4">{CONVERSATION_ICON}</div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">API Key Required</h2>
          
          {apiKeyHasFailed && (
             <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg p-3 mb-4 text-left">
                <p className="font-semibold">Connection failed with the last key.</p>
                <p className="text-xs text-red-400 mt-1">Please select a valid key from a project with billing enabled.</p>
                {apiKeyErrorDetails && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-medium text-red-400/80 hover:text-red-300">Show error details</summary>
                    <p className="mt-1 text-red-400/70 font-mono break-all">{apiKeyErrorDetails}</p>
                  </details>
                )}
            </div>
          )}

          <p className="text-slate-400 mb-6">
            The real-time "Converse & Refine" feature requires selecting an API key from a project with billing enabled.
          </p>
          <Button onClick={handleSelectKey} className="w-full">
            Select API Key & Enable Feature
          </Button>
          <p className="text-xs text-slate-500 mt-4">
            For more information on billing, visit{' '}
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
              ai.google.dev/gemini-api/docs/billing
            </a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PromptWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <ValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        validationResult={validationResult}
        isLoading={isValidating}
      />
      <UserInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSubmit={handleGenerateWithInput}
        isLoading={isLoading}
      />
      <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
        <div>
          <header className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="inline-flex items-center gap-4">
                  <span className="text-violet-400 w-12 h-12 flex-shrink-0">{SFL_ICON}</span>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
                      SFL Prompt Composer
                    </h1>
                    <p className="text-slate-400 mt-1">
                      Craft effective LLM prompts using Systemic Functional Linguistics.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => setIsHelpOpen(true)} className="bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 w-auto flex-shrink-0" aria-label="Open help guide">
                        <span className="w-5 h-5">{HELP_ICON}</span>
                    </Button>
                    <Button onClick={() => setIsWizardOpen(true)} className="bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 w-full sm:w-auto flex-shrink-0">
                    <span className="w-5 h-5 mr-2">{WIZARD_ICON}</span>
                    Prompt Wizard
                    </Button>
                </div>
            </div>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PromptComposer
              promptComponents={promptComponents}
              setPromptComponents={setPromptComponents}
              isInputRequired={isInputRequired}
              setIsInputRequired={setIsInputRequired}
            />
            <div className="space-y-8 flex flex-col">
              <GeneratedPromptView
                prompt={assembledPrompt}
                setPrompt={setAssembledPrompt}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                onOpenAnalysis={() => setIsValidationModalOpen(true)}
                validationResult={validationResult}
                isValidating={isValidating}
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

      {isApiKeyReady && (
        <LiveConversation
          onUpdatePrompt={handlePromptUpdateFromConversation}
          onApiKeyError={handleApiKeyError}
          latestContext={latestContextForChat}
          systemInstruction={`You are a helpful AI assistant. The user wants to refine a prompt or its response. Your primary tool is 'updatePromptComponents'. Listen for instructions to change the prompt's topic, persona, tone, format, etc., and use the tool to apply these changes in real-time. Do not ask for confirmation before using the tool. After a successful update, briefly confirm what you've changed.`}
        />
      )}
    </>
  );
};

export default App;
