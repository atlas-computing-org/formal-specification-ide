import { StateInfo, GraphError, responseContent } from "../agent.ts";
import { decodeAnnotationsFromModelFormat, validateJSONAnnotations } from "../annotation.ts";

export const decodeAnnotationsNode = (state: typeof StateInfo.State) => {
  try {
    validateJSONAnnotations(state.outputJSON);
    state.logger.info("Validated JSON annotations.");
  } catch (e) {
    const errorMsg = `Error validating annotations. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new GraphError(errorMsg, { debugInfo: { rawModelOutput: responseContent(state) }});
  }

  try {
    const newAnnotations = decodeAnnotationsFromModelFormat(state.outputJSON, state.lhsText, state.rhsText, state.logger);
    state.logger.info("Finished decoding annotations.");
    return { newAnnotations };

  } catch (e) {
    const errorMsg = `Error decoding annotations. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new GraphError(errorMsg, { debugInfo: { rawModelOutput: responseContent(state) }});
  }
};