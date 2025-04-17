import './loadEnv.ts';
import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { chatAboutAnnotationsHandler } from './endpoints/chatAboutAnnotations.ts';
import { generateAnnotationsHandler } from './endpoints/generateAnnotations.ts';
import { getDatasetNamesHandler } from './endpoints/getDatasetNames.ts';
import { getDatasetHandler } from './endpoints/getDataset.ts';
import { getLogger } from './Logger.ts';
import { DATA_DIR } from './util/fileUtils.ts';
import { Counter } from '@common/util/Counter.ts';


const PORT = Number(process.env.BACKEND_PORT);
const CLIENT_PORT = Number(process.env.FRONTEND_PORT);
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
app.use('/data', express.static(DATA_DIR));

// Middleware to parse JSON
app.use(bodyParser.json({limit: '1mb'}));

// Routes
app.post('/generate-annotations', generateAnnotationsHandler(requestCounter, logger));
app.post('/chat-with-assistant', chatAboutAnnotationsHandler(requestCounter, logger));
app.get('/getDatasetNames', getDatasetNamesHandler(requestCounter, logger));
app.get('/getDataset/:datasetName', getDatasetHandler(requestCounter, logger));

// Serve static files (including your frontend)
app.use(express.static('public'));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
