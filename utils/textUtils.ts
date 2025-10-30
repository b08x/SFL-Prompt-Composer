export const formatResponse = (text: string): string => {
    if (!text) return '';

    const codeBlocks: string[] = [];
    // 1. Isolate and escape code blocks first to prevent them from being parsed as markdown
    let processedText = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        codeBlocks.push(`<pre class="bg-slate-900/70 rounded-md p-4 text-sm font-mono overflow-x-auto"><code class="language-${lang || ''}">${escapedCode.trim()}</code></pre>`);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 2. Process inline markdown elements
    const processInlines = (str: string): string => {
        return str
            // Links: [text](url)
            .replace(
                /\[([^\]]+)\]\(([^)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:underline">$1</a>'
            )
            // Bold & Italic: ***text***
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            // Bold: **text** or __text__
            .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
            // Italics: *text* or _text_
            .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
            // Inline Code: `code`
            .replace(/`([^`]+)`/g, '<code class="bg-slate-700/50 rounded px-1.5 py-0.5 text-sm font-mono text-violet-300">$1</code>');
    };

    // 3. Process block elements
    const blocks = processedText.split(/\n\s*\n/); // Split by one or more empty lines

    const htmlBlocks = blocks.map(block => {
        let trimmedBlock = block.trim();

        // Pass-through for code block placeholders
        if (trimmedBlock.startsWith('__CODE_BLOCK_')) {
            return trimmedBlock;
        }

        // Handle blockquotes first, as they can contain other elements
        if (trimmedBlock.startsWith('>')) {
            const quoteLines = trimmedBlock.split('\n').map(line => 
                line.startsWith('>') ? line.substring(1).trim() : line
            );
            return `<blockquote class="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-4">${processInlines(quoteLines.join('\n')).replace(/\n/g, '<br />')}</blockquote>`;
        }

        const lines = trimmedBlock.split('\n');

        // Lists
        const isUnorderedList = lines.every(line => /^\s*(\*|-)\s/.test(line));
        const isOrderedList = lines.every(line => /^\s*\d+\.\s/.test(line));

        if (isUnorderedList) {
            const listItems = lines.map(line => `<li>${processInlines(line.trim().substring(2))}</li>`).join('');
            return `<ul class="list-disc list-inside my-4 space-y-1">${listItems}</ul>`;
        }
        if (isOrderedList) {
            const listItems = lines.map(line => `<li>${processInlines(line.trim().replace(/^\d+\.\s/, ''))}</li>`).join('');
            return `<ol class="list-decimal list-inside my-4 space-y-1">${listItems}</ol>`;
        }
        
        // Headings (h1 to h6)
        const headingMatch = trimmedBlock.match(/^(#{1,6})\s(.*)/);
        if (headingMatch && lines.length === 1) { // Headings should be single-line blocks
             const level = headingMatch[1].length;
             return `<h${level}>${processInlines(headingMatch[2])}</h${level}>`;
        }
        
        // Horizontal rules
        if (lines.length === 1 && (trimmedBlock === '---' || trimmedBlock === '***' || trimmedBlock === '___')) {
            return '<hr class="border-slate-700 my-6" />';
        }

        // Paragraphs
        if (trimmedBlock) {
             return `<p>${processInlines(trimmedBlock).replace(/\n/g, '<br />')}</p>`;
        }
        
        return '';
    });

    let finalHtml = htmlBlocks.filter(b => b).join('');

    // 4. Restore code blocks
    finalHtml = finalHtml.replace(/<p>__CODE_BLOCK_(\d+)__<\/p>|__CODE_BLOCK_(\d+)__/g, (match, p1, p2) => {
        const index = parseInt(p1 || p2, 10);
        return codeBlocks[index];
    });

    return finalHtml;
};
