import { TextRangeWithText } from '@common/annotations.ts';

/**
 * Scrolls a text panel to a specific text range
 * @param targetRange The text range to scroll to
 * @param scrollWindow The HTML element to scroll
 */
export function scrollToTextRange(targetRange: TextRangeWithText, scrollWindow: HTMLDivElement): void {
  // Find the target span using its data attribute
  const targetStartSpan = scrollWindow.querySelector(`span[data-start-index="${targetRange.start}"]`) as HTMLElement;
  if (!targetStartSpan) return;

  // TODO: Scroll more accurately by identifying the correct targetEndSpan
  const targetEndSpan = targetStartSpan;

  // Vertical distance to keep the target span away from the edges of the container when scrolling
  const SCROLL_PADDING = 20;

  const containerTop = scrollWindow.getBoundingClientRect().top;
  const containerBottom = scrollWindow.getBoundingClientRect().bottom;
  const targetTop = targetStartSpan.getBoundingClientRect().top;
  const targetBottom = targetEndSpan.getBoundingClientRect().bottom;
  const targetOffsetTop = targetStartSpan.offsetTop;
  const targetOffsetBottom = targetEndSpan.offsetTop + targetEndSpan.offsetHeight;

  // Return early if the target is already visible in scrollWindow
  if (targetTop >= containerTop + SCROLL_PADDING && targetBottom <= containerBottom - SCROLL_PADDING) {
    return;
  }

  // Scroll so that the target range is in view
  if (targetTop < containerTop + SCROLL_PADDING) {
    // When the target is above the visible area: Scroll to put the target near the top
    const offset = Math.max(0, targetOffsetTop - SCROLL_PADDING);
    scrollWindow.scrollTo({ top: offset, behavior: "smooth" });
  } else if (targetBottom > containerBottom - SCROLL_PADDING) {
    // When the target is below the visible area: Scroll to put the target near the bottom,
    // but keep the target from overflowing the top
    let offset = targetOffsetBottom - scrollWindow.clientHeight + SCROLL_PADDING;
    if (offset < targetOffsetTop - SCROLL_PADDING) {
      offset = targetOffsetTop - SCROLL_PADDING;
    }
    scrollWindow.scrollTo({ top: offset, behavior: "smooth" });
  }
} 