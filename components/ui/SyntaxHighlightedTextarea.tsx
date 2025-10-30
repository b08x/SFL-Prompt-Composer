import React, { useRef } from 'react';
import { highlightSFLSyntax } from '../../utils/syntaxHighlighter';

interface SyntaxHighlightedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
}

export const SyntaxHighlightedTextarea: React.FC<SyntaxHighlightedTextareaProps> = ({ value, className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Append a newline to ensure the last line is rendered and the textarea has scroll space
  const highlightedText = highlightSFLSyntax(value + '\n');
  
  return (
    <div className="relative w-full h-full bg-slate-900/50 rounded-md overflow-hidden border border-slate-700/50">
        <pre
            ref={backdropRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full p-4 m-0 font-mono text-sm overflow-auto whitespace-pre-wrap pointer-events-none"
        >
            <code dangerouslySetInnerHTML={{ __html: highlightedText }} />
        </pre>
      <textarea
        ref={textareaRef}
        className={`absolute inset-0 w-full h-full bg-transparent text-transparent caret-slate-200 resize-none border-none focus:ring-0 p-4 m-0 font-mono text-sm focus:outline-none whitespace-pre-wrap ${className}`}
        value={value}
        onScroll={handleScroll}
        spellCheck="false"
        {...props}
      />
    </div>
  );
};
