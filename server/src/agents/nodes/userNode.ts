import { HumanMessage } from "@langchain/core/messages";
import { StateInfo } from "../agent.ts";

export const userNode = (state: typeof StateInfo.State) => {
  state.logger.debug(`User Message:\n${state.userInput}`);
  return { messages: [new HumanMessage(state.userInput)] };
}