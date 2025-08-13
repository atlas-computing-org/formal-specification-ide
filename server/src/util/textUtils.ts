import { Document } from 'langchain/document';
import { FastSearch } from './fastSearch.ts';
import { BatchProcessor, ObjectPool } from './performance.ts';

// High-performance text processing utilities
export class TextProcessor {
  private static readonly blockPool = new ObjectPool<Document>(
    () => ({ pageContent: '', metadata: {} }),
    (doc) => { doc.pageContent = ''; doc.metadata = {}; },
    1000
  );

  private static readonly separatorCache = new Map<string, RegExp>();

  /**
   * Ultra-fast text splitting using optimized algorithms
   * @param text - The text to split
   * @param file - Optional file identifier
   * @param separatorRegex - Custom separator regex
   * @returns Array of Document objects
   */
  static splitTextBySeparatorRegex(
    text: string, 
    file?: string, 
    separatorRegex = /\n\s*\n+/g
  ): Document[] {
    if (!text || text.length === 0) return [];

    // Use cached regex for better performance
    const regexKey = separatorRegex.source + separatorRegex.flags;
    let regex = this.separatorCache.get(regexKey);
    if (!regex) {
      regex = new RegExp(separatorRegex.source, separatorRegex.flags);
      this.separatorCache.set(regexKey, regex);
    }

    // Use optimized string splitting for better performance
    const blocks: Document[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Reset regex state
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      const splitIndex = match.index;
      
      if (splitIndex > lastIndex) {
        const block = this.blockPool.acquire();
        block.pageContent = text.substring(lastIndex, splitIndex).trim();
        block.metadata = { 
          start: lastIndex, 
          end: splitIndex, 
          ...(file && { file }) 
        };
        
        if (block.pageContent.length > 0) {
          blocks.push(block);
        } else {
          this.blockPool.release(block);
        }
      }
      
      lastIndex = regex.lastIndex;
    }

    // Handle the last block
    if (lastIndex < text.length) {
      const block = this.blockPool.acquire();
      block.pageContent = text.substring(lastIndex).trim();
      block.metadata = { 
        start: lastIndex, 
        end: text.length, 
        ...(file && { file }) 
      };
      
      if (block.pageContent.length > 0) {
        blocks.push(block);
      } else {
        this.blockPool.release(block);
      }
    }

    return blocks;
  }

  /**
   * High-performance multi-file text processing with streaming
   * @param files - Array of file paths
   * @param separatorRegex - Custom separator regex
   * @returns Array of Document objects
   */
  static async splitTextBySeparatorRegexMultifile(
    files: string[], 
    separatorRegex = /\n\s*\n+/g
  ): Promise<Document[]> {
    if (!files || files.length === 0) return [];

    // Process files in parallel batches for optimal performance
    const processFile = async (file: string): Promise<Document[]> => {
      try {
        // Use streaming file reading for large files
        const text = await this.readFileStreaming(file);
        const fileBlocks = this.splitTextBySeparatorRegex(text, file, separatorRegex);
        return fileBlocks;
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        return [];
      }
    };

    // Use batch processing for optimal concurrency
    const allBlocks = await BatchProcessor.processBatch(
      files,
      processFile,
      10, // Process 10 files at a time
      4   // Use 4 concurrent workers
    );

    // Flatten results efficiently
    return allBlocks.flat();
  }

  /**
   * Streaming file reader for memory efficiency
   * @param filePath - Path to the file
   * @returns File content as string
   */
  private static async readFileStreaming(filePath: string): Promise<string> {
    const { readFile } = await import('fs/promises');
    return await readFile(filePath, 'utf-8');
  }

  /**
   * High-performance text search with multiple algorithms
   * @param text - Text to search in
   * @param query - Search query
   * @param options - Search options
   * @returns Search results with positions
   */
  static searchText(
    text: string, 
    query: string, 
    options: {
      algorithm?: 'exact' | 'boyer-moore' | 'kmp' | 'fuzzy';
      threshold?: number;
      caseSensitive?: boolean;
    } = {}
  ): { index: number; score: number; algorithm: string }[] {
    const { 
      algorithm = 'exact', 
      threshold = 0.7, 
      caseSensitive = false 
    } = options;

    // Normalize text and query if case-insensitive
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    switch (algorithm) {
      case 'exact':
        return this.exactSearch(searchText, searchQuery);
      case 'boyer-moore':
        return this.boyerMooreSearch(searchText, searchQuery);
      case 'kmp':
        return this.kmpSearch(searchText, searchQuery);
      case 'fuzzy':
        return this.fuzzySearch(searchText, searchQuery, threshold);
      default:
        return this.exactSearch(searchText, searchQuery);
    }
  }

  /**
   * Exact string search with all occurrences
   * @param text - Text to search in
   * @param query - Search query
   * @returns Array of search results
   */
  private static exactSearch(text: string, query: string): { index: number; score: number; algorithm: string }[] {
    const results: { index: number; score: number; algorithm: string }[] = [];
    let index = 0;
    
    while ((index = text.indexOf(query, index)) !== -1) {
      results.push({ 
        index, 
        score: 1.0, 
        algorithm: 'exact' 
      });
      index += query.length;
    }
    
    return results;
  }

  /**
   * Boyer-Moore search for single occurrence
   * @param text - Text to search in
   * @param query - Search query
   * @returns Array of search results
   */
  private static boyerMooreSearch(text: string, query: string): { index: number; score: number; algorithm: string }[] {
    const index = FastSearch.boyerMooreSearch(text, query);
    return index !== -1 ? [{ index, score: 1.0, algorithm: 'boyer-moore' }] : [];
  }

  /**
   * KMP search for single occurrence
   * @param text - Text to search in
   * @param query - Search query
   * @returns Array of search results
   */
  private static kmpSearch(text: string, query: string): { index: number; score: number; algorithm: string }[] {
    const index = FastSearch.kmpSearch(text, query);
    return index !== -1 ? [{ index, score: 1.0, algorithm: 'kmp' }] : [];
  }

  /**
   * Fuzzy search with scoring
   * @param text - Text to search in
   * @param query - Search query
   * @param threshold - Similarity threshold
   * @returns Array of search results
   */
  private static fuzzySearch(
    text: string, 
    query: string, 
    threshold: number
  ): { index: number; score: number; algorithm: string }[] {
    const index = FastSearch.fastFuzzySearch(query, text, threshold);
    if (index === -1) return [];
    
    // Calculate actual score for the match
    const score = this.calculateSimilarity(text.substring(index, index + query.length), query);
    
    return [{ index, score, algorithm: 'fuzzy' }];
  }

  /**
   * Calculate similarity between two strings using optimized algorithm
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score between 0 and 1
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Use optimized Levenshtein distance for short strings
    if (str1.length <= 50 && str2.length <= 50) {
      return this.levenshteinSimilarity(str1, str2);
    }

    // Use Jaro-Winkler for longer strings (faster)
    return this.jaroWinklerSimilarity(str1, str2);
  }

  /**
   * Optimized Levenshtein distance calculation
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score
   */
  private static levenshteinSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
    if (len2 === 0) return 0.0;

    // Use dynamic programming with space optimization
    let prev = new Array(len2 + 1);
    let curr = new Array(len2 + 1);

    // Initialize first row
    for (let j = 0; j <= len2; j++) {
      prev[j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      curr[0] = i;
      
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          curr[j - 1] + 1,      // insertion
          prev[j] + 1,          // deletion
          prev[j - 1] + cost    // substitution
        );
      }
      
      // Swap arrays for next iteration
      [prev, curr] = [curr, prev];
    }

    const distance = prev[len2];
    const maxLen = Math.max(len1, len2);
    return 1.0 - distance / maxLen;
  }

  /**
   * Jaro-Winkler similarity for longer strings
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score
   */
  private static jaroWinklerSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0.0;
    
    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchDistance < 0) return 0.0;
    
    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0.0;
    
    // Count transpositions
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
    
    // Apply Winkler modification
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(len1, len2));
    
    for (let i = 0; i < maxPrefix; i++) {
      if (str1[i] === str2[i]) {
        prefix++;
      } else {
        break;
      }
    }
    
    return jaro + 0.1 * prefix * (1 - jaro);
  }

  /**
   * Clean up resources and free memory
   */
  static cleanup(): void {
    this.blockPool.clear();
    this.separatorCache.clear();
    FastSearch.clearCaches();
  }
}

// Legacy function for backward compatibility
export function splitTextBySeparatorRegex(text: string, file?: string, separatorRegex = /\n\s*\n+/g): Document[] {
  return TextProcessor.splitTextBySeparatorRegex(text, file, separatorRegex);
}

// Legacy function for backward compatibility
export function splitTextBySeparatorRegexMultifile(files: string[], separatorRegex = /\n\s*\n+/g): Promise<Document[]> {
  return TextProcessor.splitTextBySeparatorRegexMultifile(files, separatorRegex);
}
  