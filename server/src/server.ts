import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { chatAboutAnnotationsHandler } from './endpoints/chatAboutAnnotations.ts';
import { generateAnnotationsHandler } from './endpoints/generateAnnotations.ts';
import { generateCategoryLabelsHandler } from './endpoints/generateCategoryLabels.ts';
import { getDatasetNamesHandler } from './endpoints/getDatasetNames.ts';
import { getDatasetHandler } from './endpoints/getDataset.ts';
import { saveDatasetHandler } from './endpoints/saveDataset.ts';
import { getLogger } from './Logger.ts';
import { SERVER_DATA_DIR } from './util/fileUtils.ts';
import { Counter } from '@common/util/Counter.ts';
import { handleRequest, RequestHandler } from './endpoints/endpointUtils.ts';
import { getAllAgentPromptsHandler } from './endpoints/getAllAgentPrompts.ts';
import { writeAgentPromptOverrideHandler } from './endpoints/writeAgentPromptOverride.ts';
import { 
  securityHeaders, 
  rateLimiter, 
  aiRateLimiter, 
  pathTraversalProtection, 
  sanitizeInput 
} from './middleware/security.ts';
import { env, validateEnvironment } from './config/environment.ts';

// Validate environment configuration before starting
validateEnvironment();

const logger = getLogger();

const app = express();
const requestCounter = new Counter();

// Security middleware - apply first
app.use(securityHeaders);
app.use(pathTraversalProtection);
app.use(sanitizeInput);

// Rate limiting - apply to all routes
app.use(rateLimiter);

// Enable CORS for all routes, allowing requests from the client server
app.use(cors({
  origin: `http://localhost:${env.CLIENT_PORT}`,
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
  credentials: false, // Disable credentials for security
}));

// Serve static files from the data directory with additional security
app.use('/data', express.static(SERVER_DATA_DIR, {
  setHeaders: (res, _path) => {
    // Set security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// Middleware to parse JSON with size limit
app.use(bodyParser.json({limit: env.MAX_FILE_SIZE_BYTES}));

// GET routes
const getRoutes: Record<string, RequestHandler<any, any>> = {
  '/getDatasetNames': getDatasetNamesHandler,
  '/getDataset/:datasetName': getDatasetHandler,
  '/getAllAgentPrompts': getAllAgentPromptsHandler,
};

// POST routes
const postRoutes: Record<string, RequestHandler<any, any>> = {
  '/generate-annotations': generateAnnotationsHandler,
  '/generate-category-labels': generateCategoryLabelsHandler,
  '/chat-with-assistant': chatAboutAnnotationsHandler,
  '/save-dataset': saveDatasetHandler,
  '/writeAgentPromptOverride': writeAgentPromptOverrideHandler,
};

// Register routes with appropriate rate limiting
Object.entries(getRoutes).forEach(([path, handler]) => {
  app.get(path, handleRequest(handler, `GET ${path}`, requestCounter, logger));
});

Object.entries(postRoutes).forEach(([path, handler]) => {
  // Apply stricter rate limiting to AI endpoints
  if (path === '/generate-annotations' || path === '/generate-category-labels' || path === '/chat-with-assistant') {
    app.post(path, aiRateLimiter, handleRequest(handler, `POST ${path}`, requestCounter, logger));
  } else {
    app.post(path, handleRequest(handler, `POST ${path}`, requestCounter, logger));
  }
});

// Serve static files (including your frontend)
app.use(express.static('public', {
  setHeaders: (res, _path) => {
    // Set security headers for static files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  }
}));

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    logger.error(`Payload too large error: ${err.message}`);
    res.status(413).json({ error: "Payload too large" });
  } else {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(env.PORT, () => {
  logger.info(`Server running at http://localhost:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Client Port: ${env.CLIENT_PORT}`);
  logger.info('Security middleware enabled: Helmet, Rate Limiting, Path Traversal Protection, Input Sanitization');
});


