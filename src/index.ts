// Filler text for each subpanel
const leftText = "This is the left panel's main text. It contains content for analysis.";
const leftAnnotations = "Left Annotations:\n- Annotation 1\n- Annotation 2";
const rightText = "This is the right panel's main text. It contains different content for analysis.";
const rightAnnotations = "Right Annotations:\n- Annotation A\n- Annotation B";

// Inject content into the subpanels
document.getElementById('left-text')!.innerText = leftText;
document.getElementById('left-annotations')!.innerText = leftAnnotations;
document.getElementById('right-text')!.innerText = rightText;
document.getElementById('right-annotations')!.innerText = rightAnnotations;
