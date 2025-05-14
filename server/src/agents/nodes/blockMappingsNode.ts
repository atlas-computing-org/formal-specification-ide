import { StateInfo } from "../agent.ts";
import { Document } from "langchain/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TextRange } from "@common/annotations.ts";
const numMatches = 2;

interface Mapping {
  description: string;
  toRanges: TextRange[];
  fromRanges: TextRange[];
}

const blockMapping = async (block: Document, vectorStore: MemoryVectorStore): Promise<Mapping> => {
  const similarBlocks = await vectorStore.similaritySearch(block.pageContent, numMatches);
  return {
    description: block.metadata.description,
    toRanges: [{ start: block.metadata.start, end: block.metadata.end }],
    fromRanges: similarBlocks.map(doc => ({ start: doc.metadata.start, end: doc.metadata.end }))
  };
};

export const blockMappingsNode = async (state: typeof StateInfo.State) => {
  try {
    state.logger.info(`Finding mapping for selected text in vector database...`);
    const mappings = [];

    if (state.blockMappingsQuerySide === "lhs") {
      for (const block of state.lhsBlocks) {
        const mapping = await blockMapping(block, state.vectorStore);
        mappings.push({ description: mapping.description, lhsRanges: mapping.fromRanges, rhsRanges: mapping.toRanges })
      }
    } else {
      for (const block of state.rhsBlocks) {
        const mapping = await blockMapping(block, state.vectorStore);
        mappings.push({ description: mapping.description, lhsRanges: mapping.toRanges, rhsRanges: mapping.fromRanges })
      }
    }

    const newAnnotations = { mappings, lhsLabels: [], rhsLabels: [] };
    return { newAnnotations };

  } catch (e) {
    const errorMsg = `Error finding mapping for selected text in vector database. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
};  