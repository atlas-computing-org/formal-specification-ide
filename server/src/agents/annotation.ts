import Fuse from 'fuse.js';
import { Annotations, LabelType, TextMapping, TextRange } from "@common/annotations.ts";
import { Logger } from "../Logger.ts";

type ModelAnnotation = {
  description: string;
  lhsText: string[];
  rhsText: string[];
  status: LabelType;
}

type MergedAnnotation<T extends TextRange = TextRange> = TextMapping<T>;

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
        logger.warn(`Failed to determine the index for a generated annotation. LLM gave the phrase "${substring}" for the ${textDescription} text.`);
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

const encodeModelAnnotation = (annotation: MergedAnnotation, lhsText: string, rhsText: string, _logger: Logger): ModelAnnotation => {
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

export const decodeAnnotationsFromModelFormat = (modelAnnotations: ModelAnnotation[], lhsText: string, rhsText: string, logger: Logger): Annotations => {
  const indexedAnnotations = (modelAnnotations as ModelAnnotation[]).map(a => decodeModelAnnotation(a, lhsText, rhsText, logger));
  return splitMergedAnnotations(indexedAnnotations);
}

export const encodeAnnotationsInModelFormat = (annotations: Annotations, lhsText: string, rhsText: string, logger: Logger): ModelAnnotation[] => {
  const indexedAnnotations = mergeAnnotations(annotations);
  return indexedAnnotations.map(a => encodeModelAnnotation(a, lhsText, rhsText, logger));
}

export const validateJSONAnnotations = (annotations: any) => {
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

export const makeSystemData = (lhsText: string, rhsText: string, annotations: Annotations, logger: Logger): string => {
  const encodedAnnotations = encodeAnnotationsInModelFormat(annotations, lhsText, rhsText, logger);

  const userPrompt =
`### LHS TEXT

${lhsText}

### RHS TEXT

${rhsText}

### CURRENT ANNOTATIONS

${JSON.stringify(encodedAnnotations, null, 2)}`;

  return userPrompt;
}
