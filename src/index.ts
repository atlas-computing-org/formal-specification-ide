// Data Structures
type TextRange = {
  start: number;
  end: number;
  text: string;
};

type TextLabel = {
  label: string;
  ranges: TextRange[];
};

type TextMapping = {
  label: string;
  lhsRanges: TextRange[];
  rhsRanges: TextRange[];
};

// Sample LHS and RHS texts
const lhsText = "Hello fine world!";
const rhsText = "Hi beautiful planet!";

// Helper function to create TextRange
function createTextRange(start: number, end: number, text: string): TextRange {
  return { start, end, text: text.substring(start, end) };
}

// Sample Data
const mappings: TextMapping[] = [
  {
    label: "Greeting",
    lhsRanges: [createTextRange(0, 5, lhsText)],
    rhsRanges: [createTextRange(0, 2, rhsText)],
  },
  {
    label: "Noun",
    lhsRanges: [createTextRange(11, 16, lhsText)],
    rhsRanges: [createTextRange(13, 19, rhsText)],
  },
  {
    label: "All Words",
    lhsRanges: [createTextRange(0, 5, lhsText), createTextRange(6, 10, lhsText), createTextRange(11, 16, lhsText)],
    rhsRanges: [createTextRange(0, 2, rhsText), createTextRange(3, 12, rhsText), createTextRange(13, 19, rhsText)],
  },
];

const lhsLabels: TextLabel[] = [
  { label: "Word", ranges: [createTextRange(0, 5, lhsText), createTextRange(11, 16, lhsText)] },
];

const rhsLabels: TextLabel[] = [
  { label: "Term", ranges: [createTextRange(0, 2, rhsText), createTextRange(13, 19, rhsText)] },
  { label: "Beauty", ranges: [createTextRange(3, 12, rhsText)] },
];

// Render the text into the panels
document.getElementById("lhs-text-content")!.innerText = lhsText;
document.getElementById("rhs-text-content")!.innerText = rhsText;

// Highlight function
function highlightRanges(containerId: string, ranges: TextRange[]) {
  const container = document.getElementById(containerId)!;
  const text = container.innerText;
  let highlightedText = "";
  let currentIndex = 0;

  ranges.forEach(({ start, end }) => {
    highlightedText += text.substring(currentIndex, start);
    highlightedText += `<span class="highlight">${text.substring(start, end)}</span>`;
    currentIndex = end;
  });

  highlightedText += text.substring(currentIndex);
  container.innerHTML = highlightedText;
}

// Clear highlights
function clearHighlights(containerId: string) {
  const container = document.getElementById(containerId)!;
  container.innerText = container.dataset.originalText || container.innerText;
}

// Store the original text for clearing highlights later
document.getElementById("lhs-text-content")!.dataset.originalText = lhsText;
document.getElementById("rhs-text-content")!.dataset.originalText = rhsText;

// Render Mappings
function renderMappings() {
  const mappingsPanel = document.getElementById("mappings-panel")!;
  mappings.forEach((mapping) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.lhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
      <div class="cell label">${mapping.label}</div>
      <div class="cell">${mapping.rhsRanges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges("lhs-text-content", mapping.lhsRanges);
      highlightRanges("rhs-text-content", mapping.rhsRanges);
    });

    row.addEventListener("mouseout", () => {
      clearHighlights("lhs-text-content");
      clearHighlights("rhs-text-content");
    });

    mappingsPanel.appendChild(row);
  });
}

// Initialize Rendering
renderMappings();

// Render Labels
function renderLabels(panelId: string, labels: TextLabel[], textContainerId: string) {
  const panel = document.getElementById(panelId)!;
  labels.forEach((label) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div class="cell label">${label.label}</div>
      <div class="cell">${label.ranges.map(r => `${r.start}-${r.end}: ${r.text}`).join(", ")}</div>
    `;

    row.addEventListener("mouseover", () => {
      highlightRanges(textContainerId, label.ranges);
    });

    row.addEventListener("mouseout", () => {
      clearHighlights(textContainerId);
    });

    panel.appendChild(row);
  });
}

// Call renderLabels for LHS and RHS labels
renderLabels("lhs-labels-panel", lhsLabels, "lhs-text-content");
renderLabels("rhs-labels-panel", rhsLabels, "rhs-text-content");
