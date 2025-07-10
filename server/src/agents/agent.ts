import process from "process";
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from "@langchain/openai";
import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { Document } from "langchain/document";
import { Logger } from "../Logger.ts";
import { Annotations, Direction } from "@common/annotations.ts";
import { DebugInfo } from "@common/serverAPI/DebugInfo.ts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

export const StateInfo = Annotation.Root({
  lhsText: Annotation<string>,
  rhsText: Annotation<string>,
  lhsFiles: Annotation<string[]>,
  rhsFiles: Annotation<string[]>,
  lhsBlocks: Annotation<Document[]>,
  rhsBlocks: Annotation<Document[]>,
  splitTextLHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  splitTextRHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  summarizeBlocksLHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  summarizeBlocksRHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  storeBlocksLHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  storeBlocksRHS: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  blockMappingsMultifile: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  blockMappingsQuerySide: Annotation<Direction>,
  blockCategoriesQuerySide: Annotation<Direction>,
  cacheUseDemo: Annotation<boolean>({ value: (_prev, next) => next, default: () => false }),
  systemData: Annotation<string>,
  userInput: Annotation<string>,
  outputJSON: Annotation<any>,
  oldAnnotations: Annotation<Annotations>,
  newAnnotations: Annotation<Annotations>,
  vectorStore: Annotation<MemoryVectorStore>({
    value: (_prev, next) => next,
    default: () => new MemoryVectorStore(new OpenAIEmbeddings({ model: "text-embedding-3-large" })),
  }),
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

export function newChatAnthropic(overrides?: any): ChatAnthropic {
  return new ChatAnthropic({
    model: "claude-3-7-sonnet-20250219",
    temperature: 0,
    maxTokens: 10000,
    maxRetries: 2,
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...overrides,
  });
}

export function newChatDeepSeek(overrides?: any): ChatDeepSeek {
  return new ChatDeepSeek({
    model: "deepseek-reasoner",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: undefined,
    timeout: undefined,
    apiKey: process.env.DEEPSEEK_API_KEY,
    ...overrides,
  });
}

export function newChatOpenAI(overrides?: any): ChatOpenAI {
  return new ChatOpenAI({
    model: "o3-mini",
    temperature: undefined,
    maxTokens: undefined,
    maxRetries: 2,
    timeout: undefined,
    apiKey: process.env.OPENAI_API_KEY,
    ...overrides,
  });
}

export function response(state: typeof StateInfo.State): BaseMessage {
  return state.messages[state.messages.length - 1];
}

export function responseContent(state: typeof StateInfo.State): string {
  return response(state).content as string; 
}