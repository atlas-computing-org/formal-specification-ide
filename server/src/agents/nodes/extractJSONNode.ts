import { StateInfo } from "../agent.ts";
import { Logger } from "../../Logger.ts";

const escapeString = (str: string) => {
  return str.replace(/\\/g, '\\\\');
}

const extractJSON = (content: string, logger: Logger) => {
  const jsonHeaderStart = content.indexOf('### JSON ANNOTATIONS');
  const jsonStart = content.indexOf('```json', jsonHeaderStart) + 7;
  const jsonEnd = content.indexOf('```', jsonStart);

  // If the JSON block is incomplete, use the string up through the last complete object.
  // Be sure to terminate the enclosing array.
  const incompleteResponse = jsonEnd === -1;
  const jsonString = incompleteResponse ?
    content.slice(jsonStart, content.lastIndexOf('},\n') + 1).trim() + ']' :
    content.slice(jsonStart, jsonEnd).trim();
  logger.debug(`Extracted JSON string:\n${jsonString}`);

  try {
    return JSON.parse(escapeString(jsonString));
  } catch (e) {
    throw new Error(`Error parsing JSON in LLM's reponse: ${e}`);
  }
};

export const extractJSONNode = (state: typeof StateInfo.State) => {
  const response = state.messages[state.messages.length - 1];
  const responseContent = response.content as string; 
  const outputAnnotations = extractJSON(responseContent, state.logger);
  state.logger.info("Successfully parsed JSON annotations from LLM's response.");
  state.logger.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);
  return { outputAnnotations: outputAnnotations };
};