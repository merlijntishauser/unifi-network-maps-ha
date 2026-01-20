const TOAST_STYLES: Record<"success" | "info" | "error", string> = {
  success: "rgba(34, 197, 94, 0.9)",
  info: "rgba(59, 130, 246, 0.9)",
  error: "rgba(239, 68, 68, 0.9)",
};

export function showToast(message: string, variant: "success" | "info" | "error"): void {
  const feedback = document.createElement("div");
  feedback.textContent = message;
  feedback.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${TOAST_STYLES[variant]};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1002;
    animation: fadeInOut 2s ease forwards;
  `;
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 2000);
}
