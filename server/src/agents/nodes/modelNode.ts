import { newModel, StateInfo } from "../agent.ts";

const llm = newModel("Anthropic");

// Define the function that calls the model
export const modelNode = async (state: typeof StateInfo.State) => {
  try {
    state.logger.info("Sending messages to LLM.");
    const response = await llm.invoke(state.messages);

    // Check response metadata for usage information
    state.logger.info("Received response from LLM.");
    const meta = response.usage_metadata;
    if (meta !== undefined) {
      state.logger.info(`LLM usage: ${meta.input_tokens} input tokens, ${meta.output_tokens} output tokens`);
    }

    // Update message history with response:
    return { messages: response };

  } catch (e) {
    const errorMsg = `Error calling LLM. ${e}`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
};