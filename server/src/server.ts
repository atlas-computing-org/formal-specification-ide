import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { chatAboutAnnotationsHandler } from './APIEndpoints/chatAboutAnnotations.ts';
import { generateAnnotationsHandler } from './APIEndpoints/generateAnnotations.ts';
import { getLogger } from './Logger.ts';
import { Counter } from '@common/util/Counter.ts';

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

// Middleware to parse JSON
app.use(bodyParser.json());

// Routes
app.post('/generate-annotations', generateAnnotationsHandler(requestCounter, logger));
app.post('/chat-with-assistant', chatAboutAnnotationsHandler(requestCounter, logger));

// Serve static files (including your frontend)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
