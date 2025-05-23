import { StateInfo } from "../agent.ts";
import { makeSystemData } from "../annotation.ts";

export const encodeAnnotationsNode = (state: typeof StateInfo.State) => {
  try {
    const systemData = makeSystemData(state.lhsText, state.rhsText, state.oldAnnotations, state.logger);
    return { systemData };

  } catch (e) {
    const errorMsg = `Error encoding annotations. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
}