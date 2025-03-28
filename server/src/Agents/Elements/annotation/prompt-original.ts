// TODO: Move this into a .txt file
export const PROMPT =
`You are an expert in text comparison and annotation. Your task is to analyze two pieces of text and suggest annotations that capture the significant relationships between them. The text on the left (LHS TEXT) and the right (RHS TEXT) may have corresponding words, phrases, or concepts that need to be highlighted. Sometimes, some annotations have already been made, in which case you should only find new annotations to add. New annotations should cover different, usually disjoint parts of the text compared to the existing annotations. Please take care not to simply reconstruct the existing annotations, but to instead provide value by annotating currently unannotated parts of the text.

Your job is to:
1. Identify key phrases and words in both texts.
2. Group related phrases or words in both LHS TEXT and RHS TEXT. Prioritize phrases that are not already included in the existing annotations.
3. Provide new mappings between corresponding phrases/words in the LHS and RHS texts, including any potential relationships or synonyms. Avoid repeating existing annotations.
4. Describe the annotations with appropriate names or short phrases, such as "Greeting," "Noun," or other suitable labels based on the context of each text.
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

### EXISTING ANNOTATIONS

[{
  description: "Greeting",
  lhsText: ["Hello"],
  rhsText: ["Hi"],
  status: "default"
}]
\`\`\`

For the above example, you might create a mapping between "Hello" and "Hi", "ugly" and "beautiful", and "world" and "planet". If you detect synonyms or specific relationships, label them accordingly. Since "ugly" and "beautiful" are playing symmetric roles in the texts (they are both descriptors), it makes sense to match these, but since their meanings do not match, this is likely an error.

Now, based on these instructions, please generate a JSON object with annotations. Each annotation should include:
- A short description for each mapping.
- The LHS phrase(s) and RHS phrase(s) that are matched in the mapping. There can be more than one phrase for each side, and the phrases need not be contiguous. Every LHS phrase needs to be an exact substring of the LHS input text, and likewise for every RHS phrase. Please take extra care to make substrings exact, including whitespace and escape characters.
- Status for each mapping, indicating if there is any ambiguity or issue.

The JSON output format should be a list of objects. Each object has four fields: a text field "description", a text list field "lhsText", a text list field "rhsText", and a text field "status". The status field value must be one of "default", "warning", or "error".

Please organize your output into the three sections shown below, each of which begins with "### <SECTION NAME>". The second section, JSON ANNOTATIONS, should contain the JSON output in a code formatting block and nothing else.

Here's an example output:

### CHAIN-OF-THOUGHT ANALYSIS

I'll analyze these texts and create annotations that capture their relationships.

### JSON ANNOTATIONS

\`\`\`json
[{
  description: "Object",
  lhsText: ["world"],
  rhsText: ["planet"],
  status: "default"
}, {
  description: "Characteristic",
  lhsText: ["ugly"],
  rhsText: ["beautiful"],
  status: "error"
}, {
  description: "All words",
  lhsText: ["Hello", "ugly", "world"],
  rhsText: ["Hi", "beautiful", "planet"],
  status: "default"
}, {
  description: "Question",
  lhsText: ["How are you?"],
  rhsText: [],
  status: "error"
}]
\`\`\`

### NOTES AND CONCERNS

This was a simple example, so there are no concerns.`;
