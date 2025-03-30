import { StateInfo } from "../agent.ts";
import { decodeAnnotationsFromModelFormat } from "../annotation.ts";

export const decodeAnnotationsNode = (state: typeof StateInfo.State) => {
  const decodedAnnotations = decodeAnnotationsFromModelFormat(state.outputAnnotations, state.lhsText, state.rhsText, state.logger);
  state.logger.info("Finished decoding annotations.");
  return { decodedAnnotations: decodedAnnotations};
};