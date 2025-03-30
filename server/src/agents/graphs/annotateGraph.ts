import { START, END, StateGraph } from "@langchain/langgraph";
import { StateInfo } from '../agent.ts';
import { annotateNode } from "../nodes/annotateNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { decodeAnnotationsNode } from "../nodes/decodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { cacheNode } from "../nodes/cacheNode.ts";
import { extractJSONNode } from "../nodes/extractJSONNode.ts";
import { validateJSONNode } from "../nodes/validateJSONNode.ts";

// Add conditional edge for cached response
const cacheChoice = (state: typeof StateInfo.State) => {
  return state.useDemoCache ? "cache" : "encodeAnnotations";
}

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("encodeAnnotations", encodeAnnotationsNode)
  .addNode("annotate", annotateNode)
  .addNode("model", modelNode)
  .addNode("cache", cacheNode)
  .addNode("extractJSON", extractJSONNode)
  .addNode("validateJSON", validateJSONNode)
  .addNode("decodeAnnotations", decodeAnnotationsNode)
  .addConditionalEdges(START, cacheChoice)
  .addEdge("cache", "extractJSON")
  .addEdge("encodeAnnotations","annotate")
  .addEdge("annotate", "model")
  .addEdge("model", "extractJSON")
  .addEdge("extractJSON", "validateJSON")
  .addEdge("validateJSON", "decodeAnnotations")
  .addEdge("decodeAnnotations", END);

// Compile graph
export const graph = workflow.compile();