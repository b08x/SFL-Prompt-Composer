import { marked } from 'marked';
import React, { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function parseMarkdownIntoBlocks(markdown: string): string[] {
  if (!markdown) return [];
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 border-b border-slate-700 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
          a: ({node, ...props}) => <a className="text-violet-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 pl-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 pl-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          code: ({node, inline, className, children, ...props}) => {
            return !inline ? (
              <pre className="bg-slate-900/70 rounded-md p-4 my-4 overflow-x-auto">
                <code className={`font-mono text-sm ${className}`} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-slate-700/50 rounded px-1.5 py-0.5 text-sm font-mono text-violet-300" {...props}>
                {children}
              </code>
            );
          },
          table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="table-auto w-full border-collapse border border-slate-600" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-slate-700/50" {...props} />,
          th: ({node, ...props}) => <th className="border border-slate-600 px-4 py-2 text-left font-semibold" {...props} />,
          td: ({node, ...props}) => <td className="border border-slate-600 px-4 py-2" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-4" {...props} />,
          hr: ({node, ...props}) => <hr className="border-slate-700 my-6" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content,
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

export const MemoizedMarkdown = memo(
  ({ content, id }: { content: string; id: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);
    
    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
    ));
  },
   (prevProps, nextProps) => prevProps.content === nextProps.content && prevProps.id === nextProps.id
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';