import { START, END, StateGraph } from "@langchain/langgraph";
import { Document } from "langchain/document";
import { Logger } from "../../Logger.ts";
import { StateInfo } from '../agent.ts';
import { splitTextNode } from "../nodes/splitTextNode.ts";
import { storeBlocksNode } from "../nodes/storeBlocksNode.ts";
import { blockMappingsNode } from "../nodes/blockMappingsNode.ts";
import { summarizeBlocksNode } from "../nodes/summarizeBlocksNode.ts";
import { Direction, TextRange } from "@common/annotations.ts";
import { splitTextBySeparatorRegex } from "../../util/textUtils.ts";

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("splitText", splitTextNode)
  .addNode("summarizeBlocks", summarizeBlocksNode)
  .addNode("storeBlocks", storeBlocksNode)
  .addNode("blockMappings", blockMappingsNode)
  .addEdge(START, "splitText")
  .addEdge("splitText", "summarizeBlocks")
  .addEdge("summarizeBlocks", "storeBlocks")
  .addEdge("storeBlocks", "blockMappings")
  .addEdge("blockMappings", END);

// Compile graph
export const blockMappingsGraph = workflow.compile();

const selectionToBlocks = (text: string, selection: TextRange[]): Document[] => {
  return selection.map(block =>  
    ({
      pageContent: text.slice(block.start, block.end),
      metadata: { start: block.start, end: block.end },
    })
  );
};

export async function blockMappingsGraphInvoke(lhsText: string, rhsText: string, selection: TextRange[], selectionSide: Direction, logger: Logger) {
  if (selectionSide === "rhs") {
    const rhsBlocks = selection.length > 0 ? selectionToBlocks(rhsText, selection) : splitTextBySeparatorRegex(rhsText);
    const output = await blockMappingsGraph.invoke({ lhsText, rhsText, rhsBlocks, 
      blockMappingsQuerySide: selectionSide, 
      splitTextLHS: true, 
      storeBlocksLHS: true, 
      summarizeBlocksRHS: true, 
      logger });
    return output.newAnnotations;
  } else {
    const lhsBlocks = selection.length > 0 ? selectionToBlocks(lhsText, selection) : splitTextBySeparatorRegex(lhsText);
    const output = await blockMappingsGraph.invoke({ lhsText, rhsText, lhsBlocks, 
      blockMappingsQuerySide: selectionSide, 
      splitTextRHS: true, 
      storeBlocksRHS: true, 
      summarizeBlocksLHS: true, 
      logger });
    return output.newAnnotations;
  }
}