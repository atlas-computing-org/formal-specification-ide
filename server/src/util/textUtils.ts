import { Document } from "@langchain/core/documents.js";

/**
 * Splits text into segments separated by at least two newlines
 * with optional whitespace in between. Each segment includes its
 * (inclusive) start and (exclusive) end indices in the original text.
 */
export function splitText(text: string): Document[] {
  const separatorRegex = /\n\s*\n+/g;
  const segmentsWithIndices: Document[] = [];
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;


  while ((match = separatorRegex.exec(text)) !== null) {
    const splitIndex = match.index;
    segmentsWithIndices.push({
      pageContent: text.slice(lastIndex, splitIndex),
      metadata: {start: lastIndex, end: splitIndex},
    });
    lastIndex = separatorRegex.lastIndex;
  }
 
  // Add the final segment
  if (lastIndex < text.length) {
    segmentsWithIndices.push({
      pageContent: text.slice(lastIndex),
      metadata: {start: lastIndex, end: text.length},
    });
  }
  
  return segmentsWithIndices;
}
  