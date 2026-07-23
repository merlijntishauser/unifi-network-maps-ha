// Escape-key handling shared by the context menu and both modals.
export function bindEscapeToClose(onClose: () => void): () => void {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };
  document.addEventListener("keydown", handleKeydown);
  return () => document.removeEventListener("keydown", handleKeydown);
}
