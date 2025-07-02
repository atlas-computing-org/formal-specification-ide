import { SystemMessage } from "@langchain/core/messages";
import { SERVER_SRC_DIR, readFileAllowOverride } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";

export const initChatNode = async (state: typeof StateInfo.State) => {
  try {
    const PROMPT = await readFileAllowOverride(`${SERVER_SRC_DIR}/agents/prompts/initChatNodePrompt.txt`);
    state.logger.debug(`System Message:\n${PROMPT + state.systemData}`);
    return { messages: [new SystemMessage(PROMPT + state.systemData)] };

  } catch (e) {
    const errorMsg = `Error setting up chat prompt. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}
