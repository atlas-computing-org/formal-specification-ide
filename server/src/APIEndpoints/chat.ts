import { Annotations } from "@common/annotations.ts";
import { Logger } from "../Logger.ts";
import { chatGraph } from "../agents/graphs/chatGraph.ts";

export const chatWithAssistant = async (userUUID: string, userInput: string, lhsText: string, rhsText: string, 
    currentAnnotations: Annotations, resetChat: boolean, logger: Logger) => {

  const config = { configurable: { thread_id: userUUID } };
  const output = await chatGraph.invoke({ userInput: userInput, lhsText: lhsText, rhsText: rhsText, currentAnnotations: currentAnnotations, resetChat: resetChat, logger: logger }, config);
}