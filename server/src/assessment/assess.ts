import { ChatAnthropic } from '@langchain/anthropic';
import { START, END, MessagesAnnotation, StateGraph, MemorySaver } from "@langchain/langgraph";
import { Annotations } from "@common/annotations.ts";
import { PROMPT } from './prompt.ts';
import { Logger } from '../Logger.ts';

// Put into common folder?
import { makeUserPrompt } from '../annotation/annotate.ts';


const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const llm = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  apiKey: ANTHROPIC_API_KEY,
});

// Define the function that calls the model
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await llm.invoke(state.messages);
  // Update message history with response:
  return { messages: response };
};

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  // Define the (single) node in the graph
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

const chatWithAssistant = async (userUUID: string, userInput: string, lhsText: string, rhsText: string, 
    currentAnnotations: Annotations, resetChat: boolean, logger: Logger) => {

  const config = { configurable: { thread_id: userUUID } };
  const userContext = makeUserPrompt(lhsText, rhsText, currentAnnotations, logger);
  const chatPrompt = PROMPT + userContext;
  const systemInput = { 
    role: "system",
    content: chatPrompt
  };
  const input : (typeof systemInput)[] = [];

  logger.info(`Reset chat? ${resetChat}`);
  if (resetChat) {
    input.push(systemInput);
  } 

  logger.info(`Chat Prompt:\n${chatPrompt}`);
  input.push({ 
    role: "user",
    content: userInput
  });
  logger.info(`Full input:\n${JSON.stringify(input, null, 2)}`);
  logger.info("Sending prompt to Claude.");

  const output = await app.invoke({ messages: input }, config);
  const res = output.messages[output.messages.length - 1]
  logger.info("Received response from Claude.");
  return res.content as string;
}

export { chatWithAssistant };
