import { promises as fs } from 'node:fs';
import { StateInfo } from "../agent.ts";
import { AIMessage } from "@langchain/core/messages";

export const cacheNode = async (state: typeof StateInfo.State) => {
  state.logger.info("Using cached LLM response. This only works for the demo.");
  const cachedResponse = await fs.readFile('./cacheNodeResponse.txt', 'utf-8');
  // Update message history with cached response:
  return { messages: [new AIMessage(cachedResponse)] };
};