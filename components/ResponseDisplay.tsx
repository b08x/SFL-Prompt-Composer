
import React from 'react';
import { Card } from './ui/Card';
import { MemoizedMarkdown } from './ui/MemoizedMarkdown';
import type { GenerateContentResult } from '../types';

interface ResponseDisplayProps {
  response: GenerateContentResult | null;
  isLoading: boolean;
  error: string | null;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
);

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, isLoading, error }) => {
  return (
    <Card className="flex flex-col flex-grow">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">LLM Response</h2>
      <div className="flex-grow bg-slate-900/50 rounded-md p-4 overflow-auto min-h-[200px]">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-red-400">
            <h3 className="font-semibold">Error</h3>
            <p>{error}</p>
          </div>
        ) : response ? (
          <div>
            <div className="text-slate-300 prose prose-invert prose-sm max-w-none">
              <MemoizedMarkdown content={response.text} id="llm-response" />
            </div>
            {response.sources && response.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Sources</h4>
                <ul className="space-y-2">
                  {response.sources.map((source, index) => (
                    <li key={index} className="text-xs">
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-violet-400 hover:text-violet-300 hover:underline flex items-start gap-2"
                        title={source.uri}
                      >
                         <span className="flex-shrink-0 bg-slate-700 rounded-full w-4 h-4 text-center leading-4 text-slate-400 text-[10px]">{index + 1}</span>
                         <span className="truncate flex-grow">{source.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 italic">Response will appear here...</p>
        )}
      </div>
    </Card>
  );
};
