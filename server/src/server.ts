import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { annotate } from './annotation/annotate.ts';

const PORT = 3001;
const CLIENT_PORT = 3000;
const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;

const app = express();

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

  if (!lhsText) {
    return res.status(400).send({ error: "lhsText is required." });
  }

  if (!rhsText) {
    return res.status(400).send({ error: "rhsText is required." });
  }

  try {
    const response = await annotate(lhsText, rhsText);
    res.json({ response });
  } catch (error) {
    res.status(500).send({ error: "Error generating annotations." });
  }
});

// Serve static files (including your frontend)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

