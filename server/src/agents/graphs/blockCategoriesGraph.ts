import { START, END, StateGraph } from "@langchain/langgraph";
import { Logger } from "../../Logger.ts";
import { StateInfo } from '../agent.ts';
import { splitTextNode } from "../nodes/splitTextNode.ts";
import { Direction } from "@common/annotations.ts";
import { blockCategoriesNode } from "../nodes/blockCategoriesNode.ts";
import { summarizeBlocksNode } from "../nodes/summarizeBlocksNode.ts";

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("splitText", splitTextNode)
  .addNode("summarizeBlocks", summarizeBlocksNode)
  .addNode("blockCategories", blockCategoriesNode)
  .addEdge(START, "splitText")
  .addEdge("splitText", "summarizeBlocks")
  .addEdge("summarizeBlocks", "blockCategories")
  .addEdge("blockCategories", END);

// Compile graph
export const blockCategoriesGraph = workflow.compile();

export async function blockCategoriesGraphInvoke(lhsText: string, rhsText: string, blockCategoriesQuerySide: Direction, logger: Logger, userUUID: string) {
  const config = { configurable: { thread_id: userUUID } };
  if (blockCategoriesQuerySide === "rhs") {
    const output = await blockCategoriesGraph.invoke({ lhsText, rhsText, 
      blockCategoriesQuerySide,
      splitTextRHS: true, 
      summarizeBlocksRHS: true, 
      logger }, config);
    return output.newAnnotations;
  } else {
    const output = await blockCategoriesGraph.invoke({ lhsText, rhsText, 
      blockCategoriesQuerySide,
      splitTextLHS: true, 
      summarizeBlocksLHS: true, 
      logger }, config);
    return output.newAnnotations;
  }
}