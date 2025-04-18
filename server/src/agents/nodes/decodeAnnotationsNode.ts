import { StateInfo } from "../agent.ts";
import { decodeAnnotationsFromModelFormat, validateJSONAnnotations } from "../annotation.ts";

export const decodeAnnotationsNode = (state: typeof StateInfo.State) => {
  validateJSONAnnotations(state.outputAnnotations);
  state.logger.info("Validated JSON annotations.");

  const decodedAnnotations = decodeAnnotationsFromModelFormat(state.outputAnnotations, state.lhsText, state.rhsText, state.logger);
  state.logger.info("Finished decoding annotations.");
  return { decodedAnnotations: decodedAnnotations};
};