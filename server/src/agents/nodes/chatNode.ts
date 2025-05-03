import { promises as fs } from 'node:fs';
import { SystemMessage } from "@langchain/core/messages";
import { SERVER_SRC_DIR } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";

export const chatNode = async (state: typeof StateInfo.State) => {
  try {
    const PROMPT = await fs.readFile(`${SERVER_SRC_DIR}/agents/nodes/chatNodePrompt.txt`, 'utf-8');
    state.logger.debug(`System Message:\n${PROMPT + state.systemData}`);
    return { messages: [new SystemMessage(PROMPT + state.systemData)] };

  } catch (e) {
    const errorMsg = `Error setting up chat prompt. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}