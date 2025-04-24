import { useCallback } from 'react';
import { MatchableAnnotationsSlice, TextMappingSlice } from '../hooks/useAnnotationsSlice.ts';
import { TextRangeWithText } from '@common/annotations.ts';

export function useAnnotationsScrollManager(
  annotations: MatchableAnnotationsSlice,
  targetRef: React.RefObject<HTMLDivElement | null>
) {
  const getMatchingMappingInTarget = useCallback((sourceMapping: TextMappingSlice): TextMappingSlice | undefined => {
    return annotations.getMatchingMappingInOppositeText(sourceMapping);
  }, [annotations]);

  const scrollTargetTextToRange = useCallback((targetRange: TextRangeWithText): void => {
    const targetContainer = targetRef.current;
    if (!targetContainer) return;

    // Find the target span using its data attribute
    const targetStartSpan = targetContainer.querySelector(`span[data-start-index="${targetRange.start}"]`) as HTMLElement;
    if (!targetStartSpan) return;

    // TODO: Scroll more accurately by identifying the correct targetEndSpan
    const targetEndSpan = targetStartSpan;

    // Vertical distance to keep the target span away from the edges of the container when scrolling
    const SCROLL_PADDING = 20;

    const containerTop = targetContainer.getBoundingClientRect().top;
    const containerBottom = targetContainer.getBoundingClientRect().bottom;
    const targetTop = targetStartSpan.getBoundingClientRect().top;
    const targetBottom = targetEndSpan.getBoundingClientRect().bottom;
    const targetOffsetTop = targetStartSpan.offsetTop;
    const targetOffsetBottom = targetEndSpan.offsetTop + targetEndSpan.offsetHeight;

    // Return early if the target is already visible in targetContainer
    if (targetTop >= containerTop + SCROLL_PADDING && targetBottom <= containerBottom - SCROLL_PADDING) {
      return;
    }

    // Scroll so that the target range is in view
    if (targetTop < containerTop + SCROLL_PADDING) {
      // When the target is above the visible area: Scroll to put the target near the top
      const offset = Math.max(0, targetOffsetTop - SCROLL_PADDING);
      targetContainer.scrollTo({ top: offset, behavior: "smooth" });
    } else if (targetBottom > containerBottom - SCROLL_PADDING) {
      // When the target is below the visible area: Scroll to put the target near the bottom,
      // but keep the target from overflowing the top
      let offset = targetOffsetBottom - targetContainer.clientHeight + SCROLL_PADDING;
      if (offset < targetOffsetTop - SCROLL_PADDING) {
        offset = targetOffsetTop - SCROLL_PADDING;
      }
      targetContainer.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [targetRef]);

  return {
    getMatchingMappingInTarget,
    scrollTargetTextToRange
  };
} 