import { useRef, useCallback, useEffect } from 'react';

// 200ms is a common threshold for distinguishing between click and double-click
export const DOUBLE_CLICK_TIMEOUT = 200;

export function useDoubleClickDisambiguator() {
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetClickTimer = useCallback(() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((onClick: () => void) => {
    resetClickTimer();
    clickTimerRef.current = setTimeout(onClick, DOUBLE_CLICK_TIMEOUT);
  }, [resetClickTimer]);

  const handleDoubleClick = useCallback((onDoubleClick: () => void) => {
    resetClickTimer();
    onDoubleClick();
  }, [resetClickTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  return { handleClick, handleDoubleClick };
}