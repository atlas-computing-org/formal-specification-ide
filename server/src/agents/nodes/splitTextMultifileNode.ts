import { StateInfo } from "../agent.ts";
import { splitTextBySeparatorRegexMultifile } from "../../util/textUtils.ts";
import { Document } from "langchain/document";

export const splitTextMultifileNode = (state: typeof StateInfo.State) => {
  try {
    const results : {lhsBlocks?: Document[], rhsBlocks?: Document[]} = {};
    if (state.splitTextLHS) {
      results.lhsBlocks = splitTextBySeparatorRegexMultifile(state.lhsFiles);
      state.logger.info(`Number of lhs blocks: ${results.lhsBlocks.length}`);
    }
    if (state.splitTextRHS) {
      results.rhsBlocks = splitTextBySeparatorRegexMultifile(state.rhsFiles);
      state.logger.info(`Number of rhs blocks: ${results.rhsBlocks.length}`);
    }
    return results;
  
  } catch (e) {
    const errorMsg = `Error splitting texts. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}