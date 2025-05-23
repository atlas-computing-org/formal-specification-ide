import { readFileSync } from 'fs';
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Document } from "langchain/document";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { SERVER_SRC_DIR } from '../../util/fileUtils.ts';
import { newModel, StateInfo } from "../agent.ts";
import { Logger } from '../../Logger.ts';
import { TextLabel, CategoryType } from '@common/annotations.ts';

interface LabelledBlock {
  text: string,
  label: string
}

interface BlockCategory {
  label: string,
  description: string,
  category: CategoryType
}

const labelBlocks = (blocks: Document[]) => {
  const labelledBlocks : LabelledBlock[] = [];
  blocks.forEach((block, i) => {
    labelledBlocks.push({text: block.pageContent, label: `${i}:${block.metadata.start}-${block.metadata.end}`}); 
  });
  return labelledBlocks;
}

const checkBlockCategories = (blockCategories: BlockCategory[], labelledBlocks: LabelledBlock[], logger: Logger) => {
  logger.info(`Blocks length ${labelledBlocks.length}`);
  logger.info(`Output length ${blockCategories.length}`);

  let errorCount = 0;
  const counter : Record<string, number> = {};
  for (const {label} of labelledBlocks) {
    counter[label] = 0;
  }

  for (const {label} of blockCategories) {
    if (label in counter) {
      if (counter[label] !== 0) {
        logger.error(`ERROR: LABEL ALREADY EXISTS IN OUTPUT ${label} ${counter[label]}`);
        errorCount += 1;
      }
      counter[label] += 1;
    } else {
      logger.error(`ERROR: LABEL NOT FOUND IN BLOCKS ${label}`);
      errorCount += 1;
    } 
  }
  for (const {label} of labelledBlocks) {
    if (counter[label] !== 1) {
      logger.error(`ERROR: LABEL NOT FOUND IN OUTPUT ${label} ${counter[label]}`);
      errorCount += 1;
    }
  }
  logger.info(`DONE: ${errorCount} errors found.`);
  return (errorCount === 0);
}

const makeLabels = (blockCategories: BlockCategory[], logger: Logger) => {
  const labels : TextLabel[] = [];
  for (const {description, category, label} of blockCategories) {
    const match = label.match(/(\d+):(\d+)-(\d+)/);
    if (match) {
      const start = parseInt(match[2]);
      const end = parseInt(match[3]);
      const ranges = [{start, end}];
      labels.push({ description, category, ranges });
    } else {
      const errorMsg = `ERROR: Label did not match expected format ${label}`;
      logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
  return labels;
}


const prompt = ChatPromptTemplate.fromMessages([ new MessagesPlaceholder("messages") ]);
const llm = newModel("Anthropic");
const parser = new JsonOutputParser<BlockCategory[]>();
const chain = prompt.pipe(llm).pipe(parser);
const promptText = readFileSync(`${SERVER_SRC_DIR}/agents/nodes/blockCategoriesNodePrompt.txt`, 'utf-8');

export const blockCategoriesNode = async (state: typeof StateInfo.State) => {
  const blocks = state.blockMappingsQuerySide === "lhs" ? state.lhsBlocks : state.rhsBlocks;
  const labelledBlocks = labelBlocks(blocks);

  const userInput = JSON.stringify(labelledBlocks, null, 2);
  const blockCategories = await chain.invoke({ messages: [
    new SystemMessage(promptText),
    new HumanMessage(userInput)
  ]});

  const isCorrect = checkBlockCategories(blockCategories, labelledBlocks, state.logger);
  if (!isCorrect) {
    const errorMsg = `ERROR: Output blocks do not match input blocks`;
    state.logger.error(`LANGGRAPH FAILED: ${errorMsg}`);
    throw new Error(errorMsg);
  }
  
  const labels = makeLabels(blockCategories, state.logger);
  if (state.blockMappingsQuerySide === "lhs") {
    const newAnnotations = { mappings: [], lhsLabels: labels, rhsLabels: [] };
    return { newAnnotations };
  } else {
    const newAnnotations = { mappings: [], lhsLabels: [], rhsLabels: labels };
    return { newAnnotations };
  }
}
