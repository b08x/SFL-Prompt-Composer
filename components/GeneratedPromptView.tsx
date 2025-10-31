import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SFL_ICON, VALIDATION_ICON } from '../constants';
import { SyntaxHighlightedTextarea } from './ui/SyntaxHighlightedTextarea';
import type { ValidationResult } from '../types';

interface GeneratedPromptViewProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onOpenAnalysis: () => void;
  validationResult: ValidationResult | null;
  isValidating: boolean;
}

export const GeneratedPromptView: React.FC<GeneratedPromptViewProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
  onOpenAnalysis,
  validationResult,
  isValidating,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400 border-green-400/50 hover:bg-green-400/10';
    if (score >= 70) return 'text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10';
    return 'text-red-400 border-red-400/50 hover:bg-red-400/10';
  };
  const score = validationResult?.score ?? 0;

  return (
    <Card className="flex flex-col flex-grow">
       <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-100">Assembled Prompt</h2>
        <button
          onClick={onOpenAnalysis}
          disabled={isValidating && !validationResult}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 border rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait ${isValidating && !validationResult ? 'border-slate-600 text-slate-400' : getScoreColor(score)}`}
          aria-label="Open prompt analysis"
        >
          {isValidating && !validationResult ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span className={`w-5 h-5 ${isValidating ? 'animate-pulse' : ''}`}>{VALIDATION_ICON}</span>
              <span>Analysis: <span className="font-bold">{score}/100</span></span>
            </>
          )}
        </button>
      </div>
      <div className="flex-grow mb-4 min-h-[24rem] max-h-96">
        <SyntaxHighlightedTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          aria-label="Assembled Prompt"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
            onClick={handleCopy} 
            className="w-full bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
            disabled={isLoading}
        >
          {isCopied ? 'Copied!' : 'Copy Prompt'}
        </Button>
        <Button onClick={onGenerate} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <span className="w-5 h-5 mr-2">{SFL_ICON}</span>
              Generate Response
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
