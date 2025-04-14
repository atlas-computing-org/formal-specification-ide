import { MatchableAnnotationsSlice, TextMappingSlice } from "./AnnotationsSlice.ts";
import { TextRangeWithText } from "@common/annotations.ts";

export class AnnotationsScrollManager {
  private readonly annotations: MatchableAnnotationsSlice;
  private readonly targetContainer: HTMLElement;

  constructor(annotations: MatchableAnnotationsSlice, targetContainer: HTMLElement) {
    this.annotations = annotations;
    this.targetContainer = targetContainer;
  }

  public getMatchingMappingInTarget(sourceMapping: TextMappingSlice): TextMappingSlice | undefined {
    return this.annotations.getMatchingMappingInOppositeText(sourceMapping);
  }

  public scrollTargetTextToRange(targetRange: TextRangeWithText): void {
    // Find the target span using its data attribute.
    const targetStartSpan = this.targetContainer.querySelector(`span[data-start-index="${targetRange.start}"]`) as HTMLElement;
    if (!targetStartSpan) return;

    // TODO: Scroll more accurately by identifying the correct targetEndSpan
    const targetEndSpan = targetStartSpan;

    // Vertical distance to keep the target span away from the edges of the container when scrolling
    const SCROLL_PADDING = 20;

    const containerTop = this.targetContainer.getBoundingClientRect().top;
    const containerBottom = this.targetContainer.getBoundingClientRect().bottom;
    const targetTop = targetStartSpan.getBoundingClientRect().top;
    const targetBottom = targetEndSpan.getBoundingClientRect().bottom;
    const targetOffsetTop = targetStartSpan.offsetTop;
    const targetOffsetBottom = targetEndSpan.offsetTop + targetEndSpan.offsetHeight;

    // Return early if the target is already visible in targetContainer.
    if (targetTop >= containerTop + SCROLL_PADDING && targetBottom <= containerBottom - SCROLL_PADDING) {
      return;
    }

    // Scroll so that the target range is in view.
    if (targetTop < containerTop + SCROLL_PADDING) {
      // When the target is above the visible area: Scroll to put the target near the top
      const offset = Math.max(0, targetOffsetTop - SCROLL_PADDING);
      this.targetContainer.scrollTo({ top: offset, behavior: "smooth" });
    } else if (targetBottom > containerBottom - SCROLL_PADDING) {
      // When the target is below the visible area: Scroll to put the target near the bottom,
      // but keep the target from overflowing the top
      let offset = targetOffsetBottom - this.targetContainer.clientHeight + SCROLL_PADDING;
      if (offset < targetOffsetTop - SCROLL_PADDING) {
        offset = targetOffsetTop - SCROLL_PADDING;
      }
      this.targetContainer.scrollTo({ top: offset, behavior: "smooth" });
    }
  }
}