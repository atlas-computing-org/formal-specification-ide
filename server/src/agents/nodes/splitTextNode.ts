import { StateInfo } from "../agent.ts";
import { splitTextBySeparatorRegex } from "../../util/textUtils.ts";
import { Document } from "langchain/document";

export const splitTextNode = (state: typeof StateInfo.State) => {
  try {
    const results : {lhsBlocks?: Document[], rhsBlocks?: Document[]} = {};
    if (state.splitTextLHS) {
      results.lhsBlocks = splitTextBySeparatorRegex(state.lhsText);
      state.logger.info(`Number of LHS blocks: ${results.lhsBlocks.length}`);
    }
    if (state.splitTextRHS) {
      results.rhsBlocks = splitTextBySeparatorRegex(state.rhsText);
      state.logger.info(`Number of RHS blocks: ${results.rhsBlocks.length}`);
    }
    return results;
  
  } catch (e) {
    const errorMsg = `Error splitting texts. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}