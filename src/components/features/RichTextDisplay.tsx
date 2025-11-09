import React from 'react';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
  const formatContent = (text: string) => {
    // Convert markdown-style formatting to HTML
    const formattedText = text
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Lists: • item -> <li>item</li>
      .replace(/^•\s+(.*)$/gm, '<li>$1</li>')
      // Links: [text](url) -> <a href="url">text</a>
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');

    // Wrap lists in <ul> tags
    const lines = formattedText.split('<br />');
    const processedLines = lines.map((line, index) => {
      if (line.startsWith('<li>')) {
        // Check if previous line was also a list item
        const prevLine = index > 0 ? lines[index - 1] : '';
        const nextLine = index < lines.length - 1 ? lines[index + 1] : '';
        
        if (!prevLine.startsWith('<li>') && !prevLine.includes('<ul>')) {
          // Start of a list
          return `<ul class="list-disc list-inside ml-4 mb-2">${line}`;
        } else if (!nextLine.startsWith('<li>') && !nextLine.includes('</ul>')) {
          // End of a list
          return `${line}</ul>`;
        }
      }
      return line;
    });

    return processedLines.join('<br />');
  };

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: formatContent(content) }}
    />
  );
}; 