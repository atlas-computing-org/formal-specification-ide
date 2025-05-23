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

const PORT = 3001;
const CLIENT_PORT = 3000;
const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;

const logger = getLogger();

const app = express();
const requestCounter = new Counter();

// Enable CORS for all routes, allowing requests from the client server
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
}));

// Serve static files from the data directory
app.use('/data', express.static(SERVER_DATA_DIR));

// Middleware to parse JSON
app.use(bodyParser.json({limit: '1mb'}));

// GET routes
const getRoutes: Record<string, RequestHandler<any, any>> = {
  '/getDatasetNames': getDatasetNamesHandler,
  '/getDataset/:datasetName': getDatasetHandler,
};

// POST routes
const postRoutes: Record<string, RequestHandler<any, any>> = {
  '/generate-annotations': generateAnnotationsHandler,
  '/generate-category-labels': generateCategoryLabelsHandler,
  '/chat-with-assistant': chatAboutAnnotationsHandler,
  '/save-dataset': saveDatasetHandler,
};

// Register routes
Object.entries(getRoutes).forEach(([path, handler]) => {
  app.get(path, handleRequest(handler, `GET ${path}`, requestCounter, logger));
});
Object.entries(postRoutes).forEach(([path, handler]) => {
  app.post(path, handleRequest(handler, `POST ${path}`, requestCounter, logger));
});

// Serve static files (including your frontend)
app.use(express.static('public'));

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
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});


