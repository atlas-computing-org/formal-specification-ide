import { StateInfo } from "../agent.ts";

export const storeBlocksNode = async (state: typeof StateInfo.State) => {
  try {
    if (state.storeBlocksLHS) {
        state.logger.info(`Storing LHS blocks in vector database...`);
        await state.vectorStore.addDocuments(state.lhsBlocks);
    }
    if (state.storeBlocksRHS) {
        state.logger.info(`Storing RHS blocks in vector database...`);
        await state.vectorStore.addDocuments(state.rhsBlocks);
    }
    return {};
    
  } catch (e) {
    const errorMsg = `Error storing blocks in vector database. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}; 