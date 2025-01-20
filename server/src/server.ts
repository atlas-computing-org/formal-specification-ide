import express from 'express';
import { ChatAnthropic } from '@langchain/anthropic';
import bodyParser from 'body-parser';
import cors from 'cors';

const PORT = 3001;
const CLIENT_PORT = 3000;
const CLIENT_ORIGIN = `http://localhost:${CLIENT_PORT}`;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT =
`You are an expert in text comparison and annotation. Your task is to analyze two pieces of text and suggest annotations that capture the significant relationships between them. The text on the left (LHS TEXT) and the right (RHS TEXT) may have corresponding words, phrases, or concepts that need to be highlighted.

Your job is to:
1. Identify key phrases and words in both texts.
2. Group related phrases or words in both LHS TEXT and RHS TEXT.
3. Provide the mapping between corresponding phrases/words in the LHS and RHS texts, including any potential relationships or synonyms.
4. Label the annotations with appropriate names, such as "Greeting," "Noun," or other suitable labels based on the context of each text.
5. Provide the status for each annotation:
   - "default" for mappings that correctly preserve concepts.
   - "warning" for possibly ambiguous or concerning mappings.
   - "error" for mappings that are incorrect or mismatched.

Example of the input texts:
\`\`\`
### LHS TEXT

Hello ugly world! How are you?

### RHS TEXT

Hi beautiful planet!
\`\`\`

For the above example, you might create a mapping between "Hello" and "Hi", "ugly" and "beautiful", and "world" and "planet". If you detect synonyms or specific relationships, label them accordingly. Since "ugly" and "beautiful" are playing symmetric roles in the texts (they are both descriptors), it makes sense to match these, but since their meanings do not match, this is likely an error.

Now, based on these instructions, please generate a JSON object with annotations. Each annotation should include:
- A short, descriptive label for each mapping.
- The LHS phrase(s) and RHS phrase(s) that are matched in the mapping. There can be more than one phrase for each side, and the phrases need not be contiguous. Every LHS phrase needs to be an exact substring of the LHS input text, and likewise for every RHS phrase. Please take extra care to make substrings exact, including whitespace and escape characters.
- Status for each mapping, indicating if there is any ambiguity or issue.

The JSON output format should be a list of objects. Each object has four fields: a text field "label", a text list field "lhsText", a text list field "rhsText", and a text field "status". The status field value must be one of "default", "warning", or "error".

Please organize your output into the three sections shown below, each of which begins with "### <SECTION NAME>". The second section, JSON ANNOTATIONS, should contain the JSON output in a code formatting block and nothing else.

Here's an example output:

### CHAIN-OF-THOUGHT ANALYSIS

I'll analyze these texts and create annotations that capture their relationships.

### JSON ANNOTATIONS

\`\`\`json
[{
  label: "Greeting",
  lhsText: ["Hello"],
  rhsText: ["Hi"],
  status: "default"
}, {
  label: "All words",
  lhsText: ["Hello", "ugly", "world"],
  rhsText: ["Hi", "beautiful", "planet"],
  status: "default"
}, {
  label: "Description",
  lhsText: ["ugly"],
  rhsText: ["beautiful"],
  status: "error"
}, {
  label: "Object",
  lhsText: ["world"],
  rhsText: ["planet"],
  status: "default"
}, {
  label: "Question",
  lhsText: ["How are you?"],
  rhsText: [],
  status: "error"
}]
\`\`\`

### NOTES AND CONCERNS

This was a simple example, so there are no concerns.`;

type ModelOutputAnnotation = {
  label: string;
  lhsText: string[];
  rhsText: string[];
  status: 'default' | 'warning' | 'error';
}

type TextRange = {
  start: number;
  end: number;
};

type TextLabel = {
  label: string;
  ranges: TextRange[];
  isWarning?: boolean;
  isError?: boolean;
};

type TextMapping = {
  label: string;
  lhsRanges: TextRange[];
  rhsRanges: TextRange[];
  isWarning?: boolean;
  isError?: boolean;
};

interface Annotations {
  mappings: TextMapping[];
  lhsLabels: TextLabel[];
  rhsLabels: TextLabel[];
}

const app = express();

// Enable CORS for all routes, allowing requests from the client server
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type',
}));

// Middleware to parse JSON
app.use(bodyParser.json());

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

    console.log("### JSON STRING ###");
    console.log(jsonString)
    console.log("### done ###");

    return JSON.parse(escapeString(jsonString));
  } catch (error) {
    console.error("Error parsing JSON annotations. Content: %s", content)
    console.error(error);
    console.log("....x..");
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

const annotateWithClaude = async (lhsText: string, rhsText) => {
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

// Route to generate annotations
app.post('/generate-annotations', async (req, res) => {
  const { lhsText, rhsText } = req.body;

  if (!lhsText) {
    return res.status(400).send({ error: "lhsText is required." });
  }

  if (!rhsText) {
    return res.status(400).send({ error: "rhsText is required." });
  }

  try {
    const response = await annotateWithClaude(lhsText, rhsText);
    res.json({ response });
  } catch (error) {
    res.status(500).send({ error: "Error generating annotations." });
  }
});

// Serve static files (including your frontend)
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

