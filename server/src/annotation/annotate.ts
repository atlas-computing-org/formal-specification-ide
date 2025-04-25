import { promises as fs } from 'fs';
import Fuse from 'fuse.js';
import { ChatAnthropic } from '@langchain/anthropic';
import { START, END, MessagesAnnotation, StateGraph, MemorySaver, Annotation } from "@langchain/langgraph";
import { Annotations, LabelType, TextMapping, TextRange } from "@common/annotations.ts";
import { ANNOTATE_PROMPT } from './prompt-annotate.ts';
import { ASSESS_PROMPT } from './prompt-assess.ts';
import { Logger } from '../Logger.ts';
import { GenerateAnnotationsResponse } from '@common/serverAPI/generateAnnotationsAPI.ts';
import { ChatAboutAnnotationsSuccessResponse } from '@common/serverAPI/chatAboutAnnotationsAPI.ts';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type ModelAnnotation = {
  description: string;
  lhsText: string[];
  rhsText: string[];
  status: LabelType;
}

type MergedAnnotation<T extends TextRange = TextRange> = TextMapping<T>;

const llmChat = new ChatAnthropic({
  model: "claude-3-haiku-20240307",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
  apiKey: ANTHROPIC_API_KEY,
});

// Define the function that calls the model
const callModel = async (state: typeof MessagesAnnotation.State) => {
  const response = await llmChat.invoke(state.messages);
  // Update message history with response:
  return { messages: response };
};

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  // Define the (single) node in the graph
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });

const escapeString = (str: string) => {
  return str.replace(/\\/g, '\\\\');
}

const extractJSON = (content: string, logger: Logger) => {
  const jsonHeaderStart = content.indexOf('### JSON ANNOTATIONS');
  const jsonStart = content.indexOf('```json', jsonHeaderStart) + 7;
  let jsonEnd = content.indexOf('```', jsonStart);

  // If the JSON block is incomplete, use the string up through the last complete object.
  // Be sure to terminate the enclosing array.
  let incompleteResponse = jsonEnd === -1;
  const jsonString = incompleteResponse ?
    content.slice(jsonStart, content.lastIndexOf('},\n') + 1).trim() + ']' :
    content.slice(jsonStart, jsonEnd).trim();
  logger.debug(`Extracted JSON string:\n${jsonString}`);

  try {
    return JSON.parse(escapeString(jsonString));
  } catch (e) {
    throw new Error(`Error parsing JSON in Claude's reponse: ${e}`);
  }
};

const validateJSONAnnotations = (annotations: any) => {
  const prefix = "Extracted JSON annotations are invalid. ";

  if (!Array.isArray(annotations)) {
    throw new Error(`${prefix}Annotations must be an array.`);
  }

  annotations.forEach((annotation, index) => {
    if (typeof annotation !== 'object' || annotation === null) {
      throw new Error(`${prefix}Annotation at index ${index} must be an object.`);
    }

    const { description, lhsText, rhsText, status } = annotation;

    // Validate "description" field
    if (typeof description !== 'string') {
      throw new Error(`${prefix}Annotation object at index ${index} must have a "description" field of type string.`);
    }

    // Validate "lhsText" field
    if (!Array.isArray(lhsText) || !lhsText.every(item => typeof item === 'string')) {
      throw new Error(`${prefix}Annotation object at index ${index} must have a "lhsText" field of type array of strings.`);
    }

    // Validate "rhsText" field
    if (!Array.isArray(rhsText) || !rhsText.every(item => typeof item === 'string')) {
      throw new Error(`${prefix}Annotation object at index ${index} must have a "rhsText" field of type array of strings.`);
    }

    // Validate "status" field
    if (!['default', 'warning', 'error'].includes(status)) {
      throw new Error(`${prefix}Annotation object at index ${index} must have a "status" field with value "default", "warning", or "error".`);
    }
  });
};

// FIXME: This algorithm has terrible performance.
const fuzzyFindIndex = (query: string, text: string, logger: Logger, threshold: number = 0.7): number => {
  // First, try an exact match
  const exactIndex = text.indexOf(query);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  // Build an array of candidate windows—each candidate is a substring of length equal to the query
  const candidateWindows = [];
  for (let i = 0; i <= text.length - query.length; i++) {
    candidateWindows.push({ index: i, text: text.substring(i, i + query.length) });
  }

  // Configure Fuse.js to search the candidate windows
  const fuseOptions = {
    keys: ['text'],
    includeScore: true,
    threshold: 1.0, // include all candidates
  };
  const fuse = new Fuse(candidateWindows, fuseOptions);
  const results = fuse.search(query);
  if (!results.length) {
    logger.warn("No fuzzy-matching results found.")
    return -1;
  }

  const bestMatch = results[0];
  // Fuse.js scores range from 0 (perfect match) upward; we accept if the score is below the threshold.
  if (bestMatch.score !== undefined && bestMatch.score <= threshold) {
    return bestMatch.item.index;
  }
  logger.warn(`Found ${results.length} results. Best match score: ${bestMatch.score}.`);
  return -1;
};

const decodeModelAnnotation = (annotation: ModelAnnotation, lhsText: string, rhsText: string, logger: Logger): MergedAnnotation => {
  const { description, lhsText: lhsTextList, rhsText: rhsTextList, status } = annotation;

  // Function to find the start and end index of each string in the given text
  const findIndexes = (textList: string[], text: string, textDescription: string) => {
    return textList.map((substring) => {
      const start = fuzzyFindIndex(substring, text, logger);
      if (start === -1) {
        logger.warn(`Failed to determine the index for a generated annotation. Claude gave the phrase "${substring}" for the ${textDescription} text.`);
        return { start, end: -1 };
      }
      return { start, end: start + substring.length };
    });
  };

  // Index both lhsText and rhsText
  const lhsRanges = findIndexes(lhsTextList, lhsText, "natural language documentation");
  const rhsRanges = findIndexes(rhsTextList, rhsText, "mechanized spec");

  const baseAnnotation = { description, lhsRanges, rhsRanges };
  return status === "error" ? { ...baseAnnotation, isError: true } :
          status === "warning" ? { ...baseAnnotation, isWarning: true } :
          baseAnnotation;
};

const encodeModelAnnotation = (annotation: MergedAnnotation, lhsText: string, rhsText: string, logger: Logger): ModelAnnotation => {
  const { description, lhsRanges, rhsRanges, isError, isWarning } = annotation;

  // Function to extract the text from the given ranges
  const extractText = (ranges: TextRange[], text: string) => {
    return ranges.map(({ start, end }) => text.slice(start, end));
  };

  const lhsTextList = extractText(lhsRanges, lhsText);
  const rhsTextList = extractText(rhsRanges, rhsText);

  const status = isError ? "error" : isWarning ? "warning" : "default";
  return { description, lhsText: lhsTextList, rhsText: rhsTextList, status };
}

const splitMergedAnnotations = (annotations: MergedAnnotation[]): Annotations => {
  const result: Annotations = {
    mappings: [],
    lhsLabels: [],
    rhsLabels: [],
  };

  annotations.forEach((annotation) => {
    const { description, lhsRanges, rhsRanges, isError, isWarning } = annotation;

    if (lhsRanges.length > 0 && rhsRanges.length > 0) {
      result.mappings.push(annotation); // Mappings have both lhs and rhs
    } else if (lhsRanges.length > 0 && rhsRanges.length === 0) {
      result.lhsLabels.push({description, ranges: lhsRanges, isError, isWarning}); // Drop rhsRanges
    } else if (rhsRanges.length > 0 && lhsRanges.length === 0) {
      result.rhsLabels.push({description, ranges: rhsRanges, isError, isWarning}); // Drop lhsRanges
    }
  });

  return result;
}

const mergeAnnotations = (annotations: Annotations): MergedAnnotation[] => {
  const result: MergedAnnotation[] = [];

  annotations.mappings.forEach((mapping) => {
    result.push(mapping);
  });

  annotations.lhsLabels.forEach(({ description, ranges, isError, isWarning }) => {
    result.push({ description, lhsRanges: ranges, rhsRanges: [], isError, isWarning });
  });

  annotations.rhsLabels.forEach(({ description, ranges, isError, isWarning }) => {
    result.push({ description, lhsRanges: [], rhsRanges: ranges, isError, isWarning });
  });

  return result;
}

const decodeAnnotationsFromModelFormat = (modelAnnotations: ModelAnnotation[], lhsText: string, rhsText: string, logger: Logger): Annotations => {
  const indexedAnnotations = (modelAnnotations as ModelAnnotation[]).map(a => decodeModelAnnotation(a, lhsText, rhsText, logger));
  return splitMergedAnnotations(indexedAnnotations);
}

const encodeAnnotationsInModelFormat = (currentAnnotations: Annotations, lhsText: string, rhsText: string, logger: Logger): ModelAnnotation[] => {
  const indexedAnnotations = mergeAnnotations(currentAnnotations);
  return indexedAnnotations.map(a => encodeModelAnnotation(a, lhsText, rhsText, logger));
}

const makeUserPrompt = (lhsText: string, rhsText: string, currentAnnotations: Annotations, logger: Logger): string => {
  const encodedAnnotations = encodeAnnotationsInModelFormat(currentAnnotations, lhsText, rhsText, logger);

  const userPrompt =
`### LHS TEXT

${lhsText}

### RHS TEXT

${rhsText}

### CURRENT ANNOTATIONS

${JSON.stringify(encodedAnnotations, null, 2)}`;

  return userPrompt;
}

const queryClaude = async (userPrompt: string, logger: Logger) => {
  const llmAnnotate = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: ANTHROPIC_API_KEY,
  });

  logger.info("Sending prompt to Claude.");

  const res = await llmAnnotate.invoke([
    ["system", ANNOTATE_PROMPT],
    ["human", userPrompt],
  ]);
  logger.info("Received response from Claude.");
  const meta = res.usage_metadata;
  if (meta !== undefined) {
    logger.info(`Claude usage: ${meta.input_tokens} input tokens, ${meta.output_tokens} output tokens`);
  }
  return res.content as string;
}

const readDemoCachedResponse = async (logger: Logger) => {
  logger.info("Reading cached Claude response from file. This only works for the demo.");
  return await fs.readFile('./server/src/annotation/cachedClaudeResponse.txt', 'utf-8');
}

const annotateWithClaude = async (lhsText: string, rhsText: string, currentAnnotations: Annotations,
    useDemoCache: boolean, logger: Logger): Promise<GenerateAnnotationsResponse>  => {
  const userPrompt = makeUserPrompt(lhsText, rhsText, currentAnnotations, logger);

  const rawModelOutput = useDemoCache ?
    await readDemoCachedResponse(logger) :
    await queryClaude(userPrompt, logger);

  try {
    logger.debug(`Claude's response:\n${rawModelOutput}`);

    const outputAnnotations = extractJSON(rawModelOutput, logger);
    logger.info("Successfully parsed JSON annotations from Claude's response.");
    logger.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);

    validateJSONAnnotations(outputAnnotations);
    logger.info("Validated JSON annotations.");

    const decodedAnnotations = decodeAnnotationsFromModelFormat(outputAnnotations, lhsText, rhsText, logger);
    logger.info("Finished decoding annotations.");

    return { data: decodedAnnotations, debugInfo: { rawModelOutput } };
  } catch (e) {
    const error = `Error generating annotations. ${e}`;
    return { error, debugInfo: { rawModelOutput } };
  }
};

const annotate = async (lhsText: string, rhsText: string, currentAnnotations: Annotations,
    useDemoCache: boolean, logger: Logger): Promise<GenerateAnnotationsResponse> => {
  return annotateWithClaude(lhsText, rhsText, currentAnnotations, useDemoCache, logger);
}

const chatWithAssistant = async (userUUID: string, userInput: string, lhsText: string, rhsText: string, 
    currentAnnotations: Annotations, resetChat: boolean, logger: Logger): Promise<ChatAboutAnnotationsSuccessResponse> => {

  const config = { configurable: { thread_id: userUUID } };
  const userContext = makeUserPrompt(lhsText, rhsText, currentAnnotations, logger);
  const chatPrompt = ASSESS_PROMPT + userContext;
  const systemInput = { 
    role: "system",
    content: chatPrompt
  };
  const input : (typeof systemInput)[] = [];

  logger.info(`Reset chat? ${resetChat}`);
  if (resetChat) {
    input.push(systemInput);
  } 

  logger.info(`Chat Prompt:\n${chatPrompt}`);
  input.push({ 
    role: "user",
    content: userInput
  });
  logger.info(`Full input:\n${JSON.stringify(input, null, 2)}`);
  logger.info("Sending prompt to Claude.");

  const output = await app.invoke({ messages: input }, config);
  const res = output.messages[output.messages.length - 1]
  logger.info("Received response from Claude.");
  return { data: res.content as string };
}

export { annotate, chatWithAssistant };
