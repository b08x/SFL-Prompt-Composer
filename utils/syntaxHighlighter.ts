export const highlightSFLSyntax = (text: string): string => {
  if (!text) return '';

  // Escape HTML to prevent XSS and rendering issues
  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const lines = text.split('\n');
  const highlightedLines = lines.map(line => {
    const escapedLine = escapeHtml(line);
    
    // Section headers (e.g., ### INSTRUCTION: ###)
    if (escapedLine.trim().startsWith('###')) {
      return `<span class="text-violet-400 font-semibold">${escapedLine}</span>`;
    }

    // Keys (e.g., - TOPIC:)
    const keyMatch = escapedLine.match(/^(\s*- [A-Z\s/&]+:)/);
    if (keyMatch) {
      const key = keyMatch[1];
      const value = escapedLine.substring(key.length);
      
      // Special highlighting for the persona value
      if (key.includes('PERSONA')) {
          const personaValueMatch = value.match(/(\s*You are\s)(.*)/);
          if (personaValueMatch) {
              return `<span class="text-cyan-400">${key}</span>${personaValueMatch[1]}<span class="text-emerald-300">${personaValueMatch[2]}</span>`;
          }
      }
      
      return `<span class="text-cyan-400">${key}</span><span class="text-slate-300">${value}</span>`;
    }
    
    // Default lines (like "BEGIN RESPONSE.")
    if (escapedLine.trim() !== '') {
        return `<span class="text-slate-300">${escapedLine}</span>`;
    }
    
    return escapedLine; // Return empty lines as is
  });

  return highlightedLines.join('\n');
};
