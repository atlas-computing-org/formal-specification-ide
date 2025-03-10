import * as fs from 'fs';
import Fuse from 'fuse.js';
import { Annotations, AnnotationsWithText, LabelType, TextMapping, TextRange } from "@common/annotations.ts";

const DEBUG = false;

const EMPTY_ANNOTATIONS: AnnotationsWithText = {
  mappings: [],
  lhsLabels: [],
  rhsLabels: [],
};

type ModelAnnotation = {
  description: string;
  lhsText: string[];
  rhsText: string[];
  status: LabelType;
}

type MergedAnnotation<T extends TextRange = TextRange> = TextMapping<T>;

// If needed, add escape logic here
const escapeString = (str: string) => {
  //return str.replace(/\\/g, '\\\\');
  return str;
}

function extractJSON(jsonString: string) {
  try {
    // First, assume the JSON block is well-formed and try to parse it.
    return JSON.parse(escapeString(jsonString));
  } catch (e) {
    console.warn("Error parsing annotations (but will retry assuming the JSON is simply truncated):", e);
  }
  try {
    // If parsing fails, assume the JSON block is well-formed aside from being unfinished and use the string
    // up through the last complete object. Be sure to terminate the enclosing array. {
    const wellformedSubstring = jsonString.slice(0, jsonString.lastIndexOf('},\n') + 1).trim() + ']';
    return JSON.parse(escapeString(wellformedSubstring));
  } catch (e) {
    console.error("Error parsing annotations:", e);
    process.exit(1);
  }
}

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
const fuzzyFindIndex = (query: string, text: string, threshold: number = 0.7): number => {
  // First, try an exact match
  const exactIndex = text.indexOf(query);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  console.log("No exact match, running fuzzy find.")

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
    console.warn("No fuzzy-matching results found.")
    return -1;
  }

  const bestMatch = results[0];
  // Fuse.js scores range from 0 (perfect match) upward; we accept if the score is below the threshold.
  console.log(`Found ${results.length} results. Best match score: ${bestMatch.score}.`);
  if (bestMatch.score !== undefined && bestMatch.score <= threshold) {
    return bestMatch.item.index;
  }
  return -1;
};

const decodeModelAnnotation = (annotation: ModelAnnotation, lhsText: string, rhsText: string): MergedAnnotation => {
  const { description, lhsText: lhsTextList, rhsText: rhsTextList, status } = annotation;

  // Function to find the start and end index of each string in the given text
  const findIndexes = (textList: string[], text: string, textDescription: string) => {
    return textList.map((substring) => {
      const start = fuzzyFindIndex(substring, text);
      if (start === -1) {
        console.warn(`Failed to determine the index for the annotation for the ${textDescription} text. Annotation: "${substring}"`);
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

const encodeModelAnnotation = (annotation: MergedAnnotation, lhsText: string, rhsText: string): ModelAnnotation => {
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

const decodeAnnotationsFromModelFormat = (modelAnnotations: ModelAnnotation[], lhsText: string, rhsText: string): Annotations => {
  const indexedAnnotations = (modelAnnotations as ModelAnnotation[]).map(a => decodeModelAnnotation(a, lhsText, rhsText));
  return splitMergedAnnotations(indexedAnnotations);
}

const encodeAnnotationsInModelFormat = (currentAnnotations: Annotations, lhsText: string, rhsText: string): ModelAnnotation[] => {
  const indexedAnnotations = mergeAnnotations(currentAnnotations);
  return indexedAnnotations.map(a => encodeModelAnnotation(a, lhsText, rhsText));
}

function parseAnnotationsFromModelFormat(jsonString: string, lhsText: string, rhsText: string): Annotations {
  const outputAnnotations = extractJSON(jsonString);
  console.info("Successfully parsed JSON annotations from file.");
  if (DEBUG) {
    console.debug(`Parsed annotations:\n${JSON.stringify(outputAnnotations, null, 2)}`);
  }

  validateJSONAnnotations(outputAnnotations);
  console.info("Validated JSON annotations.");

  const decodedAnnotations = decodeAnnotationsFromModelFormat(outputAnnotations, lhsText, rhsText);
  console.info("Finished decoding annotations.");

  return decodedAnnotations;
}

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 4) {
    console.error("Usage: node parseModelOutput.js <modelOutputFile> <lhsTextFile> <rhsTextFile> <outputFile>");
    process.exit(1);
  }

  const jsonString = readFile(args[0]);
  const lhsText = readFile(args[1]);
  const rhsText = readFile(args[2]);
  const outputPath = args[3];

  const parsedAnnotations = parseAnnotationsFromModelFormat(jsonString, lhsText, rhsText);

  // write to file
  const outputJSON = JSON.stringify(parsedAnnotations, null, 2);
  try {
    fs.writeFileSync(outputPath, outputJSON);
    console.info(`Successfully wrote output to ${outputPath}`);
  } catch (error) {
    console.error(`Error writing to file ${outputPath}`);
    process.exit(1);
  }
}

main();