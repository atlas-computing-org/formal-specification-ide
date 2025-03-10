# Formal Specification IDE

This prototype helps engineers write correct mechanized specs and review other people's specs. Requirements for theorem proving are typically written in natural language and pen-and-paper formalizations before they are mechanized. Engineers must make sure the mechanizations capture these human-readable specifications, but engineers have little support for bridging human-readable and mechanized specs. We think we can provide valuable support through automated bookkeeping and natural-language understanding, reducing the effort and skills needed to gain confidence in a mechanized spec.

## Install and Setup

1. Install Node.js & npm if needed (skip if you already have this installed)

On Mac:
```
brew install node
```
On other systems: please google search.

2. Install packages for this tool
```
npm install
```

## Build and Run

1. Build and serve the web client at http://localhost:3000 (for now, this is served separately from the LLM backend)
```
npm run dev
```

2. Visit http://localhost:3000 to see the result

3. Select the dataset you want to visualize with the "Load Documentation" selector at the top of the UI.

4. Most of the other buttons will do nothing useful, but the "Highlight All" and "Hide Annotations Panel" at the bottom of the page are helpful.

## Convert Annotations From AI Prompt Format to Frontend Data Format

1. Store the JSON string returned from the model in its own file. Tips:
  - Double-quote characters inside strings currently break the conversion. Delete all the escaped double-quote characters (i.e. \" characters) and rely on fuzzy-search to match these strings.
  - Don't worry if the model response terminates in the middle of generating the JSON object. The convert script can handle truncated but otherwise valid JSON objects. Just store what you have in a file.

2. Run the convert script. Pass filepaths to the model's output JSON and the LHS and RHS text files, and specify the filepath for the converted output file.
```
npm run convert <modelOutputFile> <lhsTextFile> <rhsTextFile> <outputFile>
```

## Provided Data

Datasets are stored in frontend/public/data. Each dataset contains the following files:

- annotations.json: Annotations in the Frontend Data Format
- pdf.pdf: The original natural-language PDF spec
- selected-text.txt: The "LHS" text - this is Latex-formatted text corresponding to the PDF natural-language spec
- pre-written.txt: The "RHS" text - this is Lean code that aims to mechanize the natural-language spec for formal verification
- full-text.txt: Ignore this

Replace annotations.json to change the annotations visualized in the frontend.

Additionally, the SHA-1 annotations are provided in the model format in ./sha1-annotations-model-format.json. Note: converting this file does not perfectly recover the original annotations in frontend/public/data/SHA-1 because of lossiness and minor drift in the conversion from substrings to text indices. You can see an example of this in sha1-annotations-converted-format.json. It's worth being aware of these shortcomings in the visualization, but don't focus on fixing these for the take-home task.

## Provided Model Prompts

Below are two model prompts that we have used previously for the task (with Claude Sonnet). The first prompt tells Claude to generate an initial set of annotations, and the second prompt guides Claude on improving the quality of those annotations, by finding issues with coverage or specificity.

- prompt-annotate.txt: Contains a prompt that we use for eliciting annotations (in JSON format) between the selected text and the pre-written text
- prompt-assess.txt: Contains a prompt that we use for eliciting an assessment (e.g. identifying poor mappings or poor coverage) of existing annotations from Claude Sonnet
