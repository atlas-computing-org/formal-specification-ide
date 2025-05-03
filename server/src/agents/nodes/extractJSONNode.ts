import { JsonOutputParser } from "@langchain/core/output_parsers";
import { responseContent, StateInfo } from "../agent.ts";
import { response, GraphError } from "../agent.ts";

const parser = new JsonOutputParser();

export const extractJSONNode = async (state: typeof StateInfo.State) => {
  try {
    const outputAnnotations =  await parser.invoke(response(state));
    state.logger.info("Successfully parsed JSON annotations from LLM's response.");
    state.logger.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);
    return { outputAnnotations: outputAnnotations };

  } catch (e) {
    const errorMsg = `Error extracting JSON. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new GraphError(errorMsg, { debugInfo: { rawModelOutput: responseContent(state) }});
  }
};