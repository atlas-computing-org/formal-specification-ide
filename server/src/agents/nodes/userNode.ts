import { HumanMessage } from "@langchain/core/messages";
import { StateInfo } from "../agent.ts";

export const userNode = (state: typeof StateInfo.State) => {
  try {
    state.logger.debug(`User Message:\n${state.userInput}`);
    return { messages: [new HumanMessage(state.userInput)] };
  
  } catch (e) {
    const errorMsg = `Error adding user input. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}