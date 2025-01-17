import { ChatAnthropic } from "@langchain/anthropic";

// TODO: Add API key management
const ANTHROPIC_API_KEY = "sk-ant-api03-XXXXXX"

// The server URL
const SERVER_URL = "http://localhost:3001";

// The datasets to choose from
const DATASET_NAMES = ["SHA-1", "simpleText"];

// Data Structures
type TextRangeWithText = {
  start: number;
  end: number;
  text: string;
};

type TextLabelWithText = {
  label: string;
  ranges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
};

type TextMappingWithText = {
  label: string;
  lhsRanges: TextRangeWithText[];
  rhsRanges: TextRangeWithText[];
  isWarning?: boolean;
  isError?: boolean;
};

interface AnnotationsWithText {
  mappings: TextMappingWithText[];
  lhsLabels: TextLabelWithText[];
  rhsLabels: TextLabelWithText[];
}

interface DatasetWithText {
  lhsText: string;
  rhsText: string;
  annotations: AnnotationsWithText;
}

type LabelType = "default" | "warning" | "error";

// ---------------------------------------------------------------------
// Utility function to fetch data from a specific data folder.
// ---------------------------------------------------------------------

async function loadData(folderName: string) {
  const basePath = `/data/${folderName}`;

  // Fetch all in parallel
  const [lhsText, rhsText, annotations] = await Promise.all([
    fetch(`${basePath}/lhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/rhs.txt`).then((res) => res.text()),
    fetch(`${basePath}/annotations.json`).then((res) => res.json()),
  ]);

  return { lhsText, rhsText, annotations: annotations as AnnotationsWithText };
}

// ---------------------------------------------------------------------
// Highlighting logic
// ---------------------------------------------------------------------
function highlightRanges(containerId: string, ranges: TextRangeWithText[], labelType: LabelType) {
  const container = document.getElementById(containerId)!;
  const text = container.innerText;
  let highlightedText = "";
  let currentIndex = 0;

  ranges.forEach(({ start, end }) => {
    highlightedText += text.substring(currentIndex, start);
    highlightedText += `<span class="highlight ${labelType}">${text.substring(start, end)}</span>`;
    currentIndex = end;
  });

  highlightedText += text.substring(currentIndex);
  container.innerHTML = highlightedText;
}

function clearHighlights(containerId: string) {
  const container = document.getElementById(containerId)!;
  container.innerText = container.dataset.originalText || container.innerText;
}

// ---------------------------------------------------------------------
// Rendering Annotations
// ---------------------------------------------------------------------

// Store the current dataset
let currentDataset: DatasetWithText | null = null;

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
  item.label = newValue;

  // Update the displayed data
  onUpdatedAnnotations();
}

function cancelEditing(cell: HTMLElement, input: HTMLInputElement, originalText: string) {
  cell.textContent = originalText;
  input.remove();
}

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
        item = currentDataset!.annotations.mappings[index];
      } else if (type === "lhs-label") {
        item = currentDataset!.annotations.lhsLabels[index];
      } else {
        item = currentDataset!.annotations.rhsLabels[index];
      }

      // Start editing the label
      startEditing(target, item, index);
    }
  });
}

function getLabelType(item: TextMappingWithText | TextLabelWithText): LabelType  {
  if (item.isWarning) {
    return "warning";
  } else if (item.isError) {
    return "error";
  } else {
    return "default";
  }
}

function renderMappings(mappings: TextMappingWithText[]) {
  const mappingsPanel = document.getElementById("mappings-panel")!;

  // Clear existing content if needed
  mappingsPanel.innerHTML = `<div class="header">Mappings</div>`;

  mappings.forEach((mapping, i) => {
    const labelType = getLabelType(mapping);
    const row = document.createElement("div");
    row.className = `row mapping ${labelType}`;
    row.dataset.index = i.toString();
    row.innerHTML = `
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.lhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.rhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges("lhs-text-content", mapping.lhsRanges, getLabelType(mapping));
      highlightRanges("rhs-text-content", mapping.rhsRanges, getLabelType(mapping));
    });

    row.addEventListener("mouseout", () => {
      clearHighlights("lhs-text-content");
      clearHighlights("rhs-text-content");
    });

    mappingsPanel.appendChild(row);
  });
}

function renderLabels(panelId: string, labels: TextLabelWithText[], textContainerId: string) {
  const panel = document.getElementById(panelId)!;
  const lhs = panelId.includes("lhs");

  // Clear existing content if needed
  panel.innerHTML = `<div class="header">${lhs ? "LHS Labels" : "RHS Labels"}</div>`;

  labels.forEach((label, i) => {
    const labelType = getLabelType(label);
    const row = document.createElement("div");
    row.className = `row ${lhs ? "lhs" : "rhs"}-label ${labelType}`;
    row.dataset.index = i.toString();
    row.innerHTML = `
      <div class="cell label">${label.label}</div>
      <div class="cell">${label.ranges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges(textContainerId, label.ranges, getLabelType(label));
    });

    row.addEventListener("mouseout", () => {
      clearHighlights(textContainerId);
    });

    panel.appendChild(row);
  });
}

// ---------------------------------------------------------------------
// AI Query Logic
// ---------------------------------------------------------------------

// Handle AI queries
async function queryAI() {
  const prompt = "Please tell me how your day is going";

  try {
    const response = await fetch(`${SERVER_URL}/query-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    console.log("Claude's response:", data.response);
  } catch (error) {
    console.error("Error querying Claude:", error);
  }
}

// Attach event listener for the "Query AI" button
document.getElementById("query-ai")!.addEventListener("click", queryAI);


// ---------------------------------------------------------------------
// Main initialization
// ---------------------------------------------------------------------

// Populate the dropdown with our DATASET_NAMES array
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

// Print JSON annotations
function printJSONAnnotations(annotations: AnnotationsWithText) {
  if (currentDataset) {
    document.getElementById("json-annotations")!.innerText = JSON.stringify(annotations, null, 2);
  }
}

function onUpdatedAnnotations() {
  const { lhsText, rhsText, annotations } = currentDataset!;

  // IMPORTANT: fill the "text" field for each range using lhsText/rhsText
  // because your JSON only has {start, end}, but we need the substring.
  // This mutates the objects in-place.
  annotations.mappings.forEach((m) => {
    m.lhsRanges.forEach((r) => (r.text = lhsText.substring(r.start, r.end)));
    m.rhsRanges.forEach((r) => (r.text = rhsText.substring(r.start, r.end)));
  });
  annotations.lhsLabels.forEach((lbl) => {
    lbl.ranges.forEach((r) => (r.text = lhsText.substring(r.start, r.end)));
  });
  annotations.rhsLabels.forEach((lbl) => {
    lbl.ranges.forEach((r) => (r.text = rhsText.substring(r.start, r.end)));
  });

  // Render everything
  renderMappings(annotations.mappings);
  renderLabels("lhs-labels-panel", annotations.lhsLabels, "lhs-text-content");
  renderLabels("rhs-labels-panel", annotations.rhsLabels, "rhs-text-content");

  printJSONAnnotations(annotations);
}

function updateData(dataset: DatasetWithText) {
  currentDataset = dataset;

  const { lhsText, rhsText, annotations } = dataset;

  // Put the text in the DOM
  const lhsContainer = document.getElementById("lhs-text-content")!;
  const rhsContainer = document.getElementById("rhs-text-content")!;
  lhsContainer.innerText = lhsText;
  rhsContainer.innerText = rhsText;

  // Store original text for clearing highlights
  lhsContainer.dataset.originalText = lhsText;
  rhsContainer.dataset.originalText = rhsText;

  onUpdatedAnnotations();
}

async function loadAndRender(folderName: string) {
  // Load the data
  const dataset = await loadData(folderName);
  updateData(dataset);
}

// Main function to set up default and attach listeners
async function main() {
  // Populate the dropdown
  populateDataSelector();

  // Listen for double-click events on labels and mappings
  addEditCellListener();

  // Toggle JSON annotations visibility
  document.getElementById('show-json')!.addEventListener('click', () => {
    const jsonAnnotationsDiv = document.getElementById('json-annotations')!;

    // Toggle the "show" class
    jsonAnnotationsDiv.classList.toggle('show');
  });

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
