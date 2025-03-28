import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";

export const MODEL_PROVIDERS = ["Anthopic", "OpenAI", "DeepSeek"];

export function newModel(provider: string): ChatAnthropic | ChatDeepSeek | ChatOpenAI {
  if (provider === "Anthropic") {
    // https://docs.anthropic.com/en/docs/about-claude/models/all-models 
    return new ChatAnthropic({
      model: "claude-3-haiku-20240307",
      temperature: 0,
      maxTokens: undefined,
      maxRetries: 2,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  } else if (provider === "DeepSeek") {
    // https://api-docs.deepseek.com/quick_start/pricing
    return new ChatDeepSeek({
      model: "deepseek-reasoner",
      temperature: 0,
      maxTokens: undefined,
      maxRetries: undefined,
      timeout: undefined,
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  } else if (provider === "OpenAI") {
    // https://platform.openai.com/docs/models/compare 
    return new ChatOpenAI({
      model: "o3-mini",
      temperature: undefined,
      maxTokens: undefined,
      maxRetries: 2,
      timeout: undefined,
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}
