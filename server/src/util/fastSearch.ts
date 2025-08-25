import { LRUCache } from './performance.ts';

// Ultra-fast search algorithms optimized for performance
export class FastSearch {
  private static readonly searchCache = new LRUCache<string, number>(10000, 300000);
  private static readonly patternCache = new Map<string, RegExp>();
  private static readonly boyerMooreCache = new Map<string, BoyerMoorePattern>();

  // Boyer-Moore string search algorithm - O(n/m) average case
  static boyerMooreSearch(text: string, pattern: string): number {
    if (pattern.length === 0) return 0;
    if (pattern.length > text.length) return -1;

    const cacheKey = `bm:${pattern}`;
    let bmPattern = this.boyerMooreCache.get(cacheKey);
    
    if (!bmPattern) {
      bmPattern = new BoyerMoorePattern(pattern);
      this.boyerMooreCache.set(cacheKey, bmPattern);
    }

    return bmPattern.search(text);
  }

  // Knuth-Morris-Pratt algorithm for multiple pattern matching
  static kmpSearch(text: string, pattern: string): number {
    if (pattern.length === 0) return 0;
    if (pattern.length > text.length) return -1;

    const lps = this.computeLPS(pattern);
    let i = 0, j = 0;

    while (i < text.length) {
      if (pattern[j] === text[i]) {
        i++;
        j++;
      }

      if (j === pattern.length) {
        return i - j;
      } else if (i < text.length && pattern[j] !== text[i]) {
        if (j !== 0) {
          j = lps[j - 1];
        } else {
          i++;
        }
      }
    }

    return -1;
  }

  // Ultra-fast fuzzy search using optimized algorithms
  static fastFuzzySearch(query: string, text: string, threshold: number = 0.7): number {
    const cacheKey = `${query}:${text.length}:${threshold}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached !== undefined) return cached;

    // Try exact match first (fastest)
    const exactIndex = text.indexOf(query);
    if (exactIndex !== -1) {
      this.searchCache.set(cacheKey, exactIndex);
      return exactIndex;
    }

    // Try Boyer-Moore for substrings
    if (query.length > 3) {
      const bmResult = this.boyerMooreSearch(text, query);
      if (bmResult !== -1) {
        this.searchCache.set(cacheKey, bmResult);
        return bmResult;
      }
    }

    // Use optimized fuzzy matching for similar strings
    const result = this.optimizedFuzzyMatch(query, text, threshold);
    this.searchCache.set(cacheKey, result);
    return result;
  }

  // Optimized fuzzy matching using sliding window and early termination
  private static optimizedFuzzyMatch(query: string, text: string, threshold: number): number {
    if (query.length === 0) return 0;
    if (query.length > text.length) return -1;

    const queryLength = query.length;
    const textLength = text.length;
    let bestScore = 0;
    let bestIndex = -1;

    // Use sliding window with early termination
    for (let i = 0; i <= textLength - queryLength; i++) {
      let score = 0;
      let consecutive = 0;
      let maxConsecutive = 0;

      for (let j = 0; j < queryLength; j++) {
        if (text[i + j] === query[j]) {
          score++;
          consecutive++;
          maxConsecutive = Math.max(maxConsecutive, consecutive);
        } else {
          consecutive = 0;
        }

        // Early termination if score is too low
        if (score + (queryLength - j - 1) < threshold * queryLength) {
          break;
        }
      }

      // Calculate final score with consecutive bonus
      const finalScore = (score + maxConsecutive * 0.1) / queryLength;
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestIndex = i;
        
        // Early termination if we found a perfect match
        if (bestScore >= threshold) {
          break;
        }
      }
    }

    return bestScore >= threshold ? bestIndex : -1;
  }

  // Compute Longest Proper Prefix which is also Suffix for KMP
  private static computeLPS(pattern: string): number[] {
    const lps = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }

    return lps;
  }

  // Multi-pattern search using Aho-Corasick algorithm
  static multiPatternSearch(text: string, patterns: string[]): Map<string, number[]> {
    const results = new Map<string, number[]>();
    const trie = this.buildAhoCorasickTrie(patterns);
    
    let currentState = trie.root;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Follow failure links until we find a valid transition
      while (currentState && !currentState.transitions.has(char)) {
        currentState = currentState.failure;
      }
      
      if (!currentState) {
        currentState = trie.root;
        continue;
      }
      
      currentState = currentState.transitions.get(char)!;
      
      // Check for matches at current state
      if (currentState.output.length > 0) {
        for (const pattern of currentState.output) {
          if (!results.has(pattern)) {
            results.set(pattern, []);
          }
          results.get(pattern)!.push(i - pattern.length + 1);
        }
      }
    }
    
    return results;
  }

  // Build Aho-Corasick trie for multi-pattern matching
  private static buildAhoCorasickTrie(patterns: string[]): { root: ACNode } {
    const root = new ACNode();
    
    // Build trie
    for (const pattern of patterns) {
      let current = root;
      for (const char of pattern) {
        if (!current.transitions.has(char)) {
          current.transitions.set(char, new ACNode());
        }
        current = current.transitions.get(char)!;
      }
      current.output.push(pattern);
    }
    
    // Build failure links using BFS
    const queue: ACNode[] = [];
    for (const [, node] of root.transitions) {
      node.failure = root;
      queue.push(node);
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const [char, child] of current.transitions) {
        queue.push(child);
        
        let failure = current.failure;
        while (failure && !failure.transitions.has(char)) {
          failure = failure.failure;
        }
        
        child.failure = failure && failure.transitions.has(char) ? failure.transitions.get(char)! : root;
        if (child.failure) {
          child.output.push(...child.failure.output);
        }
      }
    }
    
    return { root };
  }

  // Clear caches to free memory
  static clearCaches(): void {
    this.searchCache.clear();
    this.patternCache.clear();
    this.boyerMooreCache.clear();
  }
}

// Boyer-Moore pattern class for efficient string searching
class BoyerMoorePattern {
  private pattern: string;
  private badCharTable: Map<string, number>;
  private goodSuffixTable: number[];

  constructor(pattern: string) {
    this.pattern = pattern;
    this.badCharTable = this.buildBadCharTable();
    this.goodSuffixTable = this.buildGoodSuffixTable();
  }

  search(text: string): number {
    const patternLength = this.pattern.length;
    const textLength = text.length;
    
    if (patternLength === 0) return 0;
    if (patternLength > textLength) return -1;

    let i = patternLength - 1;
    
    while (i < textLength) {
      let j = patternLength - 1;
      let k = i;
      
      while (j >= 0 && text[k] === this.pattern[j]) {
        k--;
        j--;
      }
      
      if (j === -1) {
        return k + 1;
      }
      
      const badCharShift = this.badCharTable.get(text[k]) ?? patternLength;
      const goodSuffixShift = this.goodSuffixTable[j];
      
      i += Math.max(badCharShift, goodSuffixShift);
    }
    
    return -1;
  }

  private buildBadCharTable(): Map<string, number> {
    const table = new Map<string, number>();
    const patternLength = this.pattern.length;
    
    for (let i = 0; i < patternLength - 1; i++) {
      table.set(this.pattern[i], patternLength - 1 - i);
    }
    
    return table;
  }

  private buildGoodSuffixTable(): number[] {
    const patternLength = this.pattern.length;
    const table = new Array(patternLength).fill(patternLength);
    
    // Case 1: Exact match
    table[patternLength - 1] = 1;
    
    // Case 2: Good suffix exists
    for (let i = patternLength - 2; i >= 0; i--) {
      let j = 0;
      while (j < patternLength - i - 1) {
        if (this.pattern[patternLength - 1 - j] !== this.pattern[patternLength - 1 - i - j]) {
          break;
        }
        j++;
      }
      if (j === patternLength - i - 1) {
        table[i] = patternLength - 1 - i;
      }
    }
    
    // Case 3: Prefix of pattern matches suffix of good suffix
    for (let i = 0; i < patternLength - 1; i++) {
      const suffixLength = patternLength - 1 - i;
      if (this.pattern.startsWith(this.pattern.slice(patternLength - suffixLength))) {
        table[i] = patternLength - suffixLength;
      }
    }
    
    return table;
  }
}

// Aho-Corasick node for multi-pattern matching
class ACNode {
  transitions: Map<string, ACNode> = new Map();
  failure: ACNode | null = null;
  output: string[] = [];
}
