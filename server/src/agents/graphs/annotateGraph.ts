import { START, END, StateGraph } from "@langchain/langgraph";
import { Annotations } from "@common/annotations.ts";
import { Logger } from "../../Logger.ts";
import { StateInfo, responseContent } from '../agent.ts';
import { annotateNode } from "../nodes/annotateNode.ts";
import { encodeAnnotationsNode } from "../nodes/encodeAnnotationsNode.ts";
import { decodeAnnotationsNode } from "../nodes/decodeAnnotationsNode.ts";
import { modelNode } from "../nodes/modelNode.ts";
import { cacheNode } from "../nodes/cacheNode.ts";
import { extractJSONNode } from "../nodes/extractJSONNode.ts";

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
  .addNode("decodeAnnotations", decodeAnnotationsNode)
  .addConditionalEdges(START, cacheChoice)
  .addEdge("cache", "extractJSON")
  .addEdge("encodeAnnotations","annotate")
  .addEdge("annotate", "model")
  .addEdge("model", "extractJSON")
  .addEdge("extractJSON", "decodeAnnotations")
  .addEdge("decodeAnnotations", END);

// Compile graph
export const annotateGraph = workflow.compile();

export async function annotateGraphInvoke(lhsText: string, rhsText: string, annotations: Annotations, useDemoCache: boolean, logger: Logger, userUUID: string) {
  const config = { configurable: { thread_id: userUUID } };
  const output = await annotateGraph.invoke({ lhsText, rhsText, currentAnnotations: annotations, useDemoCache, logger }, config);
  return { decodedAnnotations: output.decodedAnnotations, rawModelOutput: responseContent(output) };
}