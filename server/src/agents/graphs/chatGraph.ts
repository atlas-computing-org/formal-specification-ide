import { START, END, StateGraph, MemorySaver } from "@langchain/langgraph";
import { Annotations } from "@common/annotations.ts";
import { Logger } from "../../Logger.ts";
import { StateInfo, responseContent } from '../agent.ts';
import { chatNode } from "../nodes/chatNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { userNode } from "../nodes/userNode.ts";

// Add conditional edge for resetting chat
const resetChoice = (state: typeof StateInfo.State) => {
  return state.chatReset ? "encodeAnnotations" : "user";
}

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("encodeAnnotations", encodeAnnotationsNode)
  .addNode("chat", chatNode)
  .addNode("user", userNode)
  .addNode("model", modelNode)
  .addConditionalEdges(START, resetChoice)
  .addEdge("encodeAnnotations","chat")
  .addEdge("chat", "user")
  .addEdge("user", "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();

// Compile graph
export const chatGraph = workflow.compile({ checkpointer: memory });

export async function chatGraphInvoke(userInput: string, lhsText: string, rhsText: string, oldAnnotations: Annotations, chatReset: boolean, logger: Logger, userUUID: string): Promise<string> {
  const config = { configurable: { thread_id: userUUID } };
  const output = await chatGraph.invoke({ userInput, lhsText, rhsText, oldAnnotations, chatReset, logger }, config);
  return responseContent(output);
}