import { promises as fs } from 'node:fs';
import { SystemMessage } from "@langchain/core/messages";
import { StateInfo } from "../agent.ts";

export const chatNode = async (state: typeof StateInfo.State) => {
  const PROMPT = await fs.readFile('./chatNodePrompt.txt', 'utf-8');
  state.logger.info(`System Message:\n${PROMPT + state.systemData}`);
  return { messages: [new SystemMessage(PROMPT + state.systemData)] };
}