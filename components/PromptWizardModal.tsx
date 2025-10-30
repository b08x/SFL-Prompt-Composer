
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeTextForSFL } from '../services/geminiService';
import type { SFLPrompt } from '../types';
import { getGeminiError } from '../utils/errorHandler';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Textarea } from './ui/Textarea';
import { WIZARD_ICON } from '../constants';
import { PromptComposer } from './PromptComposer';

interface PromptWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (promptComponents: SFLPrompt) => void;
}

export const PromptWizardModal: React.FC<PromptWizardModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [sourceText, setSourceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [analyzedComponents, setAnalyzedComponents] = useState<SFLPrompt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state after a short delay to allow for closing animations
      const timer = setTimeout(() => {
        setStep('input');
        setAnalyzedComponents(null);
        setError(null);
        setSourceText('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    if (!sourceText.trim()) {
      setError('Please provide some text or upload a file to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeTextForSFL(sourceText);
      setAnalyzedComponents(result);
      setStep('review');
    } catch (e) {
      console.error("Analysis failed:", e);
      setError(getGeminiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setSourceText(text);
      };
      reader.readAsText(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleBack = () => {
    setStep('input');
    setAnalyzedComponents(null);
  };

  const handleApply = () => {
    if (analyzedComponents) {
      onComplete(analyzedComponents);
    }
  };

  const handleComponentChange = (updater: React.SetStateAction<SFLPrompt>) => {
    setAnalyzedComponents(currentComponents => {
        if (!currentComponents) return null;
        if (typeof updater === 'function') {
            return updater(currentComponents);
        }
        return updater;
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {step === 'input' ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 text-violet-400 flex-shrink-0">{WIZARD_ICON}</span>
                  <h2 className="text-2xl font-bold text-slate-100">
                    Prompt Wizard
                  </h2>
                </div>
                <button onClick={handleClose} disabled={isLoading} className="text-slate-500 hover:text-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                  <span className="sr-only">Close wizard</span>
                </button>
              </div>
              <p className="text-slate-400 mb-6">
                Paste text or upload a document (.txt, .md). The wizard will analyze it and pre-fill the SFL components for you.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="sourceText">Source Text</Label>
                  <Textarea
                    id="sourceText"
                    name="sourceText"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    rows={10}
                    placeholder="Paste your content here..."
                    className="min-h-[200px] font-mono text-sm"
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md border border-red-800/50">{error}</p>}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.md,text/plain" className="hidden" disabled={isLoading} />
                  <Button onClick={triggerFileSelect} className="w-full bg-slate-700 hover:bg-slate-600 focus:ring-slate-500" disabled={isLoading}>
                    Upload File
                  </Button>
                  <Button onClick={handleAnalyze} className="w-full" disabled={isLoading || !sourceText.trim()}>
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : 'Analyze & Populate'}
                  </Button>
                </div>
              </div>
            </>
        ) : (
            <>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                    <span className="w-8 h-8 text-violet-400 flex-shrink-0">{WIZARD_ICON}</span>
                    <h2 className="text-2xl font-bold text-slate-100">Review Components</h2>
                    </div>
                    <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        <span className="sr-only">Close wizard</span>
                    </button>
                </div>
                <p className="text-slate-400 mb-6">
                    Review and edit the components suggested by the AI before applying them.
                </p>

                <div className="max-h-[55vh] overflow-y-auto pr-2 -mr-4 space-y-6">
                    {analyzedComponents && (
                        <PromptComposer 
                            promptComponents={analyzedComponents} 
                            setPromptComponents={handleComponentChange}
                        />
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-700">
                    <Button onClick={handleBack} className="w-full bg-slate-700 hover:bg-slate-600 focus:ring-slate-500">
                        Back
                    </Button>
                    <Button onClick={handleApply} className="w-full">
                        Apply Components
                    </Button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
