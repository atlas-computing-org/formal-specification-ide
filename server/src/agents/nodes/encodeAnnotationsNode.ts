import { StateInfo } from "../agent.ts";
import { makeSystemData } from "../annotation.ts";

export const encodeAnnotationsNode = (state: typeof StateInfo.State) => {
  const systemData = makeSystemData(state.lhsText, state.rhsText, state.currentAnnotations, state.logger);
  return { systemData: systemData };
}