import { ChatAnthropic } from '@langchain/anthropic';
import { Annotations, LabelType, TextMapping } from "@common/annotations.ts";
import { SYSTEM_PROMPT } from './prompt.ts';
import { Logger } from '../Logger.ts';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type ModelOutputAnnotation = {
  description: string;
  lhsText: string[];
  rhsText: string[];
  status: LabelType;
}

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

const indexAnnotation = (annotation: ModelOutputAnnotation, lhsText: string, rhsText: string, logger: Logger): TextMapping => {
  const { description, lhsText: lhsTextList, rhsText: rhsTextList, status } = annotation;

  // Function to find the start and end index of each string in the given text
  const findIndexes = (textList: string[], text: string, textDescription: string) => {
    return textList.map((substring) => {
      const start = text.indexOf(substring);
      if (start === -1) {
        logger.warn(`Failed to determine the index for a generated annotation. Claude gave the phrase "${substring}" for the ${description} text.`);
        return { start, end: -1 };
      }
      return { start, end: start + substring.length };
    });
  };

  // Index both lhsText and rhsText
  const lhsRanges = findIndexes(lhsTextList, lhsText, "natural language documentation");
  const rhsRanges = findIndexes(rhsTextList, rhsText, "mechanized spec");

  return status == "error" ? {description, lhsRanges, rhsRanges, isError: true} :
         status == "warning" ? {description, lhsRanges, rhsRanges, isWarning: true} :
         {description, lhsRanges, rhsRanges};
};

const splitAnnotations = (annotations: TextMapping[]): Annotations => {
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
};

const annotateWithClaude = async (lhsText: string, rhsText: string, logger: Logger) => {
  const llm = new ChatAnthropic({
    model: "claude-3-haiku-20240307",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: ANTHROPIC_API_KEY,
  });

  const userPrompt =
`### LHS TEXT

${lhsText}

### RHS TEXT

${rhsText}`;

  logger.info("Sending prompt to Claude.");

  const res = await llm.invoke([
    ["system", SYSTEM_PROMPT],
    ["human", userPrompt],
  ]);
  logger.info("Received response from Claude.");
  const meta = res.usage_metadata;
  if (meta !== undefined) {
    logger.info(`Claude usage: ${meta.input_tokens} input tokens, ${meta.output_tokens} output tokens`);
  }
  const response = res.content as string;
  logger.debug(`Claude's response:\n${response}`);

  const outputAnnotations = extractJSON(response, logger);
  logger.info("Successfully parsed JSON annotations from Claude's response.");
  logger.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);

  validateJSONAnnotations(outputAnnotations);
  logger.info("Validated JSON annotations.");

  const indexedAnnotations = (outputAnnotations as ModelOutputAnnotation[]).map(a => indexAnnotation(a, lhsText, rhsText, logger));
  const annotations = splitAnnotations(indexedAnnotations);
  return annotations;
};

const annotate = async (lhsText: string, rhsText: string, logger: Logger) => {
    return annotateWithClaude(lhsText, rhsText, logger);
}

export { annotate };