import { Annotations } from "@common/annotations.ts";
import { Logger } from "../Logger.ts";
import { graph } from "../agents/graphs/chatGraph.ts";

export const chatWithAssistant = async (userUUID: string, userInput: string, lhsText: string, rhsText: string, 
    currentAnnotations: Annotations, resetChat: boolean, logger: Logger) => {

  const config = { configurable: { thread_id: userUUID } };
  const output = await graph.invoke({ userInput: userInput, lhsText: lhsText, rhsText: rhsText, currentAnnotations: currentAnnotations, resetChat: resetChat, logger: logger }, config);
  const response = output.messages[output.messages.length - 1]
  return response.content as string;
}