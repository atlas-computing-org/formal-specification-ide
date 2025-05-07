import { Document } from "langchain/document";

/**
 * Splits text into blocks separated by at least two newlines
 * with optional whitespace in between. Each block includes its
 * (inclusive) start and (exclusive) end indices in the original text.
 */
export function splitText(text: string): Document[] {
  const separatorRegex = /\n\s*\n+/g;
  const blocks: Document[] = [];
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;


  while ((match = separatorRegex.exec(text)) !== null) {
    const splitIndex = match.index;
    blocks.push({
      pageContent: text.slice(lastIndex, splitIndex),
      metadata: {start: lastIndex, end: splitIndex},
    });
    lastIndex = separatorRegex.lastIndex;
  }
 
  // Add the final block
  if (lastIndex < text.length) {
    blocks.push({
      pageContent: text.slice(lastIndex),
      metadata: {start: lastIndex, end: text.length},
    });
  }
  
  return blocks;
}
  