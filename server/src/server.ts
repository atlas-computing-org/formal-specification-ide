import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { chatAboutAnnotationsHandler } from './endpoints/chatAboutAnnotations.ts';
import { generateAnnotationsHandler } from './endpoints/generateAnnotations.ts';
import { generateCategoryLabelsHandler } from './endpoints/generateCategoryLabels.ts';
import { getDatasetNamesHandler } from './endpoints/getDatasetNames.ts';
import { getDatasetHandler } from './endpoints/getDataset.ts';
import { saveDatasetHandler } from './endpoints/saveDataset.ts';
import { getAllAgentPromptsHandler } from './endpoints/getAllAgentPrompts.ts';
import { writeAgentPromptOverrideHandler } from './endpoints/writeAgentPromptOverride.ts';
import { getLogger } from './Logger.ts';
import { SERVER_DATA_DIR } from './util/fileUtils.ts';
import { Counter } from '@common/util/Counter.ts';
import { handleRequest, RequestHandler } from './endpoints/endpointUtils.ts';
import { securityHeaders, rateLimiter, aiRateLimiter, sanitizeInput } from './middleware/security.ts';
import { env } from './config/environment.ts';
import performanceRoutes from './routes/performance.ts';
import { PerformanceMonitor } from './util/performance.ts';

// Initialize environment configuration
try {
  console.log('Environment configuration loaded successfully');
  console.log(`Server will run on port ${env.PORT}`);
  console.log(`Client port: ${env.CLIENT_PORT}`);
  console.log(`Node environment: ${env.NODE_ENV}`);
} catch (error) {
  console.error('Failed to load environment configuration:', error);
  process.exit(1);
}

const app = express();
const logger = getLogger();

// Initialize performance monitoring
const performanceMonitor = PerformanceMonitor.getInstance();

// Apply security middleware
app.use(securityHeaders);
app.use(rateLimiter);
app.use(aiRateLimiter);
app.use(sanitizeInput);

// Apply CORS with optimized configuration
app.use(cors({
  origin: [`http://localhost:${env.CLIENT_PORT}`, `http://127.0.0.1:${env.CLIENT_PORT}`],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware with optimized limits
app.use(bodyParser.json({ 
  limit: env.MAX_FILE_SIZE_BYTES,
  strict: true 
}));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: env.MAX_FILE_SIZE_BYTES 
}));

// Performance monitoring middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const endpoint = `${req.method} ${req.path}`;
    
    performanceMonitor.startTimer(endpoint);
    performanceMonitor.endTimer(endpoint);
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn(`Slow request: ${endpoint} took ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
});

// Request counters for each endpoint
const chatCounter = new Counter();
const generateAnnotationsCounter = new Counter();
const generateCategoryLabelsCounter = new Counter();
const getDatasetNamesCounter = new Counter();
const getDatasetCounter = new Counter();
const saveDatasetCounter = new Counter();
const getAllAgentPromptsCounter = new Counter();
const writeAgentPromptOverrideCounter = new Counter();

// API endpoints with performance monitoring
app.post('/api/chatAboutAnnotations', handleRequest(chatAboutAnnotationsHandler, 'chatAboutAnnotations', chatCounter, logger));
app.post('/api/generateAnnotations', handleRequest(generateAnnotationsHandler, 'generateAnnotations', generateAnnotationsCounter, logger));
app.post('/api/generateCategoryLabels', handleRequest(generateCategoryLabelsHandler, 'generateCategoryLabels', generateCategoryLabelsCounter, logger));
app.get('/api/getDatasetNames', handleRequest(getDatasetNamesHandler, 'getDatasetNames', getDatasetNamesCounter, logger));
app.get('/api/getDataset', handleRequest(getDatasetHandler, 'getDataset', getDatasetCounter, logger));
app.post('/api/saveDataset', handleRequest(saveDatasetHandler, 'saveDataset', saveDatasetCounter, logger));
app.get('/api/getAllAgentPrompts', handleRequest(getAllAgentPromptsHandler, 'getAllAgentPrompts', getAllAgentPromptsCounter, logger));
app.post('/api/writeAgentPromptOverride', handleRequest(writeAgentPromptOverrideHandler, 'writeAgentPromptOverride', writeAgentPromptOverrideCounter, logger));

// Performance monitoring routes
app.use('/api/performance', performanceRoutes);

// Serve static files from the data directory with additional security
app.use('/data', express.static(SERVER_DATA_DIR, {
  setHeaders: (res, _path) => {
    // Set security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: env.NODE_ENV
  };
  
  res.json(healthData);
});

// Serve static files (including your frontend)
app.use(express.static('public', {
  setHeaders: (res, _path) => {
    // Set security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// Global error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route not found`
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    // Clean up performance monitoring
    performanceMonitor.reset();
    
    // Clean up other resources
    logger.info('Cleaning up resources...');
    
    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
      logger.info('Server closed');
    }
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error(`Error during graceful shutdown: ${error}`);
    process.exit(1);
  }
}

// Start server with performance monitoring
const server = app.listen(env.PORT, () => {
  logger.info(`Server started on port ${env.PORT}`);
  logger.info(`Performance monitoring enabled`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Max file size: ${env.MAX_FILE_SIZE_BYTES} bytes`);
  logger.info(`Rate limit: ${env.RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS}ms`);
  logger.info(`AI rate limit: ${env.AI_RATE_LIMIT_MAX_REQUESTS} requests per ${env.RATE_LIMIT_WINDOW_MS}ms`);
});

// Memory leak prevention
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
    logger.warn('High memory usage detected, forcing garbage collection');
    if (global.gc) {
      global.gc();
    }
  }
}, 60000); // Check every minute

export default app;


