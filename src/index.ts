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
  ];
  
  const lhsLabels: TextLabel[] = [
    { label: "Word", ranges: [createTextRange(0, 5, lhsText), createTextRange(11, 16, lhsText)] },
  ];
  
  const rhsLabels: TextLabel[] = [
    { label: "Term", ranges: [createTextRange(0, 2, rhsText), createTextRange(13, 19, rhsText)] },
  ];
  
  // Helper function to format text ranges
  function formatRanges(ranges: TextRange[]): string {
    return ranges.map((r) => `${r.start}-${r.end}: ${r.text}`).join(", ");
  }
  
  // Inject text into panels
  document.getElementById("left-text")!.innerText = lhsText;
  document.getElementById("right-text")!.innerText = rhsText;
  
  // Render Functions
  function renderMappings() {
    const mappingsPanel = document.getElementById("mappings-panel")!;
    mappings.forEach((mapping) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div class="cell label">${mapping.label}</div>
        <div class="cell">${formatRanges(mapping.lhsRanges)}</div>
        <div class="cell label">${mapping.label}</div>
        <div class="cell">${formatRanges(mapping.rhsRanges)}</div>
      `;
      mappingsPanel.appendChild(row);
    });
  }
  
  function renderLabels(panelId: string, labels: TextLabel[]) {
    const panel = document.getElementById(panelId)!;
    labels.forEach((label) => {
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div class="cell label">${label.label}</div>
        <div class="cell">${formatRanges(label.ranges)}</div>
      `;
      panel.appendChild(row);
    });
  }
  
  // Initialize Rendering
  renderMappings();
  renderLabels("lhs-labels-panel", lhsLabels);
  renderLabels("rhs-labels-panel", rhsLabels);
  