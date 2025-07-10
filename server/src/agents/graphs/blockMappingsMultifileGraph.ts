import { START, END, StateGraph } from "@langchain/langgraph";
import { Document } from "langchain/document";
import { Logger } from "../../Logger.ts";
import { StateInfo } from '../agent.ts';
import { splitTextMultifileNode } from "../nodes/splitTextMultifileNode.ts";
import { storeBlocksNode } from "../nodes/storeBlocksNode.ts";
import { blockMappingsNode } from "../nodes/blockMappingsNode.ts";
import { summarizeBlocksNode } from "../nodes/summarizeBlocksNode.ts";
import { Direction, TextRangeWithFile } from "@common/annotations.ts";
import { splitTextBySeparatorRegexMultifile } from "../../util/textUtils.ts";
import { readFileSync } from "fs";

// Define a new graph
const workflow = new StateGraph(StateInfo)
  .addNode("splitTextMultifile", splitTextMultifileNode)
  .addNode("summarizeBlocks", summarizeBlocksNode)
  .addNode("storeBlocks", storeBlocksNode)
  .addNode("blockMappings", blockMappingsNode)
  .addEdge(START, "splitTextMultifile")
  .addEdge("splitTextMultifile", "summarizeBlocks")
  .addEdge("summarizeBlocks", "storeBlocks")
  .addEdge("storeBlocks", "blockMappings")
  .addEdge("blockMappings", END);

// Compile graph
export const blockMappingsMultifileGraph = workflow.compile();

const selectionToBlocksMultifile = (selection: TextRangeWithFile[]): Document[] => {
  return selection.map((block) => {
    const fileText = readFileSync(block.file, 'utf-8');
    return {
      pageContent: fileText.slice(block.start, block.end),
      metadata: { start: block.start, end: block.end, file: block.file },
    };
  });
};

export async function blockMappingsMultifileGraphInvoke(lhsFiles: string[], rhsFiles: string[], selection: TextRangeWithFile[], selectionSide: Direction, logger: Logger) {
  if (selectionSide === "rhs") {
    const rhsBlocks = selection.length > 0 ? selectionToBlocksMultifile(selection) : splitTextBySeparatorRegexMultifile(rhsFiles);
    const output = await blockMappingsMultifileGraph.invoke({lhsFiles, rhsBlocks, 
      blockMappingsQuerySide: selectionSide, 
      splitTextLHS: true, 
      storeBlocksLHS: true, 
      summarizeBlocksRHS: true, 
      blockMappingsMultifile: true,
      logger });
    return output.newAnnotations;
  } else {
    const lhsBlocks = selection.length > 0 ? selectionToBlocksMultifile(selection) : splitTextBySeparatorRegexMultifile(lhsFiles);
    const output = await blockMappingsMultifileGraph.invoke({rhsFiles, lhsBlocks, 
      blockMappingsQuerySide: selectionSide, 
      splitTextRHS: true, 
      storeBlocksRHS: true, 
      summarizeBlocksLHS: true,   
      blockMappingsMultifile: true,
      logger });
    return output.newAnnotations;
  }
}