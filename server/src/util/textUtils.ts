import { Document } from "langchain/document";

/**
 * Splits text into blocks by separators which satisfy some given regex.
 * Default separator consists of two newlines with optional whitespace in between. 
 * Each block includes its (incl) start and (excl) end indices in the original text.
 */
export function splitTextBySeparatorRegex(text: string, separatorRegex = /\n\s*\n+/g): Document[] {
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
  