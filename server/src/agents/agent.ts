import process from "node:process";
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { Logger } from "../Logger.ts";
import { Annotations } from "@common/annotations.ts";
import { DebugInfo } from "@common/DebugInfo.ts";

export const MODEL_PROVIDERS = ["Anthopic", "OpenAI", "DeepSeek"];

export const StateInfo = Annotation.Root({
  lhsText: Annotation<string>,
  rhsText: Annotation<string>,
  currentAnnotations: Annotation<Annotations>,
  resetChat: Annotation<boolean>,
  useDemoCache: Annotation<boolean>,
  systemData: Annotation<string>,
  userInput: Annotation<string>,
  outputAnnotations: Annotation<any>,
  decodedAnnotations: Annotation<Annotations>,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  logger: Annotation<Logger>,
});

export class GraphError extends Error {
  debugInfo: DebugInfo;

  constructor(message: string, { debugInfo }: { debugInfo: DebugInfo }) {
      super(message);
      this.debugInfo = debugInfo;
  }
}

export function newModel(provider: string): ChatAnthropic | ChatDeepSeek | ChatOpenAI {
  if (provider === "Anthropic") {
    // https://docs.anthropic.com/en/docs/about-claude/models/all-models 
    return new ChatAnthropic({
      model: "claude-3-7-sonnet-20250219",
      temperature: 0,
      maxTokens: 10000,
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

export function response(state: typeof StateInfo.State): BaseMessage {
  return state.messages[state.messages.length - 1];
}

export function responseContent(state: typeof StateInfo.State): string {
  return response(state).content as string; 
}