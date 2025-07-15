import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Document } from "langchain/document";
import { StateInfo } from "../agent.ts";
import { newChatAnthropic } from '../agent.ts';

// Based on Anthropic's rate limit of 32,000 tokens a minute
// Each request takes 5 seconds and 250 tokens, which is 3000 tokens per minute
const concurrencyLimit = 5;

const promptText = "Summarize the following text into a short description in less than 10 words. The description should be a single sentence that captures the main idea of the text. The text may contain multiple paragraphs, but the description should be concise and to the point. The description should not include any specific details or examples from the text. The description should be in English and should not include any special characters or formatting.";
const llm = newChatAnthropic();

// Helper function to process a single block
const processBlock = async (block: Document): Promise<Document> => {
  // summarize a given text block into a short description
  const messages = [
    new SystemMessage(promptText),
    new HumanMessage(block.pageContent)
  ];
  const output = await llm.invoke(messages);

  block.metadata.description = output.content;
  return block;
};

const summarize = async (blocks: Document[]): Promise<Document[]> => {
  const results: Document[] = [];
  const chunks = [];
  
  // Split blocks into chunks of size concurrencyLimit
  for (let i = 0; i < blocks.length; i += concurrencyLimit) {
    chunks.push(blocks.slice(i, i + concurrencyLimit));
  }

  // Process each chunk in parallel
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processBlock));
    results.push(...chunkResults);
  }

  return results;
};

export const summarizeBlocksNode = async (state: typeof StateInfo.State) => {
  try {
    const results : {lhsBlocks?: Document[], rhsBlocks?: Document[]} = {};
    if (state.summarizeBlocksLHS) {
      state.logger.info(`Summarizing LHS blocks...`);
      results.lhsBlocks = await summarize(state.lhsBlocks);
    }
    if (state.summarizeBlocksRHS) {
      state.logger.info(`Summarizing RHS blocks...`);
      results.rhsBlocks = await summarize(state.rhsBlocks);
    }
    return results;
  
  } catch (e) {
    const errorMsg = `Error summarizing texts. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}