
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { SFL_ICON } from '../constants';

interface GeneratedPromptViewProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const GeneratedPromptView: React.FC<GeneratedPromptViewProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isLoading,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Card className="flex flex-col flex-grow">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Assembled Prompt</h2>
      <div className="flex-grow bg-slate-900/50 rounded-md mb-4 overflow-auto max-h-96">
        <textarea
          className="w-full h-full bg-transparent text-sm text-slate-300 whitespace-pre-wrap font-mono resize-none border-none focus:ring-0 p-4 focus:outline-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={15}
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
