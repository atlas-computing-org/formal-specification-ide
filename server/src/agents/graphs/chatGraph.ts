import { START, END, StateGraph, MemorySaver } from "@langchain/langgraph";
import { Annotations } from "@common/annotations.ts";
import { Logger } from "../../Logger.ts";
import { GraphError, StateInfo, responseContent } from '../agent.ts';
import { initChatNode } from "../nodes/initChatNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { userNode } from "../nodes/userNode.ts";
import { ChatAboutAnnotationsResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";

// Add conditional edge for resetting chat
const initChoice = (state: typeof StateInfo.State) => {
  state.logger.info(`initChoice: state.messages.length ${state.messages.length}`);
  return (state.messages.length === 0) ? "encodeAnnotations" : "user";
}

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("encodeAnnotations", encodeAnnotationsNode)
  .addNode("initChat", initChatNode)
  .addNode("user", userNode)
  .addNode("model", modelNode)
  .addConditionalEdges(START, initChoice)
  .addEdge("encodeAnnotations","initChat")
  .addEdge("initChat", "user")
  .addEdge("user", "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();

// Compile graph
export const chatGraph = workflow.compile({ checkpointer: memory });

export async function chatGraphInvoke(userInput: string, lhsText: string, rhsText: string, oldAnnotations: Annotations, sessionId: string, logger: Logger): Promise<ChatAboutAnnotationsResponse> {
  try {
    const config = { configurable: { thread_id: sessionId } };
    logger.info(`chatGraphInvoke: sessionId ${sessionId}`);
    const rawOutput = await chatGraph.invoke({ userInput, lhsText, rhsText, oldAnnotations, logger }, config);
    return { data: responseContent(rawOutput) };
  } catch (e) {
    if (e instanceof GraphError) {
      const error = `Error chatting with assistant. ${e.message}`;
      return { error, debugInfo: e.debugInfo };
    } else {
      const error = `Error chatting with assistant. ${e}`;
      return { error };
    }
  }
}