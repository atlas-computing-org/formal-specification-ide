import '@fortawesome/fontawesome-free/css/all.min.css';

import { AnnotationLookupImpl, AnnotationAndHighlightsLookup } from "./AnnotationLookup.ts";
import { AnnotationsSlice, AnnotationsSliceImpl } from "./AnnotationsSlice.ts";
import { LeftTabMode, RightTabMode, TabState } from "./TabState.ts";
import { TextPartitionIndices } from "./TextPartitionIndices.ts";
import { Annotations, AnnotationSets, AnnotationsWithText, Dataset, DatasetWithText, Direction, LabelType,
  TextLabelWithText, MultiAnnotationsDataset, TextMappingWithText, TextRange, TextRangeWithText,
  mergeAnnotations } from "@common/annotations.ts";
import { ChatAboutAnnotationsRequest, ChatAboutAnnotationsResponse } from "@common/serverAPI/chatAboutAnnotationsAPI.ts";
import { GenerateAnnotationsRequest, GenerateAnnotationsResponse } from "@common/serverAPI/generateAnnotationsAPI.ts";
import { GetDatasetResponse } from "@common/serverAPI/getDatasetAPI.ts";
import { GetDatasetNamesResponse } from "@common/serverAPI/getDatasetNamesAPI.ts";
import { AI_ASSISTANT_WELCOME_MESSAGE } from './aiAssistantWelcomeMessage.ts';

// ---------------------------------------------------------------------
// App Constants
// ---------------------------------------------------------------------

// The server URL
const SERVER_PORT = __PORTS__.BACKEND_PORT;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

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

const INITIAL_TAB_STATE: TabState = {
  left: "selected-text",
  right: "pre-written",
};

// Developer-only features
const DEFAULT_ANNOTATIONS_SET_NAME = "annotations";

// ---------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------

let currentDataset: DatasetWithText = EMPTY_DATASET;
let currentHighlights: AnnotationsWithText = EMPTY_ANNOTATIONS;

// FIXME
let HACK_pdfSrc = "";
let HACK_fullText = "";

let currentTabState: TabState = INITIAL_TAB_STATE;
let isNewChat = true;

let useDemoCache = false;

let listenersToRemove: Array<() => void> = [];

// Developer-only features
let currentAnnotationSets: AnnotationSets = {};
let selectedAnnotationsSetName = DEFAULT_ANNOTATIONS_SET_NAME;

// Debug info
let lastRawModelOutput: string = "";
let allRawModelOutputs: string[] = [];

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

function removeCachedTextFromRanges(annotations: TextRangeWithText[]): TextRange[] {
  return annotations.map(({ start, end }) => ({ start, end }));
}

function removeCachedText(annotations: AnnotationsWithText): Annotations {
  return {
    mappings: annotations.mappings.map(({ description, lhsRanges, rhsRanges, isError, isWarning }) => ({
      description, lhsRanges: removeCachedTextFromRanges(lhsRanges), rhsRanges: removeCachedTextFromRanges(rhsRanges), isError, isWarning
    })),
    lhsLabels: annotations.lhsLabels.map(({ description, ranges, isError, isWarning }) => ({
      description, ranges: removeCachedTextFromRanges(ranges), isError, isWarning
    })),
    rhsLabels: annotations.rhsLabels.map(({ description, ranges, isError, isWarning }) => ({
      description, ranges: removeCachedTextFromRanges(ranges), isError, isWarning
    })),
  };
}

async function fetchRawData(datasetName: string): Promise<MultiAnnotationsDataset> {
  // Use the new API endpoint to fetch dataset
  const responseRaw = await fetch(`${SERVER_URL}/getDataset/${datasetName}`);
  if (!responseRaw.ok) {
    throw new Error('Failed to fetch dataset');
  }
  const response = await responseRaw.json() as GetDatasetResponse;
  if ("error" in response) {
    throw new Error(response.error);
  }
  const { lhsText, rhsText, annotations, fullText, pdfUrl } = response.data;
  HACK_pdfSrc = `${SERVER_URL}${pdfUrl}`;
  HACK_fullText = fullText;
  return { lhsText, rhsText, annotations };
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
    annotationLookup: AnnotationAndHighlightsLookup, updateHighlightsForIndex: (index: number) => void): HTMLElement {
  const annotations = annotationLookup.annotations.getAnnotationsForIndex(startIdx);
  const highlights = annotationLookup.highlights.getAnnotationsForIndex(startIdx);
  const hasHighlights = highlights.mappings.length > 0 || highlights.labels.length > 0;
  const hasAnnotations = annotations.mappings.length > 0 || annotations.labels.length > 0;

  const highlightClass = hasHighlights ? `highlight-${getSeverity(highlights)}` : "";
  const annotationClass = hasAnnotations ? getSeverity(annotations) : "";

  const span = document.createElement("span");
  span.className = `${highlightClass} ${annotationClass}`;
  span.setAttribute("data-start-index", startIdx.toString());
  span.textContent = textSegment;

  // Only add event listeners if the span has annotations to highlight
  if (hasAnnotations) {
    const mouseEnterListener = () => updateHighlightsForIndex(startIdx);
    const mouseLeaveListener = () => updateHighlightsIfChanged(EMPTY_ANNOTATIONS);

    // Register the event listeners
    span.addEventListener("mouseenter", mouseEnterListener);
    span.addEventListener("mouseleave", mouseLeaveListener);

    // Add cleanup functions for listeners to be removed later
    listenersToRemove.push(() => {
      span.removeEventListener('mouseenter', mouseEnterListener);
      span.removeEventListener('mouseleave', mouseLeaveListener);
    });
  }

  return span;
}

function renderPartitionedText(text: string, partitionIndices: TextPartitionIndices,
    annotationLookup: AnnotationAndHighlightsLookup, updateHighlightsForIndex: (index: number) => void): DocumentFragment {
  // Iterate through the sorted indices and partition the text
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  partitionIndices.getSortedIndices().forEach(index => {
    if (index === 0) {
      return; // Skip the first index (it's the starting point)
    }
    const segment = text.substring(lastIndex, index);
    const span = renderTextSegment(lastIndex, index, segment, annotationLookup, updateHighlightsForIndex);
    fragment.appendChild(span);
    lastIndex = index;
  });

  return fragment;
}

function renderText(container: HTMLElement, text: string, annotations: AnnotationsSlice, highlights: AnnotationsSlice,
    updateHighlightsForIndex: (index: number) => void) {
  const annotationLookup = new AnnotationAndHighlightsLookup(
    new AnnotationLookupImpl(annotations), new AnnotationLookupImpl(highlights));
  const partitionIndices = TextPartitionIndices.fromTextAndAnnotations(text, annotations);
  const partitionedText = renderPartitionedText(text, partitionIndices, annotationLookup, updateHighlightsForIndex);

  container.appendChild(partitionedText);
}

function renderPDF(container: HTMLElement, src: string) {
  const iframe = document.createElement("iframe");
  iframe.id = "pdf-frame"
  iframe.src = src;
  iframe.width = "100%";
  iframe.height = "100%";
  container.appendChild(iframe);
}

function getMatchingRangesForIndex(ranges: TextRangeWithText[], index: number): TextRangeWithText[] {
  return ranges.filter(range => range.start <= index && index < range.end);
}

function isInnerMostRange(targetRanges: TextRangeWithText[], index: number, matchingRanges: TextRangeWithText[]): boolean {
  const rangesAreIdentical = (a: TextRangeWithText, b: TextRangeWithText): boolean =>
    a.start === b.start && a.end === b.end;
  const rangeIsStrictSuperset = (a: TextRangeWithText, b: TextRangeWithText): boolean =>
    a.start <= b.start && b.end <= a.end && !rangesAreIdentical(a, b);

  // A range is inner-most if it is not a strict superset of any other matching range
  return targetRanges
    .filter(range => range.start <= index && index < range.end) // performance optimization: filter by index first
    .filter(range => !matchingRanges.some(other => rangeIsStrictSuperset(range, other)))
    .length > 0;
}

// Filter to the inner-most annotations at the given index
function filterAnnotationsForIndex(annotations: AnnotationsWithText, index: number, direction: Direction): AnnotationsWithText {
  const matchingMappingRanges = annotations.mappings.flatMap(
    mapping => getMatchingRangesForIndex(mapping[`${direction}Ranges`], index));
  const innerMatchingMappings = annotations.mappings.filter(
    mapping => isInnerMostRange(mapping[`${direction}Ranges`], index, matchingMappingRanges));

  const matchingLabelRanges = annotations[`${direction}Labels`].flatMap(
    label => getMatchingRangesForIndex(label.ranges, index));
  const innerMatchingLabels = annotations[`${direction}Labels`].filter(
    label => isInnerMostRange(label.ranges, index, matchingLabelRanges));


  return {
    mappings: innerMatchingMappings,
    lhsLabels: direction === "lhs" ? innerMatchingLabels : [],
    rhsLabels: direction === "rhs" ? innerMatchingLabels : [],
  };
}

function updateHighlightsForIndexAndDirection(annotations: AnnotationsWithText, index: number, direction: Direction) {
  const filteredAnnotations = filterAnnotationsForIndex(annotations, index, direction);
  updateHighlightsIfChanged(filteredAnnotations);
}

function updateTabStateStyles(tabState: TabState) {
  const tabs: Array<LeftTabMode | RightTabMode> = ["pdf", "full-text", "selected-text", "pre-written", "generated"];
  tabs.forEach(tab => {
    const element = document.getElementById(`tab-${tab}`)!;
    element.classList.remove("active");
  });

  document.getElementById(`tab-${tabState.left}`)!.classList.add("active");
  document.getElementById(`tab-${tabState.right}`)!.classList.add("active");
}

function sliceAnnotations(annotations: AnnotationsWithText, direction: Direction): AnnotationsSlice {
  return AnnotationsSliceImpl.fromAnnotations(annotations, direction);
}

function renderTextPanels(dataset: DatasetWithText, highlights: AnnotationsWithText, tabState: TabState) {
  const { lhsText, rhsText, annotations } = dataset;

  updateTabStateStyles(tabState);

  const lhsContainer = document.getElementById("lhs-text-content")!;
  const rhsContainer = document.getElementById("rhs-text-content")!;

  // Clear the existing content
  lhsContainer.innerHTML = '';
  rhsContainer.innerHTML = '';

  // Render the left-side panel
  switch (tabState.left) {
    case "pdf":
      renderPDF(lhsContainer, HACK_pdfSrc);
      break;

    case "full-text":
      // TODO: Support annotations against the full-text document
      renderText(lhsContainer, HACK_fullText, sliceAnnotations(EMPTY_ANNOTATIONS, "lhs"),
        sliceAnnotations(EMPTY_ANNOTATIONS, "lhs"), _ => {});
      break;

    case "selected-text":
      renderText(lhsContainer, lhsText, sliceAnnotations(annotations, "lhs"), sliceAnnotations(highlights, "lhs"),
        (index) => updateHighlightsForIndexAndDirection(annotations, index, "lhs"));
      break;

    default:
      console.error(`Unsupported left tab state: ${tabState.left}`);
  }

  // Render the right-side panel
  switch (tabState.right) {
    case "pre-written":
      renderText(rhsContainer, rhsText, sliceAnnotations(annotations, "rhs"), sliceAnnotations(highlights, "rhs"),
        (index) => updateHighlightsForIndexAndDirection(annotations, index, "rhs"));
      break;

    case "generated":
      // TODO: Support generated mode
      break;

    default:
      console.error(`Unsupported right tab state: ${tabState.left}`);
  }
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
  cell.innerHTML = "";
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

function renderCellDescription(description: string): HTMLElement {
  const div = document.createElement("div");
  div.classList.add("cell", "description");
  div.textContent = description;
  return div;
}

function renderCellContent(content: TextRangeWithText[]): HTMLElement {
  const div = document.createElement("div");
  div.classList.add("cell", "content");
  for (const range of content) {
    // Example element:
    // <div class="range">
    //   <span class="index">1-10: </span>
    //   <span class="text">This is a range</span>
    // </div>
    const rangeDiv = document.createElement("div");
    rangeDiv.classList.add("range");
    div.appendChild(rangeDiv);

    const indexSpan = document.createElement("span");
    indexSpan.classList.add("index");
    indexSpan.textContent = `${range.start}-${range.end}: `;
    rangeDiv.appendChild(indexSpan);

    const textSpan = document.createElement("span");
    textSpan.classList.add("text");
    textSpan.textContent = range.text;
    rangeDiv.appendChild(textSpan);
  }
  return div;
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

    const lhsDescription = renderCellDescription(mapping.description);
    const lhsContent = renderCellContent(mapping.lhsRanges);
    const rhsDescription = renderCellDescription(mapping.description);
    const rhsContent = renderCellContent(mapping.rhsRanges);
    row.appendChild(lhsDescription);
    row.appendChild(lhsContent);
    row.appendChild(rhsDescription);
    row.appendChild(rhsContent);

    const mouseEnterListener = () => updateHighlightsIfChanged({
      mappings: [mapping],
      lhsLabels: [],
      rhsLabels: [],
    });
    const mouseLeaveListener = () => updateHighlightsIfChanged(EMPTY_ANNOTATIONS);

    row.addEventListener("mouseenter", mouseEnterListener);
    row.addEventListener("mouseleave", mouseLeaveListener);

    listenersToRemove.push(() => {
      row.removeEventListener('mouseenter', mouseEnterListener);
      row.removeEventListener('mouseleave', mouseLeaveListener);
    });

    mappingsPanel.appendChild(row);
  });
}

function renderLabels(direction: Direction, labels: TextLabelWithText[], highlights: TextLabelWithText[]) {
  const panel = document.getElementById(`${direction}-labels-panel`)!;

  // Clear existing content if needed
  panel.innerHTML = `<div class="header">${direction === "lhs" ? "Left-Side Labels" : "Right-Side Labels"}</div>`;

  labels.forEach((label, i) => {
    const labelType = getLabelType(label);
    const isHighlighted = highlights.includes(label);
    const row = document.createElement("div");
    row.className = `row ${direction}-label ${labelType} ${isHighlighted ? "highlight" : ""}`;
    row.dataset.index = i.toString();

    const description = renderCellDescription(label.description);
    const content = renderCellContent(label.ranges);
    row.appendChild(description);
    row.appendChild(content);

    const mouseEnterListener = () => {
      const lhsLabels = direction === "lhs" ? [label] : [];
      const rhsLabels = direction === "rhs" ? [label] : [];
      updateHighlightsIfChanged({ mappings: [], lhsLabels, rhsLabels });
    };
    const mouseLeaveListener = () => updateHighlightsIfChanged(EMPTY_ANNOTATIONS);

    row.addEventListener("mouseenter", mouseEnterListener);
    row.addEventListener("mouseleave", mouseLeaveListener);

    listenersToRemove.push(() => {
      row.removeEventListener('mouseenter', mouseEnterListener);
      row.removeEventListener('mouseleave', mouseLeaveListener);
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

async function generateAnnotations(lhsText: string, rhsText: string,
    currentAnnotations: AnnotationsWithText, useDemoCache: boolean) {
  const currentAnnotationsNoCache = removeCachedText(currentAnnotations);
  try {
    const body: GenerateAnnotationsRequest = {
      lhsText,
      rhsText,
      currentAnnotations: currentAnnotationsNoCache,
      useDemoCache,
    };
    const responseRaw = await fetch(`${SERVER_URL}/generate-annotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const response = await responseRaw.json() as GenerateAnnotationsResponse;
    console.log("Claude's response:", response);

    if ("error" in response) {
        // Add debug info if any
      if (response.debugInfo) {
        const { rawModelOutput } = response.debugInfo;
        lastRawModelOutput = rawModelOutput;
        allRawModelOutputs.push(rawModelOutput);
      }
      throw new Error(response.error);
    }

    const newAnnotations = response.data;
    const { rawModelOutput } = response.debugInfo;

    // Add debug info
    lastRawModelOutput = rawModelOutput;
    allRawModelOutputs.push(rawModelOutput);

    // Update in-memory annotations with the new annotations
    // const newAnnotations = data.response as Annotations;
    const annotations = mergeAnnotations(currentAnnotationsNoCache, newAnnotations);
    const dataset = cacheDatasetText({ lhsText, rhsText, annotations });
    updateData(dataset);
  } catch (error) {
    console.error("Error generating annotations:", error);
  }
}

// ---------------------------------------------------------------------
// AI Assistant Chat
// ---------------------------------------------------------------------

function openChatModal() {
  document.getElementById("chat-modal")!.classList.add("show");
}

function closeChatModal() {
  document.getElementById("chat-modal")!.classList.remove("show");
}

type ChatUser = "user" | "assistant" | "system";

function addChatMessage(message: string, sender: ChatUser) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.innerHTML = message;
  const chatThread = document.getElementById("chat-thread")!;
  chatThread.appendChild(messageDiv);
  chatThread.scrollTop = chatThread.scrollHeight; // Scroll to bottom
}

async function sendChatMessage() {
  const chatInput = document.getElementById("chat-input") as HTMLInputElement;
  const message = chatInput.value.trim();
  if (message) {
    addChatMessage(message, "user");
    // Clear input
    chatInput.value = "";

    const { lhsText, rhsText, annotations } = currentDataset;
    const annotationsNoCache = removeCachedText(annotations);
    const body: ChatAboutAnnotationsRequest = {
      userInput: message,
      lhsText,
      rhsText,
      annotations: annotationsNoCache,
      reset: isNewChat,
    };
    const responseRaw = await fetch(`${SERVER_URL}/chat-with-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    isNewChat = false;
    const response = await responseRaw.json() as ChatAboutAnnotationsResponse;
    if ("error" in response) {
      throw new Error(response.error);
    }
    addChatMessage(response.data, "assistant");
  }
}

function initializeChat() {
  const chatThread = document.getElementById("chat-thread")!;
  chatThread.innerHTML = ""; // Clear the chat thread
  addChatMessage(AI_ASSISTANT_WELCOME_MESSAGE, "system");
}

function resetChat() {
  initializeChat();
  isNewChat = true;
}

// ---------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------

function updateAnnotationsSetDropdown() {
  const selectDropdown = document.getElementById("annotations-set-selector") as HTMLSelectElement;
  const selectDropdownContainer = document.getElementById("annotations-set-selector-container") as HTMLSelectElement;
  const keys = Object.keys(currentAnnotationSets).sort();
  selectDropdown.innerHTML = "";
  keys.forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    if (key === selectedAnnotationsSetName) {
      option.selected = true;
    }
    selectDropdown.appendChild(option);
  });
  if (keys.length > 1) {
    selectDropdownContainer.classList.remove("hidden");
  } else {
    selectDropdownContainer.classList.add("hidden");
  }
}

// ---------------------------------------------------------------------
// State Management
// ---------------------------------------------------------------------

function removeEventListeners() {
  listenersToRemove.forEach(removeListener => removeListener());
  listenersToRemove = [];
}

function render(dataset: DatasetWithText, highlights: AnnotationsWithText, tabState: TabState) {
  // Remove dynamic event listeners before re-rendering dynamic content to avoid cycles.
  // Renders shouldn't trigger events that would cause re-renders.
  // TODO: Fix this hack by using a proper state management library.
  removeEventListeners();

  renderTextPanels(dataset, highlights, tabState);
  renderAnnotationPanels(dataset.annotations, highlights);
}

function highlightsDidChange(prevHighlights: AnnotationsWithText, newHighlights: AnnotationsWithText) {
  return JSON.stringify(prevHighlights) !== JSON.stringify(newHighlights);
}

function updateHighlightsIfChanged(highlights: AnnotationsWithText) {
  if (highlightsDidChange(currentHighlights, highlights)) {
    updateHighlights(highlights);
  }
}

function updateHighlights(highlights: AnnotationsWithText) {
  updateAppState(currentDataset, highlights, currentTabState);
}

function updateAnnotations(annotations: AnnotationsWithText) {
  updateData({ ...currentDataset, annotations });
}

function updateSelectedAnnotationsSet(annotationsSetName: string) {
  selectedAnnotationsSetName = annotationsSetName;

  const { lhsText, rhsText } = currentDataset;
  const rawAnnotations = currentAnnotationSets[selectedAnnotationsSetName] || EMPTY_ANNOTATIONS;
  const rawDataset = { lhsText, rhsText, annotations: rawAnnotations };

  const dataset = cacheDatasetText(rawDataset);
  updateAnnotationsSetDropdown();
  updateData(dataset);
}

function updateData(dataset: DatasetWithText) {
  updateAppState(dataset, EMPTY_ANNOTATIONS, currentTabState);
}

function selectLeftPanelTab(tab: "pdf" | "full-text" | "selected-text") {
  updateAppState(currentDataset, currentHighlights, { ...currentTabState, left: tab });
}

function selectRightPanelTab(tab: "pre-written" | "generated") {
  updateAppState(currentDataset, currentHighlights, { ...currentTabState, right: tab });
}

function updateAppState(dataset: DatasetWithText, highlights: AnnotationsWithText, tabState: TabState) {
  currentDataset = dataset;
  currentHighlights = highlights;
  currentTabState = tabState;
  render(dataset, highlights, tabState);
}

// ---------------------------------------------------------------------
// Static Content Initialization
// ---------------------------------------------------------------------

// Populate the dropdown with the static DATASET_NAMES array
function populateDataSelector(datasetNames: string[]) {
  const selector = document.getElementById("data-selector") as HTMLSelectElement;
  // Clear any existing children (if necessary)
  selector.innerHTML = "";

  datasetNames.forEach((dataset, idx) => {
    const option = document.createElement("option");
    option.value = dataset;
    option.textContent = dataset;
    if (idx === 0) {
      option.selected = true;
    }
    selector.appendChild(option);
  });
}

function initializeHeader(datasetNames: string[]) {
  populateDataSelector(datasetNames);

  // Attach event listener for the "Generate Annotations" button
  document.getElementById("generate-annotations")!.addEventListener("click", () => {
    const { lhsText, rhsText, annotations } = currentDataset;
    generateAnnotations(lhsText, rhsText, annotations, useDemoCache);
  });

  // Attach event listeners for the "Coming Soon" buttons
  const modal = document.getElementById("coming-soon-modal") as HTMLElement;
  function showComingSoonModal() {
    modal.classList.add("show");
  }
  document.getElementById("slice-text")!.addEventListener("click", showComingSoonModal);
  document.getElementById("autoformalize")!.addEventListener("click", showComingSoonModal);
}

function initializeFooter() {
  // Toggle highlighting all annotations on click
  document.getElementById('highlight-all-annotations')!.addEventListener('click', () => {
    const textPanelsDiv = document.getElementById('text-panels')!;
    textPanelsDiv.classList.toggle('highlight-all');
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

  // Toggle demo cache usage
  const useDemoCacheButton = document.getElementById('use-demo-cache')!;
  useDemoCacheButton.addEventListener('click', () => {
    useDemoCache = !useDemoCache;
    useDemoCache ?
      useDemoCacheButton.textContent = 'Use Live Responses' :
      useDemoCacheButton.textContent = 'Use Cached Responses';
  });
}

function initializeMainStaticContent() {
  addEditCellListener();

  // Switch tabs when tab buttons are clicked
  document.getElementById("tab-pdf")!.addEventListener("click", () => selectLeftPanelTab("pdf"));
  document.getElementById("tab-full-text")!.addEventListener("click", () => selectLeftPanelTab("full-text"));
  document.getElementById("tab-selected-text")!.addEventListener("click", () => selectLeftPanelTab("selected-text"));
  document.getElementById("tab-pre-written")!.addEventListener("click", () => selectRightPanelTab("pre-written"));
  document.getElementById("tab-generated")!.addEventListener("click", () => selectRightPanelTab("generated"));
}

function initializeDebugInfoModal() {
  const showDebugBtn = document.getElementById("show-debug-info")!;
  const debugModal = document.getElementById("debug-info-modal")!;
  const closeDebugBtn = document.getElementById("close-debug-modal")!;
  const debugSelect = document.getElementById("debug-selector") as HTMLSelectElement;
  const debugContent = document.getElementById("debug-info-content")!;

  function updateDebugInfoContent() {
    // reset json class
    debugContent.classList.remove("json");

    switch (debugSelect.value) {
      case "last":
        debugContent.textContent = lastRawModelOutput;
        break;

      case "all":
        let content = "";
        let first = true;
        allRawModelOutputs.forEach((output, index) => {
          content += first ? "" : "\n\n\n\n\n\n";
          first = false;
          content += `---- RAW MODEL OUTPUT: ${index + 1} ----\n\n${output}`;
        });
        debugContent.textContent = content;
        break;

      case "annotations":
        debugContent.textContent = JSON.stringify(currentDataset.annotations, null, 2);
        debugContent.classList.add("json");
        break;

      default:
        const errorMessage = `Unrecognized debug option ${debugSelect.value}`;
        debugContent.textContent = errorMessage;
        throw new Error(errorMessage);
    }
  }

  showDebugBtn.addEventListener("click", () => {
    updateDebugInfoContent();
    debugModal.classList.add("show");
    showDebugBtn.textContent = "Hide Debug Info";
  });

  closeDebugBtn.addEventListener("click", () => {
    debugModal.classList.remove("show");
    showDebugBtn.textContent = "Show Debug Info";
  });

  debugSelect.addEventListener("change", updateDebugInfoContent);
}

function initializeModals() {
  initializeChat();

  // Attach event listeners for the chat modal
  document.getElementById("ai-assistant")!.addEventListener("click", openChatModal);
  document.getElementById("hide-chat")!.addEventListener("click", closeChatModal);
  document.getElementById('reset-chat')?.addEventListener('click', resetChat);
  document.getElementById('send-message')?.addEventListener('click', sendChatMessage);
  document.getElementById("chat-input")!.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  });

  // Attach event listeners for the "Coming Soon" modal
  const comingSoonModal = document.getElementById("coming-soon-modal") as HTMLElement;
  comingSoonModal.addEventListener("click", () => {
    comingSoonModal.classList.remove("show");
  });

  initializeDebugInfoModal();
}

// Initialize content that is not data-dependent
function initializeStaticContent(datasetNames: string[]) {
  initializeHeader(datasetNames);
  initializeFooter();
  initializeMainStaticContent();
  initializeModals();
}

// ---------------------------------------------------------------------
// Main Initialization
// ---------------------------------------------------------------------

async function loadAndRender(datasetName: string) {
  const { lhsText, rhsText, annotations } = await fetchRawData(datasetName);
  currentDataset = { lhsText, rhsText, annotations: EMPTY_ANNOTATIONS };
  currentAnnotationSets = annotations;
  updateSelectedAnnotationsSet(DEFAULT_ANNOTATIONS_SET_NAME);
}

// Main function to set up default and attach listeners
async function main() {
  const responseRaw = await fetch(`${SERVER_URL}/getDatasetNames`);
  if (!responseRaw.ok) {
    throw new Error('Failed to fetch dataset names');
  }
  const response = await responseRaw.json() as GetDatasetNamesResponse;
  if ("error" in response) {
    throw new Error(response.error);
  }
  const { datasetNames } = response.data;

  initializeStaticContent(datasetNames);

  // Load default dataset on initial page load
  await loadAndRender(datasetNames[0]);

  // Add an event listener to the dataset selector
  const dataSelector = document.getElementById("data-selector");
  if (dataSelector) {
    dataSelector.addEventListener("change", async (e) => {
      const datasetName = (e.target as HTMLSelectElement).value;
      await loadAndRender(datasetName);
    });
  }

  // Add an event listener to the annotations selector
  const annotationsSelector = document.getElementById("annotations-set-selector");
  if (annotationsSelector) {
    annotationsSelector.addEventListener("change", async (e) => {
      const annotationsSetName = (e.target as HTMLSelectElement).value;
      updateSelectedAnnotationsSet(annotationsSetName);
    });
  }
}

// Run the main function on page load
main();
