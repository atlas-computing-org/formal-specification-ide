import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SERVER_SRC_DIR, readFileAllowOverride } from '../../util/fileUtils.ts';
import { StateInfo } from "../agent.ts";

export const annotateNode = async (state: typeof StateInfo.State) => {
  const PROMPT = await readFileAllowOverride(`${SERVER_SRC_DIR}/agents/prompts/annotateNodePromptSnippets.txt`);
  state.logger.debug(`System Message:\n${PROMPT}`);
  state.logger.debug(`Human Message:\n${state.systemData}`);
  return { messages: [
    new SystemMessage(PROMPT),
    new HumanMessage(state.systemData)
  ]};
}
