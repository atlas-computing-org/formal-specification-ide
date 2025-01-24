import { AnnotationLookupImpl, AnnotationAndHighlightsLookup } from "./AnnotationLookup.ts";
import { AnnotationsSlice, AnnotationsSliceImpl } from "./AnnotationsSlice.ts";
import { TextPartitionIndices } from "./TextPartitionIndices.ts";
import { Annotations, AnnotationsWithText, Dataset, DatasetWithText, Direction, LabelType, TextLabelWithText,
  TextMappingWithText, TextRange, TextRangeWithText } from "@common/annotations.ts";

// ---------------------------------------------------------------------
// App Constants
// ---------------------------------------------------------------------

// The server URL
const SERVER_URL = "http://localhost:3001";

// The datasets to choose from
const DATASET_NAMES = ["SHA-1", "simpleText"];

const EMPTY_ANNOTATIONS: AnnotationsWithText = {
  mappings: [],
  lhsLabels: [],
  rhsLabels: [],
};
const EMPTY_DATASET: DatasetWithText = {
  lhsText: "",
  rhsText: "",
  annotations: EMPTY_ANNOTATIONS,
};

// ---------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------

let currentDataset: DatasetWithText = EMPTY_DATASET;

let currentHighlights: AnnotationsWithText = EMPTY_ANNOTATIONS;

// ---------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------

function cacheRangeText(ranges: TextRange[], text: string): TextRangeWithText[] {
  return ranges.map(({start, end}) => ({
    start,
    end,
    text: text.substring(start, end),
  }));
}

function cacheDatasetText(dataset: Dataset): DatasetWithText {
  const { annotations, lhsText, rhsText } = dataset;
  const annotationsWithText = {
    mappings: annotations.mappings.map(mapping => ({
      ...mapping,
      lhsRanges: cacheRangeText(mapping.lhsRanges, lhsText),
      rhsRanges: cacheRangeText(mapping.rhsRanges, rhsText),
    })),
    lhsLabels: annotations.lhsLabels.map(label => ({
      ...label,
      ranges: cacheRangeText(label.ranges, lhsText),
    })),
    rhsLabels: annotations.rhsLabels.map(label => ({
      ...label,
      ranges: cacheRangeText(label.ranges, rhsText),
    })),
  };

  return {
    lhsText,
    rhsText,
    annotations: annotationsWithText,
  };
}

async function fetchRawData(folderName: string): Promise<Dataset> {
  const basePath = `/data/${folderName}`;

  // Fetch all in parallel
  const [lhsText, rhsText, annotations] = await Promise.all([
    fetch(`${basePath}/lhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/rhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/annotations.json`).then((res) => res.json()),
  ]);

  return { lhsText, rhsText, annotations: annotations as Annotations };
}

async function fetchData(folderName: string) {
  const dataset = await fetchRawData(folderName);
  return cacheDatasetText(dataset);
}

// ---------------------------------------------------------------------
// Text Panels
// ---------------------------------------------------------------------

function getSeverity(annotations: AnnotationsSlice): LabelType {
  if (annotations.mappings.some(mapping => mapping.isError === true) ||
      annotations.labels.some(label => label.isError === true)) {
    return "error";
  } else if (
      annotations.mappings.some(mapping => mapping.isWarning === true) ||
      annotations.labels.some(label => label.isWarning === true)) {
    return "warning";
  } else {
    return "default";
  }
}

function renderTextSegment(startIdx: number, endIdx: number, textSegment: string,
    annotationLookup: AnnotationAndHighlightsLookup): string {
  const annotations = annotationLookup.annotations.getAnnotationsForIndex(startIdx);
  const highlights = annotationLookup.highlights.getAnnotationsForIndex(startIdx);
  const hasHighlights = highlights.mappings.length > 0 || highlights.labels.length > 0;
  const hasAnnotations = annotations.mappings.length > 0 || annotations.labels.length > 0;

  const highlightClass = hasHighlights ? `highlight-${getSeverity(highlights)}` : ""
  const annotationClass = hasAnnotations ? getSeverity(annotations) : ""
  return `<span class="${highlightClass} ${annotationClass}" data-start-index="${startIdx}">${textSegment}</span>`;
}

function renderPartitionedText(text: string, partitionIndices: TextPartitionIndices,
    annotationLookup: AnnotationAndHighlightsLookup): string {
  // Iterate through the sorted indices and partition the text
  let partitionedText = "";
  let lastIndex = 0;
  partitionIndices.getSortedIndices().forEach(index => {
    if (index === 0) {
      return; // Skip the first index (it's the starting point)
    }
    partitionedText += renderTextSegment(lastIndex, index, text.substring(lastIndex, index), annotationLookup);
    lastIndex = index;
  });

  return partitionedText;
}

function renderText(elementId: string, text: string, annotations: AnnotationsSlice, highlights: AnnotationsSlice) {
  const container = document.getElementById(elementId)!;
  const annotationLookup = new AnnotationAndHighlightsLookup(
    new AnnotationLookupImpl(annotations), new AnnotationLookupImpl(highlights));
  const partitionIndices = TextPartitionIndices.fromTextAndAnnotations(text, annotations);
  container.innerHTML = renderPartitionedText(text, partitionIndices, annotationLookup);
}

function sliceAnnotations(annotations: AnnotationsWithText, direction: Direction): AnnotationsSlice {
  return AnnotationsSliceImpl.fromAnnotations(annotations, direction);
}

function renderTexts(dataset: DatasetWithText, highlights: AnnotationsWithText) {
  const { lhsText, rhsText, annotations } = dataset;
  renderText("lhs-text-content", lhsText, sliceAnnotations(annotations, "lhs"), sliceAnnotations(highlights, "lhs"));
  renderText("rhs-text-content", rhsText, sliceAnnotations(annotations, "rhs"), sliceAnnotations(highlights, "rhs"));
}

// ---------------------------------------------------------------------
// Annotation Panels
// ---------------------------------------------------------------------

function startEditing(cell: HTMLElement, item: TextMappingWithText | TextLabelWithText, index: number) {
  const originalText = cell.textContent!;
  const input = document.createElement("input");
  input.type = "text";
  input.value = originalText;

  // Replace cell content with input field
  cell.textContent = "";
  cell.appendChild(input);
  input.focus();

  input.addEventListener("blur", () => stopEditing(cell, input, item, index, originalText));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      stopEditing(cell, input, item, index, originalText);
    } else if (e.key === "Escape") {
      cancelEditing(cell, input, originalText);
    }
  });
}

function stopEditing(cell: HTMLElement, input: HTMLInputElement, item: TextMappingWithText | TextLabelWithText, index: number, originalText: string) {
  const newValue = input.value;
  cell.textContent = newValue;
  input.remove();

  // Update the in-memory dataset
  item.description = newValue;

  // Propagate changes to the UI
  updateAnnotations(currentDataset.annotations);
}

function cancelEditing(cell: HTMLElement, input: HTMLInputElement, originalText: string) {
  cell.textContent = originalText;
  input.remove();
}

// Note: This listener is attached statically during initialization
function addEditCellListener() {
  document.getElementById("annotations")!.addEventListener("dblclick", (e) => {
    const target = e.target as HTMLElement;

    // Check if the clicked element is a label cell
    if (target.classList.contains("cell") && target.classList.contains("label")) {
      const row = target.closest(".row")!;
      const type = row.classList.contains("mapping") ? "mapping" :
                   row.classList.contains("lhs-label") ? "lhs-label" : "rhs-label";
      const index = parseInt(row.getAttribute("data-index")!);

      // Fetch the relevant item (mapping or label) based on the row's index and type
      let item;
      if (type === "mapping") {
        item = currentDataset.annotations.mappings[index];
      } else if (type === "lhs-label") {
        item = currentDataset.annotations.lhsLabels[index];
      } else {
        item = currentDataset.annotations.rhsLabels[index];
      }

      // Start editing the label
      startEditing(target, item, index);
    }
  });
}

function getLabelType(item: TextMappingWithText | TextLabelWithText): LabelType  {
  if (item.isError) {
    return "error";
  } else if (item.isWarning) {
    return "warning";
  } else {
    return "default";
  }
}

function renderMappings(mappings: TextMappingWithText[], highlights: TextMappingWithText[]) {
  const mappingsPanel = document.getElementById("mappings-panel")!;

  // Clear existing content if needed
  mappingsPanel.innerHTML = `<div class="header">Mappings</div>`;

  mappings.forEach((mapping, i) => {
    const labelType = getLabelType(mapping);
    const isHighlighted = highlights.includes(mapping);
    const row = document.createElement("div");
    row.className = `row mapping ${labelType} ${isHighlighted ? "highlight" : ""}`;
    row.dataset.index = i.toString();
    row.innerHTML = `
      <div class="cell label">${mapping.description}</div>
      <div class="cell">${mapping.lhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
      <div class="cell label">${mapping.description}</div>
      <div class="cell">${mapping.rhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseenter", () => {
      const highlights = {
        mappings: [mapping],
        lhsLabels: [],
        rhsLabels: [],
      }
      updateHighlights(highlights);
    });

    row.addEventListener("mouseleave", () => {
      updateHighlights(EMPTY_ANNOTATIONS);
    });

    mappingsPanel.appendChild(row);
  });
}

function renderLabels(direction: Direction, labels: TextLabelWithText[], highlights: TextLabelWithText[]) {
  const panel = document.getElementById(`${direction}-labels-panel`)!;

  // Clear existing content if needed
  panel.innerHTML = `<div class="header">${direction === "lhs" ? "LHS Labels" : "RHS Labels"}</div>`;

  labels.forEach((label, i) => {
    const labelType = getLabelType(label);
    const isHighlighted = highlights.includes(label);
    const row = document.createElement("div");
    row.className = `row ${direction}-label ${labelType} ${isHighlighted ? "highlight" : ""}`;
    row.dataset.index = i.toString();
    row.innerHTML = `
      <div class="cell label">${label.description}</div>
      <div class="cell">${label.ranges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseenter", () => {
      const lhsLabels = direction === "lhs" ? [label] : [];
      const rhsLabels = direction === "rhs" ? [label] : [];
      updateHighlights({ mappings: [], lhsLabels, rhsLabels });
    });

    row.addEventListener("mouseleave", () => {
      updateHighlights(EMPTY_ANNOTATIONS);
    });

    panel.appendChild(row);
  });
}

function renderAnnotationPanels(annotations: AnnotationsWithText, highlights: AnnotationsWithText) {
  renderMappings(annotations.mappings, highlights.mappings);
  renderLabels("lhs", annotations.lhsLabels, highlights.lhsLabels);
  renderLabels("rhs", annotations.rhsLabels, highlights.rhsLabels);
}

// ---------------------------------------------------------------------
// Annotation Generation
// ---------------------------------------------------------------------

async function generateAnnotations(lhsText: string, rhsText: string) {
  try {
    const response = await fetch(`${SERVER_URL}/generate-annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lhsText, rhsText }),
    });

    const data = await response.json();
    console.log("Claude's response:", data);

    if (data.error) {
      throw new Error(data.error);
    }

    // Update in-memory annotations with the new annotations
    const annotations = data.response as Annotations;
    const dataset = cacheDatasetText({ lhsText, rhsText, annotations });
    updateData(dataset);
  } catch (error) {
    console.error("Error generating annotations:", error);
    // Clear in-memory annotations if there was an error
    const dataset = { lhsText, rhsText, annotations: EMPTY_ANNOTATIONS };
    updateData(dataset);
  }
}

// ---------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------

// Print JSON annotations
function renderJSONAnnotationsPanel(annotations: AnnotationsWithText) {
  document.getElementById("json-annotations")!.innerHTML = JSON.stringify(annotations, null, 2);
}

function render(dataset: DatasetWithText, highlights: AnnotationsWithText) {
  renderTexts(dataset, highlights);
  renderAnnotationPanels(dataset.annotations, highlights);
  renderJSONAnnotationsPanel(dataset.annotations);
}

function updateHighlights(highlights: AnnotationsWithText) {
  updateAppState(currentDataset, highlights);
}

function updateAnnotations(annotations: AnnotationsWithText) {
  updateData({ ...currentDataset, annotations });
}

function updateData(dataset: DatasetWithText) {
  updateAppState(dataset, EMPTY_ANNOTATIONS);
}

function updateAppState(dataset: DatasetWithText, highlights: AnnotationsWithText) {
  currentDataset = dataset;
  currentHighlights = highlights;
  render(dataset, highlights);
}

// ---------------------------------------------------------------------
// Static Content Initialization
// ---------------------------------------------------------------------

// Populate the dropdown with the static DATASET_NAMES array
function populateDataSelector() {
  const selector = document.getElementById("data-selector") as HTMLSelectElement;
  // Clear any existing children (if necessary)
  selector.innerHTML = "";

  DATASET_NAMES.forEach((dataset, idx) => {
    const option = document.createElement("option");
    option.value = dataset;
    option.textContent = dataset;
    if (idx === 0) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
}

function initializeHeader() {
  populateDataSelector();

  // Attach event listener for the "Generate Annotations" button
  document.getElementById("generate-annotations")!.addEventListener("click", () => {
    const { lhsText, rhsText } = currentDataset;
    generateAnnotations(lhsText, rhsText);
  });
}

function initializeFooter() {
  // Toggle highlighting all annotations on click
  document.getElementById('highlight-all-annotations')!.addEventListener('click', () => {
    const textContentDiv = document.getElementById('text-content')!;
    textContentDiv.classList.toggle('highlight-all');
  });

  // Toggle annotations panel visibility on click
  const hideAnnotationsPanelButton = document.getElementById('hide-annotations-panel')!;
  hideAnnotationsPanelButton.addEventListener('click', () => {
    const annotationsElement = document.getElementById('annotations')!;
    annotationsElement.classList.toggle('hide');
    annotationsElement.classList.contains('hide') ?
      hideAnnotationsPanelButton.textContent = 'Show Annotations Panel' :
      hideAnnotationsPanelButton.textContent = 'Hide Annotations Panel';
  });

  // Toggle JSON annotations visibility on click
  const showJSONButton = document.getElementById('show-json')!;
  showJSONButton.addEventListener('click', () => {
    const jsonAnnotationsElement = document.getElementById('json-annotations')!;
    jsonAnnotationsElement.classList.toggle('show');
    jsonAnnotationsElement.classList.contains('show') ?
      showJSONButton.textContent = 'Hide JSON' :
      showJSONButton.textContent = 'Show JSON';
  });
}

function initializeMainStaticContent() {
  addEditCellListener();
}

// Initialize content that is not data-dependent
function initializeStaticContent() {
  initializeHeader();
  initializeFooter();
  initializeMainStaticContent();
}

// ---------------------------------------------------------------------
// Main Initialization
// ---------------------------------------------------------------------

async function loadAndRender(folderName: string) {
  const dataset = await fetchData(folderName);
  updateData(dataset);
}

// Main function to set up default and attach listeners
async function main() {
  initializeStaticContent();

  // Load default dataset on initial page load
  await loadAndRender(DATASET_NAMES[0]);

  // Add an event listener to the dropdown
  const selector = document.getElementById("data-selector");
  if (selector) {
    selector.addEventListener("change", async (e) => {
      const folderName = (e.target as HTMLSelectElement).value;
      await loadAndRender(folderName);
    });
  }
}

// Run the main function on page load
main();
