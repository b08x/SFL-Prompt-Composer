import React from 'react';
import { Card } from './ui/Card';

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

const formatResponse = (text: string): string => {
    if (!text) return '';

    // Process inline markdown elements first
    let processedText = text
        // Links: [text](url)
        .replace(
            /\[([^\]]+)\]\(([^)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">$1</a>'
        )
        // Bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
        // Italics: *text* or _text_
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');

    // Process block elements like paragraphs and lists
    const blocks = processedText.split('\n\n');

    const htmlBlocks = blocks.map(block => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return '';

        const lines = trimmedBlock.split('\n');

        // Check for lists
        const isUnorderedList = lines.every(line => line.trim().startsWith('* ') || line.trim().startsWith('- '));
        const isOrderedList = lines.every(line => /^\d+\.\s/.test(line.trim()));

        if (isUnorderedList) {
            const listItems = lines.map(line => `<li>${line.trim().substring(2)}</li>`).join('');
            return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
        }
        if (isOrderedList) {
            const listItems = lines.map(line => `<li>${line.trim().replace(/^\d+\.\s/, '')}</li>`).join('');
            return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
        }

        // Otherwise, it's a paragraph. Replace single newlines with <br> for line breaks.
        return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
    });

    return htmlBlocks.join('');
};


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
