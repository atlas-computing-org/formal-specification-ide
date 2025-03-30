import { START, END, StateGraph, MemorySaver } from "@langchain/langgraph";
import { StateInfo } from '../agent.ts';
import { chatNode } from "../nodes/chatNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { userNode } from "../nodes/userNode.ts";

// Add conditional edge for resetting chat
const resetChoice = (state: typeof StateInfo.State) => {
  return state.resetChat ? "encodeAnnotations" : "user";
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
export const graph = workflow.compile({ checkpointer: memory });