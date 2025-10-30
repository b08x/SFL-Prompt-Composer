export const formatResponse = (text: string): string => {
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
        
        // Handle headings
        if (trimmedBlock.startsWith('# ')) {
             return `<h2>${trimmedBlock.substring(2)}</h2>`;
        }

        // Otherwise, it's a paragraph. Replace single newlines with <br> for line breaks.
        return `<p>${trimmedBlock.replace(/\n/g, '<br />')}</p>`;
    });

    return htmlBlocks.join('');
};
