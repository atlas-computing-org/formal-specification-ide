import { START, END, StateGraph, MemorySaver } from "@langchain/langgraph";
import { Annotations } from "@common/annotations.ts";
import { Logger } from "../../Logger.ts";
import { GraphError, StateInfo, responseContent } from '../agent.ts';
import { chatNode } from "../nodes/chatNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { userNode } from "../nodes/userNode.ts";
import { ChatAboutAnnotationsResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";

// Slight hack for now - decide if the chat is reset by checking if the sessionId is new
let lastSessionId: string | null = null;

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

export async function chatGraphInvoke(userInput: string, lhsText: string, rhsText: string, oldAnnotations: Annotations, sessionId: string, logger: Logger): Promise<ChatAboutAnnotationsResponse> {
  // TODO - cleanup chat reset logic in the graph
  let chatReset = false;
  if (sessionId !== lastSessionId) {
    lastSessionId = sessionId;
    chatReset = true;
  }
  try {
    const config = { configurable: { thread_id: sessionId } };
    const rawOutput = await chatGraph.invoke({ userInput, lhsText, rhsText, oldAnnotations, chatReset, logger }, config);
    const output = responseContent(rawOutput);
    return { data: output };
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