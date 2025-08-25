import { TextRange, TextMapping, TextRangeWithText } from '@common/annotations.ts';
import { Logger } from '../Logger.ts';
import { FastSearch } from '../util/fastSearch.ts';
import { LRUCache, ObjectPool } from '../util/performance.ts';

// High-performance annotation processing with optimized algorithms
export class AnnotationProcessor {
  private static readonly annotationCache = new LRUCache<string, TextMapping<TextRangeWithText>[]>(5000, 300000);
  private static readonly mappingPool = new ObjectPool<TextMapping<TextRangeWithText>>(
    () => ({ lhsRanges: [], rhsRanges: [], description: '', isError: false, isWarning: false }),
    (mapping) => {
      mapping.lhsRanges = [];
      mapping.rhsRanges = [];
      mapping.description = '';
      mapping.isError = false;
      mapping.isWarning = false;
    },
    1000
  );

  // Ultra-fast annotation decoding with optimized algorithms
  static async decodeAnnotationsFromModelFormat(
    modelOutput: any,
    lhsText: string,
    rhsText: string,
    logger: Logger
  ): Promise<TextMapping<TextRangeWithText>[]> {
    if (!modelOutput || !modelOutput.annotations) {
      logger.warn('Invalid model output format');
      return [];
    }

    const cacheKey = `${lhsText.length}:${rhsText.length}:${JSON.stringify(modelOutput.annotations).slice(0, 100)}`;
    const cached = this.annotationCache.get(cacheKey);
    if (cached) {
      logger.debug('Using cached annotation mappings');
      return cached;
    }

    const annotations = modelOutput.annotations;
    const mappings: TextMapping<TextRangeWithText>[] = [];

    // Process annotations in parallel batches for optimal performance
    const processAnnotation = async (annotation: any): Promise<TextMapping<TextRangeWithText> | null> => {
      try {
        const mapping = this.mappingPool.acquire();
        
        // Extract and validate text ranges
        const lhsRanges = this.extractTextRanges(annotation.lhsText, lhsText);
        const rhsRanges = this.extractTextRanges(annotation.rhsText, rhsText);
        
        if (lhsRanges.length === 0 && rhsRanges.length === 0) {
          this.mappingPool.release(mapping);
          return null;
        }

        // Build efficient mapping
        mapping.lhsRanges = lhsRanges;
        mapping.rhsRanges = rhsRanges;
        mapping.description = annotation.description || '';
        mapping.isError = annotation.status === 'error';
        mapping.isWarning = annotation.status === 'warning';

        return mapping;
      } catch (error) {
        logger.error(`Error processing annotation: ${error}`);
        return null;
      }
    };

    // Use batch processing for optimal performance
    const results = await this.processBatch(annotations, processAnnotation, 50, 8);
    const validMappings = results.filter((mapping): mapping is TextMapping<TextRangeWithText> => mapping !== null);

    // Cache the results
    this.annotationCache.set(cacheKey, validMappings);

    logger.info(`Processed ${validMappings.length} annotations from ${annotations.length} model outputs`);
    return validMappings;
  }

  // High-performance text range extraction using optimized search
  private static extractTextRanges(textRanges: any[], fullText: string): TextRangeWithText[] {
    if (!Array.isArray(textRanges) || textRanges.length === 0) return [];

    const ranges: TextRangeWithText[] = [];
    
    for (const range of textRanges) {
      if (!range || typeof range !== 'object') continue;

      const { start, end, text } = range;
      
      // Validate range bounds
      if (typeof start !== 'number' || typeof end !== 'number' || 
          start < 0 || end > fullText.length || start >= end) {
        continue;
      }

      // Use optimized text search for validation
      const extractedText = fullText.substring(start, end);
      if (extractedText === text) {
        ranges.push({ start, end, text });
      } else {
        // Try to find the text using fast search algorithms
        const searchResult = this.findTextInRange(fullText, text, start, end);
        if (searchResult !== -1) {
          ranges.push({ 
            start: searchResult, 
            end: searchResult + text.length, 
            text 
          });
        }
      }
    }

    return ranges;
  }

  // Ultra-fast text search within a specific range
  private static findTextInRange(fullText: string, searchText: string, start: number, end: number): number {
    const rangeText = fullText.substring(start, end);
    
    // Try exact match first (fastest)
    const exactIndex = rangeText.indexOf(searchText);
    if (exactIndex !== -1) {
      return start + exactIndex;
    }

    // Use Boyer-Moore for longer texts
    if (searchText.length > 3) {
      const bmIndex = FastSearch.boyerMooreSearch(rangeText, searchText);
      if (bmIndex !== -1) {
        return start + bmIndex;
      }
    }

    // Use fuzzy search as last resort
    const fuzzyIndex = FastSearch.fastFuzzySearch(searchText, rangeText, 0.8);
    if (fuzzyIndex !== -1) {
      return start + fuzzyIndex;
    }

    return -1;
  }

  // Batch processing utility for optimal performance
  private static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 50,
    concurrency: number = 8
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize * concurrency) {
      const batch = items.slice(i, i + batchSize * concurrency);
      const batchPromises = batch.map(processor);
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  // High-performance annotation validation
  static validateJSONAnnotations(annotations: any): boolean {
    if (!annotations || !Array.isArray(annotations)) {
      return false;
    }

    // Use early termination for better performance
    for (const annotation of annotations) {
      if (!this.isValidAnnotation(annotation)) {
        return false;
      }
    }

    return true;
  }

  // Fast annotation validation with early termination
  private static isValidAnnotation(annotation: any): boolean {
    if (!annotation || typeof annotation !== 'object') {
      return false;
    }

    // Check required fields with short-circuit evaluation
    if (!annotation.description || typeof annotation.description !== 'string') {
      return false;
    }

    if (!annotation.lhsText || !Array.isArray(annotation.lhsText)) {
      return false;
    }

    if (!annotation.rhsText || !Array.isArray(annotation.rhsText)) {
      return false;
    }

    if (!annotation.status || typeof annotation.status !== 'string') {
      return false;
    }

    // Validate text ranges efficiently
    if (!this.areValidTextRanges(annotation.lhsText) || 
        !this.areValidTextRanges(annotation.rhsText)) {
      return false;
    }

    return true;
  }

  // Fast text range validation
  private static areValidTextRanges(ranges: any[]): boolean {
    if (!Array.isArray(ranges)) return false;
    
    for (const range of ranges) {
      if (!this.isValidTextRange(range)) {
        return false;
      }
    }
    
    return true;
  }

  // Ultra-fast text range validation
  private static isValidTextRange(range: any): boolean {
    if (!range || typeof range !== 'object') return false;
    
    const { start, end, text } = range;
    
    return typeof start === 'number' && 
           typeof end === 'number' && 
           typeof text === 'string' &&
           start >= 0 && 
           end > start && 
           text.length > 0;
  }

  // Memory cleanup
  static cleanup(): void {
    this.annotationCache.clear();
    this.mappingPool.clear();
  }
}

// Legacy function for backward compatibility
export async function decodeAnnotationsFromModelFormat(
  modelOutput: any,
  lhsText: string,
  rhsText: string,
  logger: Logger
): Promise<TextMapping<TextRangeWithText>[]> {
  return AnnotationProcessor.decodeAnnotationsFromModelFormat(modelOutput, lhsText, rhsText, logger);
}

// Legacy function for backward compatibility
export function validateJSONAnnotations(annotations: any): boolean {
  return AnnotationProcessor.validateJSONAnnotations(annotations);
}
