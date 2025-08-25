import { Router, Request, Response } from 'express';
import { PerformanceMonitor } from '../util/performance.ts';
import { LRUCache } from '../util/performance.ts';
import { FastSearch } from '../util/fastSearch.ts';
import { TextProcessor } from '../util/textUtils.ts';
import { AnnotationProcessor } from '../agents/annotation.ts';
import { BlockSummarizer } from '../agents/nodes/summarizeBlocksNode.ts';

const router = Router();

// Performance metrics endpoint
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const monitor = PerformanceMonitor.getInstance();
    const metrics = monitor.getMetrics();
    const memoryUsage = monitor.getMemoryUsage();
    
    // Get cache statistics
    const cacheStats = {
      searchCache: FastSearch.getCacheStats ? FastSearch.getCacheStats() : 'N/A',
      textProcessor: TextProcessor.getStats ? TextProcessor.getStats() : 'N/A',
      annotationProcessor: AnnotationProcessor.getStats ? AnnotationProcessor.getStats() : 'N/A',
      blockSummarizer: BlockSummarizer.getStats ? BlockSummarizer.getStats() : 'N/A'
    };

    // Get system performance metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };

    const performanceData = {
      timestamp: new Date().toISOString(),
      endpointMetrics: metrics,
      memoryUsage,
      cacheStats,
      systemMetrics
    };

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get performance metrics: ${error}`
    });
  }
});

// Performance optimization endpoint
router.post('/optimize', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'clear-caches':
        // Clear all caches
        FastSearch.clearCaches();
        TextProcessor.cleanup();
        AnnotationProcessor.cleanup();
        BlockSummarizer.cleanup();
        
        res.json({
          success: true,
          message: 'All caches cleared successfully'
        });
        break;
        
      case 'gc':
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          res.json({
            success: true,
            message: 'Garbage collection completed'
          });
        } else {
          res.json({
            success: false,
            message: 'Garbage collection not available'
          });
        }
        break;
        
      case 'reset-metrics':
        // Reset performance metrics
        const monitor = PerformanceMonitor.getInstance();
        monitor.reset();
        
        res.json({
          success: true,
          message: 'Performance metrics reset successfully'
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid optimization action'
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to perform optimization: ${error}`
    });
  }
});

// Performance health check endpoint
router.get('/health', (req: Request, res: Response) => {
  try {
    const monitor = PerformanceMonitor.getInstance();
    const memoryUsage = monitor.getMemoryUsage();
    
    // Check memory usage thresholds
    const memoryThreshold = 0.8; // 80%
    const memoryUsageRatio = memoryUsage.current / (memoryUsage.peak || memoryUsage.current);
    
    const healthStatus = {
      status: memoryUsageRatio < memoryThreshold ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      memory: {
        current: memoryUsage.current,
        peak: memoryUsage.peak,
        usageRatio: memoryUsageRatio,
        threshold: memoryThreshold
      },
      uptime: process.uptime(),
      version: process.version
    };
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Health check failed: ${error}`
    });
  }
});

// Performance recommendations endpoint
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const monitor = PerformanceMonitor.getInstance();
    const metrics = monitor.getMetrics();
    const memoryUsage = monitor.getMemoryUsage();
    
    const recommendations = [];
    
    // Analyze endpoint performance
    for (const [endpoint, data] of Object.entries(metrics)) {
      if (data.avg > 1000) { // More than 1 second average
        recommendations.push({
          type: 'endpoint-slow',
          endpoint,
          issue: `Average response time is ${data.avg.toFixed(2)}ms`,
          suggestion: 'Consider optimizing database queries or implementing caching'
        });
      }
      
      if (data.max > 5000) { // More than 5 seconds max
        recommendations.push({
          type: 'endpoint-timeout',
          endpoint,
          issue: `Maximum response time is ${data.max.toFixed(2)}ms`,
          suggestion: 'Investigate potential blocking operations or memory leaks'
        });
      }
    }
    
    // Analyze memory usage
    const memoryUsageRatio = memoryUsage.current / (memoryUsage.peak || memoryUsage.current);
    if (memoryUsageRatio > 0.7) {
      recommendations.push({
        type: 'memory-high',
        issue: `Memory usage is ${(memoryUsageRatio * 100).toFixed(1)}% of peak`,
        suggestion: 'Consider clearing caches or implementing memory limits'
      });
    }
    
    // System recommendations
    if (process.uptime() > 86400) { // More than 24 hours
      recommendations.push({
        type: 'uptime-long',
        issue: `Server has been running for ${(process.uptime() / 3600).toFixed(1)} hours`,
        suggestion: 'Consider scheduled restarts to prevent memory leaks'
      });
    }
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        recommendations,
        totalRecommendations: recommendations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get recommendations: ${error}`
    });
  }
});

// Performance benchmark endpoint
router.post('/benchmark', async (req: Request, res: Response) => {
  try {
    const { testType, iterations = 1000 } = req.body;
    
    const results = {
      testType,
      iterations,
      timestamp: new Date().toISOString(),
      results: {}
    };
    
    switch (testType) {
      case 'string-search':
        // Benchmark string search algorithms
        const testText = 'a'.repeat(10000) + 'target' + 'a'.repeat(10000);
        const target = 'target';
        
        const startTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          testText.indexOf(target);
        }
        const indexOfTime = performance.now() - startTime;
        
        const bmStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          FastSearch.boyerMooreSearch(testText, target);
        }
        const boyerMooreTime = performance.now() - bmStartTime;
        
        results.results = {
          indexOf: { time: indexOfTime, avg: indexOfTime / iterations },
          boyerMoore: { time: boyerMooreTime, avg: boyerMooreTime / iterations }
        };
        break;
        
      case 'text-processing':
        // Benchmark text processing
        const testBlocks = Array.from({ length: 100 }, (_, i) => `Block ${i}: ${'text '.repeat(50)}`);
        
        const splitStartTime = performance.now();
        for (let i = 0; i < iterations / 100; i++) {
          TextProcessor.splitTextBySeparatorRegex(testBlocks.join('\n\n'));
        }
        const splitTime = performance.now() - splitStartTime;
        
        results.results = {
          textSplitting: { time: splitTime, avg: splitTime / (iterations / 100) }
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid benchmark test type'
        });
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Benchmark failed: ${error}`
    });
  }
});

export default router;
