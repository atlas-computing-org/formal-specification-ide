import { Document } from "langchain/document";
import { readFileSync } from "fs";

/**
 * Splits text into blocks by separators which satisfy some given regex.
 * Default separator consists of two newlines with optional whitespace in between. 
 * Each block includes its (incl) start and (excl) end indices in the original text.
 */
export function splitTextBySeparatorRegex(text: string, file?: string, separatorRegex = /\n\s*\n+/g): Document[] {
  const blocks: Document[] = [];
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = separatorRegex.exec(text)) !== null) {
    const splitIndex = match.index;
    blocks.push({
      pageContent: text.slice(lastIndex, splitIndex),
      metadata: {start: lastIndex, end: splitIndex, ...(file && {file})},
    });
    lastIndex = separatorRegex.lastIndex;
  }
 
  // Add the final block
  if (lastIndex < text.length) {
    blocks.push({
      pageContent: text.slice(lastIndex),
      metadata: {start: lastIndex, end: text.length, ...(file && {file})},
    });
  }
  
  return blocks;
}

/**
 * Splits multiple files into blocks by separators which satisfy some given regex.
 * Each block includes its (incl) start and (excl) end indices in the original text and the file path.
 */
export function splitTextBySeparatorRegexMultifile(files: string[], separatorRegex = /\n\s*\n+/g): Document[] {
  const blocks: Document[] = [];
  
  for (const file of files) {
    const fileText = readFileSync(file, 'utf-8');
    const fileBlocks = splitTextBySeparatorRegex(fileText, file, separatorRegex);
    blocks.push(...fileBlocks);
  }
  
  return blocks;
}
  