import { promises as fs } from 'node:fs';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateInfo } from "../agent.ts";

export const annotateNode = async (state: typeof StateInfo.State) => {
  const PROMPT = await fs.readFile('./annotateNodePromptSnippets.txt', 'utf-8');
  state.logger.info(`System Message:\n${PROMPT}`);
  state.logger.info(`Human Message:\n${state.systemData}`);
  return { messages: [
    new SystemMessage(PROMPT),
    new HumanMessage(state.systemData)
  ]};
}