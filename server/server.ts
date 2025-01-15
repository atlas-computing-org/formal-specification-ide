import express from 'express';
import { ChatAnthropic } from '@langchain/anthropic';
import bodyParser from 'body-parser';
import cors from 'cors';

const PORT = 3001;
const CLIENT_PORT = 3000;
const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const app = express();

// Enable CORS for all routes, allowing requests from the client server
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
}));

// Middleware to parse JSON
app.use(bodyParser.json());

// Function to query Claude
const queryClaude = async (prompt: string) => {
  const llm = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: ANTHROPIC_API_KEY,
  });

  const framing = "You are a helpful assistant that translates English to French. Translate the user sentence.";

  try {
    const res = await llm.invoke([
      ["system", framing],
      ["human", prompt],
    ]);
    return res.content;
  } catch (error) {
    console.error("Error querying Claude:", error);
    throw new Error("Failed to query Claude.");
  }
};

// Route to handle AI queries
app.post('/query-ai', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send({ error: "Prompt is required." });
  }

  try {
    const response = await queryClaude(prompt);
    res.json({ response });
  } catch (error) {
    res.status(500).send({ error: "Error querying AI." });
  }
});

// Serve static files (including your frontend)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

