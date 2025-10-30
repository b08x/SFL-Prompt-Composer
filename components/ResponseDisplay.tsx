import React from 'react';
import { Card } from './ui/Card';
import { formatResponse } from '../utils/textUtils';

interface ResponseDisplayProps {
  response: string;
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
          <div className="text-slate-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatResponse(response) }} />
        ) : (
          <p className="text-slate-500 italic">Response will appear here...</p>
        )}
      </div>
    </Card>
  );
};