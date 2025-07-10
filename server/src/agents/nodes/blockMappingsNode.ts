import { StateInfo } from "../agent.ts";
import { Document } from "langchain/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TextRange } from "@common/annotations.ts";
const numMatches = 2;

interface Mapping<T extends TextRange = TextRange> {
  description: string;
  toRanges: T[];
  fromRanges: T[];
}

const blockMapping = async (block: Document, vectorStore: MemoryVectorStore, multifile: boolean = false): Promise<Mapping> => {
  const similarBlocks = await vectorStore.similaritySearch(block.pageContent, numMatches);
  
  const fromRanges = multifile 
    ? [{ start: block.metadata.start, end: block.metadata.end, file: block.metadata.file }]
    : [{ start: block.metadata.start, end: block.metadata.end }];
    
  const toRanges = similarBlocks.map(doc => 
    multifile 
      ? { start: doc.metadata.start, end: doc.metadata.end, file: doc.metadata.file }
      : { start: doc.metadata.start, end: doc.metadata.end }
  );
  
  return {
    description: block.metadata.description,
    fromRanges,
    toRanges
  };
};

export const blockMappingsNode = async (state: typeof StateInfo.State) => {
  try {
    state.logger.info(`Finding mapping for selected text in vector database...`);
    const mappings = [];

    if (state.blockMappingsQuerySide === "lhs") {
      for (const block of state.lhsBlocks) {
        const mapping = await blockMapping(block, state.vectorStore, state.blockMappingsMultifile);
        mappings.push({ description: mapping.description, lhsRanges: mapping.fromRanges, rhsRanges: mapping.toRanges })
      }
    } else {
      for (const block of state.rhsBlocks) {
        const mapping = await blockMapping(block, state.vectorStore, state.blockMappingsMultifile);
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