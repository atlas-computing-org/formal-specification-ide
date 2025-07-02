import { SERVER_SRC_DIR, readFileAllowOverride } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";
import { AIMessage } from "@langchain/core/messages";

export const cacheNode = async (state: typeof StateInfo.State) => {
  state.logger.info("Using cached LLM response. This only works for the demo.");
  const cachedResponse = await readFileAllowOverride(`${SERVER_SRC_DIR}/agents/prompts/cacheNodeResponse.txt`, state.logger);
  // Update message history with cached response:
  return { messages: [new AIMessage(cachedResponse)] };
};
