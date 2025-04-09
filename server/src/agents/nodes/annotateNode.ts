import { promises as fs } from 'node:fs';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SRC_DIR } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";

export const annotateNode = async (state: typeof StateInfo.State) => {
  const PROMPT = await fs.readFile(`${SRC_DIR}/agents/nodes/annotateNodePromptSnippets.txt`, 'utf-8');
  state.logger.debug(`System Message:\n${PROMPT}`);
  state.logger.debug(`Human Message:\n${state.systemData}`);
  return { messages: [
    new SystemMessage(PROMPT),
    new HumanMessage(state.systemData)
  ]};
}