type KeyHandler = (e: KeyboardEvent) => void;

interface ApplicationLevelHotkeysOptions {
  onEnterAnnotationMode: () => void;
  onAddAnnotation: () => void;
  onCancelAnnotation: () => void;
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

    // Application hotkey handlers
    switch (e.key.toUpperCase()) {
      case 'A':
        options.onEnterAnnotationMode();
        break;
      case 'ENTER':
        if (options.isAnnotationMode) {
          options.onAddAnnotation();
        }
        break;
      case 'ESCAPE':
        if (options.isAnnotationMode) {
          options.onCancelAnnotation();
        }
        break;
    }
  };
} 