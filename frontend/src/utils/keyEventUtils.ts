type KeyHandler = (e: KeyboardEvent) => void;

export const keyCodes = Object.freeze({
  A: 'a',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ONE: '1',
  TWO: '2',
  THREE: '3',
  FOUR: '4',
});

interface ApplicationLevelHotkeysOptions {
  onEnterAnnotationMode: () => void;
  onAddAnnotation: () => void;
  onCancelAnnotation: () => void;
  onScoreAnnotation?: (score: 1 | 2 | 3 | 4) => void;
  isAnnotationMode: boolean;
  isModalOpen: boolean;
}

export function handleApplicationLevelHotkeys(options: ApplicationLevelHotkeysOptions): KeyHandler {
  return (e: KeyboardEvent) => {
    // Don't handle keyboard shortcuts if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Don't handle keyboard shortcuts if user is interacting with a select element
    //
    // NOTE: Determining whether a select list is open is not straightforward. Select
    // list elements should be blurred when they are closed to minimize issues.
    if (e.target instanceof HTMLSelectElement && e.target === document.activeElement) {
      return;
    }

    if (options.isModalOpen) {
      // For now, there are no hotkeys for modal windows
      return;

    } else {
      // Application hotkey handlers
      switch (e.key) {
        case keyCodes.A:
          options.onEnterAnnotationMode();
          break;
        case keyCodes.ENTER:
          if (options.isAnnotationMode) {
            options.onAddAnnotation();
          }
          break;
        case keyCodes.ESCAPE:
          if (options.isAnnotationMode) {
            options.onCancelAnnotation();
          }
          break;
        case keyCodes.ONE:
        case keyCodes.TWO:
        case keyCodes.THREE:
        case keyCodes.FOUR:
          if (options.onScoreAnnotation) {
            const score = parseInt(e.key) as 1 | 2 | 3 | 4;
            options.onScoreAnnotation(score);
          }
          break;
      }
    }
  };
} 