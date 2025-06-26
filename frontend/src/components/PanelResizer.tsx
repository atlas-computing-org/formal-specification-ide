import React, { useCallback, useRef } from 'react';

interface PanelResizerProps {
  onResize: (leftWidth: number) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({ onResize, containerRef }) => {
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const leftWidth = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    
    // Constrain between 20% and 80% of container width
    const minWidth = containerWidth * 0.2;
    const maxWidth = containerWidth * 0.8;
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, leftWidth));
    
    onResize(clampedWidth);
  }, [onResize, containerRef]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  return (
    <div 
      className="panel-resizer"
      onMouseDown={handleMouseDown}
    />
  );
};
