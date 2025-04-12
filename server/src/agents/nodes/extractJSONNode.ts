import { JsonOutputParser } from "@langchain/core/output_parsers";
import { StateInfo } from "../agent.ts";
import { Logger } from "../../Logger.ts";
import { responseContent } from "../agent.ts";

const parser = new JsonOutputParser();

export const extractJSONNode = async (state: typeof StateInfo.State) => {
  const response = state.messages[state.messages.length - 1];
  const outputAnnotations =  await parser.invoke(response);
  state.logger.info("Successfully parsed JSON annotations from LLM's response.");
  state.logger.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);
  return { outputAnnotations: outputAnnotations };
};