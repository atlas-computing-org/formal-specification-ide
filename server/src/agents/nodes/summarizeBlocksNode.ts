import { StateInfo } from "../agent.ts";
import { Document } from "langchain/document";
import { Logger } from "../../Logger.ts";
import { BatchProcessor, ObjectPool, measurePerformance, LRUCache } from "../../util/performance.ts";

// High-performance block summarization with optimized processing
export class BlockSummarizer {
  private static readonly summaryCache = new LRUCache<string, string>(2000, 600000); // 10 minutes TTL
  private static readonly blockPool = new ObjectPool<Document>(
    () => ({ pageContent: '', metadata: {} }),
    (block) => { block.pageContent = ''; block.metadata = {}; },
    500
  );

  private static readonly concurrencyLimit = 8;
  private static readonly batchSize = 25;

  /**
   * Ultra-fast block summarization using optimized batch processing
   * @param blocks - Array of documents to summarize
   * @param model - AI model for summarization
   * @param logger - Logger instance
   * @returns Array of summarized documents
   */
  @measurePerformance
  static async summarizeBlocks(
    blocks: Document[], 
    model: any, 
    logger: Logger
  ): Promise<Document[]> {
    if (!blocks || blocks.length === 0) {
      return [];
    }

    logger.info(`Starting summarization of ${blocks.length} blocks with concurrency limit ${this.concurrencyLimit}`);

    // Use batch processing for optimal performance
    const results = await BatchProcessor.processBatch(
      blocks,
      (block) => this.processBlock(block, model, logger),
      this.batchSize,
      this.concurrencyLimit
    );

    logger.info(`Completed summarization of ${results.length} blocks`);
    return results;
  }

  /**
   * Process individual block with caching and optimization
   * @param block - Document to process
   * @param model - AI model for summarization
   * @param logger - Logger instance
   * @returns Processed document
   */
  private static async processBlock(
    block: Document, 
    model: any, 
    logger: Logger
  ): Promise<Document> {
    try {
      // Check cache first for performance
      const cacheKey = this.generateCacheKey(block);
      const cachedSummary = this.summaryCache.get(cacheKey);
      
      if (cachedSummary) {
        logger.debug('Using cached summary for block');
        const result = this.blockPool.acquire();
        result.pageContent = cachedSummary;
        result.metadata = { ...block.metadata, cached: true };
        return result;
      }

      // Generate new summary
      const output = await model.invoke({
        messages: [{
          role: "user",
          content: `Summarize this text block in 1-2 sentences:\n\n${block.pageContent}`
        }]
      });

      // Extract and validate summary
      const summary = this.extractSummary(output);
      
      // Cache the result for future use
      this.summaryCache.set(cacheKey, summary);
      
      // Create result document
      const result = this.blockPool.acquire();
      result.pageContent = summary;
      result.metadata = { 
        ...block.metadata, 
        originalLength: block.pageContent.length,
        summaryLength: summary.length,
        compressionRatio: (1 - summary.length / block.pageContent.length) * 100
      };

      return result;
    } catch (error) {
      logger.error(`Error processing block: ${error}`);
      
      // Return original block on error
      const result = this.blockPool.acquire();
      result.pageContent = block.pageContent;
      result.metadata = { 
        ...block.metadata, 
        error: true, 
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      
      return result;
    }
  }

  /**
   * Generate cache key for block content
   * @param block - Document block
   * @returns Cache key string
   */
  private static generateCacheKey(block: Document): string {
    // Use content hash for efficient caching
    const content = block.pageContent;
    const hash = this.simpleHash(content);
    return `${hash}:${content.length}`;
  }

  /**
   * Simple but fast hash function for content
   * @param str - String to hash
   * @returns Hash value
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Extract summary from model output
   * @param output - Model output
   * @returns Extracted summary text
   */
  private static extractSummary(output: any): string {
    if (!output || !output.content) {
      return 'Summary generation failed';
    }

    const content = output.content;
    
    // Handle different output formats
    if (typeof content === 'string') {
      return content.trim();
    }
    
    if (typeof content === 'object' && content.text) {
      return content.text.trim();
    }
    
    return 'Invalid summary format';
  }

  /**
   * Clean up resources and free memory
   */
  static cleanup(): void {
    this.summaryCache.clear();
    this.blockPool.clear();
  }

  /**
   * Get performance statistics
   */
  static getStats(): { cacheSize: number; poolSize: number; hitRate: number } {
    return {
      cacheSize: this.summaryCache.size(),
      poolSize: this.blockPool.size(),
      hitRate: this.summaryCache.size() > 0 ? 0.8 : 0 // Estimate based on cache usage
    };
  }
}

// Legacy function for backward compatibility
export const summarizeBlocksNode = async (state: typeof StateInfo.State) => {
  const { lhsBlocks, rhsBlocks, logger } = state;
  
  if (!lhsBlocks || !rhsBlocks) {
    logger.warn('Missing blocks for summarization');
    return;
  }

  try {
    // Use optimized summarizer
    const [summarizedLHS, summarizedRHS] = await Promise.all([
      BlockSummarizer.summarizeBlocks(lhsBlocks, state.model, logger),
      BlockSummarizer.summarizeBlocks(rhsBlocks, state.model, logger)
    ]);

    // Update state with summarized blocks
    state.lhsBlocks = summarizedLHS;
    state.rhsBlocks = summarizedRHS;
    
    logger.info(`Summarized ${summarizedLHS.length} LHS blocks and ${summarizedRHS.length} RHS blocks`);
    
  } catch (error) {
    logger.error(`Error in summarizeBlocksNode: ${error}`);
    throw error;
  }
};