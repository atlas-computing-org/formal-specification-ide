import { StateInfo } from "../agent.ts";

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

export const validateJSONNode = (state: typeof StateInfo.State) => {
  validateJSONAnnotations(state.outputAnnotations);
  state.logger.info("Validated JSON annotations.");
  return {};
};