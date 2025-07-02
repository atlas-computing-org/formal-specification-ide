import { SERVER_SRC_DIR } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";
import { AIMessage } from "@langchain/core/messages";

export const cacheNode = async (state: typeof StateInfo.State) => {
  state.logger.info("Using cached LLM response. This only works for the demo.");
  const cachedResponse = await fs.readFile(`${SERVER_SRC_DIR}/agents/prompts/cacheNodeResponse.txt`, 'utf-8');
  // Update message history with cached response:
  return { messages: [new AIMessage(cachedResponse)] };
};
