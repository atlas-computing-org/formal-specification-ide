import { StateInfo } from "../agent.ts";
import { splitText } from "../../util/textUtils.ts";

export const splitTextNode = (state: typeof StateInfo.State) => {
  try {
    const results : {lhsBlocks?: Document[], rhsBlocks?: Document[]} = {};
    if (state.splitTextLHS) {
      results.lhsBlocks = splitText(state.lhsText);
      state.logger.info(`Number of lhs blocks: ${results.lhsBlocks.length}`);
    }
    if (state.splitTextRHS) {
      results.rhsBlocks = splitText(state.rhsText);
      state.logger.info(`Number of rhs blocks: ${results.rhsBlocks.length}`);
    }
    return results;
  
  } catch (e) {
    const errorMsg = `Error splitting texts. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}