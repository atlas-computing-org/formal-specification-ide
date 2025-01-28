import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { annotate } from './annotation/annotate.ts';
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

// Route to generate annotations
app.post('/generate-annotations', async (req, res) => {
  const { lhsText, rhsText } = req.body;

  const requestId = requestCounter.next();
  const requestLogger = logger.withMessagePrefix(`POST /generate-annotations (${requestId}): `);

  requestLogger.info("REQUEST RECEIVED.");
  requestLogger.debug(`Request body: ${JSON.stringify(req.body, null, 2)}`);

  if (!lhsText) {
    const error = "lhsText is required.";
    requestLogger.error(`INVALID REQUEST: ${error}`);
    return res.status(400).send({ error });
  }

  if (!rhsText) {
    const error = "rhsText is required.";
    requestLogger.error(`INVALID REQUEST: ${error}`);
    return res.status(400).send({ error });
  }

  try {
    const response = await annotate(lhsText, rhsText, requestLogger);
    requestLogger.debug(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
    res.json({ response });
  } catch (e) {
    const error = `Error generating annotations. ${e}`;
    requestLogger.error(`REQUEST FAILED: ${error}`);
    res.status(500).send({ error });
  }
});

// Serve static files (including your frontend)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
