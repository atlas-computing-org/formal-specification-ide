import { ChatAnthropic } from '@langchain/anthropic';
import { Annotations, LabelType, TextMapping } from "@common/annotations.ts";
import { SYSTEM_PROMPT } from './prompt.ts';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

type ModelOutputAnnotation = {
  label: string;
  lhsText: string[];
  rhsText: string[];
  status: LabelType;
}

const escapeString = (str: string) => {
  return str.replace(/\\/g, '\\\\');
}

const extractJSON = (content: string) => {
  try {
    const jsonHeaderStart = content.indexOf('### JSON ANNOTATIONS');
    const jsonStart = content.indexOf('```json', jsonHeaderStart) + 7;
    let jsonEnd = content.indexOf('```', jsonStart);

    // If the JSON block is incomplete, use the string up through the last complete object.
    // Be sure to terminate the enclosing array.
    let incompleteResponse = jsonEnd === -1;
    const jsonString = incompleteResponse ?
      content.slice(jsonStart, content.lastIndexOf('},\n') + 1).trim() + ']' :
      content.slice(jsonStart, jsonEnd).trim();

    console.log("Extracted JSON:");
    console.log(jsonString)

    return JSON.parse(escapeString(jsonString));
  } catch (error) {
    console.error("Error parsing JSON annotations. Content: %s", content)
    console.error(error);
    throw new Error(error);
  }
};

const validateJSONAnnotations = (annotations: any) => {
  if (!Array.isArray(annotations)) {
    throw new Error("Annotations must be an array.");
  }

  annotations.forEach((annotation, index) => {
    if (typeof annotation !== 'object' || annotation === null) {
      throw new Error(`Annotation at index ${index} must be an object.`);
    }

    const { label, lhsText, rhsText, status } = annotation;

    // Validate "label" field
    if (typeof label !== 'string') {
      throw new Error(`Annotation at index ${index} must have a "label" field of type string.`);
    }

    // Validate "lhsText" field
    if (!Array.isArray(lhsText) || !lhsText.every(item => typeof item === 'string')) {
      throw new Error(`Annotation at index ${index} must have a "lhsText" field of type array of strings.`);
    }

    // Validate "rhsText" field
    if (!Array.isArray(rhsText) || !rhsText.every(item => typeof item === 'string')) {
      throw new Error(`Annotation at index ${index} must have a "rhsText" field of type array of strings.`);
    }

    // Validate "status" field
    if (!['default', 'warning', 'error'].includes(status)) {
      throw new Error(`Annotation at index ${index} must have a "status" field with value "default", "warning", or "error".`);
    }
  });
};

const indexAnnotation = (annotation: ModelOutputAnnotation, lhsText: string, rhsText: string): TextMapping => {
  const { label, lhsText: lhsTextList, rhsText: rhsTextList, status } = annotation;

  // Function to find the start and end index of each string in the given text
  const findIndexes = (textList: string[], text: string) => {
    return textList.map((substring) => {
      const start = text.indexOf(substring);
      const end = start === -1 ? 0 : start + substring.length;
      return { start, end };
    });
  };

  // Index both lhsText and rhsText
  const lhsRanges = findIndexes(lhsTextList, lhsText);
  const rhsRanges = findIndexes(rhsTextList, rhsText);

  return status == "error" ? {label, lhsRanges, rhsRanges, isError: true} :
         status == "warning" ? {label, lhsRanges, rhsRanges, isWarning: true} :
         {label, lhsRanges, rhsRanges};
};

const splitAnnotations = (annotations: TextMapping[]): Annotations => {
  const result: Annotations = {
    mappings: [],
    lhsLabels: [],
    rhsLabels: [],
  };

  annotations.forEach((annotation) => {
    const { label, lhsRanges, rhsRanges, isError, isWarning } = annotation;

    if (lhsRanges.length > 0 && rhsRanges.length > 0) {
      result.mappings.push(annotation); // Mappings have both lhs and rhs
    } else if (lhsRanges.length > 0 && rhsRanges.length === 0) {
      result.lhsLabels.push({label, ranges: lhsRanges, isError, isWarning}); // Drop rhsRanges
    } else if (rhsRanges.length > 0 && lhsRanges.length === 0) {
      result.rhsLabels.push({label, ranges: rhsRanges, isError, isWarning}); // Drop lhsRanges
    }
  });

  return result;
};

const annotateWithClaude = async (lhsText: string, rhsText: string) => {
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

  try {
    const res = await llm.invoke([
      ["system", SYSTEM_PROMPT],
      ["human", userPrompt],
    ]);
    const outputAnnotations = extractJSON(res.content as string);
    validateJSONAnnotations(outputAnnotations);
    const indexedAnnotations = (outputAnnotations as ModelOutputAnnotation[]).map(a => indexAnnotation(a, lhsText, rhsText));
    const annotations = splitAnnotations(indexedAnnotations);
    return annotations;
  } catch (error) {
    console.error("Error generating annotations with Claude:", error);
    throw new Error("Failed to generate annotations.");
  }
};

const annotate = async (lhsText: string, rhsText: string) => {
    return annotateWithClaude(lhsText, rhsText);
}

export { annotate };